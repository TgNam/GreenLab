import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from 'environments/environment';
import { AuthenticationService } from 'app/auth/service';
import { Router } from '@angular/router';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  /**
   *
   * @param {AuthenticationService} _authenticationService
   */
  constructor(private _authenticationService: AuthenticationService, private _router: Router) {}

  /**
   * Add auth header with jwt if user is logged in and request is to api url
   * @param request
   * @param next
   */
  // intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  //   const currentUser = this._authenticationService.currentUserValue;
  //   let currentUserStorageJSON = localStorage.getItem('currentUser');
  //   let currentUserStorage = null;
  //   try {
  //     currentUserStorage = JSON.parse(currentUserStorageJSON);
  //   } catch(error) {

  //   }
  //   const isLoggedIn = currentUser && currentUser.token && currentUserStorage.email == currentUser.email;
  //   const isApiUrl = request.url.startsWith(environment.apiUrl);
  //   if (isLoggedIn && isApiUrl) {
  //     request = request.clone({
  //       setHeaders: {
  //         Authorization: `Bearer ${currentUser.token}`
  //       },
  //       withCredentials: true
  //     });
  //   } else if (isApiUrl) {
  //   // Nếu không login nhưng là request tới API, vẫn gửi cookie
  //   request = request.clone({
  //     withCredentials: true
  //   });
  // }

  //   return next.handle(request);
  // }
  // Đọc cookie theo tên
  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const isApiUrl = request.url.startsWith(environment.apiUrl);

    if (isApiUrl) {
      const token = this.getCookie('token');

      if (token) {
        request = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          },
          withCredentials: true
        });
      } else {
        request = request.clone({
          withCredentials: true
        });
      }
    }

    return next.handle(request);
  }
}
