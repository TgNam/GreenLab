import { ChangeDetectorRef, Component, ContentChild, OnInit, OnDestroy, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { CoreConfigService } from '@core/services/config.service';
import { ToastrService } from 'ngx-toastr';
import { CoreTranslationService } from '@core/services/translation.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponent } from 'app/main/services/base.component';
import { BaseQueryParamService } from 'app/main/services/base-query-param.service';
import { EmailTemplateService } from '../email-template.service';
import { DomSanitizer, SafeHtml, Title } from '@angular/platform-browser';
declare const feather: any;

@Component({
  selector: 'app-email-template-list',
  templateUrl: './email-template-list.component.html',
  styleUrls: ['./email-template-list.component.scss']
})
export class EmailTemplateListComponent extends BaseComponent implements OnInit, OnDestroy {
  public rows = [];
  public formattedRows;
  public selectedOption = 50;
  public ColumnMode = ColumnMode;
  public searchValue = '';
  public page = 1;
  public total = 0;
  public totalPage = 0;
  public createdFrom = null;
  public createdTo = null;

  public selectedType: string | null = null;
  public selectedStatus: boolean | null = null;
  public showAdvancedSearch = false;
  public isSearching = false;

  public selectedTemplate = null;
  public modalMode: 'view' | 'edit' = 'view';
  public showModal = false;
  public showCreateModal = false;
  public updating = false;
  public creating = false;
  public newTemplate = {
    name: '',
    type: '',
    active: true,
    content: ''
  };

  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('idTemplate', { static: true }) idTemplate!: TemplateRef<any>;
  @ViewChild('nameTemplate', { static: true }) nameTemplate!: TemplateRef<any>;
  @ViewChild('typeTemplate', { static: true }) typeTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<any>;
  @ViewChild('createTimeTemplate', { static: true }) createTimeTemplate!: TemplateRef<any>;
  @ViewChild('actionTemplate', { static: true }) actionTemplate!: TemplateRef<any>;

  public columns = [];
  private tempData = [];
  private _unsubscribeAll: Subject<any>;

  statusOptions = [
    { label: 'Hoạt động', value: true },
    { label: 'Ngừng hoạt động', value: false }
  ];

  typeOptions: { label: string; value: string }[] = [];

  sizeOptions = [
    { label: '10', value: 10 },
    { label: '50', value: 50 },
    { label: '100', value: 100 }
  ];

  constructor(
    protected activatedRoute: ActivatedRoute,
    protected queryParamService: BaseQueryParamService,
    private cdr: ChangeDetectorRef,
    private _coreConfigService: CoreConfigService,
    private toastr: ToastrService,
    protected titleService: Title,
    private translate: CoreTranslationService,
    private router: Router,
    private emailTemplateService: EmailTemplateService,
    private sanitizer: DomSanitizer
  ) {
    super(activatedRoute, queryParamService, undefined);
    this._unsubscribeAll = new Subject();
  }

  async ngOnInit(): Promise<void> {
    try {
      this.titleService.setTitle('Quản lý mẫu email');
      // Initialize type options from service
      this.typeOptions = await this.emailTemplateService.getEmailTemplateTypes();
    } catch (error) {
      console.error('Error loading email template types:', error);
      // Fallback to empty array if API fails
      this.typeOptions = [];
    }

    // Subscribe to query params (load from URL, sync on browser back/forward)
    this.activatedRoute.queryParams.pipe(takeUntil(this._unsubscribeAll)).subscribe(params => {
      this.page = Math.max(Number(params['page']) || 1, 1);
      this.selectedOption = Number(params['size']) || 50;
      this.searchValue = params['name'] || '';
      this.createdFrom = params['from_time'] || null;
      this.createdTo = params['to_time'] || null;
      this.selectedType = params['type'] || null;
      if (params['active'] !== undefined && params['active'] !== '') {
        this.selectedStatus = params['active'] === 'true' || params['active'] === true;
      } else {
        this.selectedStatus = null;
      }

      const config = this._coreConfigService.config.value;
      const doFetch = () => this.doFetchPage();
      if (config?.layout?.animation === 'zoomIn') {
        setTimeout(doFetch, 450);
      } else {
        doFetch();
      }
    });
  }

  transform(value: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }

  ngAfterViewInit(): void {
    this.translate.onLangChange(event => {
      this.setColumn()
    });
    this.setColumn()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  setColumn() {
    this.columns = [
      // { name: 'ID', key: 'id', width: '10%', minWidth: 80, cellTemplate: this.idTemplate },
      { name: 'Tên mẫu', key: 'name', width: '25%', minWidth: 200, cellTemplate: this.nameTemplate },
      { name: 'Loại', key: 'type', width: '25%', minWidth: 120, cellTemplate: this.typeTemplate },
      { name: 'Trạng thái', key: 'active', width: '15%', minWidth: 120, cellTemplate: this.statusTemplate },
      { name: 'Thời gian', key: 'createTime', width: '20%', minWidth: 150, cellTemplate: this.createTimeTemplate },
      { name: 'Hành động', key: 'action', width: '15%', minWidth: 150, cellTemplate: this.actionTemplate },
    ];
    this.cdr.detectChanges();
  }

  // Filter functions
  filterUpdate(event, type) {
    if (type === 'name') {
      this.searchValue = event;
    } else if (type === 'type') {
      this.selectedType = event;
    } else if (type === 'status') {
      this.selectedStatus = event;
    } else if (type === 'from_time') {
      this.createdFrom = event;
    } else if (type === 'to_time') {
      this.createdTo = event;
    }
  }

  toggleAdvancedSearch() {
    this.showAdvancedSearch = !this.showAdvancedSearch;
  }

  pushQueryParams(): void {
    const params: Record<string, any> = {
      page: this.page,
      size: this.selectedOption
    };
    if (this.searchValue) params['name'] = this.searchValue;
    if (this.createdFrom) params['from_time'] = this.createdFrom;
    if (this.createdTo) params['to_time'] = this.createdTo;
    if (this.selectedType) params['type'] = this.selectedType;
    if (this.selectedStatus !== null && this.selectedStatus !== undefined) params['active'] = this.selectedStatus;

    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: params,
      replaceUrl: true
    });
  }

  onPageChange(newPage: number) {
    this.page = newPage;
    this.fetchPage();
  }

  onPageSizeChange(event) {
    this.selectedOption = event;
    this.page = 1;
    this.fetchPage();
  }

  fetchPage() {
    this.isSearching = true;
    this.pushQueryParams();
    this.doFetchPage();
  }

  private doFetchPage() {
    this.emailTemplateService.getDataTableRows(
      this.page,
      this.selectedOption,
      null, // id
      this.createdFrom,
      this.createdTo,
      this.searchValue,
      this.selectedType,
      this.selectedStatus
    ).then((data) => {
      this.rows = data;
      this.tempData = data;
      this.total = this.emailTemplateService.totalCount;
      this.totalPage = this.emailTemplateService.totalPage;
    }).catch((error) => {
      console.error('Error fetching email templates:', error);
      this.toastr.error('Có lỗi xảy ra khi tải danh sách mẫu email!');
    }).finally(() => {
      this.isSearching = false;
    });
  }

  resetFilters() {
    this.searchValue = '';
    this.createdFrom = null;
    this.createdTo = null;
    this.selectedType = null;
    this.selectedStatus = null;
    this.fetchPage();
  }

  // Modal functions
  openModal(template, mode: 'view' | 'edit') {
    this.selectedTemplate = { ...template }; // Create a copy to avoid direct mutation
    this.modalMode = mode;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedTemplate = null;
  }

  openModalCreate() {
    this.newTemplate = {
      name: '',
      type: '',
      active: true,
      content: ''
    };
    this.showCreateModal = true;
  }

  closeModalCreate() {
    this.showCreateModal = false;
  }

  // Action functions
  viewTemplate(template) {
    this.openModal(template, 'view');
  }

  editTemplate(template) {
    this.openModal(template, 'edit');
  }

  toggleStatus(template, newStatus?: boolean) {
    // If called from app-switch component with new status value
    if (newStatus !== undefined) {
      template.active = newStatus;
      this.emailTemplateService.toggleEmailTemplateStatus(template.id, newStatus)
        .then(() => {
          this.toastr.success('Cập nhật trạng thái thành công!');
        })
        .catch((error) => {
          console.error('Error updating status:', error);
          this.toastr.error('Có lỗi xảy ra khi cập nhật trạng thái!');
          // Revert the change on error
          template.active = !newStatus;
        });
      return;
    }

    // Direct toggle without confirmation modal
    const originalStatus = template.active;
    const newActive = !template.active;
    template.active = newActive;
    this.emailTemplateService.toggleEmailTemplateStatus(template.id, newActive)
      .then(() => {
        this.toastr.success('Cập nhật trạng thái thành công!');
      })
      .catch((error) => {
        console.error('Error updating status:', error);
        this.toastr.error('Có lỗi xảy ra khi cập nhật trạng thái!');
        // Revert the change on error
        template.active = originalStatus;
      });
  }

  async saveTemplate() {
    try {
      this.updating = true;
      await this.emailTemplateService.updateEmailTemplate(this.selectedTemplate);
      this.toastr.success('Lưu mẫu email thành công!');
      this.closeModal();
      this.fetchPage();
    } catch (error) {
      console.error('Error saving template:', error);
      this.toastr.error('Có lỗi xảy ra khi lưu mẫu email!');
    } finally {
      this.updating = false;
    }
  }

  async createTemplate() {
    try {
      this.creating = true;
      await this.emailTemplateService.createEmailTemplate(this.newTemplate);
      this.toastr.success('Tạo mẫu email thành công!');
      this.closeModalCreate();
      this.fetchPage();
    } catch (error) {
      console.error('Error creating template:', error);
      this.toastr.error('Có lỗi xảy ra khi tạo mẫu email!');
    } finally {
      this.creating = false;
    }
  }

  // Utility functions
  getTypeLabel(type: string): string {
    const option = this.typeOptions.find(opt => opt.value === type);
    return option ? option.label : type;
  }

  getStatusLabel(active: boolean): string {
    const option = this.statusOptions.find(opt => opt.value === active);
    return option ? option.label : 'Không xác định';
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('vi-VN');
  }
}
