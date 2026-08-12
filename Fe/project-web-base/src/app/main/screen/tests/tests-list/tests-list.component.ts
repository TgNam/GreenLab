import { ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CoreConfigService } from '@core/services/config.service';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponent } from 'app/main/services/base.component';
import { BaseQueryParamService } from 'app/main/services/base-query-param.service';
import { TestService, Test } from '../../../services/lab-tests/test.service';
import { TestCategoryService } from '../../../services/lab-tests/test-category.service';
import { SpecimenTypeService } from '../../../services/lab-tests/specimen-type.service';
import { UnitService } from '../../../services/lab-tests/unit.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-tests-list',
  templateUrl: './tests-list.component.html',
  styleUrls: ['./tests-list.component.scss']
})
export class TestsListComponent extends BaseComponent implements OnInit, OnDestroy {
  public rows: Test[] = [];
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

  public selectedItem: Test | null = null;
  public modalMode: 'view' | 'edit' = 'view';
  public showModal = false;
  public showCreateModal = false;
  public showDeleteModal = false;
  public updating = false;
  public creating = false;
  public deleting = false;

  public testCategories: any[] = [];
  public specimenTypes: any[] = [];
  public units: any[] = [];

  public newItem: Partial<Test> = {
    code: '', name: '', shortName: '', description: '',
    testCategoryId: null, specimenTypeId: null, unitId: null,
    price: 0, normalRange: '', method: '', isActive: true
  };

  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('codeTemplate') codeTemplate!: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate!: TemplateRef<any>;
  @ViewChild('categoryTemplate') categoryTemplate!: TemplateRef<any>;
  @ViewChild('priceTemplate') priceTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
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
    private service: TestService,
    private testCategoryService: TestCategoryService,
    private specimenTypeService: SpecimenTypeService,
    private unitService: UnitService
  ) {
    super(activatedRoute, queryParamService, undefined);
    this._unsubscribeAll = new Subject();
  }

  async ngOnInit(): Promise<void> {
    this.titleService.setTitle('Quản lý xét nghiệm');
    await this.loadLookupData();
    this.activatedRoute.queryParams.pipe(takeUntil(this._unsubscribeAll)).subscribe(params => {
      this.page = Math.max(Number(params['page']) || 1, 1);
      this.selectedOption = Number(params['size']) || 50;
      this.searchCode = params['code'] || '';
      this.searchName = params['name'] || '';
      this.selectedStatus = params['isActive'] !== undefined && params['isActive'] !== '' ? params['isActive'] === 'true' : null;
      this.doFetchPage();
    });
  }

  async loadLookupData() {
    try {
      const [categories, specimens, units] = await Promise.all([
        this.testCategoryService.getDataTableRows(1, 1000, null, null, true),
        this.specimenTypeService.getDataTableRows(1, 1000, null, null, true),
        this.unitService.getDataTableRows(1, 1000, null, null, true)
      ]);
      this.testCategories = categories.map(c => ({ id: c.id, name: c.name }));
      this.specimenTypes = specimens.map(s => ({ id: s.id, name: s.name }));
      this.units = units.map(u => ({ id: u.id, name: u.name }));
    } catch (e) { console.error('Error loading lookup data:', e); }
  }

  ngAfterViewInit(): void { this.setColumn(); }
  ngOnDestroy(): void { this._unsubscribeAll.next(); this._unsubscribeAll.complete(); }

  setColumn() {
    this.columns = [
      { name: 'Mã', key: 'code', width: '12%', cellTemplate: this.codeTemplate },
      { name: 'Tên xét nghiệm', key: 'name', width: '25%', cellTemplate: this.nameTemplate },
      { name: 'Loại', key: 'testCategoryId', width: '15%', cellTemplate: this.categoryTemplate },
      { name: 'Giá', key: 'price', width: '12%', cellTemplate: this.priceTemplate },
      { name: 'Trạng thái', key: 'isActive', width: '10%', cellTemplate: this.statusTemplate },
      { name: 'Hành động', key: 'action', width: '26%', cellTemplate: this.actionTemplate },
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
    this.service.getDataTableRows(this.page, this.selectedOption, this.searchCode, this.searchName, null, null, this.selectedStatus)
      .then((data) => { this.rows = data; this.total = this.service.totalCount; this.totalPage = this.service.totalPage; })
      .catch((error) => { console.error('Error:', error); this.toastr.error('Có lỗi xảy ra!'); })
      .finally(() => { this.isSearching = false; });
  }

  resetFilters() { this.searchCode = ''; this.searchName = ''; this.selectedStatus = null; this.fetchPage(); }

  openModal(item: Test, mode: 'view' | 'edit') { this.selectedItem = { ...item }; this.modalMode = mode; this.showModal = true; }
  closeModal() { this.showModal = false; this.selectedItem = null; }
  openModalCreate() {
    this.newItem = { code: '', name: '', shortName: '', description: '', testCategoryId: null, specimenTypeId: null, unitId: null, price: 0, normalRange: '', method: '', isActive: true };
    this.showCreateModal = true;
  }
  closeModalCreate() { this.showCreateModal = false; }
  openModalDelete(item: Test) { this.selectedItem = { ...item }; this.showDeleteModal = true; }
  closeModalDelete() { this.showDeleteModal = false; this.selectedItem = null; }

  viewItem(item: Test) { this.openModal(item, 'view'); }
  editItem(item: Test) { this.openModal(item, 'edit'); }

  getCategoryName(id: number): string { return this.testCategories.find(c => c.id === id)?.name || '-'; }
  getSpecimenTypeName(id: number): string { return this.specimenTypes.find(s => s.id === id)?.name || '-'; }
  getUnitName(id: number): string { return this.units.find(u => u.id === id)?.name || '-'; }
  formatPrice(price: number): string { return price ? price.toLocaleString('vi-VN') + ' đ' : '-'; }

  async saveItem() {
    try {
      this.updating = true;
      const result = await this.service.updateTest(this.selectedItem!);
      if (result.success !== false) { this.toastr.success('Cập nhật thành công!'); this.closeModal(); this.fetchPage(); }
      else { this.toastr.error(result.message || 'Có lỗi xảy ra!'); }
    } catch (error: any) { this.toastr.error(error.error?.message || 'Có lỗi xảy ra!'); }
    finally { this.updating = false; }
  }

  async createItem() {
    try {
      this.creating = true;
      const result = await this.service.createTest(this.newItem);
      if (result.success !== false) { this.toastr.success('Tạo mới thành công!'); this.closeModalCreate(); this.fetchPage(); }
      else { this.toastr.error(result.message || 'Có lỗi xảy ra!'); }
    } catch (error: any) { this.toastr.error(error.error?.message || 'Có lỗi xảy ra!'); }
    finally { this.creating = false; }
  }

  async deleteItem() {
    try {
      this.deleting = true;
      const result = await this.service.deleteTest(this.selectedItem!.id!);
      if (result.success !== false) { this.toastr.success('Xóa thành công!'); this.closeModalDelete(); this.fetchPage(); }
      else { this.toastr.error(result.message || 'Có lỗi xảy ra!'); }
    } catch (error: any) { this.toastr.error(error.error?.message || 'Có lỗi xảy ra!'); }
    finally { this.deleting = false; }
  }

  getStatusLabel(status: boolean): string { return status ? 'Hoạt động' : 'Ngừng hoạt động'; }
  isValidForSave(): boolean { return this.modalMode === 'edit' && !!(this.selectedItem?.code?.trim() && this.selectedItem?.name?.trim()); }
  isValidForCreate(): boolean { return !!(this.newItem.code?.trim() && this.newItem.name?.trim()); }
}
