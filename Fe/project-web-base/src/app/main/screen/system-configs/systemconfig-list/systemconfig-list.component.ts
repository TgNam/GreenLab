import { AfterViewInit, ChangeDetectorRef, Component, OnInit, OnDestroy, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CoreConfigService } from '@core/services/config.service';
import { CoreSidebarService } from '@core/components/core-sidebar/core-sidebar.service';
import { CoreTranslationService } from '@core/services/translation.service';

import { ToastrService } from 'ngx-toastr';
import { SystemConfigService } from '../systemconfig.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-systemconfig-list',
  templateUrl: './systemconfig-list.component.html',
  styleUrls: ['./systemconfig-list.component.scss'],
})
export class SystemConfigListComponent implements OnInit, AfterViewInit, OnDestroy {
  public rows: any[] = [];

  public isCreating = false;
  public isUpdating = false;

  // Templates for dynamic table
  @ViewChild('idTemplate', { static: true }) idTemplate!: TemplateRef<any>;
  @ViewChild('infoTemplate', { static: true }) infoTemplate!: TemplateRef<any>;
  @ViewChild('valueTemplate', { static: true }) valueTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<any>;
  @ViewChild('timeTemplate', { static: true }) timeTemplate!: TemplateRef<any>;
  @ViewChild('actionTemplate', { static: true }) actionTemplate!: TemplateRef<any>;
  public columns = [];

  // modal update/view
  public showModal = false;
  public modalMode: 'view' | 'edit' = 'view';
  public selectedAdmin: any = null;

  // modal create
  public showModalCreate = false;

  // advanced search
  public showAdvancedSearch = false;
  public isSearching = false;

  // confirm modal
  confirmVisible = false;
  confirmType: 'danger' | 'primary' = 'danger';
  confirmMessage = '';
  confirmHeader = '';
  confirmAction: (() => void) | null = null;

  private deleteTargetKey: string | null = null;

  public total = 0;
  public totalPage: any = 0;
  public page = 1;
  public selectedOption = 50;

  public filters = {
    page: 1,
    size: 50,

    id: null as number | null,
    name: '',
    value: '',
    key: null as string | null,

    isActive: null as boolean | null,

    timeType: 0 as number, // 0: createdTime, 1: updatedTime
    timeFrom: null as string | null, // 'yyyy-MM-dd'
    timeTo: null as string | null
  };

  // Properties for date picker (string format - same as admin screen)
  public timeFrom: string | null = null; // 'yyyy-MM-dd'
  public timeTo: string | null = null; // 'yyyy-MM-dd'

  keyList: any[] = [];
  keyOptions: any[] = [];
  timeOpts: any[] = [];
  statusOptions: any[] = [];
  sizeOptions: any[] = [
    { label: '50', value: 50 },
    { label: '100', value: 100 },
    { label: '200', value: 200 },
    { label: '500', value: 500 }
  ];

  private _unsubscribeAll: Subject<any>;
  public resetPage = false;
  private previousParams: any = null;
  public layoutAnimation = null;
  private skipNextFetch = false;

  constructor(
    private _systemConfigService: SystemConfigService,
    private _coreSidebarService: CoreSidebarService,
    private _coreConfigService: CoreConfigService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private translate: CoreTranslationService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title
  ) {
    this._unsubscribeAll = new Subject();
    this.initOptions();
  }

  initOptions() {
    this.timeOpts = [
      { label: this.translate.instant('COMMON.CREATED_TIME'), value: 0 },
      { label: this.translate.instant('COMMON.UPDATED_TIME'), value: 1 }
    ];

    this.statusOptions = [
      { label: this.translate.instant('COMMON.ACTIVE'), value: true },
      { label: this.translate.instant('COMMON.INACTIVE'), value: false }
    ];
  }

  showSuccessToast(message: string, title?: string) {
    const successTitle = title || this.translate.instant('COMMON.SUCCESS');
    this.toastr.success(message, successTitle);
  }

  showErrorToast(message: string, title?: string) {
    const errorTitle = title || this.translate.instant('COMMON.FAILED');
    this.toastr.error(message, errorTitle);
  }

  getSystemConfigKeyset(): void {
    this._systemConfigService.getSystemConfigKeys().subscribe(
        (data: any[]) => {
            this.keyList = data;
            this.keyOptions = [
              ...data.map(k => ({ label: k.name, value: k.name }))
            ];
        },
        (error) => {

        }
    );
  }

  getUnusedKeyset(): void {
    this._systemConfigService.getUnusedKeyList().subscribe(
        (data: any[]) => {
            this.keyList = data;
            this.keyOptions = [
              ...data.map(k => ({ label: k.name, value: k.name }))
            ];
        },
        (error) => {

        }
    );
  }
  
  

