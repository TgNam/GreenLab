import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, ViewChild, TemplateRef, ChangeDetectorRef } from '@angular/core';
import { CoreTranslationService } from '@core/services/translation.service';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

export interface LogViewApi {
  getActionTypes: () => Promise<any>;
  getLogs: (targetId: any) => Promise<any[]>;
  getDetailChanges: (logId: string) => Promise<any>;
}

@Component({
  selector: 'app-common-log-view-popup',
  templateUrl: './common-log-view-popup.component.html',
  styleUrls: ['./common-log-view-popup.component.scss']
})
export class CommonLogViewPopupComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() targetId: string | number | null = null;
  @Input() logApi: LogViewApi | null = null;
  @Input() logs: any[] = [];
  @Input() subLog = false;
  @Output() close = new EventEmitter<void>();

  @ViewChild('timeTemplate') timeTemplate!: TemplateRef<any>;
  @ViewChild('actionTemplate') actionTemplate!: TemplateRef<any>;
  @ViewChild('userTemplate') userTemplate!: TemplateRef<any>;
  @ViewChild('changesTemplate') changesTemplate!: TemplateRef<any>;
  @ViewChild('ipTemplate') ipTemplate!: TemplateRef<any>;
  @ViewChild('descriptionTemplate') descriptionTemplate!: TemplateRef<any>;

  public rows: any[] = [];
  public filteredRows: any[] = [];
  public paginatedRows: any[] = [];
  public page = 1;
  public pageSize = 10;
  public total = 0;
  public totalPage = 0;
  public selectedOption = 10;
  public sizeOptions = [10, 20, 50, 100];
  public tableColumns: any[] = [];

  public keyword = '';
  public selectedAction: string | null = null;
  public actionOptions: any[] = [];
  public actionTypesMap: Map<string, string> = new Map();
  public actionNameMap: Map<string, string> = new Map();

  public sortColumn = 'create_time';
  public sortDirection: 'asc' | 'desc' = 'desc';

  public jsonModalVisible = false;
  public jsonData: any = null;
  public loading = false;

  @BlockUI('log-view-block') sectionBlockUI: NgBlockUI;

  public onApplySortFN: (column: string, direction: 'asc' | 'desc') => void;
  public onPageChangeFN: (page: number) => void;
  public onPageSizeChangeFN: (pageSize: number) => void;

  constructor(
    private translate: CoreTranslationService,
    private cdr: ChangeDetectorRef
  ) {
    this.onApplySortFN = this.onApplySort.bind(this);
    this.onPageChangeFN = this.onPageChange.bind(this);
    this.onPageSizeChangeFN = this.onPageSizeChange.bind(this);
  }

  ngOnInit(): void {
    this.loadActionTypes();
    this.initColumns();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && changes['visible'].currentValue) {
      this.initColumns();
      this.loadLogs().then(() => {
        this.cdr.markForCheck();
      });
    }
    if (changes['logs'] && changes['logs'].currentValue) {
      this.logs = changes['logs'].currentValue;
      console.log('logs', this.logs);
      if (this.subLog) {
        this.initColumns();
        this.loadLogs().then(() => {
          this.cdr.markForCheck();
        });
      }
    }
    if (changes['visible'] && !changes['visible'].currentValue) {
      this.rows = [];
      this.filteredRows = [];
      this.paginatedRows = [];
      this.total = 0;
      this.totalPage = 0;
      this.page = 1;
    }
  }

  onSelectClose(): void {
    const modalContent = document.querySelector('.modal-content');
    const modalBody = document.querySelector('.modal-body');
    if (modalContent) modalContent.classList.remove('modal-content-no-overflow');
    if (modalBody) modalBody.classList.remove('modal-body-scroll');
  }

  initColumns(): void {
    this.tableColumns = [
      {
        key: 'create_time',
        name: this.translateWithFallback('LOG.COLUMNS_TIME', 'Thời gian'),
        cellTemplate: this.timeTemplate,
        minWidth: 150,
        visible: true
      },
      {
        key: 'description',
        name: this.translateWithFallback('LOG.COLUMNS_DESCRIPTION', 'Mô tả'),
        cellTemplate: this.descriptionTemplate,
        minWidth: 400,
        visible: true
      },
      {
        key: 'changes',
        name: this.translateWithFallback('LOG.COLUMNS_CHANGES', 'Thao tác'),
        cellTemplate: this.changesTemplate,
        minWidth: 150,
        visible: true
      }
    ];
  }

  async loadActionTypes(): Promise<void> {
    try {
      if (!this.logApi?.getActionTypes) {
        this.initActionOptionsFallback();
        return;
      }

      const actionTypes: any = await this.logApi.getActionTypes();
      this.actionTypesMap.clear();
      this.actionNameMap.clear();
      this.actionOptions = [{ label: this.translateWithFallback('LOG.ACTION.ALL', 'Tất cả'), value: null }];

      if (actionTypes && typeof actionTypes === 'object') {
        Object.entries(actionTypes).forEach(([vietnameseName, enumValue]: [string, any]) => {
          const enumName = typeof enumValue === 'string'
            ? enumValue
            : (enumValue?.name ?? String(enumValue));
          this.actionTypesMap.set(enumName, vietnameseName);
          this.actionNameMap.set(vietnameseName, enumName);
          this.actionOptions.push({ label: vietnameseName, value: enumName });
        });
      }

      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading action types:', error);
      this.initActionOptionsFallback();
    }
  }

  onSelectOpen(): void {
    setTimeout(() => {
    const panel = document.querySelector('.ng-dropdown-panel:last-child');
      if (panel) {
        panel.classList.add('log-dropdown-panel');
      }
    }, 100);
  }

  initActionOptionsFallback(): void {
    this.actionOptions = [
      { label: this.translateWithFallback('LOG.ACTION.ALL', 'Tất cả'), value: null },
      { label: 'Tạo', value: 'CREATE' },
      { label: 'Cập nhật', value: 'UPDATE' },
      { label: 'Xóa', value: 'DELETE' },
      { label: 'Xuất', value: 'EXPORT' },
      { label: 'Nhập', value: 'IMPORT' },
      { label: 'Khác', value: 'OTHER' }
    ];
    ['CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'IMPORT', 'OTHER'].forEach(
      (e, i) => this.actionTypesMap.set(e, this.actionOptions[i + 1].label)
    );
  }

  getActionName(actionEnum: string): string {
    return actionEnum ? (this.actionTypesMap.get(actionEnum) || actionEnum) : '-';
  }

  async loadLogs(): Promise<void> {
    const id = this.targetId != null ? this.targetId : null;
    if(this.subLog) {
      this.rows = this.logs;
      this.applyFilters();
      return;
    }
    if (id == null) {
      this.rows = [];
      this.applyFilters();
      return;
    }

    if (!this.logApi?.getLogs) {
      this.rows = [];
      this.applyFilters();
      return;
    }

    this.loading = true;
    this.sectionBlockUI?.start();
    try {
      const logs = await this.logApi.getLogs(id);
      this.rows = logs || [];
      this.applyFilters();
    } catch (error) {
      console.error('Error loading logs:', error);
      this.rows = [];
      this.applyFilters();
    } finally {
      this.loading = false;
      this.sectionBlockUI?.stop();
      this.cdr.markForCheck();
    }
  }

  applyFilters(): void {
    let filtered = [...this.rows];
    if (this.selectedAction) filtered = filtered.filter(log => log.action === this.selectedAction);

    if (this.keyword && this.keyword.trim()) {
      const k = this.keyword.toLowerCase().trim();
      filtered = filtered.filter(log =>
        (log.description || '').toLowerCase().includes(k) ||
        (log.actor?.username || '').toLowerCase().includes(k) ||
        log.changes?.some((c: any) => (c.field || '').toLowerCase().includes(k))
      );
    }

    filtered = this.sortData(filtered);
    this.filteredRows = filtered;
    this.total = filtered.length;
    this.totalPage = Math.ceil(this.total / this.pageSize) || 1;
    this.page = 1;
    this.updatePaginatedRows();
  }

  private updatePaginatedRows(): void {
    this.paginatedRows = this.filteredRows;
  }

  sortData(data: any[]): any[] {
    return [...data].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (this.sortColumn) {
        case 'create_time':
          aVal = new Date(a.create_time).getTime();
          bVal = new Date(b.create_time).getTime();
          break;
        case 'action':
          aVal = a.action || '';
          bVal = b.action || '';
          break;
        case 'username':
          aVal = a.actor?.username || '';
          bVal = b.actor?.username || '';
          break;
        case 'description':
          aVal = a.description || '';
          bVal = b.description || '';
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  onKeywordChange(): void {
    this.applyFilters();
  }

  onActionChange(): void {
    this.applyFilters();
  }

  onClose(): void {
    this.close.emit();
    this.keyword = '';
    this.selectedAction = null;
    this.sortColumn = 'create_time';
    this.sortDirection = 'desc';
  }

  onCancel(): void {
    this.jsonModalVisible = false;
  }

  async getDetailChanges(logId: string): Promise<void> {
    if (!logId || !this.logApi?.getDetailChanges) return;

    try {
      const changes = await this.logApi.getDetailChanges(logId);
      this.jsonData = changes || [];
      this.jsonModalVisible = true;
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error loading detail changes:', error);
      this.jsonData = [];
      this.jsonModalVisible = false;
      this.cdr.markForCheck();
    }
  }

  onPageChange(page: number): void {
    this.page = page;
    this.updatePaginatedRows();
  }

  onPageSizeChange(pageSize: number): void {
    this.selectedOption = pageSize;
    this.pageSize = pageSize;
    this.page = 1;
    this.totalPage = Math.ceil(this.total / this.pageSize) || 1;
    this.updatePaginatedRows();
  }

  onApplySort(column: string, direction: 'asc' | 'desc'): void {
    this.sortColumn = column;
    this.sortDirection = direction;
    this.applyFilters();
  }

  translateWithFallback(key: string, fallback: string): string {
    const t = this.translate.instant(key);
    return t && t !== key ? t : fallback;
  }
}

