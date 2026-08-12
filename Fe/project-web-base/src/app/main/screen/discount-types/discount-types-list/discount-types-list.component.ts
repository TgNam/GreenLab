import { ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CoreConfigService } from '@core/services/config.service';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponent } from 'app/main/services/base.component';
import { BaseQueryParamService } from 'app/main/services/base-query-param.service';
import { DiscountTypeService, DiscountType } from '../../../services/lab-tests/discount-type.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-discount-types-list',
  templateUrl: './discount-types-list.component.html',
  styleUrls: ['./discount-types-list.component.scss']
})
export class DiscountTypesListComponent extends BaseComponent implements OnInit, OnDestroy {
  public rows: DiscountType[] = [];
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

  public selectedItem: DiscountType | null = null;
  public modalMode: 'view' | 'edit' = 'view';
  public showModal = false;
  public showCreateModal = false;
  public showDeleteModal = false;
  public updating = false;
  public creating = false;
  public deleting = false;

  public newItem: Partial<DiscountType> = { code: '', name: '', calculationMethod: 'PERCENTAGE' as any, isActive: true };

  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('codeTemplate') codeTemplate!: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate!: TemplateRef<any>;
  @ViewChild('methodTemplate') methodTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('actionTemplate') actionTemplate!: TemplateRef<any>;

  public columns = [];
  private _unsubscribeAll: Subject<any>;

  statusOptions = [
    { label: 'Hoạt động', value: true },
    { label: 'Ngừng hoạt động', value: false }
  ];

  methodOptions = [
    { label: 'Phần trăm (%)', value: 'PERCENTAGE' },
    { label: 'Cố định (VND)', value: 'FIXED' }
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
    private service: DiscountTypeService
  ) {
    super(activatedRoute, queryParamService, undefined);
    this._unsubscribeAll = new Subject();
  }

  async ngOnInit(): Promise<void> {
    this.titleService.setTitle('Quản lý loại giảm giá');
    this.activatedRoute.queryParams.pipe(takeUntil(this._unsubscribeAll)).subscribe(params => {
      this.page = Math.max(Number(params['page']) || 1, 1);
      this.selectedOption = Number(params['size']) || 50;
      this.searchCode = params['code'] || '';
      this.searchName = params['name'] || '';
      this.selectedStatus = params['isActive'] !== undefined && params['isActive'] !== '' ? params['isActive'] === 'true' : null;
      this.doFetchPage();
    });
  }

  ngAfterViewInit(): void { this.setColumn(); }
  ngOnDestroy(): void { this._unsubscribeAll.next(); this._unsubscribeAll.complete(); }

  setColumn() {
    this.columns = [
      { name: 'Mã', key: 'code', width: '15%', cellTemplate: this.codeTemplate },
      { name: 'Tên loại giảm giá', key: 'name', width: '30%', cellTemplate: this.nameTemplate },
      { name: 'Phương thức', key: 'calculationMethod', width: '20%', cellTemplate: this.methodTemplate },
      { name: 'Trạng thái', key: 'isActive', width: '10%', cellTemplate: this.statusTemplate },
      { name: 'Hành động', key: 'action', width: '25%', cellTemplate: this.actionTemplate },
    ];
    this.cdr.detectChanges();
  }

  filterUpdate(value: any, type: string) {
    if (type === 'code') this.searchCode = value;
    else if (type === 'name') this.searchName = value;
    else if (type === 'isActive') this.selectedStatus = value;
  }

  toggleAdvancedSearch() { this.showAdvancedSearch = !this.showAdvancedSearch; }

  pushQueryParams(): void {
    const params: Record<string, any> = { page: this.page, size: this.selectedOption };
    if (this.searchCode) params['code'] = this.searchCode;
    if (this.searchName) params['name'] = this.searchName;
    if (this.selectedStatus !== null) params['isActive'] = this.selectedStatus;
    this.router.navigate([], { relativeTo: this.activatedRoute, queryParams: params, replaceUrl: true });
  }

  onPageChange(newPage: number) { this.page = newPage; this.fetchPage(); }
  onPageSizeChange(event) { this.selectedOption = event; this.page = 1; this.fetchPage(); }

  fetchPage() {
    this.isSearching = true;
    this.pushQueryParams();
    this.doFetchPage();
  }

  private doFetchPage() {
    this.service.getDataTableRows(this.page, this.selectedOption, this.searchCode, this.searchName, this.selectedStatus)
      .then((data) => { this.rows = data; this.total = this.service.totalCount; this.totalPage = this.service.totalPage; })
      .catch((error) => { console.error('Error:', error); this.toastr.error('Có lỗi xảy ra!'); })
      .finally(() => { this.isSearching = false; });
  }

  resetFilters() { this.searchCode = ''; this.searchName = ''; this.selectedStatus = null; this.fetchPage(); }

  openModal(item: DiscountType, mode: 'view' | 'edit') { this.selectedItem = { ...item }; this.modalMode = mode; this.showModal = true; }
  closeModal() { this.showModal = false; this.selectedItem = null; }
  openModalCreate() { this.newItem = { code: '', name: '', calculationMethod: 'PERCENTAGE' as any, isActive: true }; this.showCreateModal = true; }
  closeModalCreate() { this.showCreateModal = false; }
  openModalDelete(item: DiscountType) { this.selectedItem = { ...item }; this.showDeleteModal = true; }
  closeModalDelete() { this.showDeleteModal = false; this.selectedItem = null; }

  viewItem(item: DiscountType) { this.openModal(item, 'view'); }
  editItem(item: DiscountType) { this.openModal(item, 'edit'); }

  async saveItem() {
    try {
      this.updating = true;
      const result = await this.service.updateDiscountType(this.selectedItem!);
      if (result.success !== false) { this.toastr.success('Cập nhật thành công!'); this.closeModal(); this.fetchPage(); }
      else { this.toastr.error(result.message || 'Có lỗi xảy ra!'); }
    } catch (error: any) { this.toastr.error(error.error?.message || 'Có lỗi xảy ra!'); }
    finally { this.updating = false; }
  }

  async createItem() {
    try {
      this.creating = true;
      const result = await this.service.createDiscountType(this.newItem);
      if (result.success !== false) { this.toastr.success('Tạo mới thành công!'); this.closeModalCreate(); this.fetchPage(); }
      else { this.toastr.error(result.message || 'Có lỗi xảy ra!'); }
    } catch (error: any) { this.toastr.error(error.error?.message || 'Có lỗi xảy ra!'); }
    finally { this.creating = false; }
  }

  async deleteItem() {
    try {
      this.deleting = true;
      const result = await this.service.deleteDiscountType(this.selectedItem!.id!);
      if (result.success !== false) { this.toastr.success('Xóa thành công!'); this.closeModalDelete(); this.fetchPage(); }
      else { this.toastr.error(result.message || 'Có lỗi xảy ra!'); }
    } catch (error: any) { this.toastr.error(error.error?.message || 'Có lỗi xảy ra!'); }
    finally { this.deleting = false; }
  }

  getStatusLabel(status: boolean): string { return status ? 'Hoạt động' : 'Ngừng hoạt động'; }
  getMethodLabel(method: string): string { return method === 'PERCENTAGE' ? 'Phần trăm (%)' : 'Cố định (VND)'; }
  isValidForSave(): boolean { return this.modalMode === 'edit' && !!(this.selectedItem?.code?.trim() && this.selectedItem?.name?.trim()); }
  isValidForCreate(): boolean { return !!(this.newItem.code?.trim() && this.newItem.name?.trim()); }
}