  fetchPage() {
    // Bật loading state
    this.isSearching = true;
    
    const {
      page,
      size,
      id,
      name,
      value,
      key,
      isActive,
      timeType,
      timeFrom,
      timeTo
    } = this.filters;

    const fromMs = timeFrom ? new Date(timeFrom).getTime() : 0;
    const toMs = timeTo ? new Date(timeTo).getTime() : 0;

    // Validate: timeTo < timeFrom
    if (fromMs > 0 && toMs > 0 && toMs < fromMs) {
      this.showErrorToast(
        this.translate.instant('SYSTEMCONFIG.ERROR_TIME_RANGE'),
        this.translate.instant('SYSTEMCONFIG.ERROR_TITLE')
      );
      this.isSearching = false;
      return;
    }

    const params: any = {};
    if (this.resetPage) {
      this.filters.page = 1;
      this.page = 1;
    }
    if (this.filters.page) params.page = Number(this.filters.page);
    
    this.resetPage = false;
    if (timeType != 0 && timeType != 1) {
      this.filters.timeType = 0;
    }
    params.timeType = Number(this.filters.timeType);
    if (size) params.size = Number(size);
    if (id) params.id = Number(id);
    if (name) params.name = String(name);
    if (value) params.value = String(value);
    if (key) params.key = String(key);
    else if (key === '') delete params.key;
    if (isActive != null) params.isActive = Boolean(isActive);
    if (timeFrom) params.timeFrom = String(timeFrom);
    if (timeTo) params.timeTo = String(timeTo);
    
    // Update URL with params
    const navigationExtras = {
      onSameUrlNavigation: 'reload' as const
    };
    this.router.navigate([], {
      ...navigationExtras,
      queryParams: params,
      replaceUrl: true
    });

    // Call API directly to fetch data - pass string và timeType
    this._systemConfigService.getDataTableRows(
      this.filters.page || 1,
      size || 50,
      id ? Number(id) : null,
      timeFrom,
      timeTo,
      name,
      value,
      key,
      null,
      isActive,
      this.filters.timeType
    ).catch((error) => {
      // Tắt loading nếu có lỗi (onSystemConfigListChange sẽ không emit khi có lỗi)
      this.isSearching = false;
    });
  }

  parseNum(v: any): number | null {
    const n = Number(v);
    return isNaN(n) ? null : n;
  }

  ngAfterViewInit(): void {
    this.translate.onLangChange(event => {
      console.log('Language changed to:', event.lang);
      this.initOptions();
      this.setColumn();
    });
    this.setColumn();
  }

  setColumn() {
    this.columns = [
      { name: 'STT', key: 'index', width: '3%', cellTemplate: this.idTemplate, visible: true },
      { name: this.translate.instant('SYSTEMCONFIG.CONFIG_NAME'), key: 'config_name', width: '25%', cellTemplate: this.infoTemplate, visible: true },
      { name: this.translate.instant('SYSTEMCONFIG.VALUE'), key: 'config_value', width: '20%', cellTemplate: this.valueTemplate, visible: true },
      { name: this.translate.instant('COMMON.STATUS'), key: 'status', width: '12%', cellTemplate: this.statusTemplate, visible: true },
      { name: this.translate.instant('COMMON.CREATED_TIME'), key: 'created_time', width: '22%', cellTemplate: this.timeTemplate, visible: true },
      { name: this.translate.instant('COMMON.OPERATION'), key: 'operation', width: '10%', cellTemplate: this.actionTemplate, visible: true },
    ];
    this.cdr.detectChanges();
  }

  onPageChange(newPage: number) {
    this.page = newPage;
    this.filters.page = newPage;
    this.fetchPage();
  }

  onPageSizeChange(newSize: any) {
    const val = parseInt(newSize, 10);
    if (!isNaN(val) && val > 0) {
      this.selectedOption = val;
      this.filters.size = val;
      this.filters.page = 1;
      this.page = 1;
      this.fetchPage();
    }
  }

  resetFilters() {
    this.resetPage = true;
    
    // Reset all filters to default values
    this.filters = {
      page: 1,
      size: 50,
      id: null,
      name: '',
      value: '',
      key: null,
      isActive: null,
      timeType: 0,
      timeFrom: null,
      timeTo: null
    };
    this.page = 1;
    this.selectedOption = 50;

    // Clear time inputs completely - same as admin screen
    this.timeFrom = null;
    this.timeTo = null;
    this.filters.timeFrom = null;
    this.filters.timeTo = null;
    
    // Set skipNextFetch to prevent queryParams subscription from calling API
    // We will call API directly after navigation
    this.skipNextFetch = true;

    // Reset URL params to empty
    this.router.navigate([], {
      queryParams: {},
      replaceUrl: true
    }).then(() => {
      // Call API directly after reset - this will fetch data with empty filters
      this.fetchPageAfterReset();
    });
  }

