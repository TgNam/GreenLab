import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';

import { AuthenticationService } from 'app/auth/service';
import { ToastrService } from 'ngx-toastr';
import { CoreTranslationService } from '@core/services/translation.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  /**
   * @param {Router} _router
   * @param {AuthenticationService} _authenticationService
   */
  constructor(private _router: Router, private _authenticationService: AuthenticationService, private toastrService: ToastrService, private translate: CoreTranslationService, private translationService: TranslateService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError(err => from(this.normalizeErrorPayload(err)).pipe(mergeMap((normalizedErr: any) => {
        const err = normalizedErr;
        console.error(err)
        if ([403, 404, 400].indexOf(err.status) !== -1) {
          // auto logout if 401 Unauthorized or 403 Forbidden response returned from api
          if (err.status === 400) {
            const errorMsg = this.translate.instant('COMMON.FAILED');
            if (err.error?.i18n) {
              let currentLang = this.getCurrentLang();
              const detailMsg = err.error.i18n[currentLang] || err.error?.message || 'Yêu cầu không hợp lệ';
              this.showErrorToast(detailMsg, errorMsg);
            } else if (err.error?.message) {
              this.showErrorToast(err.error.message, errorMsg);
            } else {
              this.showErrorToast('Yêu cầu không hợp lệ', errorMsg);
            }
          }
          else if (err.error.i18n) {
            let errorMsg = this.translate.instant('COMMON.FAILED');
            let currentLang = this.getCurrentLang();
            let detailMsg = err.error.i18n[currentLang];
            this.showErrorToast(detailMsg, errorMsg)
          }
          else if (err.error.message) {
            let errorMsg = this.translate.instant('COMMON.FAILED');
            this.showErrorToast(err.error.message, errorMsg)
          }
          else {
            this._router.navigate(['/pages/miscellaneous/not-authorized']);
          }
          // ? Can also logout and reload if needed
          // this._authenticationService.logout();
          // location.reload(true);
        } else if ([401].indexOf(err.status) !== -1) {
          this._authenticationService.logout();
          this._router.navigate(['/login']);
          let message = this.translate.instant('COMMON.TOKEN_EXPIRED');
          let errorMsg = this.translate.instant('COMMON.FAILED');
          this.showErrorToast(message, errorMsg)
        }
        else {
          // other errors
          if (err.error && typeof err.error === 'object' && err.error.error) {
            let errorMsg = this.translate.instant('COMMON.FAILED');
            this.showErrorToast(err.error.error, errorMsg)
          }
        }

        // throwError
        const error = err?.error?.message || err?.statusText || 'Request failed';
        return throwError(error);
      })))
    );
  }

  private getCurrentLang(): string {
    let currentLang = this.translationService.currentLang;
    if (!currentLang) {
      currentLang = 'vi';
    } else if (currentLang === 'vn') {
      currentLang = 'vi';
    }
    return currentLang;
  }

  private async normalizeErrorPayload(err: any): Promise<any> {
    if (!(err?.error instanceof Blob)) {
      return err;
    }
    const blob_error = err.error as Blob;
    // Ưu tiên parse JSON để giữ message/i18n khi request dùng responseType: 'blob'
    if (blob_error.type && blob_error.type.includes('application/json')) {
      try {
        const text = await blob_error.text();
        err.error = JSON.parse(text);
        return err;
      } catch {
        return err;
      }
    }
    return err;
  }

  showErrorToast(message: string, title = 'Thất bại') {
    this.toastrService.error(message, title);
  }
}
