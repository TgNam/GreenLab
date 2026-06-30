import { Injectable } from '@angular/core';

declare global {
  interface Window {
    qz?: any;
    startConnection?: (config?: { retries?: number; delay?: number }) => Promise<void>;
    qzPrintPdfBase64?: (
      base64Pdf: string,
      printerName?: string,
      orientation?: 'landscape' | 'portrait',
      size?: { width: number, height: number },
      options?: {
        rasterize?: boolean;
        scaleContent?: boolean;
        density?: number | number[];
        type?: string;
        ignoreTransparency?: boolean;
        colorType?: string;
        interpolation?: string;
        /** Mảng data tùy chỉnh cho qz.print (đã build sẵn, thường từ buildQzData) */
        qzDataOverride?: any[];
        /** Gộp vào data[0].options khi không dùng qzDataOverride */
        qzDataItemOptions?: Record<string, unknown>;
      }
    ) => Promise<void>;
    __GREENLAB_QZ_STATIC_URL?: string;
    __GREENLAB_QZ_SIGN_URL?: string;
  }
}

/**
 * Service in qua QZ Tray.
 * Load qz-tray.js và qz-print-greenlab.js từ assets/lib/qz-print/, kết nối và in PDF.
 */
@Injectable({
  providedIn: 'root'
})
export class QzPrintService {

  private scriptsLoaded = false;
  private loadPromise: Promise<void> | null = null;
  private connected = false;
  /** Một promise kết nối đang chờ (tránh gọi startConnection nhiều lần -> nhiều popup). */
  private connectionPromise: Promise<void> | null = null;

  constructor() {}

  private getAssetsBase(): string {
    const base = document.querySelector('base')?.href || '/';
    return base.replace(/\/$/, '') + '/assets/lib/qz-print/';
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(script);
    });
  }

  /**
   * Load QZ scripts (qz-tray.js, qz-print-greenlab.js) và cấu hình cert/sign URL.
   * Sau khi xong, window.qz sẽ có giá trị.
   */
  loadScripts(): Promise<void> {
    if (this.scriptsLoaded) return Promise.resolve();
    if (this.loadPromise) return this.loadPromise;
    const base = this.getAssetsBase();
    window.__GREENLAB_QZ_STATIC_URL = base;
    this.loadPromise = this.loadScript(base + 'qz-polyfills.js')
      .then(() => this.loadScript(base + 'qz-tray.js'))
      .then(() => this.loadScript(base + 'qz-print-greenlab.js'))
      .then(() => {
        this.scriptsLoaded = true;
        if (typeof window.qz === 'undefined') {
          return Promise.reject(new Error('Script QZ đã tải nhưng window.qz chưa có. Kiểm tra đường dẫn assets/lib/qz-print/.'));
        }
      });
    return this.loadPromise;
  }

  /**
   * Kết nối QZ Tray (phải gọi sau khi loadScripts). Chỉ tạo một lần kết nối; gọi lại sẽ chờ cùng promise → chỉ 1 popup "Allow".
   * Khi QZ đã tắt (mất kết nối) thì xóa trạng thái connected để lần sau có thể kết nối lại.
   */
  connect(opts?: { retries?: number; delay?: number }): Promise<void> {
    if (this.connected && window.qz?.websocket?.isActive()) {
      return Promise.resolve();
    }
    // Đã mất kết nối (user tắt QZ) → cho phép kết nối lại
    if (this.connected && window.qz && !window.qz.websocket?.isActive?.()) {
      this.connected = false;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    const retries = opts?.retries ?? 5;
    const delay = opts?.delay ?? 1;

    this.connectionPromise = (async () => {
      await this.loadScripts();

      if (typeof window.qz === 'undefined') {
        throw new Error('Chưa load script QZ.');
      }

      if (typeof window.startConnection !== 'function') {
        throw new Error('QZ chưa sẵn sàng.');
      }

      await window.startConnection({ retries, delay });

      this.connected = true;
    })()
    .finally(() => {
      this.connectionPromise = undefined;
    });

    return this.connectionPromise;
  }

  /**
   * Thử kết nối QZ Tray một lần (không retry). Dùng khi user vừa mở lại QZ sau khi tắt.
   */
  connectNoRetry(): Promise<void> {
    return this.connect({ retries: 1, delay: 300 });
  }

  /**
   * Đảm bảo đã load script và đã kết nối QZ Tray. Gọi trước khi getPrinters() hoặc in.
   */
  ensureReady(): Promise<void> {
    return this.connect();
  }

  /**
   * In PDF từ blob (dùng cho API trả về application/pdf).
   */
  printPdfFromBlob(
    blob: Blob,
    printerName?: string,
    orientation?: 'landscape' | 'portrait',
    size?: { width: number, height: number },
    options?: {
      rasterize?: boolean;
      scaleContent?: boolean;
      density?: number | number[];
      type?: string;
      ignoreTransparency?: boolean;
      colorType?: string;
      interpolation?: string;
      qzDataItemOptions?: Record<string, unknown>;
      /** Build mảng data cho qz.print; nhận base64 PDF (không prefix data:) */
      buildQzData?: (base64Pdf: string) => any[];
    }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        let base64 = (reader.result as string) || '';
        if (base64.indexOf('base64,') >= 0) base64 = base64.split('base64,')[1];
        this.connect()
          .then(() => {
            if (typeof window.qzPrintPdfBase64 !== 'function') {
              reject(new Error('Hàm in QZ chưa có'));
              return;
            }
            const buildQzData = options?.buildQzData;
            const qzDataOverride =
              typeof buildQzData === 'function' ? buildQzData(base64) : undefined;
            const { buildQzData: _omit, ...restForQz } = options || {};
            return window.qzPrintPdfBase64!(base64, printerName, orientation, size, {
              ...restForQz,
              qzDataOverride:
                Array.isArray(qzDataOverride) && qzDataOverride.length > 0
                  ? qzDataOverride
                  : undefined,
            });
          })
          .then(resolve)
          .catch(reject);
      };
      reader.onerror = () => reject(reader.error || new Error('Đọc file PDF lỗi'));
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Kiểm tra QZ Tray đã kết nối chưa.
   */
  isActive(): boolean {
    return !!(window.qz?.websocket?.isActive && window.qz.websocket.isActive());
  }

  private static readonly STORAGE_KEY_PRINTER = 'greenlab_qz_printer_name';

  /**
   * Lấy danh sách tên máy in từ QZ Tray.
   * Tự gọi ensureReady() (load script + kết nối) trước khi gọi qz.printers.find().
   */
  getPrinters(): Promise<string[]> {
    return this.ensureReady().then(() => {
      if (!window.qz?.printers?.find) {
        return Promise.reject(new Error('QZ API printers không khả dụng'));
      }
      return window.qz.printers.find() as Promise<string[]>;
    }).then((list) => Array.isArray(list) ? list : []);
  }

  /** Lấy tên máy in đã lưu từ localStorage. */
  getSavedPrinterName(): string | null {
    try {
      const name = localStorage.getItem(QzPrintService.STORAGE_KEY_PRINTER);
      return name || null;
    } catch {
      return null;
    }
  }

  /** Lưu tên máy in vào localStorage. */
  savePrinterName(name: string | null): void {
    try {
      if (name) {
        localStorage.setItem(QzPrintService.STORAGE_KEY_PRINTER, name);
      } else {
        localStorage.removeItem(QzPrintService.STORAGE_KEY_PRINTER);
      }
    } catch (_) {}
  }
}
