import { Component, EventEmitter, HostListener, Input, Output, OnChanges, SimpleChanges, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { isNgxLightboxOpen } from '../ngx-lightbox-open.util';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.css']
})
export class ConfirmModalComponent implements OnChanges, AfterViewInit {
  @Input() visible = false;
  @Input() loading = false;
  @Input() header = 'Xác nhận';
  @Input() message = 'Bạn có chắc chắn muốn thực hiện hành động này không?';
  @Input() type: 'danger' | 'primary' = 'primary'; // Màu modal: đỏ hoặc xanh
  @Input() isHandleEnter: boolean = false; // Nếu true, nhấn Enter sẽ xác nhận

  @Output() onCancel = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<void>();

  @ViewChild('modalElement', { static: false }) modalElement?: ElementRef;

  // Static flag để đảm bảo chỉ một modal được đóng mỗi lần bấm ESC
  private static escKeyHandled = false;

  ngAfterViewInit() {
    if (this.visible) {
      setTimeout(() => this.updateZIndex(), 0);
      this.focusConfirmButton();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible'] && this.visible) {
      // Delay để đảm bảo DOM đã render
      setTimeout(() => this.updateZIndex(), 0);
      this.focusConfirmButton();
    }
  }

  // Public method để parent component có thể gọi
  focusConfirmButton() {
    // Focus vào button xác nhận sau khi modal hiển thị
    setTimeout(() => {
      if (this.modalElement?.nativeElement) {
        const modalFooter = this.modalElement.nativeElement.querySelector('.modal-footer');
        if (modalFooter) {
          // Tìm tất cả button trong footer, button cuối cùng là "Xác nhận"
          const allButtons = modalFooter.querySelectorAll('button');
          if (allButtons.length > 0) {
            // Lấy button cuối cùng (button xác nhận)
            const confirmBtn = allButtons[allButtons.length - 1] as HTMLButtonElement;
            if (confirmBtn && !confirmBtn.disabled) {
              confirmBtn.focus();
            }
          }
        }
      }
    }, 400);
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscKey(event: KeyboardEvent) {
    if (this.visible && !ConfirmModalComponent.escKeyHandled) {
      if (isNgxLightboxOpen()) {
        return;
      }
      // Tìm modal có z-index cao nhất
      const highestModal = this.findHighestZIndexModal();
      
      // Chỉ đóng nếu modal này là modal có z-index cao nhất
      if (highestModal && this.modalElement?.nativeElement === highestModal) {
        ConfirmModalComponent.escKeyHandled = true;
        this.handleCancel();
        
        // Reset flag sau một khoảng thời gian ngắn để cho phép đóng modal tiếp theo
        setTimeout(() => {
          ConfirmModalComponent.escKeyHandled = false;
        }, 100);
      }
    }
  }

  @HostListener('document:keydown.enter', ['$event'])
  onEnterKey(event: KeyboardEvent) {
    if (this.visible && this.isHandleEnter && !this.loading) {
      // Tìm modal có z-index cao nhất
      const highestModal = this.findHighestZIndexModal();
      
      // Chỉ xác nhận nếu modal này là modal có z-index cao nhất
      if (highestModal && this.modalElement?.nativeElement === highestModal) {
        // Kiểm tra xem có input nào đang focus không (tránh xác nhận khi đang nhập liệu)
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.tagName === 'SELECT' ||
          (activeElement as HTMLElement).isContentEditable
        );
        
        // Chỉ xác nhận nếu không có input nào đang focus
        if (!isInputFocused) {
          event.preventDefault();
          event.stopPropagation();
          this.handleConfirm();
        }
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

    // Áp dụng z-index cho modal (confirm-modal không có backdrop riêng, nó dùng inline style)
    if (this.modalElement?.nativeElement) {
      const modal = this.modalElement.nativeElement as HTMLElement;
      modal.style.zIndex = modalZIndex.toString();
    }
  }

  handleCancel() {
    this.onCancel.emit();
  }

  handleConfirm() {
    this.onConfirm.emit();
  }
}
