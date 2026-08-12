import { ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CoreConfigService } from '@core/services/config.service';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponent } from 'app/main/services/base.component';
import { BaseQueryParamService } from 'app/main/services/base-query-param.service';
import { TestCategoryService, TestCategory } from '../../../services/lab-tests/test-category.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-test-categories-list',
  templateUrl: './test-categories-list.component.html',
  styleUrls: ['./test-categories-list.component.scss']
})
export class TestCategoriesListComponent extends BaseComponent implements OnInit, OnDestroy {
  public rows: TestCategory[] = [];
  public selectedOption = 50;
  public ColumnMode = ColumnMode;
  public searchCode = '';
  public searchName = '';
  public page = 1;
  public total = 0;
  public totalPage = 0;
  public selectedStatus: boolean | null = null;
  public showAdvancedSearch = false;
  public isSearching = false;

  public selectedItem: TestCategory | null = null;
  public modalMode: 'view' | 'edit' = 'view';
  public showModal = false;
  public showCreateModal = false;
  public showDeleteModal = false;
  public updating = false;
  public creating = false;
  public deleting = false;

  public newItem: Partial<TestCategory> = {
    code: '',
    name: '',
    description: '',
    isActive: true
  };

  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('codeTemplate') codeTemplate!: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('createdAtTemplate') createdAtTemplate!: TemplateRef<any>;
  @ViewChild('actionTemplate') actionTemplate!: TemplateRef<any>;

  public columns = [];
  private _unsubscribeAll: Subject<any>;

  statusOptions = [
    { label: 'Hoạt động', value: true },
    { label: 'Ngừng hoạt động', value: false }
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
    private router: Router,
    private testCategoryService: TestCategoryService
  ) {
    super(activatedRoute, queryParamService, undefined);
    this._unsubscribeAll = new Subject();
  }

  async ngOnInit(): Promise<void> {
    this.titleService.setTitle('Quản lý loại xét nghiệm');

    this.activatedRoute.queryParams.pipe(takeUntil(this._unsubscribeAll)).subscribe(params => {
      this.page = Math.max(Number(params['page']) || 1, 1);
      this.selectedOption = Number(params['size']) || 50;
      this.searchCode = params['code'] || '';
      this.searchName = params['name'] || '';
      if (params['isActive'] !== undefined && params['isActive'] !== '') {
        this.selectedStatus = params['isActive'] === 'true';
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
    this.setColumn();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  setColumn() {
    this.columns = [
      { name: 'Mã', key: 'code', width: '15%', minWidth: 100, cellTemplate: this.codeTemplate },
      { name: 'Tên loại xét nghiệm', key: 'name', width: '30%', minWidth: 200, cellTemplate: this.nameTemplate },
      { name: 'Trạng thái', key: 'isActive', width: '15%', minWidth: 120, cellTemplate: this.statusTemplate },
      { name: 'Thời gian', key: 'createdAt', width: '20%', minWidth: 150, cellTemplate: this.createdAtTemplate },
      { name: 'Hành động', key: 'action', width: '20%', minWidth: 150, cellTemplate: this.actionTemplate },
    ];
    this.cdr.detectChanges();
  }

  filterUpdate(value: any, type: string) {
    if (type === 'code') this.searchCode = value;
    else if (type === 'name') this.searchName = value;
    else if (type === 'isActive') this.selectedStatus = value;
  }

  toggleAdvancedSearch() {
    this.showAdvancedSearch = !this.showAdvancedSearch;
  }

  pushQueryParams(): void {
    const params: Record<string, any> = {
      page: this.page,
      size: this.selectedOption
    };
    if (this.searchCode) params['code'] = this.searchCode;
    if (this.searchName) params['name'] = this.searchName;
    if (this.selectedStatus !== null && this.selectedStatus !== undefined) params['isActive'] = this.selectedStatus;

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
    this.testCategoryService.getDataTableRows(
      this.page,
      this.selectedOption,
      this.searchCode,
      this.searchName,
      this.selectedStatus
    ).then((data) => {
      this.rows = data;
      this.total = this.testCategoryService.totalCount;
      this.totalPage = this.testCategoryService.totalPage;
    }).catch((error) => {
      console.error('Error:', error);
      this.toastr.error('Có lỗi xảy ra!');
    }).finally(() => {
      this.isSearching = false;
    });
  }

  resetFilters() {
    this.searchCode = '';
    this.searchName = '';
    this.selectedStatus = null;
    this.fetchPage();
  }

  openModal(item: TestCategory, mode: 'view' | 'edit') {
    this.selectedItem = { ...item };
    this.modalMode = mode;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedItem = null;
  }

  openModalCreate() {
    this.newItem = { code: '', name: '', description: '', isActive: true };
    this.showCreateModal = true;
  }

  closeModalCreate() {
    this.showCreateModal = false;
  }

  openModalDelete(item: TestCategory) {
    this.selectedItem = { ...item };
    this.showDeleteModal = true;
  }

  closeModalDelete() {
    this.showDeleteModal = false;
    this.selectedItem = null;
  }

  viewItem(item: TestCategory) {
    this.openModal(item, 'view');
  }

  editItem(item: TestCategory) {
    this.openModal(item, 'edit');
  }

  async saveItem() {
    try {
      this.updating = true;
      const result = await this.testCategoryService.updateCategory(this.selectedItem!);
      if (result.success !== false) {
        this.toastr.success('Cập nhật thành công!');
        this.closeModal();
        this.fetchPage();
      } else {
        this.toastr.error(result.message || 'Có lỗi xảy ra!');
      }
    } catch (error: any) {
      this.toastr.error(error.error?.message || 'Có lỗi xảy ra!');
    } finally {
      this.updating = false;
    }
  }

  async createItem() {
    try {
      this.creating = true;
      const result = await this.testCategoryService.createCategory(this.newItem);
      if (result.success !== false) {
        this.toastr.success('Tạo mới thành công!');
        this.closeModalCreate();
        this.fetchPage();
      } else {
        this.toastr.error(result.message || 'Có lỗi xảy ra!');
      }
    } catch (error: any) {
      this.toastr.error(error.error?.message || 'Có lỗi xảy ra!');
    } finally {
      this.creating = false;
    }
  }

  async deleteItem() {
    try {
      this.deleting = true;
      const result = await this.testCategoryService.deleteCategory(this.selectedItem!.id!);
      if (result.success !== false) {
        this.toastr.success('Xóa thành công!');
        this.closeModalDelete();
        this.fetchPage();
      } else {
        this.toastr.error(result.message || 'Có lỗi xảy ra!');
      }
    } catch (error: any) {
      this.toastr.error(error.error?.message || 'Có lỗi xảy ra!');
    } finally {
      this.deleting = false;
    }
  }

  getStatusLabel(status: boolean): string {
    return status ? 'Hoạt động' : 'Ngừng hoạt động';
  }

  isValidForSave(): boolean {
    if (this.modalMode === 'view') return false;
    return !!(this.selectedItem?.code?.trim() && this.selectedItem?.name?.trim());
  }

  isValidForCreate(): boolean {
    return !!(this.newItem.code?.trim() && this.newItem.name?.trim());
  }
}
