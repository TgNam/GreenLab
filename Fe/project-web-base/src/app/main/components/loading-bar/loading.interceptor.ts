// src/app/core/interceptors/loading.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpHandler, HttpInterceptor, HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from './loading.service';
import { SKIP_LOADING } from './loading.context';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {

  constructor(private loadingService: LoadingService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Kiểm tra xem có block UI nào đang active không
    const hasActiveBlockUI = this.hasAnyActiveBlockUI();
    const skipLoading = req.context.get(SKIP_LOADING);
        const shouldShowLoading = !skipLoading && !hasActiveBlockUI;

    // Chỉ show loading bar nếu không có block UI nào đang active
    if (shouldShowLoading) {
      this.loadingService.show();
    }

    return next.handle(req).pipe(
      finalize(() => {
        // Chỉ hide loading bar nếu đã show (tức là không có block UI active)
        if (shouldShowLoading) {
          this.loadingService.hide();
        }
      })
    );
  }

  /**
   * Kiểm tra xem có block UI nào đang active không
   * Check DOM elements - cách này hoạt động cho cả ng-block-ui và custom directive
   * Vì cả hai đều tạo ra class 'block-ui-wrapper active' khi active
   */
  private hasAnyActiveBlockUI(): boolean {
    // Check DOM elements có class 'block-ui-wrapper active'
    // Điều này bao gồm cả ng-block-ui và custom directive appSectionBlock
    const activeBlockUIElements = document.querySelectorAll('.block-ui-wrapper.active');
    return activeBlockUIElements && activeBlockUIElements.length > 0;
  }
}
