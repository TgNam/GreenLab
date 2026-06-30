import { Component, Input, OnInit, OnDestroy, SimpleChanges, ViewEncapsulation, EventEmitter, Output, HostListener, HostBinding, ViewChild, ElementRef, ChangeDetectorRef, ChangeDetectionStrategy, TemplateRef, NgZone, ViewChildren, QueryList } from '@angular/core';
import { CoreConfigService } from '@core/services/config.service';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormInputFocusService } from 'app/main/services/form-input-focus.service';
import { DynamicTableRowComponent } from './dynamic-table-row.component';
import { CommonFunc } from 'app/utils/common-func.component';

@Component({
  selector: 'app-dynamic-table',
  templateUrl: './dynamic-table.component.html',
  styleUrls: ['./dynamic-table.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush // Tối ưu: Chỉ chạy change detection khi inputs thay đổi
})
export class DynamicTableComponent implements OnInit, OnDestroy {
 // 1. Dùng biến nội bộ để tránh lặp vô tận
private _columns: any[] = [];

// 2. Chỉ để một decorator @Input ở hàm set
@Input() set columns(value: any[]) {
    if (value) {
        // Lưu giá trị vào biến nội bộ
        this._columns = value;

        // Sao chép sâu (Deep Copy) để defaultColumns không bị dính líu đến columns gốc
        this.defaultColumns = value.map(col => ({ ...col }));

        // Xóa dữ liệu cũ trong Set trước khi nạp mới (để tránh cộng dồn nếu columns đổi nhiều lần)
        this.originalVisibleColumnNames.clear();

        this.defaultColumns.forEach(col => {
            if (col.visible !== false) {
                this.originalVisibleColumnNames.add(col.key);
            }
        });

    }
}

// Nếu bạn vẫn muốn truy cập biến columns từ bên ngoài, hãy thêm hàm get
get columns(): any[] {
    return this._columns;
}
  @Input() rows: any[] = [];
  @Input() totalCnt: number = 0;
  @Input() rowClass: any;
  @Input() resultText: string = '';
  @Input() rowTooltip: any; // Function to get tooltip text for a row
  @Input() filterTime: boolean = false;
  @Input() showTimeFilter: boolean = true; // Ẩn/hiện 2 input thời gian, mặc định là true
  @Input() showSingleTimeFilter: boolean = false; // Chỉ hiển thị 1 input thời gian từ (không có thời gian đến và select), mặc định false
  @Input() timeOpts: any[] = [];
  @Input() timeFrom: any = null;
  @Input() timeTo: any = null;
  @Input() hideTime: boolean = false;
  @Input() timeOnTopRow: boolean = false; // Hiển thị phần thời gian ở dòng riêng phía trên "Tìm thấy..."
  @Input() dateStatus: boolean = true;
  @Input() timeType: any = "";
  @Input() totalPage: number = 0;
  @Input() total: number = 0;
  @Input() page: number = 1;
  @Input() selectedOption: number = 0;
  @Input() sizeOptions: any[] = [];
  @Input() onPageChange: (page: number) => void;
  @Input() onPageSizeChange: (pageSize: number) => void;
  @Input() applySort: (column: string, direction: 'asc' | 'desc') => void;
  @Input() selectMode: boolean = false; // Enable row selection mode
  @Input() selectedRow: any = null; // Currently selected row
  /**
   * Nếu selectMode = true và giá trị này != null/empty,
   * thì sẽ hiển thị thêm 1 cột checkbox ở chế độ selectMode (single chọn).
   */
  @Input() selectModeCheckboxColumnLabel: string | null = null;
  @Input() multiSelectMode: boolean = false; // Enable multi-select mode (checkbox selection)
  /** Phím tắt chọn/bỏ chọn tất cả trong multi-select (vd: 'f1'). */
  @Input() multipleSelectShortcutKey: string | null = null;
  /** Cố định (sticky) cột checkbox khi bật multiSelectMode. */
  @Input() multiSelectFixedColumn: boolean = false;
  /**
   * Khi true: trong multiSelectMode, click thường (không giữ phím) chỉ chọn đúng một dòng — giống single select.
   * Để chọn nhiều: giữ Ctrl (Windows/Linux) hoặc Cmd (macOS) rồi click từng dòng (toggle từng dòng),
   * hoặc Shift+click để chọn dải, hoặc kéo chuột trên các dòng, hoặc focus vùng bảng và Ctrl+A.
   * Mặc định false: click thường vẫn bật/tắt từng dòng như multi-select cũ.
   */
  @Input() multiSelectPlainClickSingle: boolean = false;
  @Input() selectedRows: any[] = []; // Array of selected rows for multi-select mode
  /** Tên field dùng làm key định danh duy nhất cho mỗi row. Nếu không set, sẽ dùng logic mặc định (id/sid/...). */
  @Input() rowKeyField: string | null = null;
  @Input() maxHeight: any = null;
  @Input() fixedHeader: boolean = true; // Fixed header mode - header stays fixed, only tbody scrolls
  @Input() fixedHeaderMaxHeight: any = 500; // Max height for tbody when fixedHeader is true
  @Input() fixedHeader2: boolean = false; // Fixed header mode 2 - applies overflow unset and sticky header styles
  @Input() detachMode: boolean = false; // Detach mode - detach ONLY table body (qua DynamicTableBodyComponent)
  @Input() detachModeRow: boolean = false; // Detach mode - detach ONLY table row (qua DynamicTableRowComponent)

  get showSelectCheckboxInSelectMode(): boolean {
    return !!(this.selectMode && this.selectModeCheckboxColumnLabel && this.selectModeCheckboxColumnLabel.trim().length > 0);
  }
  @HostBinding('class.fixed-header2') get isFixedHeader2() {
    return this.fixedHeader2;
  }
  @Input() showResultInfo: boolean = true; // Hiển thị thông tin "Tìm thấy ..."
  @Input() enableSort: boolean = false; // Enable sorting for columns, default false
  @Input() enablePagination: boolean = true;
  /** Phân trang phía FE: cắt rows theo page/pageSize, không gọi API. Khi có 1 trang thì ẩn pagination. */
  @Input() clientSidePagination: boolean = false;
  @Input() showPageSize: boolean = true; // Hiển thị phần "Show ... entries", mặc định là true
  @Input() prefix: string = ''; // Prefix để phân biệt các bảng trong cùng một trang
  @Input() showSetting: boolean = true; // Hiển thị nút bánh răng cài đặt
  @Input() dynamicWidth: boolean = false; // Size class (e.g., 'form-control-sm'), if null uses default size
  @Input() showIndexColumn: boolean = false; // Hiển thị cột số thứ tự
  @Input() toolbarActionsTemplate: TemplateRef<any> | null = null; // Template cho các action buttons bên phải toolbar
  @Input() enableDoubleClick: boolean = false; // Enable double click handler
  @Input() onDoubleClick: (row: any) => void; // Function to handle double click
  @Input() size: string | null = null; // Size class (e.g., 'form-control-sm'), if null uses default size
  @Input() paginationAlign: 'start' | 'center' | 'end' = 'end'; // Alignment of pagination, default 'end'
  @Output() timeFromChange = new EventEmitter<any>();
  @Output() timeToChange = new EventEmitter<any>();
  @Output() timeTypeChange = new EventEmitter<any>();
  @Output() rowClick = new EventEmitter<any>();
  @Output() rowSelect = new EventEmitter<any>(); // Emit when row is selected in select mode
  @Output() rowActivate = new EventEmitter<any>();
  @Output() selectedRowsChange = new EventEmitter<any[]>(); // Emit when selected rows change in multi-select mode
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' | null = null;

  isMobile = false;
  @ViewChild('mainDatatableElement') datatable: DatatableComponent;
  @ViewChild('tableWrapper', { static: true }) tableWrapper!: ElementRef;

  resizeObserver: ResizeObserver;
  private isFirstLoad = true;
  private cachedContainerWidth: number = 0;
  private columnWidthTimeout: any = null;
  private searchColumnDebounceTimeout: any = null; // Debounce cho search column input
  private rowsChangeDebounceTimeout: any = null; // Debounce cho rows change
  private previousRowsHash: string = ''; // Hash để so sánh rows có thay đổi thực sự không

  // Performance optimization: Cache calculated column widths
  private cachedColumnWidths: Map<string, any[]> = new Map();
  private cachedColumnWidthsKey: string = '';

  // Performance optimization: Pre-computed row data để tránh tính toán trong template
  public rowClassMap: Map<string | number, string> = new Map(); // Pre-computed row classes
  public rowTooltipMap: Map<string | number, string> = new Map(); // Pre-computed row tooltips
  public rowSelectionMap: Map<string | number, boolean> = new Map(); // Pre-computed row selection
  private selectedRowsMap: Map<string | number, any> = new Map(); // Cache selected rows for O(1) lookup

  // Tạo hash từ rows để so sánh nội dung (tránh trigger khi chỉ reference thay đổi)
  private getRowsHash(rows: any[]): string {
    if (!rows || rows.length === 0) {
      return 'empty';
    }

    // Tạo hash từ id/sid, warning và checkDel của các rows (nhanh hơn JSON.stringify toàn bộ)
    // Bao gồm warning/checkDel để detect khi thay đổi (cần cho rowClass update)
    const ids = rows.slice(0, 100).map(row => {
      const key = this.getRowKey(row);
      const warning = row.warning ? '1' : '0';
      const checkDel = row.checkDel ? '1' : '0';
      return `${String(key)}:${warning}:${checkDel}`;
    }).join(',');

    // Thêm length để detect khi số lượng rows thay đổi
    return `${rows.length}_${ids.substring(0, 200)}`;
  }

  /** Helper để tạo key từ row (public cho template mat-table). */
  getRowKey(row: any): string | number {
    // Nếu có rowKeyField, ưu tiên dùng field đó
    if (this.rowKeyField && row[this.rowKeyField] !== undefined && row[this.rowKeyField] !== null) {
      return `custom_${row[this.rowKeyField]}`;
    }
    // Ưu tiên sử dụng processId (cho appointments), sau đó id hoặc sid
    if (row.id !== undefined && row.id !== null) {
      return `id_${row.id}`;
    }
    if (row.sid !== undefined && row.sid !== null) {
      return `sid_${row.sid}`;
    }
    // Một số màn (call-management) dùng call_id thay cho id/sid
    if (row.call_id !== undefined && row.call_id !== null) {
      return `call_id_${row.call_id}`;
    }
    if (row.callId !== undefined && row.callId !== null) {
      return `callId_${row.callId}`;
    }
    if (row.processId !== undefined && row.processId !== null) {
      return `processId_${row.processId}`;
    }
    // Fallback: sử dụng index nếu có thể, hoặc hash đơn giản
    // Tránh JSON.stringify vì nó rất tốn kém với objects lớn
    if (row._index !== undefined) {
      return `idx_${row._index}`;
    }
    // Nếu không có id/sid, tạo key từ một số properties quan trọng
    const keyParts: string[] = [];
    if (row.code) keyParts.push(`code_${row.code}`);
    if (row.name) keyParts.push(`name_${String(row.name).substring(0, 20)}`);
    if (row.key) keyParts.push(`key_${row.key}`);

    return keyParts.length > 0 ? keyParts.join('_') : `row_${Math.random().toString(36).substring(7)}`;
  }

  // Performance optimization: Cache DOM queries
  private cachedTableRows: NodeListOf<HTMLElement> | null = null;
  private lastSelectRangeCall = 0;
  private readonly SELECT_RANGE_THROTTLE = 50; // Throttle selectRange calls

  // Event listeners cleanup
  private resizeHandler: (() => void) | null = null;
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;
  private datatableBodyElement: HTMLElement | null = null;
  private bound_multi_select_shortcut_keys: string[] = [];

  recalculateDatatable() {
    if (this.datatable && !this.isFirstLoad) {
      this.datatable.recalculate();
    }
  }

  /**
   * Lấy container width từ toolbar-containerId element
   * Cache để tránh query DOM nhiều lần
   */
  private getContainerWidth(): number {
    const start = performance.now();
    // Chỉ query DOM nếu chưa có cache hoặc cần refresh
    if (this.cachedContainerWidth === 0) {
      const containerElement = document.getElementById('toolbar-containerId');
      if (containerElement) {
        this.cachedContainerWidth = Math.floor(containerElement.getBoundingClientRect().width);
      }
    }
    const duration = performance.now() - start;
    if (duration > 1) {
    }
    return this.cachedContainerWidth;
  }

  /**
   * Reset cached container width (gọi khi window resize hoặc layout thay đổi)
   */
  private resetCachedContainerWidth(): void {
    this.cachedContainerWidth = 0;
  }

  /**
   * Tính width cho các cột: các cột đầu tính theo %, cột cuối cùng có width dạng % lấy phần còn lại
   * Tối ưu: Cache kết quả và tối ưu thuật toán
   */
  private calculateColumnWidths(columns: any[], containerWidth: number): any[] {
    const start = performance.now();

    if (!columns || columns.length === 0 || containerWidth <= 0) {
      return columns;
    }

    // Tạo cache key
    const cacheKey = `${columns.map(c => `${c.key}:${c.visible}:${c.width}`).join('|')}_${containerWidth}`;
    if (this.cachedColumnWidths.has(cacheKey) && this.cachedColumnWidthsKey === cacheKey) {
      return this.cachedColumnWidths.get(cacheKey);
    }

    // Tối ưu: Sử dụng một vòng lặp thay vì nhiều filter/map
    const visibleColumns: any[] = [];
    const originalWidthMap = new Map<string, string>();

    // Tạo map từ this.columns để lookup nhanh hơn
    const originalColumnsMap = new Map<string, any>();
    this.columns.forEach(col => {
      originalColumnsMap.set(col.key, col);
      if (col.width && typeof col.width === 'string' && col.width.endsWith('%')) {
        originalWidthMap.set(col.key, col.width);
      }
    });

    // Phân loại columns và lấy width gốc trong một vòng lặp
    columns.forEach(col => {
      if (col.visible !== false) {
        // Lấy width gốc nếu cần
        if (col.width && typeof col.width === 'number') {
          const originalWidth = originalWidthMap.get(col.key);
          if (originalWidth) {
            col = { ...col, width: originalWidth };
          }
        }
        visibleColumns.push(col);
      }
    });

    // Tìm cột cuối cùng có width dạng %
    let lastPercentColumnIndex = -1;
    for (let i = visibleColumns.length - 1; i >= 0; i--) {
      if (visibleColumns[i].width && typeof visibleColumns[i].width === 'string' && visibleColumns[i].width.endsWith('%')) {
        lastPercentColumnIndex = i;
        break;
      }
    }

    // Tính width cho visible columns
    let totalWidth = 0;
    const calculatedVisibleColumns = visibleColumns.map((col, index) => {
      if (col.width && typeof col.width === 'string' && col.width.endsWith('%')) {
        if (index === lastPercentColumnIndex && lastPercentColumnIndex >= 0) {
          const remainingWidth = containerWidth - totalWidth;
          return {
            ...col,
            width: remainingWidth > 0 ? remainingWidth : containerWidth * Number(col.width.replace('%', '')) / 100
          };
        }
        const percent = Number(col.width.replace('%', ''));
        const calculatedWidth = containerWidth * percent / 100;
        totalWidth += calculatedWidth;
        return { ...col, width: calculatedWidth };
      }
      if (typeof col.width === 'number') {
        totalWidth += col.width;
      }
      return col;
    });

    // Tạo map từ calculatedVisibleColumns để lookup nhanh
    const calculatedMap = new Map<string, any>();
    calculatedVisibleColumns.forEach(col => {
      calculatedMap.set(col.key, col);
    });

    // Merge lại với thứ tự ban đầu (tối ưu: sử dụng map thay vì find)
    const result = columns.map(col => {
      if (col.visible === false) {
        return col;
      }
      return calculatedMap.get(col.key) || col;
    });

    // Cache kết quả (giới hạn cache size)
    if (this.cachedColumnWidths.size > 10) {
      const firstKey = this.cachedColumnWidths.keys().next().value;
      this.cachedColumnWidths.delete(firstKey);
    }
    this.cachedColumnWidths.set(cacheKey, result);
    this.cachedColumnWidthsKey = cacheKey;

    const duration = performance.now() - start;
    return result;
  }

  onScroll = (event: Event) => {
    // logic ở đây
  };

  ngAfterViewInit() {
    this.ensureStickyLeftResizeObserver();

    // Chỉ tính lại column widths nếu chưa tính trong ngOnInit (trường hợp tableWrapper chưa sẵn sàng)
    if (this.displayedColumns.length > 0) {
      // Delay để đảm bảo container đã render xong
      setTimeout(() => {
        const containerWidth = this.getContainerWidth();
        if (containerWidth > 0) {
          // Kiểm tra xem đã có width chưa (nếu chưa thì mới tính lại)
          const hasCalculatedWidth = this.displayedColumns.some(col => typeof col.width === 'number');
          if (!hasCalculatedWidth) {
            this.displayedColumns = this.calculateColumnWidths(this.displayedColumns, containerWidth);
          }
          this.updateTableConfig();
          // Đo sticky `left` từ DOM sau layout (nhiều cột fixed + auto layout dễ lệch nếu chỉ dùng width config).
          this.scheduleRemeasureStickyLeft();
          this.cdr.markForCheck();
        }
      }, 150);
    }


    this.applyMaxHeight();

    // Đánh dấu đã load xong lần đầu sau một chút delay
    // Để tránh recalculate ngay từ đầu gây scroll ngang
    setTimeout(() => {
      this.isFirstLoad = false;
      const datatableBody =
        this.tableWrapper?.nativeElement?.querySelector('.table');

      if (!datatableBody) return;
      (datatableBody as HTMLElement).removeAttribute('tabindex');
      this.datatableBodyElement = null;
      // Chỉ cần focus + bắt phím (Ctrl+A, v.v.) khi đang ở multiSelectMode
      if (!this.multiSelectMode) {

        return;
      }

      this.datatableBodyElement = datatableBody as HTMLElement;
      this.datatableBodyElement.setAttribute('tabindex', '0'); // để element có thể focus


    }, 300);
  }

  detachTable() {
    this.cdr.detach();
  }

  attachTable() {

  }



  getCellContext(row: any, col: any, index: number) {
    return {
      row,
      value: row[col.key],
      index
    };
  }

  onCtrlAInTable() {
    if (this.multiSelectMode == true) {
      // Select all rows
      if (this.selectedRows.length === this.rows.length) {
        // Đã chọn hết → bỏ chọn tất cả
        this.selectedRows = [];
      } else {
        // Chưa chọn hết → chọn tất cả
        this.selectedRows = [...this.rows];
      }
      // Update selectedRowsMap
      this.updateSelectedRowsMap();

      // Update pre-computed maps
      this.updateRowSelectionMap();
      this.updateRowClassMap();

      // Emit change event
      this.selectedRowsChange.emit([...this.selectedRows]);

      // Force change detection với OnPush
      this.cdr.markForCheck();
    }
  }

  private applyMaxHeight(): void {
    if (this.fixedHeader) {
      // Apply fixed header mode
      this.applyFixedHeader();
      return;
    }

    if (!this.maxHeight) {
      return;
    }

    // Try multiple times in case datatable hasn't rendered yet
    let attempts = 0;
    const maxAttempts = 10;

    const tryApply = () => {
      attempts++;
      // Try to find datatable-body in tableWrapper
      const datatableBody = this.tableWrapper?.nativeElement?.querySelector('.datatable-body');

      if (datatableBody) {
        const maxHeightValue = typeof this.maxHeight === 'string' ? parseInt(this.maxHeight) : this.maxHeight;
        if (!isNaN(maxHeightValue) && maxHeightValue > 0) {
          (datatableBody as HTMLElement).style.maxHeight = maxHeightValue + 'px';
          (datatableBody as HTMLElement).style.overflowY = 'auto';
          (datatableBody as HTMLElement).style.overflowX = 'auto';
        }
      } else if (attempts < maxAttempts) {
        // Retry after a short delay
        setTimeout(tryApply, 50);
      }
    };

    setTimeout(tryApply, 0);
  }

  private applyFixedHeader(): void {
    if (!this.fixedHeaderMaxHeight) {
      return;
    }

    // Try multiple times in case table hasn't rendered yet
    let attempts = 0;
    const maxAttempts = 10;

    const tryApply = () => {
      attempts++;

      // Try to find tbody in tableWrapper
      const tbody = this.tableWrapper?.nativeElement;
      const thead = this.tableWrapper?.nativeElement?.querySelector('thead');
      const table = this.tableWrapper?.nativeElement?.querySelector('table');
      if (tbody && thead && table) {
        const maxHeightValue = typeof this.fixedHeaderMaxHeight === 'string'
          ? parseInt(this.fixedHeaderMaxHeight)
          : this.fixedHeaderMaxHeight;

        if (!isNaN(maxHeightValue) && maxHeightValue > 0) {
          // Set max-height for tbody and enable scrolling
          (tbody as HTMLElement).style.maxHeight = maxHeightValue + 'px';
          (tbody as HTMLElement).style.overflowY = 'auto';
          (tbody as HTMLElement).style.overflowX = 'auto';

          // Ensure table has proper layout
          (table as HTMLElement).style.borderCollapse = 'separate';
          (table as HTMLElement).style.borderSpacing = '0';

          // Make thead sticky (CSS will handle this, but we ensure it's set)
          (thead as HTMLElement).style.position = 'sticky';
          (thead as HTMLElement).style.top = '0';
          (thead as HTMLElement).style.zIndex = '100';

          // Set background color based on theme
          const isDark = this.currentSkin === 'dark';
          (thead as HTMLElement).style.backgroundColor = isDark ? '#343a40' : '#fff';

          // Ensure thead tr also has background
          const theadTr = thead.querySelector('tr');
          if (theadTr) {
            (theadTr as HTMLElement).style.backgroundColor = isDark ? '#343a40' : '#fff';
          }
        }
      } else if (attempts < maxAttempts) {
        // Retry after a short delay
        setTimeout(tryApply, 50);
      }
    };

    setTimeout(tryApply, 0);
  }



  filterUpdate(event, type) {
    // Tối ưu: Chỉ emit khi giá trị thực sự thay đổi
    if (type == 'timeFrom') {
      this.timeFrom = event;
      this.timeFromChange.emit(event);

    } else if (type == 'timeTo') {
      this.timeTo = event;
      this.timeToChange.emit(event);

    } else if (type == 'timeType') {
      if (this.timeType !== event) {
        this.timeType = event;
        this.timeTypeChange.emit(event);
      }
    }
  }

  onActivate(event: any) {
    this.rowActivate.emit(event);
  }

  currentSkin: string = 'light';
  private _unsubscribeAll = new Subject<void>();

  displayedColumns: any[] = [];
  visibleColumnNames = new Set<string>();
  showColumnPopup = false;
  public filteredColumns: any[] = [];

  /** Đã tính sẵn để tránh gọi function trong template (getResultText). */
  resultTextDisplay = '';
  /** Đã tính sẵn để tránh gọi areAllRowsSelected() trong template. */
  allRowsSelected = false;
  /** Class theo index dòng (rowClassByIndex[i] = class của rows[i]). */
  rowClassByIndex: string[] = [];
  /** Tooltip theo index dòng. */
  rowTooltipByIndex: string[] = [];
  /** Trạng thái chọn theo index dòng (rowSelectedByIndex[i] = rows[i] được chọn). */
  rowSelectedByIndex: boolean[] = [];
  /** Class cho pagination mobile (theo theme). */
  mobilePaginationClass = '';

  /** Config gom một object → giảm số binding cho row component (OnPush chỉ so 1 reference). */
  tableConfig: {
    displayedColumns: any[];
    size: string | null;
    dynamicWidth: boolean;
    selectMode: boolean;
    multiSelectMode: boolean;
    multiSelectFixedColumn?: boolean;
    showSelectCheckbox?: boolean;
    showIndexColumn: boolean;
    enableDoubleClick: boolean;
    /** Left offset (px) cho từng cột khi fixed (sticky) — cùng thứ tự displayedColumns. */
    fixedLeftPx?: number[];
    /** z-index tăng dần theo từng cột fixed (tbody) để cột sticky sau không bị ô cuộn phía phải che. */
    fixedStickyZIndex?: number[];
  } = {
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

  /** Đo lại offset sticky sau layout / resize (tránh lệch khi nhiều cột fixed + table-layout auto). */
  private sticky_left_resize_observer: ResizeObserver | null = null;
  private sticky_left_raf_id: number | null = null;

  /** Meta từng dòng (class, tooltip, selected) gom một object/dòng → giảm binding. */
  rowMeta: { index: number; class: string; tooltip: string; selected: boolean }[] = [];

  // Chunk render (desktop only, server-side mode) để giảm lag khi render quá nhiều rows.
  private useChunkedDesktopRows = false;
  private chunkedDisplayedRows: any[] = [];
  private chunkRenderToken = 0;
  private chunkRafId: number | null = null;
  private readonly CHUNK_RENDER_MIN_ROWS = 300;
  private readonly CHUNK_RENDER_CHUNK_SIZE = 10;

  private shouldChunkDesktopRender(): boolean {
    // Chỉ chunk khi desktop + server-side pagination (không cắt theo page ở FE).
    if (this.isMobile) return false;
    if (this.clientSidePagination) return false;
    const len = this.rows?.length ?? 0;
    return len > this.CHUNK_RENDER_MIN_ROWS;
  }

  private cancelChunkRender(): void {
    this.chunkRenderToken++;
    if (this.chunkRafId != null) {
      cancelAnimationFrame(this.chunkRafId);
      this.chunkRafId = null;
    }
  }

  private startChunkRenderDesktop(data: any[]): void {
    // Guard: chỉ chạy khi đang bật chunk render
    if (!this.useChunkedDesktopRows) return;
    this.cancelChunkRender();
    const token = this.chunkRenderToken;
    const chunkSize = this.CHUNK_RENDER_CHUNK_SIZE;

    // Fill chunk đầu tiên đồng bộ để tránh cảm giác "đợi lâu rồi mới render".
    this.chunkedDisplayedRows = data.slice(0, chunkSize);
    let index = this.chunkedDisplayedRows.length;
    this.cdr.detectChanges();

    const renderChunk = () => {
      // rows đã đổi trong khi đang render => hủy
      if (token !== this.chunkRenderToken) return;

      const nextChunk = data.slice(index, index + chunkSize);
      if (nextChunk.length) {
        this.chunkedDisplayedRows.push(...nextChunk);
      }
      index += chunkSize;

      // Chạy detectChanges để cập nhật template ngay cả khi một phần view đang detach.
      this.cdr.detectChanges();

      if (index < data.length) {
        this.chunkRafId = requestAnimationFrame(() => {
          setTimeout(renderChunk, 30);
        });
      } else {
        this.chunkRafId = null;
      }
    };

    // Render frame đầu tiên ngay sau khi rows đã set
    this.chunkRafId = requestAnimationFrame(renderChunk);
  }

  /** Khi clientSidePagination: chỉ các dòng của trang hiện tại; ngược lại = toàn bộ rows. */
  get displayedRows(): any[] {
    if (!this.clientSidePagination || !this.rows?.length) {
      // server-side mode (desktop only) => có thể render theo chunk
      if (!this.clientSidePagination && this.useChunkedDesktopRows) {
        return this.chunkedDisplayedRows;
      }
      return this.rows || [];
    }
    const pageSize = Math.max(1, Number(this.selectedOption) || 10);
    const start = (this.page - 1) * pageSize;
    return this.rows.slice(start, start + pageSize);
  }

  /** Khi clientSidePagination: rowMeta tương ứng displayedRows; ngược lại = rowMeta. */
  get displayedRowMeta(): { index: number; class: string; tooltip: string; selected: boolean }[] {
    if (!this.clientSidePagination || !this.rowMeta?.length) return this.rowMeta || [];
    const pageSize = Math.max(1, Number(this.selectedOption) || 10);
    const start = (this.page - 1) * pageSize;
    return this.rowMeta.slice(start, start + pageSize);
  }

  /** Tổng số bản ghi (khi clientSidePagination = rows.length). */
  get effectiveTotal(): number {
    if (this.clientSidePagination && this.rows?.length != null) return this.rows.length;
    return this.total;
  }

  /** Tổng số trang (khi clientSidePagination = ceil(rows.length/pageSize)). Ẩn pagination khi = 1. */
  get effectiveTotalPage(): number {
    if (this.clientSidePagination && this.rows?.length != null) {
      const pageSize = Math.max(1, Number(this.selectedOption) || 10);
      return Math.ceil(this.rows.length / pageSize) || 1;
    }
    return this.totalPage;
  }

  /** Chỉ số đầy đủ của dòng (dùng cho selection khi clientSidePagination). */
  getFullRowIndex(displayedIndex: number): number {
    if (!this.clientSidePagination) return displayedIndex;
    const pageSize = Math.max(1, Number(this.selectedOption) || 10);
    return (this.page - 1) * pageSize + displayedIndex;
  }

  /** Trạng thái chọn theo index trên trang hiện tại (cho mobile khi clientSidePagination). */
  isRowSelectedByDisplayedIndex(displayedIndex: number): boolean {
    const idx = this.getFullRowIndex(displayedIndex);
    return !!(this.rowSelectedByIndex && this.rowSelectedByIndex[idx]);
  }

  /** Danh sách key cột cho mat-table (bao gồm select, index nếu bật). */
  get displayedColumnsKeys(): string[] {
    const keys: string[] = [];
    if (this.multiSelectMode) keys.push('select');
    if (this.showIndexColumn) keys.push('index');
    this.displayedColumns.forEach(col => keys.push(col.key));
    return keys;
  }

  /** Chiều cao viewport cho virtual scroll. */
  get virtualScrollViewportHeight(): number {
    const h = this.fixedHeaderMaxHeight ?? this.maxHeight ?? 400;
    return typeof h === 'string' ? parseInt(h, 10) || 400 : (h || 400);
  }

  getHeaderHeight(): number {
    // Standard header height (input search is in dropdown, not always visible)
    return 50;
  }

  get getTotalCnt(): number {
    return this.totalCnt;
  }

  private updateResultTextDisplay(): void {
    this.resultTextDisplay = this.resultText ? this.resultText.replace('%cnt', String(this.getTotalCnt)) : 'result';
  }

  /** Text "Tìm thấy X chỉ định" (hoặc resultText) khi có phân trang; dùng effectiveTotal/effectiveTotalPage nếu clientSidePagination. */
  get effectiveResultTextDisplay(): string {
    if (!this.resultText) return '';
    const cnt = this.clientSidePagination ? this.effectiveTotal : this.totalCnt;
    let text = this.resultText.replace(/%cnt/g, String(cnt));
    if (this.enablePagination && this.effectiveTotalPage > 1) {
      text += ' trong ' + this.effectiveTotalPage + ' trang';
    }
    return text;
  }

  private updateMobilePaginationClass(): void {
    this.mobilePaginationClass = this.currentSkin === 'dark' ? 'bg-primary text-white' : 'bg-white text-dark';
  }

  /** Cập nhật tableConfig (gom binding) khi columns/size/options đổi. */
  private updateTableConfig(): void {
    const fixedLeftPx = this.resolveFixedLeftPx();
    const fixedStickyZIndex = this.computeFixedStickyZIndex(this.displayedColumns);
    this.tableConfig = {
      displayedColumns: this.displayedColumns,
      size: this.size,
      dynamicWidth: this.dynamicWidth,
      selectMode: this.selectMode,
      multiSelectMode: this.multiSelectMode,
      multiSelectFixedColumn: this.multiSelectFixedColumn,
      showSelectCheckbox: !!(this.selectMode && this.selectModeCheckboxColumnLabel && this.selectModeCheckboxColumnLabel.trim().length > 0),
      showIndexColumn: this.showIndexColumn,
      enableDoubleClick: this.enableDoubleClick,
      fixedLeftPx: fixedLeftPx.some(v => v > 0) ? fixedLeftPx : undefined,
      fixedStickyZIndex: fixedStickyZIndex.some(v => v > 0) ? fixedStickyZIndex : undefined
    };
  }

  /** Ưu tiên đo từ DOM (chính xác khi nhiều cột sticky); fallback theo width config. */
  private resolveFixedLeftPx(): number[] {
    const measured = this.tryMeasureFixedLeftPxFromDom();
    if (measured) {
      return measured;
    }
    return this.computeFixedColumnLeftPx(this.displayedColumns);
  }

  /**
   * Đo cumulative left từ các ô `thead` — khớp với layout thực tế (padding, border, nội dung rộng hơn minWidth).
   * Khi có nhiều cột fixed, chỉ cộng width trong config dễ lệch dồn → cột cuối trông như không dính.
   */
  private tryMeasureFixedLeftPxFromDom(): number[] | null {
    if (!this.tableWrapper?.nativeElement || !this.displayedColumns?.length || this.isMobile) {
      return null;
    }
    const thead_row = this.tableWrapper.nativeElement.querySelector('thead tr') as HTMLTableRowElement | null;
    if (!thead_row?.cells?.length) {
      return null;
    }
    const cells = thead_row.cells;
    let data_start = 0;
    if (this.multiSelectMode) {
      data_start++;
    }
    if (!this.multiSelectMode && this.selectMode && !!(this.selectModeCheckboxColumnLabel && this.selectModeCheckboxColumnLabel.trim().length > 0)) {
      data_start++;
    }
    if (this.showIndexColumn) {
      data_start++;
    }
    if (cells.length < data_start + this.displayedColumns.length) {
      return null;
    }
    const result: number[] = [];
    for (let i = 0; i < this.displayedColumns.length; i++) {
      let left = 0;
      for (let k = 0; k < data_start + i; k++) {
        left += (cells[k] as HTMLTableCellElement).offsetWidth;
      }
      const col = this.displayedColumns[i];
      result.push(col.fixed ? left : 0);
    }
    return result;
  }

  /**
   * Fallback: cộng dồn chiều rộng mọi cột đứng trước (kể cả không fixed).
   * Tránh sai offset khi có cột không fixed xen giữa các cột fixed (thứ tự cột từ localStorage).
   */
  private computeFixedColumnLeftPx(columns: any[]): number[] {
    const result: number[] = [];
    let cumulative_left = this.multiSelectMode && this.multiSelectFixedColumn ? 40 : 0;
    for (const col of columns) {
      result.push(col.fixed ? cumulative_left : 0);
      const w = col.width ?? col.minWidth ?? 80;
      cumulative_left += typeof w === 'number' ? w : 80;
    }
    return result;
  }

  /** z-index lớn dần theo thứ tự cột fixed trong tbody (0 = không áp dụng). */
  private computeFixedStickyZIndex(columns: any[]): number[] {
    const result: number[] = [];
    let stack = 10;
    for (const col of columns) {
      result.push(col.fixed ? stack++ : 0);
    }
    return result;
  }

  /** Sau khi browser layout xong, đo lại sticky left (DOM) vì lần đầu có thể chưa có thead. */
  private scheduleRemeasureStickyLeft(): void {
    if (this.isMobile) {
      return;
    }
    if (typeof requestAnimationFrame === 'undefined') {
      setTimeout(() => {
        this.updateTableConfig();
        this.cdr.markForCheck();
      }, 0);
      return;
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.ngZone.run(() => {
          this.updateTableConfig();
          this.cdr.markForCheck();
        });
      });
    });
  }

  private ensureStickyLeftResizeObserver(): void {
    if (this.isMobile || typeof ResizeObserver === 'undefined') {
      return;
    }
    const el = this.tableWrapper?.nativeElement;
    if (!el || this.sticky_left_resize_observer) {
      return;
    }
    this.sticky_left_resize_observer = new ResizeObserver(() => {
      if (this.sticky_left_raf_id != null) {
        cancelAnimationFrame(this.sticky_left_raf_id);
      }
      this.sticky_left_raf_id = requestAnimationFrame(() => {
        this.sticky_left_raf_id = null;
        this.ngZone.run(() => {
          this.updateTableConfig();
          this.cdr.markForCheck();
        });
      });
    });
    this.sticky_left_resize_observer.observe(el);
  }

  /** Cập nhật rowMeta từ các mảng *ByIndex (gom binding theo dòng). */
  private updateRowMeta(): void {
    const len = (this.rows || []).length;
    this.rowMeta = Array.from({ length: len }, (_, i) => ({
      index: i,
      class: this.rowClassByIndex[i] ?? '',
      tooltip: this.rowTooltipByIndex[i] ?? '',
      selected: this.rowSelectedByIndex[i] ?? false
    }));
    // console.log(this.rowMeta)
  }

  /** Tạm detach CD khi user đang gõ/chọn trong form-input để tránh bảng re-render. */
  private formInputDetached = false;

  constructor(
    private _coreConfigService: CoreConfigService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private elementRef: ElementRef,
    private formInputFocusService: FormInputFocusService
  ) {
    // Map showTimeFilter với hideTime khi khởi tạo
    this.hideTime = !this.showTimeFilter;
    // Đảm bảo rows luôn là array
    if (!Array.isArray(this.rows)) {
      this.rows = [];
    }

  }

  ngOnChanges(changes: SimpleChanges): void {
    const start = performance.now();
    const changedKeys = Object.keys(changes);
    // EARLY RETURN: Bỏ qua rows nếu không thực sự thay đổi (chỉ reference thay đổi)
    // Điều này xảy ra khi parent component re-render (ví dụ: khi gõ text trong modal)
  
    if (changes['rows'] && !changes['rows'].firstChange) {
      // Đảm bảo rows luôn là array
      if (!Array.isArray(this.rows)) {
        this.rows = [];
      }
      if (changes['rows'].currentValue && changes['rows'].currentValue.length > 0) {
        const currentRowsHash = this.getRowsHash(this.rows);


        // Update hash nếu có thay đổi thực sự
        this.previousRowsHash = currentRowsHash;

        // Update rowClassMap ngay lập tức khi hash thay đổi (không đợi debounce)
        // Điều này đảm bảo highlight được update ngay khi warning thay đổi
        this.updateRowClassMap();
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    }
    // Filter out function inputs that don't actually change (just reference comparison)
    const meaningfulChanges = changedKeys.filter(key => {
      // Bỏ qua function inputs nếu chúng không thực sự thay đổi
      if (['onPageChange', 'onPageSizeChange', 'applySort'].includes(key)) {
        const change = changes[key];
        // Chỉ log nếu thực sự có thay đổi (từ undefined/null sang function hoặc ngược lại)
        if (change.previousValue === change.currentValue ||
          (change.previousValue && change.currentValue &&
            change.previousValue.toString() === change.currentValue.toString())) {
          return false; // Bỏ qua - không có thay đổi thực sự
        }
      }
      // Bỏ qua rows nếu đã được xử lý ở trên (firstChange hoặc hash không đổi)
      if (key === 'rows' && changes['rows'] && !changes['rows'].firstChange) {
        if (changes['rows'].currentValue && changes['rows'].currentValue.length > 0) {
          const currentRowsHash = this.getRowsHash(this.rows);
          if (currentRowsHash === this.previousRowsHash) {
            return false;
          }
        }
      }
      return true;
    });

    if (meaningfulChanges.length > 0) {
    }

    if (changes['showTimeFilter'] !== undefined) {
      this.hideTime = !this.showTimeFilter;
      this.cdr.markForCheck();
    }

    if (changes['resultText'] != undefined || changes['totalCnt'] != undefined || changes['rows'] != undefined || changes.hasOwnProperty('totalCnt')) {
      this.updateResultTextDisplay();
    }

    const tableConfigKeys = ['columns', 'size', 'dynamicWidth', 'multiSelectMode', 'multiSelectFixedColumn', 'showIndexColumn', 'enableDoubleClick'];
    if (tableConfigKeys.some(k => changes[k])) {
      this.updateTableConfig();
    }

    // Đảm bảo rows luôn là array
    if (changes['rows']) {
      if (!Array.isArray(this.rows)) {
        this.rows = [];
      }
    }
    // Update maxHeight when it changes
    if (changes['maxHeight'] && !changes['maxHeight'].firstChange) {
      setTimeout(() => {
        this.applyMaxHeight();
      }, 0);
    }

    // Update fixedHeader when it changes
    if (changes['fixedHeader'] && !changes['fixedHeader'].firstChange) {
      setTimeout(() => {
        this.applyMaxHeight();
      }, 0);
    }

    // Update fixedHeaderMaxHeight when it changes
    if (changes['fixedHeaderMaxHeight'] && !changes['fixedHeaderMaxHeight'].firstChange) {
      setTimeout(() => {
        this.applyMaxHeight();
      }, 0);
    }

    if (changes['timeFrom']) {
      this.timeFromChange.emit(this.timeFrom);
    }
    if (changes['timeTo']) {
      this.timeToChange.emit(this.timeTo);
    }

    // Update pre-computed maps khi selectedRow hoặc selectedRows thay đổi
    if (changes['selectedRow'] || changes['selectedRows']) {
      this.updateSelectedRowsMap();
      this.updateRowSelectionMap();
      this.updateRowClassMap();
      this.cdr.markForCheck();
    }

    // Update pre-computed maps khi rowClass hoặc rowTooltip thay đổi
    if (changes['rowClass'] || changes['rowTooltip']) {
      this.updateRowClassMap();
      this.updateRowTooltipMap();
      this.cdr.markForCheck();
    }

    // Update pre-computed maps khi selectMode hoặc multiSelectMode thay đổi
    if (changes['selectMode'] || changes['multiSelectMode']) {
      this.updateRowSelectionMap();
      this.updateRowClassMap();
      this.cdr.markForCheck();
      this.refreshMultipleSelectShortcutBinding();
    }
    if (changes['multipleSelectShortcutKey']) {
      this.refreshMultipleSelectShortcutBinding();
    }

    if (changes['columns']) {
      console.log('columns', changes['columns'])
      // Clear cache khi columns thay đổi
      this.cachedColumnWidths.clear();
      this.cachedColumnWidthsKey = '';
      this.cachedLowercaseColumnNames.clear(); // Clear cache lowercase names

      // Khởi tạo filteredColumns
      if (this.columns && this.columns.length > 0) {
        this.filteredColumns = [...this.columns];

        // Xử lý lần đầu tiên: chỉ hiển thị các cột có visible !== false
        if (changes['columns'].firstChange || this.displayedColumns.length === 0) {
         
          this.visibleColumnNames.clear();
          // Kiểm tra localStorage trước
          const storageKey = this.getStorageKey();
          const key = 'datatable-column-order-map';
          const storedMap = JSON.parse(localStorage.getItem(key) || '{}');
          const savedOrder = storedMap[storageKey];
          if (savedOrder && savedOrder.length > 0) {
            // Nếu có savedOrder trong localStorage, set visible theo savedOrder
            this.columns.forEach(col => {
              if (savedOrder.includes(col.key)) {
                col.visible = true;
                this.visibleColumnNames.add(col.key);
              } else {
                col.visible = false;
              }
            });
          } else {
            // Nếu không có savedOrder, giữ nguyên visible ban đầu
            this.columns.forEach(col => {
              if (col.visible !== false) {
                this.visibleColumnNames.add(col.key);
              }
            });
          }
          this.displayedColumns = this.columns.filter(c => this.visibleColumnNames.has(c.key));
          this.sortDisplayedColumn();
        } else {
          // Xử lý khi columns thay đổi sau lần đầu
          this.displayedColumns = [...this.columns];
          this.sortDisplayedColumn();
          this.columns.forEach(col => {
            if (this.displayedColumns.some(dc => dc.key === col.key)) {
              this.visibleColumnNames.add(col.key);
            }
          });
        }
        // Delay để đảm bảo container đã render xong
        setTimeout(() => {
          const containerWidth = this.getContainerWidth();
          this.displayedColumns = this.calculateColumnWidths(this.displayedColumns, containerWidth);
          this.updateTableConfig();
          this.scheduleRemeasureStickyLeft();
          this.cdr.markForCheck();
          // console.log(this.displayedColumns, containerWidth)
        }, 150);
      }
      this.cdr.detectChanges();
    } else if (changes['rows']) {
      // Hash đã được check ở đầu function, nếu đến đây nghĩa là rows thực sự thay đổi

      // Desktop (server-side mode) => chunk render để giảm lag khi render quá nhiều rows.
      // Hủy chunk cũ và reset state để tránh lẫn dữ liệu.
      this.useChunkedDesktopRows = false;
      this.chunkedDisplayedRows = [];
      this.cancelChunkRender();
      if (this.shouldChunkDesktopRender()) {
        this.useChunkedDesktopRows = true;
      }

      // Start chunk render ngay khi rows vừa đổi (desktop server-side),
      // không chờ debounce/precompute để tránh cảm giác "render trễ rồi lại render lại".
      const nextRows = changes['rows']?.currentValue;
      if (this.useChunkedDesktopRows && Array.isArray(nextRows) && nextRows.length > 0) {
        this.startChunkRenderDesktop(nextRows);
      }

      // Debounce để tránh trigger liên tục khi parent update nhiều lần
      if (this.rowsChangeDebounceTimeout) {
        clearTimeout(this.rowsChangeDebounceTimeout);
      }

      this.rowsChangeDebounceTimeout = setTimeout(() => {
        // Pre-compute row data khi rows thay đổi
        this.updateSelectedRowsMap();
        this.updateRowSelectionMap();
        this.updateRowClassMap();
        this.updateRowTooltipMap();

        // Trigger change detection
        this.cdr.markForCheck();

        if (!changes['rows'].firstChange) {
          // Re-apply maxHeight when rows change (table might re-render)
          if (this.maxHeight || this.fixedHeader) {
            setTimeout(() => {
              this.applyMaxHeight();
            }, 100);
          }
          // Delay để đảm bảo container đã render xong
          // Debounce để tránh gọi quá nhiều lần khi rows update liên tục
          if (this.columnWidthTimeout) {
            clearTimeout(this.columnWidthTimeout);
          }
          this.columnWidthTimeout = setTimeout(() => {
            // Reset cache để lấy width mới nhất
            this.resetCachedContainerWidth();
            const containerWidth = this.getContainerWidth();
            if (containerWidth > 0) {
              const newDisplayedColumns = this.calculateColumnWidths(this.displayedColumns, containerWidth);
              // Chỉ update nếu có thay đổi thực sự (so sánh chỉ các properties quan trọng, bỏ qua TemplateRef)
              const hasChanged = this.hasColumnsChanged(newDisplayedColumns, this.displayedColumns);
              if (hasChanged) {
                this.displayedColumns = newDisplayedColumns;
                this.cdr.markForCheck();
              }
            }
            // Luôn đo lại offset sticky sau khi layout ổn định: ẩn/hiện dòng (vd. nhóm XN) làm đổi width cột
            // thực tế nhưng thuật toán calculateColumnWidths có thể không đổi config — vẫn cần đo thead DOM.
            this.updateTableConfig();
            this.scheduleRemeasureStickyLeft();
            this.columnWidthTimeout = null;
          }, 150);
          // Force recalculate datatable khi rows change để fix scroll ngang
          // Ngay cả khi column widths không đổi, ngx-datatable vẫn cần recalculate
        }

        this.rowsChangeDebounceTimeout = null;
        this.cdr.detectChanges();
        // Sau khi class ẩn dòng (display:none) áp vào DOM — đo lại sticky left (ResizeObserver có thể không bắn nếu khung bảng không đổi width).
        this.scheduleRemeasureStickyLeft();
      }, 50); // Debounce 50ms để batch các updates
    }

    const duration = performance.now() - start;
    if (duration > 5) {
    }
  }

  onReorder(event: any) {
    const { newValue, prevValue } = event;

    // Cập nhật lại thứ tự trong mảng
    const movedColumn = this.displayedColumns.splice(prevValue, 1)[0];
    this.displayedColumns.splice(newValue, 0, movedColumn);
    // Delay để đảm bảo container đã render xong
    setTimeout(() => {
      const containerWidth = this.getContainerWidth();
      this.displayedColumns = this.calculateColumnWidths(this.displayedColumns, containerWidth);
      this.updateTableConfig();
      this.cdr.markForCheck();
      // console.log(this.displayedColumns)

      // Lấy storage key với prefix
      const storageKey = this.getStorageKey();

      // Đọc map hiện tại trong localStorage
      const key = 'datatable-column-order-map';
      const storedMap = JSON.parse(localStorage.getItem(key) || '{}');

      // Cập nhật lại map cho màn hình hiện tại với prefix
      storedMap[storageKey] = this.displayedColumns.map(c => c.key);

      // Ghi lại toàn bộ map
      localStorage.setItem(key, JSON.stringify(storedMap));
    }, 150);
  }
  searchColumnText: string = '';

  // Cache lowercase column names để tránh toLowerCase() mỗi lần filter
  private cachedLowercaseColumnNames: Map<string, string> = new Map();

  onSearchColumnChange(value: string) {
    const start = performance.now();

    // Debounce để tránh filter quá nhiều lần khi user đang gõ
    if (this.searchColumnDebounceTimeout) {
      clearTimeout(this.searchColumnDebounceTimeout);
    }

    // Update searchColumnText ngay để UI responsive (không debounce UI update)
    this.searchColumnText = value;

    this.searchColumnDebounceTimeout = setTimeout(() => {
      const filterStart = performance.now();
      const keyword = value.toLowerCase().trim();

      if (!keyword) {
        this.filteredColumns = [...this.columns];
      } else {
        // Tối ưu: Cache lowercase names để tránh toLowerCase() mỗi lần
        if (this.cachedLowercaseColumnNames.size === 0) {
          const cacheStart = performance.now();
          this.columns.forEach(col => {
            this.cachedLowercaseColumnNames.set(col.key, (col.name || '').toLowerCase());
          });
        }

        this.filteredColumns = this.columns.filter(col => {
          const colNameLower = this.cachedLowercaseColumnNames.get(col.key) || '';
          return colNameLower.includes(keyword);
        });
      }

      const filterDuration = performance.now() - filterStart;

      // Không cần markForCheck vì đây là local state, OnPush sẽ tự detect
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      this.searchColumnDebounceTimeout = null;

      const totalDuration = performance.now() - start;
    }, 200); // Debounce 200ms để giảm lag khi gõ
  }

  maxPageSize = 5;
  @HostListener('window:resize', ['$event'])
  onWindowResize(event: Event) {
    // Reset cached container width khi window resize
    this.resetCachedContainerWidth();
    this.setMaxPageSize(window.innerWidth);
    this.scheduleRemeasureStickyLeft();
    this.cdr.detectChanges();
  }

  setMaxPageSize(width: number) {
    // Nếu màn hình nhỏ (mobile < 768px), hiển thị ít page hơn
    if (width < 768) {
      this.maxPageSize = 2;
    } else {
      this.maxPageSize = 5;
    }
  }
  public originalVisibleColumnNames: Set<string> = new Set();
  public defaultColumns: any[] = [];
  ngOnInit(): void {
    // Theo dõi thay đổi theme (skin)
    this.isMobile = window.innerWidth < 768;
    if (this.isMobile) {
      this.maxPageSize = 2;
    } else {
      this.maxPageSize = 5;
    }
    // Store handler để có thể remove sau
    this.resizeHandler = () => {
      this.isMobile = window.innerWidth < 768;
      if (this.isMobile) {
        this.maxPageSize = 2;
      } else {
        this.maxPageSize = 5;
      }
      this.cdr.markForCheck();
    };
    window.addEventListener('resize', this.resizeHandler);
    this._coreConfigService
      .getConfig()
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(config => {
        this.currentSkin = config.layout.skin;
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(this.currentSkin);
        this.updateMobilePaginationClass();
        this.cdr.markForCheck();
      });

    // Mặc định hiển thị tất cả cột
    // this.displayedColumns = [...this.columns];
    // this.filteredColumns = [...this.columns];
    // this.sortDisplayedColumn()
    // this.columns.forEach(col => {
    //   if (this.displayedColumns.some(dc => dc.name === col.name)) {
    //     this.visibleColumnNames.add(col.name);
    //   }
    // });

    // Mặc định hiển thị các cột có visible: true hoặc không có thuộc tính visible
  
    if (this.columns && this.columns.length > 0) {
      this.filteredColumns = [...this.columns];

      // Load dữ liệu từ localStorage
      const storageKey = this.getStorageKey();
      const key = 'datatable-column-order-map';
      const storedMap = JSON.parse(localStorage.getItem(key) || '{}');
      const savedOrder = storedMap[storageKey];

      // Nếu có savedOrder trong localStorage, set visible dựa trên savedOrder
      if (savedOrder && Array.isArray(savedOrder) && savedOrder.length > 0) {
        this.columns.forEach(col => {
          if (savedOrder.includes(col.key)) {
            // Cột có trong savedOrder => đang được người dùng hiển thị => set visible = true
            col.visible = true;
            this.visibleColumnNames.add(col.key);
          } else {
            // Cột không có trong savedOrder => người dùng đã ẩn => set visible = false
            col.visible = false;
          }
        });
      } else {
        // Không có savedOrder, giữ nguyên visible ban đầu
        this.columns.forEach(col => {
          if (col.visible !== false) {
            this.visibleColumnNames.add(col.key);
          }
        });
      }
      this.displayedColumns = this.columns.filter(c => this.visibleColumnNames.has(c.key));
      // Không tính width trong ngOnInit vì tableWrapper có thể chưa sẵn sàng
      // Sẽ tính trong ngAfterViewInit
      // const containerWidth = this.tableWrapper.nativeElement.clientWidth;
      // this.displayedColumns = this.calculateColumnWidths(this.displayedColumns, containerWidth);
      // console.log(this.displayedColumns)
      this.sortDisplayedColumn();
    }

    // Pre-compute row data khi khởi tạo
    if (this.rows && this.rows.length > 0) {
      this.updateSelectedRowsMap();
      this.updateRowSelectionMap();
      this.updateRowClassMap();
      this.updateRowTooltipMap();
    }
    this.updateResultTextDisplay();
    this.updateMobilePaginationClass();
    this.updateTableConfig();
    this.updateRowMeta();
    this.refreshMultipleSelectShortcutBinding();
  }

  private refreshMultipleSelectShortcutBinding(): void {
    if (this.bound_multi_select_shortcut_keys.length > 0) {
      CommonFunc.unbindMousetrapShortcuts(this.bound_multi_select_shortcut_keys);
      this.bound_multi_select_shortcut_keys = [];
    }
    const shortcut = (this.multipleSelectShortcutKey || '').trim().toLowerCase();
    if (!this.multiSelectMode || !shortcut) {
      return;
    }
    this.bound_multi_select_shortcut_keys = [shortcut];
    CommonFunc.bindMousetrapShortcuts(this.bound_multi_select_shortcut_keys, this.ngZone, () => {
      this.toggleSelectAllByShortcut();
      return true;
    });
  }

  private toggleSelectAllByShortcut(): void {
    if (!this.multiSelectMode) {
      return;
    }
    if (this.selectedRows.length === this.rows.length) {
      this.selectedRows = [];
      this.selectedRowsMap.clear();
    } else {
      this.selectedRows = [...this.rows];
      this.updateSelectedRowsMap();
    }
    this.updateRowSelectionMap();
    this.updateRowClassMap();
    this.selectedRowsChange.emit([...this.selectedRows]);
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  sortDisplayedColumn() {
    const storageKey = this.getStorageKey();
    const key = 'datatable-column-order-map';
    const storedMap = JSON.parse(localStorage.getItem(key) || '{}');
    const savedOrder = storedMap[storageKey];
    if (savedOrder) {
      // // Chỉ giữ lại các cột có trong savedOrder VÀ có visible !== false
      // this.displayedColumns = this.displayedColumns.filter(c =>
      //   savedOrder.includes(c.key) && c.visible !== false
      // );

      // this.displayedColumns.sort(
      //   (a, b) => savedOrder.indexOf(a.key) - savedOrder.indexOf(b.key)
      // );

      // // Cập nhật lại visibleColumnNames để đồng bộ
      // this.visibleColumnNames.clear();
      this.displayedColumns.forEach(col => {
        this.visibleColumnNames.add(col.key);
      });
      // Delay để đảm bảo container đã render xong
      setTimeout(() => {
        const containerWidth = this.getContainerWidth();
        this.displayedColumns = this.calculateColumnWidths(this.displayedColumns, containerWidth);
        this.updateTableConfig();
        this.scheduleRemeasureStickyLeft();
        this.cdr.markForCheck();
        // console.log(this.displayedColumns)
      }, 150);
    } else {
      // Khi không có savedOrder, sắp xếp lại displayedColumns theo thứ tự trong columns array
      // để đảm bảo thứ tự ban đầu được giữ nguyên
      // this.displayedColumns.sort((a, b) => {
      //   const indexA = this.columns.findIndex(c => c.key === a.key);
      //   const indexB = this.columns.findIndex(c => c.key === b.key);
      //   return indexA - indexB;
      // });
    }

  }
  // Bật/tắt popup chọn cột
  toggleColumnPopup(): void {
    this.showColumnPopup = !this.showColumnPopup;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  // Kiểm tra cột có đang hiển thị không
  isColumnVisible(col: any): boolean {
    return this.visibleColumnNames.has(col.key);
  }
  showAllColumns() {
    this.columns.forEach(col => this.visibleColumnNames.add(col.key));
    this.displayedColumns = [...this.columns];
    this.updateTableConfig();
    for (let i = 0; i < this.displayedColumns.length; i++) {
      if (!this.displayedColumns[i].visible) {
        this.displayedColumns[i].visible = !this.displayedColumns[i].visible;
      }

    }
    if(this.detachMode) {
      this.detachMode = false;
      setTimeout(() => {
        this.detachMode = true;
      }, 500);
    }
    // Delay để đảm bảo container đã render xong
    setTimeout(() => {
      const containerWidth = this.getContainerWidth();
      this.displayedColumns = this.calculateColumnWidths(this.displayedColumns, containerWidth);
      this.updateTableConfig();
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      // console.log(this.displayedColumns)
      this.saveDisplayedColumn();
    }, 150);
  }

  hideAllColumns() {
    this.visibleColumnNames.clear();
    this.displayedColumns = [];
    this.updateTableConfig();
    if(this.detachMode) {
      this.detachMode = false;
      setTimeout(() => {
        this.detachMode = true;
      }, 500);
    }
    // Delay để đảm bảo container đã render xong
    setTimeout(() => {
      const containerWidth = this.getContainerWidth();
      this.displayedColumns = this.calculateColumnWidths(this.displayedColumns, containerWidth);
      this.updateTableConfig();
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      // console.log(this.displayedColumns)
      this.saveDisplayedColumn();
    }, 150);
  }
  // Bật/tắt hiển thị cột
  toggleColumn(col: any): void {
    if (this.visibleColumnNames.has(col.key)) {
      this.visibleColumnNames.delete(col.key);
    } else {
      this.visibleColumnNames.add(col.key);
    }
    this.displayedColumns = this.columns.filter(c => this.visibleColumnNames.has(c.key));
    this.updateTableConfig();
    for (let i = 0; i < this.displayedColumns.length; i++) {
      if (this.displayedColumns[i].key === col.key) {
        if (!this.displayedColumns[i].visible) {
          this.displayedColumns[i].visible = !this.displayedColumns[i].visible;
        }
      }
    }
    setTimeout(() => {
      const containerWidth = this.getContainerWidth();
      this.displayedColumns = this.calculateColumnWidths(this.displayedColumns, containerWidth);
      this.updateTableConfig();
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      if(this.detachMode) {
        this.detachMode = false;
        setTimeout(() => {
          this.detachMode = true;
        }, 500);
      }
      // console.log(this.displayedColumns)
      this.saveDisplayedColumn();
    }, 150);
  }

  @ViewChild('columnPopup', { static: false }) columnPopup!: ElementRef;
  @ViewChild('columnPopupButton', { static: false }) columnPopupButton!: ElementRef;

  // ... existing code ...

  // ✅ Thêm method để đóng popup khi click ra ngoài
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Chỉ log khi popup đang mở để tránh spam
    if (this.showColumnPopup) {
      const clickedInsidePopup = this.columnPopup?.nativeElement?.contains(event.target);
      const clickedOnButton = this.columnPopupButton?.nativeElement?.contains(event.target);
      if (!clickedInsidePopup && !clickedOnButton) {
        this.showColumnPopup = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    }
  }

  onRowActivate(event: any) {
    if (event.type === 'click' && event.row) {
      if (this.selectMode) {
        this.selectedRow = event.row;
        this.updateRowSelectionMap();
        this.updateRowClassMap();
        this.rowSelect.emit(event.row);
      } else {
        this.rowClick.emit(event.row);
      }
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }
  }

  // Handle direct row click (for table rows)
  onRowClick(row: any, event?: MouseEvent, rowIndex?: number) {
    if (this.multiSelectMode) {
      // Shift + click: chọn range từ lần click trước tới dòng hiện tại
      if (event && event.shiftKey && typeof rowIndex === 'number') {
        if (this.lastClickedIndexForMulti == null) {
          this.lastClickedIndexForMulti = rowIndex;
          this.toggleRowSelection(row);
        } else {
          this.selectRange(this.lastClickedIndexForMulti, rowIndex);
        }
      } else if (
        this.multiSelectPlainClickSingle &&
        event &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey
      ) {
        // Click thường (có MouseEvent): chỉ giữ một dòng được chọn; Ctrl/Cmd/Shift xử lý ở nhánh khác
        if (!this.wasDragOperation) {
          this.replaceMultiSelectionWithRow(row);
          if (typeof rowIndex === 'number') {
            this.lastClickedIndexForMulti = rowIndex;
          }
        }
      } else {
        // Legacy multi-select, hoặc Ctrl/Cmd+click, hoặc click từ checkbox (event null) → toggle từng dòng
        if (!this.wasDragOperation) {
          this.toggleRowSelection(row);
          if (typeof rowIndex === 'number') {
            this.lastClickedIndexForMulti = rowIndex;
          }
        }
        // Nếu là drag thì selection đã được xử lý trong onMouseMove
      }
    } else if (this.selectMode) {
      // Keep selection even if clicking on already selected row
      // Update selectedRow ngay lập tức để maps được update
      this.selectedRow = row;

      // Update pre-computed maps ngay lập tức (không đợi parent update input)
      this.updateRowSelectionMap();
      this.updateRowClassMap();

      // Emit event để parent biết
      this.rowSelect.emit(row);

      // Force change detection để UI update ngay
      this.cdr.markForCheck();
    } else {
      this.rowClick.emit(row);
    }
    this.cdr.detectChanges();

  }

  // Handle double click on row
  onRowDoubleClick(row: any, event?: MouseEvent) {
    if (this.enableDoubleClick && this.onDoubleClick) {
      // Prevent default behavior and stop propagation
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      // Call the provided double click handler
      this.onDoubleClick(row);
      this.cdr.detectChanges();

    }
  }

  toggleRowSelectionForRow(event: any, row: any) {
    if (event.target) {
      this.toggleRowSelection(row);
    }
  }

  resetToDefaultColumns() {
    const storageKey = this.getStorageKey();

    // Đọc map hiện tại trong localStorage
    const key = 'datatable-column-order-map';
    const storedMap = JSON.parse(localStorage.getItem(key) || '{}');
    // Xóa key khỏi Object (dùng toán tử delete)
    delete storedMap[storageKey];
    localStorage.setItem(key, JSON.stringify(storedMap));

    // Reset đúng về trạng thái mặc định ban đầu (không toggle).
    this.visibleColumnNames = new Set<string>(this.originalVisibleColumnNames);
    this.columns = this.columns.map(col => ({
      ...col,
      visible: this.originalVisibleColumnNames.has(col.key)
    }));
    this.filteredColumns = [...this.columns];
    this.displayedColumns = this.columns.filter(c => this.visibleColumnNames.has(c.key));
    this.updateTableConfig();
    if(this.detachMode) {
      this.detachMode = false;
      setTimeout(() => {
        this.detachMode = true;
      }, 500);
    }
    setTimeout(() => {
      const containerWidth = this.getContainerWidth();
      this.displayedColumns = this.calculateColumnWidths(this.displayedColumns, containerWidth);
      this.updateTableConfig();
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      this.saveDisplayedColumn();
    }, 150);
  }

  /** Gán selection multi-select thành đúng một dòng (dùng khi multiSelectPlainClickSingle + click thường). */
  private replaceMultiSelectionWithRow(row: any): void {
    if (!this.multiSelectMode) {
      return;
    }
    const key = this.getRowKey(row);
    if (this.selectedRowsMap.has(key)) {
      // Deselect
      const index = this.findRowIndex(row);
      if (index >= 0) {
        this.selectedRows.splice(index, 1);
        this.selectedRowsMap.delete(key);
      }
    } else {
      // Select
      this.selectedRows = [row];
      this.selectedRowsMap.set(key, row);
    }
    this.updateSelectedRowsMap();
    this.updateRowSelectionMap();
    this.updateRowClassMap();
    this.selectedRowsChange.emit([...this.selectedRows]);
    this.cdr.markForCheck();
  }

  // Toggle row selection in multi-select mode
  toggleRowSelection(row: any) {
    if (!this.multiSelectMode) return;

    const key = this.getRowKey(row);
    if (this.selectedRowsMap.has(key)) {
      // Deselect
      const index = this.findRowIndex(row);
      if (index >= 0) {
        this.selectedRows.splice(index, 1);
        this.selectedRowsMap.delete(key);
      }
    } else {
      // Select
      this.selectedRows.push(row);
      this.selectedRowsMap.set(key, row);
    }

    // Update pre-computed maps
    this.updateRowSelectionMap();
    this.updateRowClassMap();

    this.selectedRowsChange.emit([...this.selectedRows]);
    this.cdr.markForCheck();

  }

  // Find row index in selectedRows array (tối ưu: sử dụng Map nếu có nhiều rows)
  findRowIndex(row: any): number {
    // Nếu có ít rows, dùng findIndex (nhanh hơn cho small arrays)
    if (this.selectedRows.length < 50) {
      return this.selectedRows.findIndex(selected => {
        if (row.id && selected.id) {
          return row.id === selected.id;
        }
        return row === selected;
      });
    }

    // Với nhiều rows, sử dụng Map để lookup O(1)
    const key = this.getRowKey(row);
    const selectedRow = this.selectedRowsMap.get(key);
    if (selectedRow) {
      return this.selectedRows.indexOf(selectedRow);
    }
    return -1;
  }

  // Update selectedRowsMap khi selectedRows thay đổi
  private updateSelectedRowsMap(): void {
    this.selectedRowsMap.clear();
    this.selectedRows.forEach(selectedRow => {
      const key = this.getRowKey(selectedRow);
      this.selectedRowsMap.set(key, selectedRow);
    });
  }

  // Check if row is selected in multi-select mode
  isRowSelectedInMultiMode(row: any): boolean {
    if (!this.multiSelectMode) return false;
    return this.findRowIndex(row) >= 0;
  }

  isRowSelected(row: any): boolean {
    const key = this.getRowKey(row);
    const result = this.rowSelectionMap.get(key) || false;
    // Uncomment để debug nếu được gọi quá nhiều:
    // console.log(`[${Date.now()}] isRowSelected called for row:`, key, 'result:', result);
    return result;
  }

  // Pre-compute row selection state cho tất cả rows
  private updateRowSelectionMap(): void {
    const prevSelectedMap = new Map(this.rowSelectionMap);
    this.rowSelectionMap.clear();
    if (this.multiSelectMode) {
      this.selectedRows.forEach(selectedRow => {
        const key = this.getRowKey(selectedRow);
        this.rowSelectionMap.set(key, true);
      });
    } else if (this.selectMode && this.selectedRow) {
      const key = this.getRowKey(this.selectedRow);
      this.rowSelectionMap.set(key, true);

    }
    this.allRowsSelected = !!(this.multiSelectMode && this.rows?.length > 0 && this.selectedRows.length === this.rows.length);
    this.rowSelectedByIndex = (this.rows || []).map(row => this.rowSelectionMap.get(this.getRowKey(row)) || false);
    this.updateRowMeta();
    this.cdr.detectChanges();
  }

  // public rowComponents = null;
  @ViewChildren(DynamicTableRowComponent)
  public rowComponents!: QueryList<DynamicTableRowComponent>;
  private refreshChangedRows(prevMap: Map<any, boolean>) {
    if (!this.rowComponents) return;

    const rows = this.rowComponents.toArray();

    (this.rows || []).forEach((row, index) => {
      const key = this.getRowKey(row);

      const prev = prevMap.get(key) || false;
      const curr = this.rowSelectionMap.get(key) || false;

      // chỉ update row bị thay đổi trạng thái
      if (prev !== curr && rows[index]) {
        rows[index].cdr.detectChanges();
      }
    });
  }

  // Drag selection variables
  private isDragging = false;

  // Getter để template có thể check isDragging hoặc hasMoved
  get isCurrentlyDragging(): boolean {
    return this.isDragging || this.hasMoved;
  }
  private dragStartIndex = -1;
  private dragEndIndex = -1;
  private dragStartRow: any = null;
  private mouseDownRow: any = null;
  private mouseDownPosition: { x: number; y: number } | null = null;
  private hasMoved = false;
  private wasDragOperation = false;
  private lastClickedIndexForMulti: number | null = null;

  // Handle mousedown on tbody (event delegation)
  onTbodyMouseDown(event: MouseEvent) {
    if (!this.multiSelectMode) return;

    // Only start drag on left mouse button
    if (event.button !== 0) return;

    // Kiểm tra xem user có đang cố gắng select text không
    const target = event.target as HTMLElement;
    // Nếu click vào input, button, hoặc element có thể select text, không prevent default
    const isTextSelectable = target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'BUTTON' ||
      target.closest('input, textarea, button, a') !== null;

    // Nếu đang select text, không xử lý drag
    if (isTextSelectable) return;

    // Tìm row từ target
    const rowElement = target.closest('tr');
    if (!rowElement) return;

    const rowIndexAttr = rowElement.getAttribute('data-row-index');
    if (rowIndexAttr === null) return;

    const rowIndex = parseInt(rowIndexAttr, 10);
    if (isNaN(rowIndex) || rowIndex < 0 || rowIndex >= this.rows.length) return;

    const row = this.rows[rowIndex];

    // Store initial state để có thể prevent sau nếu cần
    this.mouseDownRow = row;
    this.mouseDownPosition = { x: event.clientX, y: event.clientY };
    this.hasMoved = false;
    this.wasDragOperation = false;
    this.dragStartIndex = rowIndex;
    this.dragEndIndex = rowIndex;
    this.dragStartRow = row;

    // Cache rows ngay khi bắt đầu drag để tránh query DOM liên tục
    if (this.tableWrapper) {
      this.cachedTableRows = this.tableWrapper.nativeElement.querySelectorAll('tbody tr');
    }

    // Add event listeners for drag
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  // Start drag selection (kept for backward compatibility with checkbox cell)
  onRowMouseDown(event: MouseEvent, row: any, rowIndex: number) {
    if (!this.multiSelectMode) return;

    // Only start drag on left mouse button
    if (event.button !== 0) return;

    // Nếu click vào checkbox hoặc label của checkbox, không xử lý drag
    const target = event.target as HTMLElement;
    if (target && (
      (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') ||
      target.tagName === 'LABEL' ||
      target.closest('app-form-input') ||
      target.closest('.custom-control-input') ||
      target.closest('.custom-control-label') ||
      target.closest('.custom-control') ||
      target.closest('.custom-checkbox')
    )) {
      // Cho phép checkbox hoạt động bình thường, chỉ stop propagation để không trigger row click
      // KHÔNG stop propagation ở đây để cho phép checkbox nhận được event
      return;
    }

    // Stop propagation để không trigger tbody handler
    event.stopPropagation();

    // Store initial state
    this.mouseDownRow = row;
    this.mouseDownPosition = { x: event.clientX, y: event.clientY };
    this.hasMoved = false;
    this.wasDragOperation = false;
    this.dragStartIndex = rowIndex;
    this.dragEndIndex = rowIndex;
    this.dragStartRow = row;

    // Cache rows ngay khi bắt đầu drag để tránh query DOM liên tục
    if (this.tableWrapper) {
      this.cachedTableRows = this.tableWrapper.nativeElement.querySelectorAll('tbody tr');
    }

    // Add event listeners for drag
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  // Handle mouse move during drag (tối ưu: cache rows và throttle)
  private onMouseMove = (event: MouseEvent) => {
    if (!this.multiSelectMode || !this.mouseDownPosition) return;

    // Check if mouse has moved significantly (more than 5px)
    const moveThreshold = 5;
    const deltaX = Math.abs(event.clientX - this.mouseDownPosition.x);
    const deltaY = Math.abs(event.clientY - this.mouseDownPosition.y);

    if (!this.hasMoved && (deltaX > moveThreshold || deltaY > moveThreshold)) {
      this.hasMoved = true;
      this.isDragging = true;
      this.wasDragOperation = true;

      // Chỉ prevent default khi thực sự bắt đầu drag (đã di chuyển)
      // Điều này cho phép text selection nếu user không di chuyển mouse
      event.preventDefault();

      // Select the starting row if not already selected
      if (!this.isRowSelected(this.dragStartRow)) {
        this.toggleRowSelection(this.dragStartRow);
      }
    }

    if (this.isDragging) {
      // Find the row under the mouse cursor
      const target = event.target as HTMLElement;
      const rowElement = target.closest('tr');

      if (rowElement && this.cachedTableRows) {
        // Tối ưu: Sử dụng cached rows thay vì query lại mỗi lần
        let rowIndex = -1;
        for (let i = 0; i < this.cachedTableRows.length; i++) {
          if (this.cachedTableRows[i] === rowElement) {
            rowIndex = i;
            break;
          }
        }

        if (rowIndex >= 0 && rowIndex < this.rows.length) {
          this.dragEndIndex = rowIndex;
          // Throttle selectRange calls để tránh lag
          const now = Date.now();
          if (now - this.lastSelectRangeCall > this.SELECT_RANGE_THROTTLE) {
            this.selectRange(this.dragStartIndex, this.dragEndIndex);
            this.lastSelectRangeCall = now;
          }
        }
      }
    }
  };

  // Handle mouse up to end drag
  private onMouseUp = (event: MouseEvent) => {
    // Clean up
    this.mouseDownPosition = null;

    // Remove event listeners
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);

    // Clear cached rows
    this.cachedTableRows = null;

    // Nếu đã drag, đảm bảo maps được update sau khi kết thúc drag
    if (this.wasDragOperation && this.multiSelectMode) {
      // Update maps một lần nữa để đảm bảo UI được update
      this.updateRowSelectionMap();
      this.updateRowClassMap();
      this.cdr.markForCheck();
    }

    // Reset dragging state after a short delay to allow click event to check wasDragOperation
    setTimeout(() => {
      this.isDragging = false;
      this.dragStartIndex = -1;
      this.dragEndIndex = -1;
      this.dragStartRow = null;
      this.mouseDownRow = null;
      this.hasMoved = false;
      this.wasDragOperation = false;
      this.cdr.markForCheck();
    }, 100);
  };

  // Select range of rows between start and end index (tối ưu: sử dụng Set để tránh duplicate check)
  private selectRange(startIndex: number, endIndex: number) {
    const start = performance.now();
    if (!this.multiSelectMode || startIndex < 0 || endIndex < 0) return;

    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);

    // Tối ưu: Sử dụng selectedRowsMap để check nhanh hơn
    const rowsToAdd: any[] = [];
    for (let i = minIndex; i <= maxIndex; i++) {
      if (i >= 0 && i < this.rows.length) {
        const row = this.rows[i];
        const key = this.getRowKey(row);

        // Check nhanh bằng Map
        if (!this.selectedRowsMap.has(key)) {
          rowsToAdd.push(row);
          this.selectedRowsMap.set(key, row);
        }
      }
    }

    // Batch add để tránh nhiều lần emit
    if (rowsToAdd.length > 0) {
      this.selectedRows.push(...rowsToAdd);

      // Update pre-computed maps
      this.updateRowSelectionMap();
      this.updateRowClassMap();

      this.selectedRowsChange.emit([...this.selectedRows]);
      // Chỉ markForCheck thay vì detectChanges
      this.cdr.markForCheck();
      this.cdr.detectChanges();

    }
  }

  // Toggle select all rows
  toggleSelectAll(event: any) {
    if (!this.multiSelectMode) return;

    const checked = event.target.checked;
    if (checked) {
      // Select all rows
      this.selectedRows = [...this.rows];
      this.updateSelectedRowsMap();
    } else {
      // Deselect all rows
      this.selectedRows = [];
      this.selectedRowsMap.clear();
    }

    // Update pre-computed maps
    this.updateRowSelectionMap();
    this.updateRowClassMap();

    this.selectedRowsChange.emit([...this.selectedRows]);
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  // Check if all rows are selected
  areAllRowsSelected(): boolean {
    if (!this.multiSelectMode || !this.rows || this.rows.length === 0) {
      return false;
    }
    return this.selectedRows.length === this.rows.length && this.rows.length > 0;
  }

  // TrackBy function để tối ưu ngFor
  trackByRow(index: number, row: any): any {
    return row.id || row.sid || row.call_id || row.callId || index;
  }

  trackByColumn(index: number, col: any): any {
    return col.key;
  }

  // Pre-compute row classes cho tất cả rows (đồng thời cập nhật rowClassByIndex để template highlight đúng)
  private updateRowClassMap(): void {
    this.rowClassMap.clear();
    if (!this.rows || this.rows.length === 0) {
      this.rowClassByIndex = [];
      this.rowMeta = [];
      return;
    }

    this.rowClassByIndex = [];
    this.rows.forEach(row => {
      const key = this.getRowKey(row);
      let result = '';

      // If custom rowClass is provided from parent, use it
      if (this.rowClass) {
        if (typeof this.rowClass === 'function') {
          result = this.rowClass(row) || '';
        } else {
          result = this.rowClass || '';
        }
      }
      // Also check for selected row if in select mode
      if ((this.selectMode || this.multiSelectMode) && this.rowSelectionMap.get(key)) {
        result = result ? `${result} selected-row` : 'selected-row';
      }

      this.rowClassMap.set(key, result);
      this.rowClassByIndex.push(result);
    });

    this.updateRowMeta();
    this.cdr.detectChanges();
  }

  // Pre-compute row tooltips cho tất cả rows
  private updateRowTooltipMap(): void {
    const start = performance.now();
    this.rowTooltipMap.clear();
    if (!this.rows || this.rows.length === 0) {
      this.rowTooltipByIndex = [];
      this.rowMeta = [];
      return;
    }

    this.rows.forEach(row => {
      const key = this.getRowKey(row);
      let result = '';
      if (this.rowTooltip && typeof this.rowTooltip === 'function') {
        result = this.rowTooltip(row) || '';
      }
      this.rowTooltipMap.set(key, result);
    });

    this.rowTooltipByIndex = this.rows.map(row => this.rowTooltipMap.get(this.getRowKey(row)) || '');
    this.updateRowMeta();
  }

  // Get row class từ pre-computed map (được gọi trong template)
  getRowClass = (row: any): string => {
    const key = this.getRowKey(row);
    const result = this.rowClassMap.get(key) || '';
    // Debug log để kiểm tra
    if (this.selectMode && this.rowSelectionMap.get(key)) {
    }
    return result;
  }

  // Get row tooltip từ pre-computed map (được gọi trong template)
  getRowTooltip = (row: any): string => {
    const key = this.getRowKey(row);
    const result = this.rowTooltipMap.get(key) || '';
    // Uncomment để debug nếu cần:
    // console.log(`[${Date.now()}] getRowTooltip called for row:`, key);
    return result;
  }

  /**
   * Lấy storage key dựa trên pathname và prefix
   */
  private getStorageKey(): string {
    const path = window.location.pathname;
    return this.prefix ? `${path}_${this.prefix}` : path;
  }

  saveDisplayedColumn() {
    const storageKey = this.getStorageKey();

    // Đọc map hiện tại trong localStorage
    const key = 'datatable-column-order-map';
    const storedMap = JSON.parse(localStorage.getItem(key) || '{}');

    // Cập nhật lại map cho màn hình hiện tại với prefix
    storedMap[storageKey] = this.displayedColumns.map(c => c.key);

    // Ghi lại toàn bộ map
    localStorage.setItem(key, JSON.stringify(storedMap));
  }

  /**
   * Kiểm tra xem rows có phải là array hợp lệ không
   * Sử dụng trong template vì không thể dùng Array.isArray() trực tiếp
   */
  isValidRowsArray(): boolean {
    return Array.isArray(this.rows);
  }

  ngOnDestroy(): void {
    if (this.bound_multi_select_shortcut_keys.length > 0) {
      CommonFunc.unbindMousetrapShortcuts(this.bound_multi_select_shortcut_keys);
      this.bound_multi_select_shortcut_keys = [];
    }
    // Clean up drag event listeners
    if (this.isDragging) {
      document.removeEventListener('mousemove', this.onMouseMove);
      document.removeEventListener('mouseup', this.onMouseUp);
    }

    // Clean up resize listener
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    if (this.sticky_left_resize_observer) {
      this.sticky_left_resize_observer.disconnect();
      this.sticky_left_resize_observer = null;
    }
    if (this.sticky_left_raf_id != null) {
      cancelAnimationFrame(this.sticky_left_raf_id);
      this.sticky_left_raf_id = null;
    }

    // Clean up keydown listener
    if (this.keydownHandler && this.datatableBodyElement) {
      this.datatableBodyElement.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
      this.datatableBodyElement = null;
    }

    // Clear timeouts
    if (this.columnWidthTimeout) {
      clearTimeout(this.columnWidthTimeout);
      this.columnWidthTimeout = null;
    }
    if (this.searchColumnDebounceTimeout) {
      clearTimeout(this.searchColumnDebounceTimeout);
      this.searchColumnDebounceTimeout = null;
    }
    if (this.rowsChangeDebounceTimeout) {
      clearTimeout(this.rowsChangeDebounceTimeout);
      this.rowsChangeDebounceTimeout = null;
    }

    // Clear all caches
    this.cachedColumnWidths.clear();
    this.rowClassMap.clear();
    this.rowTooltipMap.clear();
    this.rowSelectionMap.clear();
    this.selectedRowsMap.clear();
    this.cachedTableRows = null;

    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  onSort(col: any) {
    if (!this.enableSort) return;

    if (this.sortColumn !== col.key) {
      // Click cột mới
      this.sortColumn = col.key;
      this.sortDirection = 'asc';
    } else {
      // Toggle asc <-> desc
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    }

    this.applySort(this.sortColumn, this.sortDirection);
  }

  /**
   * So sánh 2 mảng columns để kiểm tra có thay đổi không
   * Bỏ qua các properties có thể gây circular reference như TemplateRef, functions
   * Chỉ so sánh các properties quan trọng: key, width, minWidth, visible, name, etc.
   */
  private hasColumnsChanged(newColumns: any[], oldColumns: any[]): boolean {
    if (newColumns.length !== oldColumns.length) {
      return true;
    }

    for (let i = 0; i < newColumns.length; i++) {
      const newCol = newColumns[i];
      const oldCol = oldColumns[i];

      // So sánh key (phải giống nhau)
      if (newCol.key !== oldCol.key) {
        return true;
      }

      // So sánh các properties quan trọng (bỏ qua cellTemplate, headerTemplate, etc.)
      const propertiesToCompare = ['width', 'minWidth', 'visible', 'name', 'sortable', 'right', 'center'];

      for (const prop of propertiesToCompare) {
        if (newCol[prop] !== oldCol[prop]) {
          return true;
        }
      }
    }

    return false;
  }

}
