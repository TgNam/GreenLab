import { Directive, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, ElementRef, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appSectionBlock]'
})
export class SectionBlockDirective implements OnInit, OnDestroy, OnChanges {
  @Input('appSectionBlock') isLoading: boolean = false;
  @Input() blockMessage: string = 'Đang tải...';

  private overlay: HTMLElement | null = null;
  private spinner: HTMLElement | null = null;
  private messageElement: HTMLElement | null = null;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    // Đảm bảo element cha có position relative
    const nativeElement = this.el.nativeElement;
    const computedStyle = window.getComputedStyle(nativeElement);
    if (computedStyle.position === 'static') {
      this.renderer.setStyle(nativeElement, 'position', 'relative');
    }
    
    // Tạo overlay và spinner
    this.createBlockUI();
    
    // Kiểm tra trạng thái ban đầu
    if (this.isLoading) {
      this.showBlock();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isLoading'] && this.overlay) {
      if (this.isLoading) {
        this.showBlock();
      } else {
        this.hideBlock();
      }
    }
   
  }

  ngOnDestroy() {
    this.removeBlockUI();
  }

  private createBlockUI() {
    const nativeElement = this.el.nativeElement;

    // Tạo overlay - giống hệt ng-block-ui với đầy đủ class
    this.overlay = this.renderer.createElement('div');
    // Thêm các class giống ng-block-ui: block-ui-wrapper, section-block, block-ui-wrapper--element
    this.renderer.addClass(this.overlay, 'block-ui-wrapper');
    this.renderer.addClass(this.overlay, 'section-block');
    this.renderer.addClass(this.overlay, 'block-ui-wrapper--element');
    // Không set style inline, để CSS của ng-block-ui xử lý

    // Tạo template container - giống ng-block-ui
    const template = this.renderer.createElement('div');
    this.renderer.addClass(template, 'block-ui-template');
    this.renderer.addClass(template, 'text-center');
    // Không set style inline, để CSS của ng-block-ui xử lý

    // Tạo spinner - sử dụng Bootstrap spinner-border giống ng-block-ui
    this.spinner = this.renderer.createElement('div');
    this.renderer.addClass(this.spinner, 'spinner-border');
    this.renderer.addClass(this.spinner, 'text-light');
    this.renderer.setAttribute(this.spinner, 'role', 'status');

    // Tạo sr-only span cho accessibility
    const srOnly = this.renderer.createElement('span');
    this.renderer.addClass(srOnly, 'sr-only');
    this.renderer.setProperty(srOnly, 'textContent', 'Loading...');
    this.renderer.appendChild(this.spinner, srOnly);

    // Thêm spinner vào template
    this.renderer.appendChild(template, this.spinner);

    // Tạo message element nếu có message
    if (this.blockMessage) {
      this.messageElement = this.renderer.createElement('div');
      this.renderer.addClass(this.messageElement, 'block-ui-message');
      this.renderer.setProperty(this.messageElement, 'textContent', this.blockMessage);
      this.renderer.appendChild(template, this.messageElement);
    }

    // Thêm template vào overlay
    this.renderer.appendChild(this.overlay, template);

    // Thêm overlay vào element
    this.renderer.appendChild(nativeElement, this.overlay);
  }

  private showBlock() {
    if (this.overlay) {
      this.renderer.addClass(this.overlay, 'active');
      this.renderer.setStyle(this.overlay, 'opacity', '1');
      this.renderer.setStyle(this.overlay, 'visibility', 'visible');
    }
  }

  private hideBlock() {
    if (this.overlay) {
      this.renderer.removeClass(this.overlay, 'active');
      this.renderer.setStyle(this.overlay, 'opacity', '0');
      this.renderer.setStyle(this.overlay, 'visibility', 'hidden');
    }
  }

  private removeBlockUI() {
    if (this.overlay) {
      this.renderer.removeChild(this.el.nativeElement, this.overlay);
      this.overlay = null;
      this.spinner = null;
      this.messageElement = null;
    }
  }
}

