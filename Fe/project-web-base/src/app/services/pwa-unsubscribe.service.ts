import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PwaUnsubscribeService {

  constructor() { }

  /**
   * Unsubscribe từ PWA - Hủy đăng ký service worker và xóa cache
   */
  async unsubscribePWA(): Promise<{ success: boolean; message: string }> {
    const results: string[] = [];

    try {
      // 1. Unregister tất cả service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        for (const registration of registrations) {
          const unregistered = await registration.unregister();
          if (unregistered) {
            results.push(`Service Worker "${registration.scope}" đã được unregister`);
          }
        }

        if (registrations.length === 0) {
          results.push('Không có Service Worker nào được đăng ký');
        }
      } else {
        results.push('Browser không hỗ trợ Service Worker');
      }

      // 2. Xóa tất cả cache
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            results.push(`Đang xóa cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
        );
        
        if (cacheNames.length > 0) {
          results.push(`Đã xóa ${cacheNames.length} cache(s)`);
        } else {
          results.push('Không có cache nào để xóa');
        }
      }

      // 3. Xóa FCM token từ localStorage (nếu có)
      const fcmTokenKeys = ['token-firebase', 'fcm-token', 'firebase-messaging-token'];
      fcmTokenKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          results.push(`Đã xóa ${key} từ localStorage`);
        }
      });

      // 4. Xóa các PWA-related data khác
      const pwaKeys = ['pwa-installed', 'pwa-prompt', 'sw-registered'];
      pwaKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          results.push(`Đã xóa ${key} từ localStorage`);
        }
      });

      return {
        success: true,
        message: results.join('\n')
      };

    } catch (error) {
      console.error('Error unsubscribing PWA:', error);
      return {
        success: false,
        message: `Lỗi khi unsubscribe PWA: ${error.message}\n\nĐã thực hiện:\n${results.join('\n')}`
      };
    }
  }

  /**
   * Unregister một service worker cụ thể
   */
  async unregisterServiceWorker(scope?: string): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Browser không hỗ trợ Service Worker');
      return false;
    }

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      if (scope) {
        // Unregister service worker với scope cụ thể
        const registration = registrations.find(reg => reg.scope === scope);
        if (registration) {
          return await registration.unregister();
        }
        return false;
      } else {
        // Unregister tất cả service workers
        const promises = registrations.map(reg => reg.unregister());
        const results = await Promise.all(promises);
        return results.every(result => result === true);
      }
    } catch (error) {
      console.error('Error unregistering service worker:', error);
      return false;
    }
  }

  /**
   * Xóa tất cả cache
   */
  async clearAllCaches(): Promise<number> {
    if (!('caches' in window)) {
      console.warn('Browser không hỗ trợ Cache API');
      return 0;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      return cacheNames.length;
    } catch (error) {
      console.error('Error clearing caches:', error);
      return 0;
    }
  }

  /**
   * Xóa FCM token và các data liên quan
   */
  clearFcmData(): void {
    const keysToRemove = [
      'token-firebase',
      'fcm-token',
      'firebase-messaging-token',
      'firebase-token',
      'fcm-registration-token'
    ];

    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`Đã xóa ${key} từ localStorage`);
      }
    });
  }

  /**
   * Kiểm tra xem app có đang chạy trong PWA mode (standalone) không
   */
  isPwaInstalled(): boolean {
    // Check nếu đang chạy trong standalone mode (PWA đã được cài đặt)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }
    
    // Check cho iOS Safari
    if ((window.navigator as any).standalone === true) {
      return true;
    }
    
    // Check nếu có manifest và đang chạy như app
    if (document.referrer.includes('android-app://')) {
      return true;
    }
    
    return false;
  }

  /**
   * Kiểm tra trạng thái PWA
   */
  async getPwaStatus(): Promise<{
    hasServiceWorker: boolean;
    serviceWorkers: Array<{ scope: string; active: boolean }>;
    cacheCount: number;
    hasFcmToken: boolean;
    notificationPermission: NotificationPermission;
    isPwaInstalled: boolean;
    isStandalone: boolean;
  }> {
    const status: any = {
      hasServiceWorker: 'serviceWorker' in navigator,
      serviceWorkers: [],
      cacheCount: 0,
      hasFcmToken: false,
      notificationPermission: 'default' as NotificationPermission,
      isPwaInstalled: false,
      isStandalone: false
    };

    // Check service workers
    if (status.hasServiceWorker) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        status.serviceWorkers = registrations.map(reg => ({
          scope: reg.scope,
          active: reg.active !== null
        }));
      } catch (error) {
        console.error('Error getting service worker registrations:', error);
      }
    }

    // Check caches
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        status.cacheCount = cacheNames.length;
      } catch (error) {
        console.error('Error getting cache names:', error);
      }
    }

    // Check FCM token
    const fcmTokenKeys = ['token-firebase', 'fcm-token', 'firebase-messaging-token'];
    status.hasFcmToken = fcmTokenKeys.some(key => localStorage.getItem(key) !== null);

    // Check notification permission
    if ('Notification' in window) {
      status.notificationPermission = Notification.permission;
    }

    // Check PWA installation status
    status.isPwaInstalled = this.isPwaInstalled();
    status.isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    return status;
  }

  /**
   * Xóa manifest link từ HTML để ngăn browser nhận diện như PWA
   * Lưu ý: Chỉ có tác dụng sau khi reload trang
   */
  removeManifestLink(): void {
    try {
      const manifestLinks = document.querySelectorAll('link[rel="manifest"]');
      manifestLinks.forEach(link => {
        link.remove();
      });
      
      // Xóa apple-touch-icon và các PWA-related meta tags
      const appleTouchIcons = document.querySelectorAll('link[rel="apple-touch-icon"]');
      appleTouchIcons.forEach(icon => icon.remove());
      
      const themeColors = document.querySelectorAll('meta[name="theme-color"]');
      themeColors.forEach(meta => meta.remove());
    } catch (error) {
      console.error('Error removing manifest link:', error);
    }
  }

  /**
   * Hướng dẫn user cách uninstall PWA
   */
  getUninstallInstructions(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    let instructions = '';

    if (userAgent.includes('chrome') || userAgent.includes('edge')) {
      instructions = `
Để gỡ cài đặt PWA trên Chrome/Edge:
1. Mở Chrome/Edge Settings
2. Vào "Apps" hoặc "Ứng dụng"
3. Tìm ứng dụng và click "Remove" hoặc "Gỡ cài đặt"
Hoặc:
- Click chuột phải vào icon PWA trên desktop/taskbar
- Chọn "Uninstall" hoặc "Gỡ cài đặt"
      `;
    } else if (userAgent.includes('firefox')) {
      instructions = `
Để gỡ cài đặt PWA trên Firefox:
1. Mở Firefox Settings
2. Vào "Privacy & Security" > "Permissions"
3. Tìm và xóa site data
      `;
    } else if (userAgent.includes('safari')) {
      instructions = `
Để gỡ cài đặt PWA trên Safari (iOS):
1. Giữ icon app trên home screen
2. Chọn "Remove App" hoặc "Xóa ứng dụng"
      `;
    } else {
      instructions = `
Để gỡ cài đặt PWA:
- Tìm ứng dụng trong danh sách ứng dụng đã cài đặt
- Gỡ cài đặt như một ứng dụng thông thường
      `;
    }

    return instructions.trim();
  }

  /**
   * Unsubscribe PWA hoàn chỉnh - bao gồm cả việc xóa manifest reference
   */
  async unsubscribePWAComplete(): Promise<{ success: boolean; message: string; needsReload: boolean }> {
    const result = await this.unsubscribePWA();
    
    // Xóa manifest link để ngăn browser nhận diện như PWA
    this.removeManifestLink();
    
    // Check nếu đang chạy trong PWA mode
    const isInstalled = this.isPwaInstalled();
    let message = result.message;
    
    if (isInstalled) {
      message += '\n\n⚠️ PWA đã được cài đặt. Để hoàn tất việc gỡ cài đặt:\n';
      message += this.getUninstallInstructions();
      message += '\n\nHoặc reload trang để áp dụng các thay đổi.';
    }
    
    return {
      success: result.success,
      message: message,
      needsReload: isInstalled
    };
  }
}

