import { Component, OnInit, OnDestroy, ViewEncapsulation, HostListener, ViewChild, ElementRef } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CoreConfigService } from '@core/services/config.service';
import { CoreSidebarService } from '@core/components/core-sidebar/core-sidebar.service';

@Component({
  selector: 'core-theme-customizer',
  templateUrl: './theme-customizer.component.html',
  styleUrls: ['./theme-customizer.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CoreThemeCustomizerComponent implements OnInit, OnDestroy {
  navbarColorValue: string;
  primaryColorValue: string;
  coreConfig: any;
  form: UntypedFormGroup;

  // Private
  private _unsubscribeAll: Subject<any>;

  /**
   * Constructor

   * @param {FormBuilder} _formBuilder
   * @param {CoreConfigService} _coreConfigService
   * @param {CoreSidebarService} _coreSidebarService
   * */
  constructor(
    private _formBuilder: UntypedFormBuilder,
    private _coreConfigService: CoreConfigService,
    private _coreSidebarService: CoreSidebarService
  ) {
    // Set the private defaults
    this._unsubscribeAll = new Subject();
    const root = document.documentElement;
    this.primaryColorValue = getComputedStyle(root).getPropertyValue('--primary').trim();
  }

  //  Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Build theme config form

    if (localStorage.getItem('config')) {
      let item = JSON.parse(localStorage.getItem('config'));
      if (item.primary) {
        const root = document.documentElement;
        root.style.setProperty('--primary', item.primary);
        this.primaryColorValue = item.primary
        root.style.setProperty('--linear-primary', this.hexToRgb(item.primary));
        root.style.setProperty('--primary-hover', this.hoverColor(item.primary));
      }
    }
    this.form = this._formBuilder.group({
      app: this._formBuilder.group({
        appName: new UntypedFormControl(),
        appTitle: new UntypedFormControl(),
        appLogoImage: new UntypedFormControl(),
        appLanguage: new UntypedFormControl()
      }),
      layout: this._formBuilder.group({
        skin: new UntypedFormControl(),
        type: new UntypedFormControl(),
        animation: new UntypedFormControl(),
        menu: this._formBuilder.group({
          hidden: new UntypedFormControl(),
          collapsed: new UntypedFormControl()
        }),
        navbar: this._formBuilder.group({
          hidden: new UntypedFormControl(),
          type: new UntypedFormControl(),
          background: new UntypedFormControl(),
          customBackgroundColor: new UntypedFormControl(),
          backgroundColor: new UntypedFormControl()
        }),
        footer: this._formBuilder.group({
          hidden: new UntypedFormControl(),
          type: new UntypedFormControl(),
          background: new UntypedFormControl(),
          customBackgroundColor: new UntypedFormControl(),
          backgroundColor: new UntypedFormControl()
        }),
        enableLocalStorage: new UntypedFormControl(),
        customizer: new UntypedFormControl(),
        scrollTop: new UntypedFormControl(),
        buyNow: new UntypedFormControl()
      })
    });

    // Subscribe to the config changes
    this._coreConfigService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe(config => {
      // Update config
      this.coreConfig = config;

      // Set the config form values
      this.form.setValue(config, { emitEvent: false });
    });

    // Subscribe to the form layout.type value changes
    this.form
      .get('layout.type')
      .valueChanges.pipe(takeUntil(this._unsubscribeAll))
      .subscribe(value => {
        this._resetFormValues(value);
      });

    // Subscribe to the form value changes
    this.form.valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe(config => {
        // console.log(config)
       this._coreConfigService.setConfig(config, { emitEvent: true });
      //  console.log(this._coreConfigService.config)
      
      this.form.setValue(config, { emitEvent: false });
    });

    // Set navbar color
    this.navbarColor(this.form.get('layout.navbar.backgroundColor').value);
  }
  isCustomizerOpen = false;



closeCustomizer() {
  this.isCustomizerOpen = false;
}

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }
  @ViewChild('colorPicker') colorPicker!: ElementRef;

  isCustomColorSelected = false;

  openColorPicker(event: Event) {
    event.stopPropagation();
    document.getElementById('colorPicker').click()
    this.colorPicker.nativeElement.click();
  }

  onCustomColorChanged(event: any) {
    const color = event.target.value;
    this.isCustomColorSelected = true;
    this.primaryColor(color);   // gọi giống các phần tử khác
  }

  /** Tắt khi click ra ngoài */
  @HostListener('document:click')
  closePickerOnClickOutside() {
    this.isCustomColorSelected = false;
  }
  //  Private methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Reset form values based on the selected menu layout
   *
   * @param value
   * @private
   */
  private _resetFormValues(value): void {
    switch (value) {
      case 'vertical': {
        this.form.patchValue({
          layout: {
            // skin: 'default',
            animation: 'fadeIn',
            menu: {
              hidden: false,
              collapsed: false
            },
            navbar: {
              hidden: false,
              type: 'floating-nav',
              background: 'navbar-light',
              customBackgroundColor: true,
              backgroundColor: ''
            },
            footer: {
              hidden: false,
              type: 'footer-static',
              background: 'footer-light',
              customBackgroundColor: false,
              backgroundColor: 'bg-primary'
            }
          }
        });
      }
      case 'horizontal': {
        this.form.patchValue({
          layout: {
            // skin: 'default',
            animation: 'fadeIn',
            menu: {
              hidden: false,
              collapsed: false
            },
            navbar: {
              hidden: false,
              type: 'floating-nav',
              background: 'navbar-light',
              customBackgroundColor: true,
              backgroundColor: ''
            },
            footer: {
              hidden: false,
              type: 'footer-static',
              background: 'footer-light',
              customBackgroundColor: false,
              backgroundColor: 'bg-primary'
            }
          }
        });
      }
    }

    // Set navbar color
    this.navbarColor(this.form.get('layout.navbar.backgroundColor').value);
  }

  // Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Patch selected navbar color value to form
   *
   * @param value
   */
  navbarColor(value): void {
    this.navbarColorValue = value;
    this.form.patchValue({
      layout: { navbar: { customBackgroundColor: true, backgroundColor: this.navbarColorValue } }
    });
  }

  primaryColor(value): void {
    this.primaryColorValue = value;
    const root = document.documentElement;
    root.style.setProperty('--primary', value);
    root.style.setProperty('--linear-primary', this.hexToRgb(value));
    root.style.setProperty('--primary-hover', this.hoverColor(value));
    if (localStorage.getItem('config')) {
      let item = JSON.parse(localStorage.getItem('config'));
      item.primary = value;
      localStorage.setItem('config', JSON.stringify(item))
    }
  }

  hoverColor(hex) {
    // Bỏ ký tự #
    hex = hex.replace('#', '');

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const dr = 86;
    const dg = 70;
    const db = 1;

    // Cộng chênh lệch và clamp về 0–255
    const nr = Math.min(255, r + dr);
    const ng = Math.min(255, g + dg);
    const nb = Math.min(255, b + db);

    // Chuyển lại về hex
    return (
      '#' +
      nr.toString(16).padStart(2, '0') +
      ng.toString(16).padStart(2, '0') +
      nb.toString(16).padStart(2, '0')
    );
  }


  hexToRgb(hex: string): string {
    // Xóa # nếu có
    hex = hex.replace(/^#/, '');

    // HEX 3 ký tự như #f00
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }

    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return `${r},${g},${b}`;
  }

  /**
   * Toggle sidebar open
   *
   * @param key
   */
  toggleSidebar(key): void {
      this.isCustomizerOpen = !this.isCustomizerOpen;
    this._coreSidebarService.getSidebarRegistry(key).toggleOpen();
  }
}
