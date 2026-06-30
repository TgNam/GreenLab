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
import { DepartmentsService } from '../departments.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-departments-list',
  templateUrl: './departments-list.component.html',
  styleUrls: ['./departments-list.component.scss']
})
export class DepartmentsListComponent extends BaseComponent implements OnInit, OnDestroy {
  public rows = [];
  public selectedOption = 50;
  public ColumnMode = ColumnMode;
  public searchValue = '';
  public searchShortName = '';
  public page = 1;
  public total = 0;
  public totalPage = 0;
  public createdFrom = null;
  public createdTo = null;

  public selectedStatus: number | null = null;
  public showAdvancedSearch = false;
  public isSearching = false;

  public selectedDepartment = null;
  public modalMode: 'view' | 'edit' = 'view';
  public showModal = false;
  public showCreateModal = false;
  public updating = false;
  public creating = false;
  public newDepartment = {
    name: '',
    short_name: '',
    status: 1
  };

  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('nameTemplate', { static: true }) nameTemplate!: TemplateRef<any>;
  @ViewChild('shortNameTemplate', { static: true }) shortNameTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<any>;
  @ViewChild('createTimeTemplate', { static: true }) createTimeTemplate!: TemplateRef<any>;
  @ViewChild('actionTemplate', { static: true }) actionTemplate!: TemplateRef<any>;

  public columns = [];
  private _unsubscribeAll: Subject<any>;

  statusOptions = [
    { label: 'Hoạt động', value: 1 },
    { label: 'Ngừng hoạt động', value: 0 }
  ];

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
    private departmentsService: DepartmentsService
  ) {
    super(activatedRoute, queryParamService, undefined);
    this._unsubscribeAll = new Subject();
  }

  async ngOnInit(): Promise<void> {
    this.titleService.setTitle('Quản lý phòng ban');

    this.activatedRoute.queryParams.pipe(takeUntil(this._unsubscribeAll)).subscribe(params => {
      this.page = Math.max(Number(params['page']) || 1, 1);
      this.selectedOption = Number(params['size']) || 50;
      this.searchValue = params['name'] || '';
      this.searchShortName = params['shortName'] || '';
      this.createdFrom = params['from_time'] || null;
      this.createdTo = params['to_time'] || null;
      if (params['status'] !== undefined && params['status'] !== '') {
        this.selectedStatus = Number(params['status']);
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
      { name: 'Tên phòng ban', key: 'name', width: '25%', minWidth: 180, cellTemplate: this.nameTemplate },
      { name: 'Tên viết tắt', key: 'short_name', width: '15%', minWidth: 120, cellTemplate: this.shortNameTemplate },
      { name: 'Trạng thái', key: 'status', width: '15%', minWidth: 120, cellTemplate: this.statusTemplate },
      { name: 'Thời gian', key: 'createTime', width: '20%', minWidth: 180, cellTemplate: this.createTimeTemplate },
      { name: 'Hành động', key: 'action', width: '25%', minWidth: 200, cellTemplate: this.actionTemplate },
    ];
    this.cdr.detectChanges();
  }

  filterUpdate(event, type) {
    if (type === 'name') {
      this.searchValue = event;
    } else if (type === 'shortName') {
      this.searchShortName = event;
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
    if (this.searchShortName) params['shortName'] = this.searchShortName;
    if (this.createdFrom) params['from_time'] = this.createdFrom;
    if (this.createdTo) params['to_time'] = this.createdTo;
    if (this.selectedStatus !== null && this.selectedStatus !== undefined) params['status'] = this.selectedStatus;

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
    this.departmentsService.getDataTableRows(
      this.page,
      this.selectedOption,
      null,
      this.createdFrom,
      this.createdTo,
      this.searchValue,
      this.searchShortName,
      this.selectedStatus
    ).then((data) => {
      this.rows = data;
      this.total = this.departmentsService.totalCount;
      this.totalPage = this.departmentsService.totalPage;
    }).catch((error) => {
      console.error('Error fetching departments:', error);
      this.toastr.error('Có lỗi xảy ra khi tải danh sách phòng ban!');
    }).finally(() => {
      this.isSearching = false;
    });
  }

  resetFilters() {
    this.searchValue = '';
    this.searchShortName = '';
    this.createdFrom = null;
    this.createdTo = null;
    this.selectedStatus = null;
    this.fetchPage();
  }

  openModal(department, mode: 'view' | 'edit') {
    this.selectedDepartment = { ...department };
    this.modalMode = mode;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedDepartment = null;
  }

  openModalCreate() {
    this.newDepartment = {
      name: '',
      short_name: '',
      status: 1
    };
    this.showCreateModal = true;
  }

  closeModalCreate() {
    this.showCreateModal = false;
  }

  viewDepartment(department) {
    this.openModal(department, 'view');
  }

  editDepartment(department) {
    this.openModal(department, 'edit');
  }

  async saveDepartment() {
    try {
      this.updating = true;
      await this.departmentsService.updateDepartment(this.selectedDepartment);
      this.toastr.success('Lưu phòng ban thành công!');
      this.closeModal();
      this.fetchPage();
    } catch (error) {
      console.error('Error saving department:', error);
      this.toastr.error('Có lỗi xảy ra khi lưu phòng ban!');
    } finally {
      this.updating = false;
    }
  }

  async createDepartment() {
    try {
      this.creating = true;
      await this.departmentsService.createDepartment(this.newDepartment);
      this.toastr.success('Tạo phòng ban thành công!');
      this.closeModalCreate();
      this.fetchPage();
    } catch (error) {
      console.error('Error creating department:', error);
      this.toastr.error('Có lỗi xảy ra khi tạo phòng ban!');
    } finally {
      this.creating = false;
    }
  }

  getStatusLabel(status: number): string {
    return status === 1 ? 'Hoạt động' : 'Ngừng hoạt động';
  }
}
