import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, NgZone, ChangeDetectorRef, SimpleChanges } from '@angular/core';

export interface TableConfig {
  displayedColumns: any[];
  size: string | null;
  dynamicWidth: boolean;
  selectMode: boolean;
  multiSelectMode: boolean;
  multiSelectFixedColumn?: boolean;
  /** Hiển thị checkbox ở chế độ selectMode (single chọn) */
  showSelectCheckbox?: boolean;
  showIndexColumn: boolean;
  enableDoubleClick: boolean;
  /** Left offset (px) cho cột fixed — cùng thứ tự displayedColumns. */
  fixedLeftPx?: number[];
  /** z-index tăng dần theo từng cột fixed (tbody). */
  fixedStickyZIndex?: number[];
}

export interface RowMeta {
  index: number;
  class: string;
  tooltip: string;
  selected: boolean;
}

/**
 * Component một dòng bảng, dùng OnPush và tableConfig/rowMeta để giảm binding.
 */
@Component({
  selector: 'app-dynamic-table-row',
  templateUrl: './dynamic-table-row.component.html',
  styleUrls: ['./dynamic-table-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.display]': '"contents"'
  }
})
export class DynamicTableRowComponent {
  @Input() row: any;
  @Input() detachMode: boolean = false;
  @Input() rowIndex: number;
  @Input() tableConfig: TableConfig | null = null;
  @Input() rowMeta: RowMeta | null = null;

  @Output() rowClick = new EventEmitter<{ row: any; rowIndex: number; event: MouseEvent }>();
  @Output() rowDoubleClick = new EventEmitter<{ row: any; event: MouseEvent }>();
  @Output() rowMouseDown = new EventEmitter<{ event: MouseEvent; row: any; rowIndex: number }>();
  @Output() toggleSelection = new EventEmitter<{ event: any; row: any }>();

  constructor(private ngZone: NgZone, public cdr: ChangeDetectorRef) { }

  ngOnChanges(changes: SimpleChanges): void {
      if(changes['rowMeta'] && this.detachMode) {
        this.cdr.detectChanges();
      }
      if(changes['detachMode'] && !changes['detachMode'].firstChange && !this.detachMode) {
        this.cdr.reattach();
        this.cdr.detectChanges();
        setTimeout(() => {
          this.cdr.detach();
        }, 500);
      }
  }

  ngAfterViewInit(): void {
    if (this.detachMode) {
      // Detach riêng phần body sau khi render xong để tránh ảnh hưởng input bên ngoài
      setTimeout(() => {
        this.cdr.detach();
      }, 0);
    }
  }
  get config(): TableConfig {
    return this.tableConfig ?? {
      displayedColumns: [],
      size: null,
      dynamicWidth: false,
      selectMode: false,
      multiSelectMode: false,
      multiSelectFixedColumn: false,
      showSelectCheckbox: false,
      showIndexColumn: false,
      enableDoubleClick: false,
      fixedLeftPx: undefined,
      fixedStickyZIndex: undefined
    };
  }
  get meta(): RowMeta {
    return this.rowMeta ?? { index: this.rowIndex, class: '', tooltip: '', selected: false };
  }



  trackByColumn(index: number, col: any): any {
    return col?.key ?? index;
  }

  onRowClick(event: MouseEvent): void {
    this.rowClick.emit({ row: this.row, rowIndex: this.rowIndex, event });
    this.cdr.detectChanges();
  }

  onRowDoubleClick(event: MouseEvent): void {
    this.rowDoubleClick.emit({ row: this.row, event });
    this.cdr.detectChanges();
  }

  onCellDoubleClick(event: MouseEvent, col: any): void {
    console.log('onCellDoubleClick', this.row);
    const on_cell_double_click = col?.onCellDoubleClick;
    if (typeof on_cell_double_click !== 'function') {
      return;
    }
    // event.preventDefault();
    // event.stopPropagation();
    on_cell_double_click(this.row, col, event);
    this.cdr.detectChanges();
  }

  onCellClick(event: MouseEvent, col: any): void {
    
  }

  onRowMouseDown(event: MouseEvent): void {
    this.rowMouseDown.emit({ event, row: this.row, rowIndex: this.rowIndex });
    this.cdr.detectChanges();

  }

  onToggleSelection(event: any): void {
    this.toggleSelection.emit({ event, row: this.row });
    this.cdr.detectChanges();
  }

  onSelectCheckboxChange(event: any): void {
    // Khi click checkbox trong selectMode, vẫn muốn parent xử lý như click row.
    // Không dựa vào event.shiftKey nên có thể truyền null.
    this.rowClick.emit({
      row: this.row,
      rowIndex: this.rowIndex,
      event: null as any
    });
    this.cdr.detectChanges();
  }

  getCellColor(col: any, row: any): string | null {
    if (!col || !col.cellColor) {
      return null;
    }
    const cellColor = col.cellColor;
    if (typeof cellColor === 'function') {
      try {
        return cellColor(row, row ? row[col.key] : null) || null;
      } catch {
        return null;
      }
    }
    return cellColor;
  }

  getCellBgColor(col: any, row: any): string | null {
    if (!col || !col.cellBgColor) {
      return null;
    }
    const cellBgColor = col.cellBgColor;
    if (typeof cellBgColor === 'function') {
      try {
        return cellBgColor(row, row ? row[col.key] : null) || null;
      } catch {
        return null;
      }
    }
    return cellBgColor;
  }

  getCellTextAlign(col: any, row: any): string | null {
    if (!col) {
      return null;
    }
    if (typeof col.cellTextAlign === 'function') {
      try {
        return col.cellTextAlign(row, row ? row[col.key] : null) || null;
      } catch {
        // ignore and fallback
      }
    } else if (typeof col.cellTextAlign === 'string') {
      return col.cellTextAlign;
    }
    if (col.right) {
      return 'right';
    }
    if (col.center) {
      return 'center';
    }
    return null;
  }
}
