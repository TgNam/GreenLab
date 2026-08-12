import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';

import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { CoreConfigService } from '@core/services/config.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from 'app/auth/service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-auth-reset-password-v2',
  templateUrl: './auth-reset-password-v2.component.html',
  styleUrls: ['./auth-reset-password-v2.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AuthResetPasswordV2Component implements OnInit {
  // Public
  public coreConfig: any;
  public passwordTextType: boolean;
  public confPasswordTextType: boolean;
  public resetPasswordForm: UntypedFormGroup;
  public submitted = false;
  private readonly passwordRegex =
    /^(?!.*\s)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]{8,}$/;

  // Private
  private _unsubscribeAll: Subject<any>;

  /**
   * Constructor
   *
   * @param {CoreConfigService} _coreConfigService
   * @param {FormBuilder} _formBuilder
   */
  constructor(private _coreConfigService: CoreConfigService, private _formBuilder: UntypedFormBuilder, private _route: ActivatedRoute,
    private _authenticationService: AuthenticationService,
    private _router: Router,
    private _toastr: ToastrService
  ) {
    this._unsubscribeAll = new Subject();

    // Configure the layout
    this._coreConfigService.config = {
      layout: {
        navbar: {
          hidden: true
        },
        menu: {
          hidden: true
        },
        footer: {
          hidden: true
        },
        customizer: false,
        enableLocalStorage: false
      }
    };
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.resetPasswordForm.controls;
  }

  /**
   * Toggle password
   */
  togglePasswordTextType() {
    this.passwordTextType = !this.passwordTextType;
  }

  /**
   * Toggle confirm password
   */
  toggleConfPasswordTextType() {
    this.confPasswordTextType = !this.confPasswordTextType;
  }

  /**
   * On Submit
   */
  // onSubmit() {
  //   this.submitted = true;

  //   // stop here if form is invalid
  //   if (this.resetPasswordForm.invalid) {
  //     return;
  //   }
  // }

  public lostPasswordCode: string;

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  async ngOnInit() {
    this.resetPasswordForm = this._formBuilder.group({
      newPassword: ['', [Validators.required, Validators.pattern(this.passwordRegex)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    // Subscribe to config changes
    this._coreConfigService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe(config => {
      this.coreConfig = config;
    });

    const code = this._route.snapshot.queryParamMap.get('code') || this._route.snapshot.queryParamMap.get('CODE');
      try {
        const res = await this._authenticationService.checkLostPasswordCode(code).toPromise();
        if (res.success) {
          this.lostPasswordCode = code;
        } else {
          this._router.navigateByUrl('/login');
        }
      } catch (error) {
        console.error(error);
        this._router.navigateByUrl('/login');
      }
    
  }

  onSubmit() {
    this.submitted = true;
    if (this.resetPasswordForm.invalid) {
      return;
    }
    this._authenticationService.changePassword(this.lostPasswordCode, this.f.newPassword.value, this.f.confirmPassword.value).subscribe(res => {
      if (res.success) {
        this._toastr.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại');
        this._router.navigateByUrl('/login');
      }
    });
  }

  private passwordMatchValidator(control: AbstractControl): { passwordMismatch: boolean } | null {
    const new_password = control.get('newPassword')?.value;
    const confirm_password = control.get('confirmPassword')?.value;

    if (!new_password || !confirm_password) {
      return null;
    }

    return new_password === confirm_password ? null : { passwordMismatch: true };
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }
}
