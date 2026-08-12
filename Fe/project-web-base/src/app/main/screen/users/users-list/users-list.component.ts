import { ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { DatatableComponent, ColumnMode } from '@swimlane/ngx-datatable';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CoreConfigService } from '@core/services/config.service';
import { ToastrService } from 'ngx-toastr';
import { CoreTranslationService } from '@core/services/translation.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponent } from 'app/main/services/base.component';
import { BaseQueryParamService } from 'app/main/services/base-query-param.service';
import { UsersService, User } from '../users.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html'
})
export class UsersListComponent extends BaseComponent implements OnInit, OnDestroy {
  public rows: User[] = [];
  public selectedOption = 20;
  public ColumnMode: any;
  public searchValue = '';
  public page = 1;
  public total = 0;
  public totalPage = 0;
  public createdFrom = null;
  public createdTo = null;

  public selectedIsActive: boolean | null = null;
  public selectedType: number | null = null;
  public selectedRegSource: number | null = null;
  public showAdvancedSearch = false;
  public isSearching = false;

  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<any>;
  @ViewChild('createTimeTemplate', { static: true }) createTimeTemplate!: TemplateRef<any>;
  @ViewChild('actionTemplate', { static: true }) actionTemplate!: TemplateRef<any>;

  public columns = [];
  private _unsubscribeAll: Subject<any>;

  isActiveOptions = [
    { label: 'Đang hoạt động', value: true },
    { label: 'Đã khóa', value: false }
  ];

  sizeOptions = [
    { label: '20', value: 20 },
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
    private usersService: UsersService
  ) {
    super(activatedRoute, queryParamService, titleService);
    this._unsubscribeAll = new Subject();
  }

  async ngOnInit(): Promise<void> {
    try {
      this.titleService.setTitle('Quản lý người dùng');
    } catch (error) {
      console.error('Error initializing users page:', error);
    }

    this.activatedRoute.queryParams.pipe(takeUntil(this._unsubscribeAll)).subscribe(params => {
      this.page = Math.max(Number(params['page']) || 1, 1);
      this.selectedOption = Number(params['size']) || 20;
      this.searchValue = params['keyword'] || params['email'] || params['fullName'] || params['phone'] || '';
      this.createdFrom = params['createdFrom'] || null;
      this.createdTo = params['createdTo'] || null;
      if (params['isActive'] !== undefined && params['isActive'] !== '') {
        this.selectedIsActive = params['isActive'] === 'true' || params['isActive'] === true;
      } else {
        this.selectedIsActive = null;
      }
      this.selectedType = params['type'] !== undefined && params['type'] !== '' ? Number(params['type']) : null;
      this.selectedRegSource = params['regSource'] !== undefined && params['regSource'] !== '' ? Number(params['regSource']) : null;

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
    this.ColumnMode = ColumnMode;
    this.columns = [
      { name: 'Họ tên', key: 'fullName', width: '20%', minWidth: 150 },
      { name: 'Email', key: 'email', width: '22%', minWidth: 200 },
      { name: 'Phone', key: 'phone', width: '15%', minWidth: 130 },
      { name: 'Trạng thái', key: 'status', width: '12%', minWidth: 120, cellTemplate: this.statusTemplate },
      { name: 'Thời gian', key: 'createTime', width: '18%', minWidth: 180, cellTemplate: this.createTimeTemplate },
      { name: 'Hành động', key: 'action', width: '13%', minWidth: 150, cellTemplate: this.actionTemplate },
    ];
    this.cdr.detectChanges();
  }

  filterUpdate(event, type: string) {
    if (type === 'keyword') {
      this.searchValue = event;
    } else if (type === 'isActive') {
      this.selectedIsActive = event;
    } else if (type === 'type') {
      this.selectedType = event;
    } else if (type === 'regSource') {
      this.selectedRegSource = event;
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
    if (this.searchValue) params['keyword'] = this.searchValue;
    if (this.createdFrom) params['createdFrom'] = this.createdFrom;
    if (this.createdTo) params['createdTo'] = this.createdTo;
    if (this.selectedIsActive !== null && this.selectedIsActive !== undefined) params['isActive'] = this.selectedIsActive;
    if (this.selectedType !== null && this.selectedType !== undefined) params['type'] = this.selectedType;
    if (this.selectedRegSource !== null && this.selectedRegSource !== undefined) params['regSource'] = this.selectedRegSource;

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
    this.usersService.getList({
        page: this.page,
        size: this.selectedOption,
        keyword: this.searchValue,
        isActive: this.selectedIsActive == null ? undefined : this.selectedIsActive,
        type: this.selectedType,
        regSource: this.selectedRegSource,
        createdFrom: this.createdFrom,
        createdTo: this.createdTo,
        sortBy: 'createTime',
        sortDir: 'desc'
      }, false
    ).then((data) => {
      this.rows = data;
      this.total = this.usersService.totalCount;
      this.totalPage = this.usersService.totalPage;
    }).catch((error) => {
      console.error('Error fetching users:', error);
      this.toastr.error('Có lỗi xảy ra khi tải danh sách người dùng!');
    }).finally(() => {
      this.isSearching = false;
    });
  }

  resetFilters() {
    this.searchValue = '';
    this.createdFrom = null;
    this.createdTo = null;
    this.selectedIsActive = null;
    this.selectedType = null;
    this.selectedRegSource = null;
    this.fetchPage();
  }

  openDetail(id: number): void {
    this.router.navigate(['/users', id]);
  }

  getStatusLabel(status: boolean): string {
    return status ? 'Đang hoạt động' : 'Đã khóa';
  }

  getStatusClass(status: boolean): string {
    return status ? 'badge-light-success' : 'badge-light-danger';
  }
}
