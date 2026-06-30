import { Injectable } from '@angular/core';

/**
 * Service dùng chung giữa app-form-input và app-dynamic-table:
 * khi user đang gõ hoặc chọn option trong form-input, bảng có thể tạm bỏ qua change detection
 * để tránh re-render gây lag.
 */
@Injectable({ providedIn: 'root' })
export class FormInputFocusService {
  /** Số lượng form-input đang focus hoặc dropdown đang mở (dùng counter cho nested/nhiều input). */
  private activeCount = 0;

  setActive(active: boolean): void {
    if (active) {
      this.activeCount++;
    } else {
      this.activeCount = Math.max(0, this.activeCount - 1);
    }
  }

  isActive(): boolean {
    return this.activeCount > 0;
  }
}
