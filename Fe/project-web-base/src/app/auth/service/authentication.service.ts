import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from 'environments/environment';
import { User, Role } from 'app/auth/models';
import { ToastrService } from 'ngx-toastr';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  //public
  public currentUser: Observable<User>;

  //private
  private currentUserSubject: BehaviorSubject<User>;

  /**
   *
   * @param {HttpClient} _http
   * @param {ToastrService} _toastrService
   * @param {Router} _router
   */
  constructor(private _http: HttpClient, private _toastrService: ToastrService, private _router: Router) {
    this.currentUserSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('currentUser')));
    this.currentUser = this.currentUserSubject.asObservable();
  }

  // getter: currentUserValue
  public get currentUserValue(): User {
    return this.currentUserSubject.value;
  }

  /**
   * Check if JWT token exists in cookie
   * Used to determine if we should sync user from backend
   */
  public hasToken(): boolean {
    return document.cookie.split(';').some(c => c.trim().startsWith('token='));
  }

  /**
   *  Confirms if user is admin
   */
  get isAdmin() {
    return this.currentUser && this.currentUserSubject.value.role === Role.Admin;
  }

  /**
   *  Confirms if user is client
   */
  get isClient() {
    return this.currentUser && this.currentUserSubject.value.role === Role.Client;
  }

  /**
   * User login
   *
   * @param email
   * @param password
   * @returns user
   */

  login(usernameOrEmail: string, password: string, rememberMe: boolean, returnUrl?: string) {
  return this._http
      .post<{ token: string; adminName: string; adminAvatar: string; expiryDate: number }>(`${environment.apiUrl}/auth/login`, { usernameOrEmail, password, rememberMe })
    .pipe(
      map(res => {
        if (res) {
          const user: any = {
            id: null as any,
            email: usernameOrEmail,
            password: '',
            firstName: 'Admin',
            lastName: '',
            fullName: res.adminName,
            avatar: res.adminAvatar,
            role: Role.Admin
          };

          // Lưu JWT vào cookie Authorization để interceptor lấy ra gán vào header
        
          localStorage.setItem('currentUser', JSON.stringify(user));

          this.currentUserSubject.next(user);

            // Redirect to returnUrl if provided, otherwise to dashboard
            if (returnUrl && returnUrl !== '/login') {
              this._router.navigateByUrl(returnUrl);
            } else {
              console.log('redirect to dashboard');
              this._router.navigate(['/dashboard']);
            }

          return user;
        }
        return null as any;
      }),
      catchError(err => {
        console.log(err)
        // Hiển thị thông báo lỗi rõ ràng
        const message = err || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!';
        // Trả lại lỗi cho component nếu cần
        return throwError(() => err);
      })
    );
}

forgotPassword(email: string) {
  return this._http.post<any>(`${environment.apiUrl}/auth/forgot-password`, { email })
    .pipe(
      map(res => {
        return res;
      })
    );
}

checkLostPasswordCode(code: string) {
  return this._http.get<any>(`${environment.apiUrl}/auth/check-lost-password-code?code=${code}`)
    .pipe(
      map(res => {
        return res;
      })
    );
}

changePassword(code: string, newPassword: string, confirmPassword: string) {
  return this._http.post<any>(`${environment.apiUrl}/auth/change-password`, {
     code: code, 
     new_password: newPassword,
     confirm_password: confirmPassword })
    .pipe(
      map(res => {
        return res;
      })
    );
}
showErrorToast(message: string, title = 'Thất bại') {
    this._toastrService.error(message, title, {
      closeButton: true,
      tapToDismiss: false,
      progressBar: true,
      toastClass: 'toast ngx-toastr toast-error',
      positionClass: 'toast-top-right'

    });
  }

  /**
   * Get current user info from backend
   * Dùng khi OAuth2 redirect về, cần sync user info từ JWT cookie
   */
  getCurrentUser(): Observable<any> {
    return this._http.get<any>(`${environment.apiUrl}/auth/me`, { withCredentials: true }).pipe(
      map(res => {
        if (res && res.success && res.data) {
          const user: User = {
            id: res.data.id,
            email: res.data.email,
            password: '',
            firstName: '',
            lastName: '',
            fullName: res.data.fullName,
            avatar: res.data.avatar,
            role: Role.Admin
          };
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
          return user;
        }
        return null;
      }),
      catchError(err => {
        console.log('getCurrentUser error:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * User logout
   *
   */
  logout() {
    document.cookie = "token=; Max-Age=0; path=/";
    // remove user from local storage to log user out
    localStorage.removeItem('currentUser');
    // notify
    this.currentUserSubject.next(null);
  }
}
