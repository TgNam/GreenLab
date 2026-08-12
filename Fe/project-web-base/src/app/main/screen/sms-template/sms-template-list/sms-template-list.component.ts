import { ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CoreConfigService } from '@core/services/config.service';
import { ToastrService } from 'ngx-toastr';
import { CoreTranslationService } from '@core/services/translation.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponent } from 'app/main/services/base.component';
import { BaseQueryParamService } from 'app/main/services/base-query-param.service';
import { SmsTemplateService } from '../sms-template.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-sms-template-list',
  templateUrl: './sms-template-list.component.html',
  styleUrls: ['./sms-template-list.component.scss']
})
export class SmsTemplateListComponent extends BaseComponent implements OnInit, OnDestroy {
  public rows = [];
  public selectedOption = 50;
  public ColumnMode = ColumnMode;
  public searchValue = '';
  public page = 1;
  public total = 0;
  public totalPage = 0;
  public createdFrom = null;
  public createdTo = null;

  public selectedType: string | null = null;
  public selectedRecipientType: string | null = null;
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
    recipientType: '',
    active: true,
    content: ''
  };

  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('nameTemplate', { static: true }) nameTemplate!: TemplateRef<any>;
  @ViewChild('typeTemplate', { static: true }) typeTemplate!: TemplateRef<any>;
  @ViewChild('recipientTypeTemplate', { static: true }) recipientTypeTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<any>;
  @ViewChild('createTimeTemplate', { static: true }) createTimeTemplate!: TemplateRef<any>;
  @ViewChild('actionTemplate', { static: true }) actionTemplate!: TemplateRef<any>;

  public columns = [];
  private _unsubscribeAll: Subject<any>;

  statusOptions = [
    { label: 'Hoạt động', value: true },
    { label: 'Ngừng hoạt động', value: false }
  ];

  typeOptions: { label: string; value: string }[] = [];
  recipientTypeOptions: { label: string; value: string }[] = [];

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
    private smsTemplateService: SmsTemplateService
  ) {
    super(activatedRoute, queryParamService, undefined);
    this._unsubscribeAll = new Subject();
  }

  async ngOnInit(): Promise<void> {
    try {
      this.titleService.setTitle('Quản lý biểu mẫu SMS');
      const [types, recipientTypes] = await Promise.all([
        this.smsTemplateService.getSmsTemplateTypes(),
        this.smsTemplateService.getSmsRecipientTypes()
      ]);
      this.typeOptions = types;
      this.recipientTypeOptions = recipientTypes;
    } catch (error) {
      console.error('Error loading SMS template options:', error);
      this.typeOptions = [];
      this.recipientTypeOptions = [];
    }

    this.activatedRoute.queryParams.pipe(takeUntil(this._unsubscribeAll)).subscribe(params => {
      this.page = Math.max(Number(params['page']) || 1, 1);
      this.selectedOption = Number(params['size']) || 50;
      this.searchValue = params['name'] || '';
      this.createdFrom = params['from_time'] || null;
      this.createdTo = params['to_time'] || null;
      this.selectedType = params['type'] || null;
      this.selectedRecipientType = params['recipientType'] || null;
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

  ngAfterViewInit(): void {
    this.translate.onLangChange(() => {
      this.setColumn();
    });
    this.setColumn();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  setColumn() {
    this.columns = [
      { name: 'Tên mẫu', key: 'name', width: '20%', minWidth: 180, cellTemplate: this.nameTemplate },
      { name: 'Loại', key: 'type', width: '20%', minWidth: 140, cellTemplate: this.typeTemplate },
      { name: 'Người nhận', key: 'recipientType', width: '15%', minWidth: 120, cellTemplate: this.recipientTypeTemplate },
      { name: 'Trạng thái', key: 'active', width: '15%', minWidth: 120, cellTemplate: this.statusTemplate },
      { name: 'Thời gian', key: 'createTime', width: '18%', minWidth: 150, cellTemplate: this.createTimeTemplate },
      { name: 'Hành động', key: 'action', width: '12%', minWidth: 150, cellTemplate: this.actionTemplate },
    ];
    this.cdr.detectChanges();
  }

  filterUpdate(event, type) {
    if (type === 'name') {
      this.searchValue = event;
    } else if (type === 'type') {
      this.selectedType = event;
    } else if (type === 'recipientType') {
      this.selectedRecipientType = event;
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
    if (this.selectedRecipientType) params['recipientType'] = this.selectedRecipientType;
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
    this.smsTemplateService.getDataTableRows(
      this.page,
      this.selectedOption,
      null,
      this.createdFrom,
      this.createdTo,
      this.searchValue,
      this.selectedType,
      this.selectedRecipientType,
      this.selectedStatus
    ).then((data) => {
      this.rows = data;
      this.total = this.smsTemplateService.totalCount;
      this.totalPage = this.smsTemplateService.totalPage;
    }).catch((error) => {
      console.error('Error fetching SMS templates:', error);
      this.toastr.error('Có lỗi xảy ra khi tải danh sách biểu mẫu SMS!');
    }).finally(() => {
      this.isSearching = false;
    });
  }

  resetFilters() {
    this.searchValue = '';
    this.createdFrom = null;
    this.createdTo = null;
    this.selectedType = null;
    this.selectedRecipientType = null;
    this.selectedStatus = null;
    this.fetchPage();
  }

  openModal(template, mode: 'view' | 'edit') {
    this.selectedTemplate = { ...template };
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
      recipientType: '',
      active: true,
      content: ''
    };
    this.showCreateModal = true;
  }

  closeModalCreate() {
    this.showCreateModal = false;
  }

  viewTemplate(template) {
    this.openModal(template, 'view');
  }

  editTemplate(template) {
    this.openModal(template, 'edit');
  }

  toggleStatus(template, newStatus?: boolean) {
    if (newStatus !== undefined) {
      template.active = newStatus;
      this.smsTemplateService.toggleSmsTemplateStatus(template.id, newStatus)
        .then(() => {
          this.toastr.success('Cập nhật trạng thái thành công!');
        })
        .catch((error) => {
          console.error('Error updating status:', error);
          this.toastr.error('Có lỗi xảy ra khi cập nhật trạng thái!');
          template.active = !newStatus;
        });
      return;
    }

    const originalStatus = template.active;
    const newActive = !template.active;
    template.active = newActive;
    this.smsTemplateService.toggleSmsTemplateStatus(template.id, newActive)
      .then(() => {
        this.toastr.success('Cập nhật trạng thái thành công!');
      })
      .catch((error) => {
        console.error('Error updating status:', error);
        this.toastr.error('Có lỗi xảy ra khi cập nhật trạng thái!');
        template.active = originalStatus;
      });
  }

  async saveTemplate() {
    try {
      this.updating = true;
      await this.smsTemplateService.updateSmsTemplate(this.selectedTemplate);
      this.toastr.success('Lưu biểu mẫu SMS thành công!');
      this.closeModal();
      this.fetchPage();
    } catch (error) {
      console.error('Error saving template:', error);
      this.toastr.error('Có lỗi xảy ra khi lưu biểu mẫu SMS!');
    } finally {
      this.updating = false;
    }
  }

  async createTemplate() {
    try {
      this.creating = true;
      await this.smsTemplateService.createSmsTemplate(this.newTemplate);
      this.toastr.success('Tạo biểu mẫu SMS thành công!');
      this.closeModalCreate();
      this.fetchPage();
    } catch (error) {
      console.error('Error creating template:', error);
      this.toastr.error('Có lỗi xảy ra khi tạo biểu mẫu SMS!');
    } finally {
      this.creating = false;
    }
  }

  getTypeLabel(type: string): string {
    const option = this.typeOptions.find(opt => opt.value === type);
    return option ? option.label : type;
  }

  getRecipientTypeLabel(recipientType: string): string {
    const option = this.recipientTypeOptions.find(opt => opt.value === recipientType);
    return option ? option.label : recipientType;
  }
}
