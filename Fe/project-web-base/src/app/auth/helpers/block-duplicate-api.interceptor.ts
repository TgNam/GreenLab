import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable, EMPTY } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable()
export class BlockDuplicateApiInterceptor implements HttpInterceptor {

  private pendingRequests = new Map<string, boolean>();

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const nonBlock = request.headers.get('X-Non-Block') === 'true';

    // 🔥 Tạo request key gồm method + url + params + body
    const requestKey = this.generateRequestKey(request);

    if (!nonBlock) {
      if (this.pendingRequests.has(requestKey)) {
        // Đang có request giống hệt đang chạy
        return EMPTY;
      }

      this.pendingRequests.set(requestKey, true);
    }

    return next.handle(request).pipe(
      finalize(() => {
        if (!nonBlock) {
          this.pendingRequests.delete(requestKey);
        }
      })
    );
  }

  private generateRequestKey(request: HttpRequest<any>): string {

    const method = request.method;

    const url = request.urlWithParams; // đã bao gồm query param

    let body = '';

    if (request.body) {
      try {
        body = JSON.stringify(request.body);
      } catch {
        body = '';
      }
    }

    return `${method}-${url}-${body}`;
  }
}
