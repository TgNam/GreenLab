import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { takeUntil, first } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as _ from 'lodash';

import { AuthenticationService } from 'app/auth/service';
import { CoreConfigService } from '@core/services/config.service';
import { MenuEventService } from 'app/menu/menu-event.service';
import { TranslateService } from '@ngx-translate/core';
import { CoreTranslationService } from '@core/services/translation.service';

@Component({
  selector: 'app-auth-login-v2',
  templateUrl: './auth-login-v2.component.html',
  styleUrls: ['./auth-login-v2.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AuthLoginV2Component implements OnInit, AfterViewInit {
  //  Public
  public coreConfig: any;
  public loginForm: UntypedFormGroup;
  public loading = false;
  public submitted = false;
  public returnUrl: string;
  public error = '';
  public passwordTextType: boolean;
  public languageOptions: any;
  public selectedLanguage: any;
  public showLoginForm = true; // Control whether to show login form
  @ViewChild('emailInput') emailInput?: ElementRef<HTMLInputElement>;
  @ViewChild('passwordInput') passwordInput?: ElementRef<HTMLInputElement>;
  // Private
  private _unsubscribeAll: Subject<any>;

  /**
   * Constructor
   *
   * @param {CoreConfigService} _coreConfigService
   */
  constructor(
    private _coreConfigService: CoreConfigService,
    private _formBuilder: UntypedFormBuilder,
    private _route: ActivatedRoute,
    private _router: Router,
    private _authenticationService: AuthenticationService,
    private menuEvent: MenuEventService,
    private _translate: CoreTranslationService,
    public _translateService: TranslateService,
    private cdr: ChangeDetectorRef
  ) {
    this._translate.onLangChange(event => {
      this.languageOptions = {
        en: {
          title: this._translateService.instant('COMMON.ENGLISH'),
          flag: 'us'
        },
        fr: {
          title: 'French',
          flag: 'fr'
        },
        de: {
          title: 'German',
          flag: 'de'
        },
        pt: {
          title: 'Portuguese',
          flag: 'pt'
        },
        vn: {
          title: this._translateService.instant('COMMON.VIETNAMESE'),
          flag: 'vn'
        }
      };
    });
    this.languageOptions = {
      en: {
        title: this._translateService.instant('COMMON.ENGLISH'),
        flag: 'us'
      },
      fr: {
        title: 'French',
        flag: 'fr'
      },
      de: {
        title: 'German',
        flag: 'de'
      },
      pt: {
        title: 'Portuguese',
        flag: 'pt'
      },
      vn: {
        title: this._translateService.instant('COMMON.VIETNAMESE'),
        flag: 'vn'
      }
    };

    this._unsubscribeAll = new Subject();
    const currentConfig = this._coreConfigService.config || {};
    const currentLayout = currentConfig.layout || {};
    // Configure the layout

    this._coreConfigService.config = {
      ...currentConfig.app,
      layout: {
        ...currentLayout,
        navbar: {
          ...currentLayout.navbar,
          hidden: true
        },
        menu: {
          ...currentLayout.menu,
          hidden: true
        },
        footer: {
          ...currentLayout.footer,
          hidden: true
        },
        customizer: false,
        enableLocalStorage: false
      }
    };
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.loginForm.controls;
  }

  /**
   * Get cookie value by name
   */
  private getCookie(name: string): string {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : '';
  }

  /**
   * Set cookie with expiration days
   */
  private setCookie(name: string, value: string, days: number): void {
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    document.cookie = `${name}=${encodeURIComponent(value)};path=/;expires=${expires.toUTCString()}`;
  }

  /**
   * Delete cookie
   */
  private deleteCookie(name: string): void {
    document.cookie = `${name}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 UTC`;
  }

  setLanguage(language): void {
    // Set the selected language for the navbar on change
    this.selectedLanguage = language;
    // Use the selected language id for translations
    this._translateService.use(language);
    const currentConfig = this._coreConfigService.config || {};
    const currentLayout = currentConfig.layout || {};
    this._coreConfigService.setConfig({
      app: { appLanguage: language }, layout: {
        ...currentLayout,
        navbar: {
          ...currentLayout.navbar,
          hidden: true
        },
        menu: {
          ...currentLayout.menu,
          hidden: true
        },
        footer: {
          ...currentLayout.footer,
          hidden: true
        },
        customizer: false,
      }
    }, { emitEvent: true });
  }
  /**
   * Toggle password
   */
  togglePasswordTextType() {
    this.passwordTextType = !this.passwordTextType;
  }

  onSubmit() {
    this.submitted = true;
    // stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    // Save email to cookie if rememberMe is true
    if (this.f.rememberMe.value) {
      this.setCookie('rememberedEmail', this.f.email.value, 7);
    } else {
      // Delete cookie if rememberMe is false
      this.deleteCookie('rememberedEmail');
    }

    // Login
    this.loading = true;
    this._authenticationService
      .login(this.f.email.value, this.f.password.value, this.f.rememberMe.value, this.returnUrl)
      .pipe(first())
      .subscribe(
        data => {
          // Hide login form immediately after successful login
          this.showLoginForm = false;

          // Navigation is now handled by authentication service
          this.menuEvent.emitReloadMenu()
          const currentConfig = this._coreConfigService.config || {};
          const currentLayout = this._coreConfigService.config?.layout || {};

          this._coreConfigService.setConfig({
            layout: {
              navbar: { ...currentLayout.navbar, hidden: false },
              menu: { ...currentLayout.menu, hidden: false },
              footer: { ...currentLayout.footer, hidden: false },
              customizer: true,
            }
          }, { emitEvent: true });
        },
        error => {
          this.loading = false;
        }
      );
  }

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // get return url from route parameters or default to '/'
    this.returnUrl = this._route.snapshot.queryParams['returnUrl'] || '/dashboard';
    // Check if user is already logged in and redirect
    if (this._authenticationService.currentUserValue) {
      this.showLoginForm = false; // Hide login form immediately
      // Redirect to returnUrl if exists, otherwise redirect to '/dashboard'
      const redirectUrl = this.returnUrl && this.returnUrl !== '/' ? this.returnUrl : '/dashboard';
      this._router.navigateByUrl(redirectUrl);
      return;
    }

    // Subscribe to authentication changes
    this._authenticationService.currentUser.pipe(takeUntil(this._unsubscribeAll)).subscribe(user => {
      if (user) {
        // User logged in, hide form and redirect away from login page
        this.showLoginForm = false;
        // Redirect to returnUrl if exists, otherwise redirect to '/dashboard'
        const redirectUrl = this.returnUrl && this.returnUrl !== '/' ? this.returnUrl : '/dashboard';
        this._router.navigateByUrl(redirectUrl);
      }
    });

    // Check if there's a saved email in cookie
    const rememberedEmail = this.getCookie('rememberedEmail');
    const defaultEmail = rememberedEmail || '';

    this.loginForm = this._formBuilder.group({
      email: [defaultEmail, [Validators.required]],
      password: ['', Validators.required],
      rememberMe: !!rememberedEmail
    });

    // console.log('init', this._translateService.defaultLang)
    // Subscribe to config changes
    this._coreConfigService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe(config => {
      this.coreConfig = config;
      this._translateService.use(this.coreConfig.app.appLanguage)
    });
    this.selectedLanguage = _.find(this.languageOptions, {
      id: this._translateService.currentLang
    });
  }

  ngAfterViewInit(): void {
    // Browser autofill có thể fill input sau khi Angular đã khởi tạo form,
    // nên cần đồng bộ DOM value -> FormControl để trạng thái valid/invalid đúng.
    setTimeout(() => this.syncAutofilledCredentialsToForm(), 200);
  }

  private syncAutofilledCredentialsToForm(): void {
    if (!this.loginForm) {
      return;
    }

    const email_value = this.emailInput?.nativeElement?.value || '';
    const password_value = this.passwordInput?.nativeElement?.value || '';
    const form_email = this.f.email.value || '';
    const form_password = this.f.password.value || '';

    let has_changed = false;
    if (email_value !== form_email) {
      this.f.email.setValue(email_value, { emitEvent: true });
      has_changed = true;
    }
    if (password_value !== form_password) {
      this.f.password.setValue(password_value, { emitEvent: true });
      has_changed = true;
    }

    this.f.email.updateValueAndValidity({ emitEvent: true });
    this.f.password.updateValueAndValidity({ emitEvent: true });
    this.loginForm.updateValueAndValidity({ emitEvent: true });
    console.log('syncAutofilledCredentialsToForm', has_changed)
    this.cdr.detectChanges();

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
