import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from 'environments/environment';

/**
 * Gọi các API {@code CommonController} (`/common/...`) — dùng chung giữa các màn (test-results, machine-results, …).
 * Tham số query khớp backend (ví dụ `is_old`, `searchText`).
 */
@Injectable({
  providedIn: 'root'
})
export class CommonService {
  private readonly basePath = `${environment.apiUrl}/common`;

  constructor(private http: HttpClient) {}

  /** GET `/common/doctor-select` */
  getDoctorSelect(): Promise<any[]> {
    return this.getList('/doctor-select');
  }

  /** GET `/common/test-categories` — nhóm danh mục XN (CfgTestCategory). */
  getTestCategories(): Promise<any[]> {
    return this.getList('/test-categories').then((rows) =>
      (rows || []).map((c) => ({
        ...c,
        id: c?.id,
        category_id: c?.category_id ?? c?.categoryId,
        category_name: c?.category_name ?? c?.categoryName
      }))
    );
  }

  /** GET `/common/tests` */
  getCfgTests(): Promise<any[]> {
    return this.getList('/tests');
  }

  /**
   * GET `/common/admin` — tìm nhân viên (keyword, position enum tùy chọn).
   */
  searchAdmin(keyword?: string, position?: string): Promise<any[]> {
    let hp = new HttpParams();
    const kw = (keyword ?? '').trim();
    if (kw) {
      hp = hp.set('keyword', kw);
    }
    if (position != null && String(position).trim() !== '') {
      hp = hp.set('position', String(position).trim());
    }
    return this.getList('/admin', hp);
  }

  /** GET `/common/cities` */
  getCities(is_old?: boolean): Promise<any[]> {
    let hp = new HttpParams();
    if (is_old === true) {
      hp = hp.set('is_old', 'true');
    }
    return this.getList('/cities', hp);
  }

  /** GET `/common/wards` */
  getWards(is_old?: boolean): Promise<any[]> {
    let hp = new HttpParams();
    if (is_old === true) {
      hp = hp.set('is_old', 'true');
    }
    return this.getList('/wards', hp);
  }

  /** GET `/common/districts` */
  getDistricts(): Promise<any[]> {
    return this.getList('/districts');
  }

  /** GET `/common/location/search` */
  searchLocation(keyword: string, version = 2): Promise<any[]> {
    const kw = (keyword || '').trim();
    if (!kw) {
      return Promise.resolve([]);
    }
    const hp = new HttpParams().set('keyword', kw).set('version', String(version));
    return this.getList('/location/search', hp);
  }

  /** GET `/common/location/detail` */
  getLocationDetail(id: string, version = 2): Promise<Record<string, unknown>> {
    const hp = new HttpParams().set('id', id).set('version', String(version));
    return this.getObject('/location/detail', hp);
  }

  /**
   * GET `/common/instruments` — máy XN (InstrumentSelectOutput: `id`, `name` = "id - tên máy").
   * Chuẩn hóa thêm `ins_name` để khớp code cũ gọi `/test-results/instruments`.
   */
  getInstruments(): Promise<any[]> {
    return this.getList('/instruments').then((rows) =>
      (rows || []).map((raw: { id?: number; name?: string }) => {
        const id = Number(raw?.id);
        const name = raw?.name != null ? String(raw.name) : '';
        const prefix = `${id} - `;
        const ins_name = name.startsWith(prefix) ? name.slice(prefix.length) : name;
        return { id, ins_name, name };
      })
    );
  }

  /** GET `/common/result-status` — map mã → mô tả (ResultStatus). */
  getResultStatus(): Promise<Record<string, string>> {
    return this.getObject('/result-status', new HttpParams()).then((obj) => {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(obj)) {
        out[k] = v != null ? String(v) : '';
      }
      return out;
    });
  }

  /** GET `/common/area` */
  getAreas(): Promise<any[]> {
    return this.getList('/area');
  }

  /** GET `/common/roles` — phiên bản config + roles admin hiện tại. */
  getRolesForCurrentAdmin(): Promise<Record<string, unknown>> {
    return this.getObject('/roles', new HttpParams());
  }

  /** GET `/common/permissions?searchText=` */
  findPermissionsForCurrentAdmin(searchText: string): Promise<any[]> {
    const hp = new HttpParams().set('searchText', searchText ?? '');
    return this.getList('/permissions', hp);
  }

  private extractFileNameFromContentDisposition(content_disposition: string | null): string | null {
    if (!content_disposition) {
      return null;
    }
    const utf8_match = content_disposition.match(/filename\*\s*=\s*(?:UTF-8''|utf-8'')?([^;]+)/i);
    const quoted_match = content_disposition.match(/filename\s*=\s*"([^"]+)"/i);
    const basic_match = content_disposition.match(/filename\s*=\s*([^;]+)/i);
    const raw_name = utf8_match?.[1] || quoted_match?.[1] || basic_match?.[1];
    if (!raw_name) {
      return null;
    }
    const cleaned_name = raw_name.trim().replace(/^["']|["']$/g, '');
    try {
      return decodeURIComponent(cleaned_name);
    } catch {
      return cleaned_name;
    }
  }

  private getList(path: string, params?: HttpParams): Promise<any[]> {
    const url = `${this.basePath}${path}`;
    return new Promise((resolve, reject) => {
      this.http.get<{ success?: boolean; message?: string; data?: unknown }>(url, { params }).subscribe({
        next: (res) => {
          if (res?.success && Array.isArray(res.data)) {
            resolve(res.data as any[]);
            return;
          }
          reject(new Error(res?.message || 'Không tải được dữ liệu'));
        },
        error: (err) =>
          reject(new Error(err?.error?.message || err?.message || 'Lỗi khi gọi API common'))
      });
    });
  }

  private getObject(path: string, params: HttpParams): Promise<Record<string, unknown>> {
    const url = `${this.basePath}${path}`;
    return new Promise((resolve, reject) => {
      this.http.get<{ success?: boolean; message?: string; data?: unknown }>(url, { params }).subscribe({
        next: (res) => {
          if (res?.success && res.data != null && typeof res.data === 'object' && !Array.isArray(res.data)) {
            resolve(res.data as Record<string, unknown>);
            return;
          }
          reject(new Error(res?.message || 'Không tải được dữ liệu'));
        },
        error: (err) =>
          reject(new Error(err?.error?.message || err?.message || 'Lỗi khi gọi API common'))
      });
    });
  }
}