  fetchPageAfterReset() {
    // Bật loading state
    this.isSearching = true;
    
    const {
      page,
      size,
      id,
      name,
      value,
      key,
      isActive,
      timeType,
      timeFrom,
      timeTo
    } = this.filters;

    // Call API directly to fetch data with reset filters
    this._systemConfigService.getDataTableRows(
      page || 1,
      size || 50,
      id ? Number(id) : null,
      timeFrom,
      timeTo,
      name,
      value,
      key,
      null,
      isActive,
      timeType || 0
    ).then(() => {
      // Reset skipNextFetch flag after API call succeeds
      this.skipNextFetch = false;
    }).catch((error) => {
      // Tắt loading nếu có lỗi
      this.isSearching = false;
      // Reset skipNextFetch flag even if there's an error
      this.skipNextFetch = false;
    });
  }

  filterUpdate(event: any, type: string) {
    // app-form-input emits the value directly, not event.target.value
    switch (type) {
      case 'name':
        this.filters.name = (event || '').trim().toLowerCase();
        break;
      case 'value':
        this.filters.value = (event || '').trim().toLowerCase();
        break;
      case 'key':
        this.filters.key = event || null;
        break;
      case 'status':
        this.filters.isActive = event;
        break;
      case 'id':
        this.filters.id = (event !== null && event !== undefined && event !== '') ? Number(event) : null;
        break;
      case 'timeType':
        this.filters.timeType = event !== null && event !== undefined ? Number(event) : 0;
        break;
      case 'timeFrom':
        break;
      case 'timeTo':
        break;
    }
    this.filters.page = 1;
    this.page = 1;
  }

  onTimeTypeChange(event: any) {
    this.filters.timeType = event !== null && event !== undefined ? Number(event) : 0;
  }

  // Handle time changes from dynamic-table - same as admin screen
  onTimeFromChange(event: string | null) {
    this.timeFrom = event;
    this.filters.timeFrom = event;
  }

  onTimeToChange(event: string | null) {
    this.timeTo = event;
    this.filters.timeTo = event;
  }

  async openModal(row: any, mode: 'view' | 'edit') {
    this.selectedAdmin = { ...row };
    this.modalMode = mode;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedAdmin = null;
  }

  async updateSystemConfig(updated: any) {
    if (this.isUpdating) {
      return;
    }

    try {
      this.isUpdating = true;
      const response = await this._systemConfigService.updateSystemConfig(updated);
      const message = this.translate.instant('SYSTEMCONFIG.EDIT_SUCCESS');
      this.showSuccessToast(message);
      this.closeModal();
      
      // Cập nhật trực tiếp vào list thay vì gọi lại API
      const index = this.rows.findIndex(row => row.key === updated.key);
      if (index !== -1) {
        this.rows[index] = { ...this.rows[index], ...response };
        this.rows = [...this.rows]; // Trigger change detection
      }
    } catch (error) {
    } finally {
      this.isUpdating = false;
    }
  }

  async openModalCreate() {
    this.showModalCreate = true;
  }

  closeModalCreate() {
    this.showModalCreate = false;
  }

  async create(created: any) {
    if (this.isCreating) {
      return;
    }
    
    try {
      this.isCreating = true;
      await this._systemConfigService.create(created);
      const message = this.translate.instant('SYSTEMCONFIG.CREATE_SUCCESS');
      this.showSuccessToast(message);
      this.closeModalCreate();
      this.fetchPage();
    } catch (error) {
    } finally {
      this.isCreating = false;
    }
  }

  openConfirm(
    type: 'danger' | 'primary',
    header: string,
    message: string,
    action: () => void
  ) {
    this.confirmType = type;
    this.confirmHeader = header;
    this.confirmMessage = message;
    this.confirmAction = action;
    this.confirmVisible = true;
  }

  handleCancel() {
    this.confirmVisible = false;
    this.confirmAction = null;
    this.deleteTargetKey = null;
  }

  handleConfirm() {
    try {
      if (this.confirmAction) {
        this.confirmAction();
      }
    } catch (error) {
    } finally {
      this.confirmVisible = false;
      this.confirmAction = null;
    }
  }

