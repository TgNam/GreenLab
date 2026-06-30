import { Component, EventEmitter, HostListener, Input, Output, OnChanges, SimpleChanges, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { isNgxLightboxOpen } from '../ngx-lightbox-open.util';

@Component({
  selector: 'app-modal-content',
  templateUrl: './modal-content.component.html',
  styleUrls: ['./modal-content.component.scss'],
})
export class ModalContentComponent implements OnChanges, AfterViewInit {
  @Input() visible = false;
  @Input() hideSave = false;
  @Input() title = 'Modal Title';
  @Input() customHtmlHeader = false;
  @Input() customHeader = false;
  @Input() customFooter = false;
  @Input() saveButtonText = 'Save';
  @Input() closeButtonText = 'Close';
  @Input() disableSave = false;
  @Input() loading = false;
  @Input() overflowY = true;
  @Input() size:  'ssm' | 'sm' | 'lg' | 'lgr' | 'lgxl' | 'xl' | 'fullscreen' | string = 'lg'
  @Input() blockUIName: string = 'section-block'; // Tên block UI instance, mặc định là 'section-block'
  @Output() onSave = new EventEmitter<void>();
  @Output() onClose = new EventEmitter<void>();

  @ViewChild('backdropElement', { static: false }) backdropElement?: ElementRef;
  @ViewChild('modalElement', { static: false }) modalElement?: ElementRef;

  // Static flag để đảm bảo chỉ một modal được đóng mỗi lần bấm ESC
  private static escKeyHandled = false;

  ngAfterViewInit() {
    if (this.visible) {
      setTimeout(() => this.updateZIndex(), 0);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible']) {
      if (this.visible) {
        // Delay để đảm bảo DOM đã render
        setTimeout(() => this.updateZIndex(), 0);
      } else {
        // Đóng tất cả flatpickr dropdowns trong modal khi modal đóng
        this.closeAllFlatpickrDropdowns();
      }
    }
  }

  handleSave() {
    this.onSave.emit();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscKey(event: KeyboardEvent) {
    if (this.visible && !ModalContentComponent.escKeyHandled) {
      // Lightbox đóng bằng keyup; không xử lý ESC ở keydown để tránh đóng cả modal.
      if (isNgxLightboxOpen()) {
        return;
      }
      // Tìm modal có z-index cao nhất
      const highestModal = this.findHighestZIndexModal();
      
      // Chỉ đóng nếu modal này là modal có z-index cao nhất
      if (highestModal && this.modalElement?.nativeElement === highestModal) {
        ModalContentComponent.escKeyHandled = true;
        this.handleClose();
        
        // Reset flag sau một khoảng thời gian ngắn để cho phép đóng modal tiếp theo
        setTimeout(() => {
          ModalContentComponent.escKeyHandled = false;
        }, 100);
      }
    }
  }

  private findHighestZIndexModal(): HTMLElement | null {
    // Tìm tất cả các modal đang hiển thị (có class "show")
    const allModals = document.querySelectorAll('.modal.show');
    let highestModal: HTMLElement | null = null;
    let highestZIndex = -1;

    allModals.forEach((modal) => {
      const modalElement = modal as HTMLElement;
      const zIndex = parseInt(window.getComputedStyle(modalElement).zIndex || '0', 10);
      
      // Chỉ xét các modal đang hiển thị và có z-index hợp lệ
      if (zIndex > highestZIndex && zIndex > 0) {
        highestZIndex = zIndex;
        highestModal = modalElement;
      }
    });

    return highestModal;
  }

  handleClose() {
    // Đóng tất cả flatpickr dropdowns trong modal trước khi đóng modal
    this.closeAllFlatpickrDropdowns();
    this.onClose.emit();
  }

  private updateZIndex() {
    // Đếm số lượng modal đang mở (bao gồm cả modal-content và confirm-modal)
    // Tìm tất cả các modal đang hiển thị
    const openModals = document.querySelectorAll('.modal.show').length;
    const modalIndex = openModals;

    // Tính z-index: backdrop = 1040 + (index - 1) * 20, modal = backdrop + 10
    // Modal 1: backdrop 1040, modal 1050
    // Modal 2: backdrop 1060, modal 1070
    // Modal 3: backdrop 1080, modal 1090
    const backdropZIndex = 1040 + (modalIndex - 1) * 20;
    const modalZIndex = backdropZIndex + 10;

    // Áp dụng z-index cho backdrop
    if (this.backdropElement?.nativeElement) {
      const backdrop = this.backdropElement.nativeElement as HTMLElement;
      backdrop.style.zIndex = backdropZIndex.toString();
      
      // Giảm opacity cho modal sau (index > 1)
      // if (modalIndex > 1) {
      //   backdrop.style.opacity = '0.2';
      // } else {
      //   backdrop.style.opacity = '0.5';
      // }
      backdrop.style.opacity = '0.5';
    }

    // Áp dụng z-index cho modal
    if (this.modalElement?.nativeElement) {
      const modal = this.modalElement.nativeElement as HTMLElement;
      modal.style.zIndex = modalZIndex.toString();
    }
  }

  get modalDialogClass() {
    // map size sang class Bootstrap
    const sizeClassMap: any = {
      ssm: 'modal-ssm',
      sm: 'modal-sm',
      lg: 'modal-lg',
      lgr: 'modal-lgr',
      lgxl: 'modal-lgxl',
      xl: 'modal-xl',
      fullscreen: 'modal-fullscreen'
    }
    return `modal-dialog modal-dialog-centered ${sizeClassMap[this.size] || this.size}`
  }

  /**
   * Đóng tất cả flatpickr dropdowns đang mở trong modal này
   * Chỉ đóng các flatpickr trong modal hiện tại, không ảnh hưởng đến các modal khác
   */
  private closeAllFlatpickrDropdowns(): void {
    if (!this.modalElement?.nativeElement) {
      return;
    }

    // Tìm tất cả datetime adapter components chỉ trong modal này
    const modalElement = this.modalElement.nativeElement as HTMLElement;
    const dateAdapters = modalElement.querySelectorAll('app-datetime-adapter');
    
    dateAdapters.forEach((dateAdapter) => {
      // Tìm input element trong datetime adapter
      // Có thể là .ng2-flatpickr-input hoặc input element trực tiếp
      const inputFlatpickr = dateAdapter.querySelector('.ng2-flatpickr-input.form-control.input') as HTMLInputElement;
      inputFlatpickr.blur();
      console.log('inputFlatpickr', inputFlatpickr);
      if (inputFlatpickr) {
        // Lấy flatpickr instance từ input element
        const flatpickrInstance = (inputFlatpickr as any)._flatpickr;
        console.log('flatpickrInstance', flatpickrInstance);
        // Đóng dropdown nếu đang mở
        if (flatpickrInstance && typeof flatpickrInstance.close === 'function' && flatpickrInstance.isOpen) {
          flatpickrInstance.close();
        }
      }
    });
  }
}
