import { AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-dynamic-table-body',
  templateUrl: './dynamic-table-body.component.html',
  styleUrls: ['./dynamic-table.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicTableBodyComponent implements AfterViewInit, OnChanges {
  /** Khi true, body sẽ tự detach ChangeDetectorRef (không ảnh hưởng header/toolbar của bảng cha). */
  @Input() detachMode: boolean = false;
  /** Không detach khi đang dùng chọn dòng (single/multi) để tránh lỗi highlight. */
  @Input() selectMode: boolean = false;
  @Input() multiSelectMode: boolean = false;

  private has_view_initialized = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.has_view_initialized = true;
    if (this.detachMode) {
      // Detach riêng phần body sau khi render xong để tránh ảnh hưởng input bên ngoài
      setTimeout(() => {
        this.cdr.detach();
      }, 0);
    }
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (_changes['detachMode'] && !_changes['detachMode'].firstChange && !this.detachMode) {
      this.cdr.reattach();
      this.cdr.detectChanges();
      setTimeout(() => {
        this.cdr.detach();
      }, 500);
    }
  }
}