  removeFunction(row: any) {
    this.deleteTargetKey = row.key;

    this.openConfirm(
      'danger',
      this.translate.instant('SYSTEMCONFIG.DELETE_HEADER'),
      this.translate.instant('SYSTEMCONFIG.CONFIRM_DELETE', { key: row.key }),
      () => {
        if (!this.deleteTargetKey) return;
        this._systemConfigService.delete(this.deleteTargetKey).then(() => {
          const message = this.translate.instant('SYSTEMCONFIG.DELETE_SUCCESS');
          this.showSuccessToast(message);
          this.deleteTargetKey = null;
          this.fetchPage();
        }).catch((error) => {
        });
      }
    );
  }

  toggleSidebar(name: string): void {
    this._coreSidebarService.getSidebarRegistry(name).toggleOpen();
  }

  toggleAdvancedSearch(): void {
    this.showAdvancedSearch = !this.showAdvancedSearch;
  }

  ngOnInit(): void {
    this.titleService.setTitle(
      this.translate.instant('SYSTEMCONFIG.TITLE') || 'Quản lý cấu hình hệ thống'
    );

    // Subscribe config change
    this._coreConfigService.config
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(config => {
        this.layoutAnimation = config.layout.animation;
      });

    // Subscribe system config list changes
    this._systemConfigService.onSystemConfigListChange
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(response => {
        if (Array.isArray(response)) {
          const currentPage = this.filters.page || this.page || 1;
          const pageSize = this.filters.size || this.selectedOption || 50;
          this.rows = response.map((row: any, index: number) => {
            return {
              ...row,
              stt: (currentPage - 1) * pageSize + index + 1
            };
          });
          this.total = this._systemConfigService.totalCount || 0;
          this.totalPage = this._systemConfigService.totalPage || 0;
          this.page = this.filters.page || this.page || 1;
        } else {
          this.rows = [];
        }
        // Tắt loading khi nhận được data
        this.isSearching = false;
      });

    // Load system config keys
    this.getSystemConfigKeyset();

    // Subscribe query params from URL
    this.activatedRoute.queryParams.subscribe(async params => {
      this.filters.page = this.parseNum(params['page']) || 1;
      this.page = this.filters.page;
      if (this.page < 1) {
        this.page = 1;
        this.filters.page = 1;
      }
      if (this.page > 10000) {
        this.page = 1;
        this.filters.page = 1;
      }
      
      const old = this.previousParams;
      this.previousParams = { ...params };
      if (old) {
        const keysToCheck = Object.keys(params).filter(k => k !== 'page' && k !== 't');
        if (keysToCheck.length > 0) {
          const changed = keysToCheck.some(k => params[k] != old[k]);
          if (changed) {
            params = { ...params, page: 1 };
            this.page = 1;
            this.filters.page = 1;
          }
        }
      }

      this.filters.size = this.sizeOptions.some(s => s.value == Number(params['size']))
        ? Number(params['size'])
        : 50;
      this.selectedOption = this.filters.size;

      this.filters.id = this.parseNum(params['id']);
      this.filters.name = params['name'] || '';
      this.filters.value = params['value'] || '';
      this.filters.key = params['key'] || null;
      this.filters.isActive = params['isActive'] === 'true'
        ? true
        : params['isActive'] === 'false'
          ? false
          : null;
      this.filters.timeType = params['timeType'] == 1 ? 1 : 0;
      this.filters.timeFrom = params['timeFrom'] || null;
      this.filters.timeTo = params['timeTo'] || null;
      // Sync with timeFrom and timeTo properties for dynamic-table binding
      this.timeFrom = this.filters.timeFrom;
      this.timeTo = this.filters.timeTo;

      // Skip fetch nếu đang reset filters
      if (this.skipNextFetch) {
        this.skipNextFetch = false;
        return;
      }

      const fetch = () => {
        const {
          page,
          size,
          id,
          name,
          value,
          key,
          isActive,
          timeType,
          timeFrom,
          timeTo
        } = this.filters;

        const fromMs = timeFrom ? new Date(timeFrom).getTime() : 0;
        const toMs = timeTo ? new Date(timeTo).getTime() : 0;

        // Validate: timeTo < timeFrom
        if (fromMs > 0 && toMs > 0 && toMs < fromMs) {
          this.showErrorToast(
            this.translate.instant('SYSTEMCONFIG.ERROR_TIME_RANGE'),
            this.translate.instant('SYSTEMCONFIG.ERROR_TITLE')
          );
          return;
        }

        this._systemConfigService.getDataTableRows(
          page,
          size,
          id ? Number(id) : null,
          timeFrom,
          timeTo,
          name,
          value,
          key,
          null,
          isActive,
          timeType
        );
      };

      if (this.layoutAnimation === 'zoomIn') {
        setTimeout(fetch, 450);
      } else {
        fetch();
      }
    });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }
}
