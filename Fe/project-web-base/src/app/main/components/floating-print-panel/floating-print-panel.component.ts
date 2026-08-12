import {
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { QzPrintActionItem } from 'app/main/components/qz-print-actions/qz-print-actions.component';

/** Nút trong khu vực Thao tác (callback `on_click`). */
export interface FloatingPrintButtonItem {
  id: string;
  text: string;
  type?: string;
  button_class?: string;
  icon?: string;
  title?: string;
  on_click: () => void;
}

/** Checkbox: đọc/ghi qua callback để parent giữ state (động, không bind cứng template). */
export interface FloatingPrintCheckboxItem {
  id: string;
  for_id: string;
  label: string;
  title?: string;
  get_checked: () => boolean;
  set_checked: (value: boolean) => void;
}

/** Select-search: options + get/set model. */
export interface FloatingPrintSelectItem {
  id: string;
  placeholder?: string;
  options: any[];
  option_label?: string;
  option_value?: string;
  input_class?: string;
  get_model: () => any;
  set_model: (value: any) => void;
}

/** Một dòng: chọn người + checkbox kèm (chữ ký). */
export interface FloatingPrintSignatureRowItem {
  id: string;
  select: FloatingPrintSelectItem;
  checkbox: FloatingPrintCheckboxItem;
}

/**
 * Nút nổi (`app-floating-print-actions-bar`) + popup cấu hình in trong `app-modal-content`.
 * Checkbox, nút, select đều truyền mảng + callback (get/set hoặc on_click).
 */
@Component({
  selector: 'app-floating-print-panel',
  templateUrl: './floating-print-panel.component.html',
  styleUrls: ['./floating-print-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingPrintPanelComponent implements OnChanges, OnDestroy {
  @Input() panel_title = 'In & xuất';

  @Input() fab_icon = 'fa fa-print';
  @Input() fab_title = 'Tùy chọn in / xuất PDF (kéo thả để chọn vị trí của nút)';

  @Input() section_title_actions = 'Thao tác';
  @Input() section_title_print = 'Cấu hình in';
  @Input() section_title_signature = 'Cấu hình chữ ký';

  /** Nút thao tác (Xem trước, Xuất PDF, …). In QZ vẫn qua `qz_print_items`. */
  @Input() action_buttons: FloatingPrintButtonItem[] = [];

  @Input() qz_print_items: QzPrintActionItem[] = [];
  @Input() qz_primary_mode: 'qz' | 'normal' = 'normal';

  @Input() print_checkboxes: FloatingPrintCheckboxItem[] = [];
  @Input() signature_rows: FloatingPrintSignatureRowItem[] = [];

  /** Nội dung HTML tùy chỉnh thêm phía dưới (ít dùng). */
  @Input() extra_template: TemplateRef<unknown> | null = null;

  /** Báo khi panel đóng/mở (tùy chọn). */
  @Output() opened_change = new EventEmitter<boolean>();

  is_open = false;

  /** Đồng bộ khi modal mở (dự phòng layout global). */
  private static readonly BODY_CLASS_PANEL_OPEN = 'has-app-floating-print-panel--open';

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.remove(FloatingPrintPanelComponent.BODY_CLASS_PANEL_OPEN);
    }
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.cdr.markForCheck();
  }

  toggle(): void {
    this.is_open = !this.is_open;
    this.sync_body_panel_open_class();
    this.opened_change.emit(this.is_open);
    this.cdr.markForCheck();
  }

  open(): void {
    this.is_open = true;
    this.sync_body_panel_open_class();
    this.opened_change.emit(true);
    this.cdr.markForCheck();
  }

  close(): void {
    this.is_open = false;
    this.sync_body_panel_open_class();
    this.opened_change.emit(false);
    this.cdr.markForCheck();
  }

  private sync_body_panel_open_class(): void {
    if (typeof document === 'undefined') {
      return;
    }
    if (this.is_open) {
      document.body.classList.add(FloatingPrintPanelComponent.BODY_CLASS_PANEL_OPEN);
    } else {
      document.body.classList.remove(FloatingPrintPanelComponent.BODY_CLASS_PANEL_OPEN);
    }
  }

  onActionClick(btn: FloatingPrintButtonItem): void {
    btn.on_click();
  }

  public opt_print_all = false;

  onPrintAllChange(event: any): void {
    if (event.target) {
      const isChecked = event.target.checked;
      this.opt_print_all = isChecked;

      // Cập nhật từng checkbox trong mảng
      this.print_checkboxes.forEach(checkbox => {
        checkbox.set_checked(isChecked);
      });

      this.print_checkboxes = [...this.print_checkboxes];
      console.log(this.print_checkboxes);
      this.cdr.detectChanges();
    }
  }

 

  onSelectOpen() {
    const modalContent = document.querySelector('.modal-content');
    const modalBody = document.querySelector('.modal-body');

    if (modalContent) modalContent.classList.add('modal-content-no-overflow');
    if (modalBody) modalBody.classList.add('modal-body-scroll');
  }

  onSelectClose() {
    const modalContent = document.querySelector('.modal-content');
    const modalBody = document.querySelector('.modal-body');

    if (modalContent) modalContent.classList.remove('modal-content-no-overflow');
    if (modalBody) modalBody.classList.remove('modal-body-scroll');
  }


  onCheckboxChange(row: FloatingPrintCheckboxItem, value: boolean): void {
    row.set_checked(value);
    this.cdr.markForCheck();
  }

  onSelectChange(row: FloatingPrintSelectItem, value: any): void {
    row.set_model(value);
    this.cdr.markForCheck();
  }

  trackById(_index: number, row: { id: string }): string {
    return row.id;
  }

  hasActionsSection(): boolean {
    return (this.action_buttons?.length ?? 0) > 0 || (this.qz_print_items?.length ?? 0) > 0;
  }
}
