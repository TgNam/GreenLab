import { Component, Inject, OnDestroy, OnInit, ElementRef, Renderer2, NgZone, ViewEncapsulation, RendererStyleFlags2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Title } from '@angular/platform-browser';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import * as Waves from 'node-waves';

import { CoreMenuService } from '@core/components/core-menu/core-menu.service';
import { CoreSidebarService } from '@core/components/core-sidebar/core-sidebar.service';
import { CoreConfigService } from '@core/services/config.service';
import { CoreLoadingScreenService } from '@core/services/loading-screen.service';
import { CoreTranslationService } from '@core/services/translation.service';
import { PwaUnsubscribeService } from 'app/services/pwa-unsubscribe.service';

import { menu } from 'app/menu/menu';
import { locale as menuEnglish } from 'app/menu/i18n/en';
import { locale as menuFrench } from 'app/menu/i18n/fr';
import { locale as menuGerman } from 'app/menu/i18n/de';
import { locale as menuPortuguese } from 'app/menu/i18n/pt';
import { locale as menuVietnamese } from 'app/menu/i18n/vn';
import { MenuService } from './menu/menu.service';
import { ActivatedRoute, Router, NavigationEnd, NavigationStart } from '@angular/router';
import { filter, pairwise } from 'rxjs/operators';
import { MenuEventService } from './menu/menu-event.service';
import { DoctorSelectService } from './main/services/doctor-select.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  coreConfig: any;
  menu: any;
  defaultLanguage = 'vn'; // This language will be used as a fallback when a translation isn't found in the current language
  appLanguage = 'vn'; // Set application default language i.e fr
  loadedApp = false;
  executed = false;
  private previousUrl: string = '';
  private previousLayoutType: string | null = null; // Track previous layout type
  private previousMenuHidden = false;

  ngAfterViewInit(): void {
    // đảm bảo view (bao gồm loading bar) đã render
    setTimeout(() => {
      this.loadedApp = true;
    });

    // Subscribe to config changes
    this._coreConfigService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe(() => {
      const currentLayoutType = this.coreConfig.layout.type;

      // Only execute if:
      // 1. First time load (previousLayoutType is null) and current is horizontal
      // 2. Layout changed from 'vertical' to 'horizontal'
      const isFirstLoad = this.previousLayoutType === null;
      const isVerticalToHorizontal = this.previousLayoutType === 'vertical' && currentLayoutType === 'horizontal';
      const isHiddenMenuToNotHidden = this.previousMenuHidden && !this.coreConfig?.layout?.menu?.hidden;
      const isNotHiddenMenuToHidden = !this.previousMenuHidden && this.coreConfig?.layout?.menu?.hidden;
      // Capture trước khi update để trong waitForMenuAndContentOnce (có retry async) vẫn dùng đúng giá trị
      const wasMenuHidden = this.previousMenuHidden;
      if (currentLayoutType === 'horizontal' && (isFirstLoad || isHiddenMenuToNotHidden || isVerticalToHorizontal || isNotHiddenMenuToHidden)) {
        this.executed = false;
        this.waitForMenuAndContentOnce(wasMenuHidden, isVerticalToHorizontal);
      }

      // Update previous layout type
      this.previousLayoutType = currentLayoutType;
      this.previousMenuHidden = this.coreConfig?.layout?.menu?.hidden;

    });

  }

  private waitForMenuAndContentOnce(wasMenuHidden: boolean, isVerticalToHorizontal: boolean): void {
    // wasMenuHidden: giá trị menu.hidden tại thời điểm gọi (tránh bị reset do subscription update previousMenuHidden)
    this._ngZone.runOutsideAngular(() => {
      const check = () => {
        if (this.executed) return;
        // Nếu menu đang ẩn (hidden true → set 80px)
        if (this.coreConfig?.layout?.menu?.hidden) {

          const content = document.querySelector('.app-content') as HTMLElement;
          if (content) {
            this.executed = true;
            this._ngZone.run(() => {
              this._renderer.setStyle(content, 'padding-top', '80px', RendererStyleFlags2.Important);
            });
            return;
          }
          requestAnimationFrame(check);
          return;
        }

        const nav = document.getElementById('main-menu-navigation');
        const content = document.querySelector('.app-content') as HTMLElement;

        if (!nav || !content) {
          requestAnimationFrame(check);
          return;
        }

        const navHeight = nav.offsetHeight;
        if (navHeight <= 0) {
          requestAnimationFrame(check);
          return;
        }

        const currentPaddingTop =
          parseFloat(window.getComputedStyle(content).paddingTop) || 0;

        // CHỈ retry khi paddingTop còn nhỏ và trước đó menu đang ẩn (hidden→visible)
        if (currentPaddingTop <= 149) {
          if (wasMenuHidden) {
            this.executed = true;
            const addedPx = Math.round(navHeight + 10);
            this._ngZone.run(() => {
              this._renderer.setStyle(
                content,
                'padding-top',
                `${currentPaddingTop + addedPx}px`
              );
            });
            return;
          }
          else {
            requestAnimationFrame(check);
            return;
          }
        }
        this.executed = true;
        const addedPx = Math.round(navHeight - 62.34);
        this._ngZone.run(() => {
          this._renderer.setStyle(
            content,
            'padding-top',
            `${currentPaddingTop + addedPx}px`
          );
        });
      };

      check();
    });

  }


  // Private
  private _unsubscribeAll: Subject<any>;

  /**
   * Constructor
   *
   * @param {DOCUMENT} document
   * @param {Title} _title
   * @param {Renderer2} _renderer
   * @param {ElementRef} _elementRef
   * @param {CoreConfigService} _coreConfigService
   * @param {CoreSidebarService} _coreSidebarService
   * @param {CoreLoadingScreenService} _coreLoadingScreenService
   * @param {CoreMenuService} _coreMenuService
   * @param {CoreTranslationService} _coreTranslationService
   * @param {TranslateService} _translateService
   */
  constructor(
    @Inject(DOCUMENT) private document: any,
    private _title: Title,
    private _renderer: Renderer2,
    private _elementRef: ElementRef,
    public _coreConfigService: CoreConfigService,
    private _coreSidebarService: CoreSidebarService,
    private _coreLoadingScreenService: CoreLoadingScreenService,
    private _coreMenuService: CoreMenuService,
    private _coreTranslationService: CoreTranslationService,
    private _translateService: TranslateService,
    private _menuService: MenuService,
    private _ngZone: NgZone,
    private route: ActivatedRoute,
    private router: Router,
    private menuEvent: MenuEventService,
    private _pwaUnsubscribe: PwaUnsubscribeService,
    private _doctorSelectService: DoctorSelectService
  ) {
    // Get the application main menu



    // Register the menu to the menu service


    // Add languages to the translation service
    this._translateService.addLangs(['en', 'vn']);

    // This language will be used as a fallback when a translation isn't found in the current language
    this._translateService.setDefaultLang('vn');

    // Set the translations for the menu
    this._coreTranslationService.translate(menuEnglish, menuFrench, menuGerman, menuPortuguese, menuVietnamese);

    // Set the private defaults
    this._unsubscribeAll = new Subject();
  }

  async loadRoles() {
    try {
      const response: any = await this._menuService.getRolesForAdmin();
      const menuBuilt = this.buildMenu(response.data.roles);
      //tạm tắt
      if (response.data.version) {
        const version = typeof response.data.version === 'string' ? JSON.parse(response.data.version) : response.data.version;
        if (version) {
          let versionLocalStr = localStorage.getItem('version');
          let versionLocal = versionLocalStr ? JSON.parse(versionLocalStr) : null;
          // if (!versionLocal || version.location !== versionLocal.location) {
          //   const responseLocations: any = await this._menuService.getLocations();
          //   localStorage.setItem('cities', JSON.stringify(responseLocations.data.cities));
          //   localStorage.setItem('districts', JSON.stringify(responseLocations.data.districts));
          //   localStorage.setItem('wards', JSON.stringify(responseLocations.data.wards));
          // }
          if (!versionLocal || version.doctor !== versionLocal.doctor || localStorage.getItem('doctorSelect') === null) {
            this._doctorSelectService.getDoctorSelect().subscribe((resp: any) => {
              console.log('Doctor select reloaded success !');
            });
          }
          localStorage.setItem('version', JSON.stringify(version));
        }
      }
      const arrMenu = []
      arrMenu.push(menuBuilt)
      // Register menu sau khi async
      this.menu = menuBuilt;
      this._coreMenuService.unregister('main'); // nếu service có hỗ trợ
      this._coreMenuService.register('main', this.menu);
      this._coreMenuService.setCurrentMenu('main');
    } catch (error) {
      console.log(error)
    }
  }
  toggleSidebarOut() {
    if (this._coreSidebarService.getSidebarRegistry('themeCustomizer') && this._coreSidebarService.getSidebarRegistry('themeCustomizer').isOpened)
      this._coreSidebarService.getSidebarRegistry('themeCustomizer').toggleOpen();

  }

  buildMenu(rolesData) {
    // Mảng cấu hình để check uri và thêm prefix
    const uriConfigs = [
      { prefix: '', uri: 'roles' },
      { prefix: '', uri: 'permissions' },
      { prefix: '', uri: 'administrators' },
      { prefix: 'config', uri: 'system-configs' },
      { prefix: '', uri: 'email-templates' },
      { prefix: '', uri: 'users' },
      { prefix: '', uri: 'sms-templates' },
      // thêm các cấu hình khác nếu cần
    ];

    const menu: any[] = []; // Menu trả về là mảng các role
    if (!rolesData) {
      // console.log('rolesData is undefined');
      return [];
    }
    rolesData.forEach(role => {
      const roleItem: any = {
        id: `role-${role.id}`,
        title: role.name,
        translate: role.name,
        type: 'collapsible',
        icon: role.icon ? role.icon : 'menu',
        children: []
      };

      role.permissions.forEach(perm => {
        if (!perm.hidden) {
          let url = perm.uri;
          if (url.includes('exception-handling')) {
            if (!roleItem.children.find(child => child.url.includes('exception-handling'))) {
              roleItem.children.push({
                id: `perm-${perm.id}`,
                title: 'KH-Mẫu cần xử lý',
                type: 'item',
                icon: 'circle',
                url: '/exception-handling'
              });
            }
          } else {
            roleItem.children.push({
              id: `perm-${perm.id}`,
              title: perm.name,
              type: 'item',
              icon: 'circle',
              url: url
            });
          }
        }
      });
      menu.push(roleItem); // Thêm role vào menu


    });
    // console.log('MENU: ', menu)
    return menu;
  }


  // Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  async ngOnInit(): Promise<void> {
    // Check và unsubscribe PWA nếu đang dùng
    this.checkAndUnsubscribePWA();

    // Init wave effect (Ripple effect)
    this.menuEvent.reloadMenu$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(() => {
        this.loadRoles();
      });
    Waves.init();

    // Helper function to check if current route is login page
    const isLoginPage = (url: string): boolean => {
      if (!url || url === '/') return false;
      const cleanUrl = url.split('?')[0].split('#')[0];
      return cleanUrl === '/pages/authentication/login-v2' ||
        cleanUrl === '/pages/authentication/login' ||
        cleanUrl.startsWith('/pages/authentication/login-v2/') ||
        cleanUrl.startsWith('/pages/authentication/login/') ||
        cleanUrl.includes('/pages/authentication/login-v2') ||
        cleanUrl.includes('/pages/authentication/login') ||
        cleanUrl === '/login' ||
        cleanUrl.startsWith('/login/') ||
        cleanUrl.startsWith('/login-v2/') ||
        cleanUrl.includes('/login-v2')
        ;
    };

    const isForgotPasswordPage = (url: string): boolean => {
      if (!url || url === '/') return false;
      const cleanUrl = url.split('?')[0].split('#')[0];
      return cleanUrl === '/pages/authentication/forgot-password-v2' ||
        cleanUrl === '/pages/authentication/forgot-password' ||
        cleanUrl.startsWith('/pages/authentication/forgot-password-v2/') ||
        cleanUrl.startsWith('/pages/authentication/forgot-password/') ||
        cleanUrl.includes('/pages/authentication/forgot-password-v2') ||
        cleanUrl.includes('/pages/authentication/forgot-password') ||
        cleanUrl === '/forgot-password' ||
        cleanUrl.startsWith('/forgot-password/') ||
        cleanUrl.startsWith('/forgot-password-v2/') ||
        cleanUrl.includes('/forgot-password-v2');
    };

    const isResetPasswordPage = (url: string): boolean => {
      if (!url || url === '/') return false;
      const cleanUrl = url.split('?')[0].split('#')[0];
      return cleanUrl === '/pages/authentication/reset-password' ||
        cleanUrl.startsWith('/pages/authentication/reset-password/') ||
        cleanUrl.includes('/pages/authentication/reset-password') ||
        cleanUrl === '/reset-password' ||
        cleanUrl.startsWith('/reset-password-v2/') ||
        cleanUrl.includes('/reset-password-v2');
    };

    // Subscribe to router events to get the actual URL after navigation
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this._unsubscribeAll)
      )
      .subscribe((event: NavigationEnd) => {
        if (!isLoginPage(event.urlAfterRedirects) && !isForgotPasswordPage(event.urlAfterRedirects) && !isResetPasswordPage(event.urlAfterRedirects) && !this.menu) {
          console.log('reload menu', event.urlAfterRedirects);
          this.loadRoles();
        }
      });

    // Check initial URL - use setTimeout to ensure router is initialized
    setTimeout(() => {
      const currentUrl = this.router.url;
      if (currentUrl && currentUrl !== '/' && !isLoginPage(currentUrl) && !isForgotPasswordPage(currentUrl) && !isResetPasswordPage(currentUrl) && !this.menu) {
        this.loadRoles();
      }
    }, 100);
    //this.menu = menu;
    this._coreMenuService.register('main', this.menu);

    // Set the main menu as our current menu
    this._coreMenuService.setCurrentMenu('main');

    // Subscribe to config changes
    this._coreConfigService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe(config => {
      this.coreConfig = config;

      // Set application default language.

      // Change application language? Read the ngxTranslate Fix

      // ? Use app-config.ts file to set default language
      const appLanguage = this.coreConfig.app.appLanguage || 'vn';
      this._translateService.use(appLanguage);

      // ? OR
      // ? User the current browser lang if available, if undefined use 'en'
      // const browserLang = this._translateService.getBrowserLang();
      // this._translateService.use(browserLang.match(/en|fr|de|pt/) ? browserLang : 'en');

      /**
       * ! Fix : ngxTranslate
       * ----------------------------------------------------------------------------------------------------
       */

      /**
       *
       * Using different language than the default ('en') one i.e French?
       * In this case, you may find the issue where application is not properly translated when your app is initialized.
       *
       * It's due to ngxTranslate module and below is a fix for that.
       * Eventually we will move to the multi language implementation over to the Angular's core language service.
       *
       **/

      // Set the default language to 'en' and then back to 'fr'.

      setTimeout(() => {
        this._translateService.setDefaultLang('en');
        this._translateService.setDefaultLang(appLanguage);
      });

      /**
       * !Fix: ngxTranslate
       * ----------------------------------------------------------------------------------------------------
       */

      // Layout
      //--------

      // Remove default classes first
      this._elementRef.nativeElement.classList.remove(
        'vertical-layout',
        'vertical-menu-modern',
        'horizontal-layout',
        'horizontal-menu'
      );
      // Add class based on config options
      if (this.coreConfig.layout.type === 'vertical') {
        this._elementRef.nativeElement.classList.add('vertical-layout', 'vertical-menu-modern');
      } else if (this.coreConfig.layout.type === 'horizontal') {
        this._elementRef.nativeElement.classList.add('horizontal-layout', 'horizontal-menu');
      }

      // Navbar
      //--------

      // Remove default classes first
      this._elementRef.nativeElement.classList.remove(
        'navbar-floating',
        'navbar-static',
        'navbar-sticky',
        'navbar-hidden'
      );

      // Add class based on config options
      if (this.coreConfig.layout.navbar.type === 'navbar-static-top') {
        this._elementRef.nativeElement.classList.add('navbar-static');
      } else if (this.coreConfig.layout.navbar.type === 'fixed-top') {
        this._elementRef.nativeElement.classList.add('navbar-sticky');
      } else if (this.coreConfig.layout.navbar.type === 'floating-nav') {
        this._elementRef.nativeElement.classList.add('navbar-floating');
      } else {
        this._elementRef.nativeElement.classList.add('navbar-hidden');
      }

      // Footer
      //--------

      // Remove default classes first
      this._elementRef.nativeElement.classList.remove('footer-fixed', 'footer-static', 'footer-hidden');

      // Add class based on config options
      if (this.coreConfig.layout.footer.type === 'footer-sticky') {
        this._elementRef.nativeElement.classList.add('footer-fixed');
      } else if (this.coreConfig.layout.footer.type === 'footer-static') {
        this._elementRef.nativeElement.classList.add('footer-static');
      } else {
        this._elementRef.nativeElement.classList.add('footer-hidden');
      }

      // Blank layout
      if (
        this.coreConfig.layout.menu.hidden &&
        this.coreConfig.layout.navbar.hidden &&
        this.coreConfig.layout.footer.hidden
      ) {
        this._elementRef.nativeElement.classList.add('blank-page');
        // ! Fix: Transition issue while coming from blank page
        this._renderer.setAttribute(
          this._elementRef.nativeElement.getElementsByClassName('app-content')[0],
          'style',
          'transition:none'
        );
      } else {
        this._elementRef.nativeElement.classList.remove('blank-page');
        // ! Fix: Transition issue while coming from blank page
        setTimeout(() => {
          // if (this._renderer) {

          //   this._renderer.setAttribute(
          //     this._elementRef.nativeElement.getElementsByClassName('app-content')[0],
          //     'style',
          //     'transition:300ms ease all'
          //   );
          // }
          const el = this._elementRef.nativeElement
            ?.getElementsByClassName('app-content')?.[0];

          if (!el || !this._renderer) return;

          this._renderer.setStyle(el, 'transition', '300ms ease all');
        }, 0);

        // If navbar hidden
        if (this.coreConfig.layout.navbar.hidden) {
          this._elementRef.nativeElement.classList.add('navbar-hidden');
        }
        // Menu (Vertical menu hidden)
        if (this.coreConfig.layout.menu.hidden) {
          this._renderer.setAttribute(this._elementRef.nativeElement, 'data-col', '1-column');
          // Từ false → true (menu ẩn): set padding top 80px
          const contentEl = this._elementRef.nativeElement?.getElementsByClassName('app-content')?.[0];
          if (contentEl && this._renderer) {
            this._renderer.setStyle(contentEl, 'padding-top', '80px');
          }
        } else {
          this._renderer.removeAttribute(this._elementRef.nativeElement, 'data-col');
        }
        // Footer
        if (this.coreConfig.layout.footer.hidden) {
          this._elementRef.nativeElement.classList.add('footer-hidden');
        }
      }

      // Skin Class (Adding to body as it requires highest priority)
      if (this.coreConfig.layout.skin !== '' && this.coreConfig.layout.skin !== undefined) {
        this.document.body.classList.remove('default-layout', 'bordered-layout', 'dark-layout', 'semi-dark-layout');
        this.document.body.classList.add(this.coreConfig.layout.skin + '-layout');
      }
    });

    // Set the application page title
    this._title.setTitle(this.coreConfig.app.appTitle);
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  // Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Toggle sidebar open
   *
   * @param key
   */
  toggleSidebar(key): void {
    this._coreSidebarService.getSidebarRegistry(key).toggleOpen();
  }

  /**
   * Kiểm tra và unsubscribe PWA nếu đang được sử dụng
   */
  private async checkAndUnsubscribePWA(): Promise<void> {
    try {
      // Kiểm tra trạng thái PWA
      const status = await this._pwaUnsubscribe.getPwaStatus();

      // Nếu có service worker hoặc cache hoặc FCM token hoặc PWA đã được cài đặt thì unsubscribe
      if (status.serviceWorkers.length > 0 || status.cacheCount > 0 || status.hasFcmToken || status.isPwaInstalled) {
        // Sử dụng unsubscribePWAComplete để xóa cả manifest
        const result = await this._pwaUnsubscribe.unsubscribePWAComplete();

        if (result.success) {
          // Nếu PWA đã được cài đặt, log hướng dẫn
          if (status.isPwaInstalled) {
            console.warn('⚠️ PWA đã được cài đặt. Cần gỡ cài đặt thủ công:', result.message);
          }
        }
      }
    } catch (error) {
      // Không log error để tránh làm gián đoạn app nếu service không hoạt động
      console.warn('Không thể check PWA status:', error);
    }
  }
}
