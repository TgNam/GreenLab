import { ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CoreConfigService } from '@core/services/config.service';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponent } from 'app/main/services/base.component';
import { BaseQueryParamService } from 'app/main/services/base-query-param.service';
import { PanelService, Panel } from '../../../services/lab-tests/panel.service';
import { PanelCategoryService } from '../../../services/lab-tests/panel-category.service';
import { DiscountTypeService } from '../../../services/lab-tests/discount-type.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-panels-list',
  templateUrl: './panels-list.component.html',
  styleUrls: ['./panels-list.component.scss']
})
export class PanelsListComponent extends BaseComponent implements OnInit, OnDestroy {
  public rows: Panel[] = [];
  public selectedOption = 50;
  public ColumnMode = ColumnMode;
  public searchCode = '';
  public searchName = '';
  public page = 1;
  public total = 0;
  public totalPage = 0;
  public selectedPanelCategoryId: number | null = null;
  public showAdvancedSearch = false;
  public isSearching = false;

  public selectedItem: Panel | null = null;
  public modalMode: 'view' | 'edit' = 'view';
  public showModal = false;
  public showCreateModal = false;
  public showDeleteModal = false;
  public updating = false;
  public creating = false;
  public deleting = false;

  public panelCategories: any[] = [];
  public discountTypes: any[] = [];

  public newItem: Partial<Panel> = {
    code: '', name: '', shortDescription: '', panelCategoryId: null,
    discountTypeId: null, originalPrice: 0, discountValue: 0
  };

  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('codeTemplate') codeTemplate!: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate!: TemplateRef<any>;
  @ViewChild('categoryTemplate') categoryTemplate!: TemplateRef<any>;
  @ViewChild('priceTemplate') priceTemplate!: TemplateRef<any>;
  @ViewChild('testCountTemplate') testCountTemplate!: TemplateRef<any>;
  @ViewChild('actionTemplate') actionTemplate!: TemplateRef<any>;

  public columns = [];
  private _unsubscribeAll: Subject<any>;

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
    private service: PanelService,
    private panelCategoryService: PanelCategoryService,
    private discountTypeService: DiscountTypeService
  ) {
    super(activatedRoute, queryParamService, undefined);
    this._unsubscribeAll = new Subject();
  }

  async ngOnInit(): Promise<void> {
    this.titleService.setTitle('Quản lý gói xét nghiệm');
    await this.loadLookupData();
    this.activatedRoute.queryParams.pipe(takeUntil(this._unsubscribeAll)).subscribe(params => {
      this.page = Math.max(Number(params['page']) || 1, 1);
      this.selectedOption = Number(params['size']) || 50;
      this.searchCode = params['code'] || '';
      this.searchName = params['name'] || '';
      this.selectedPanelCategoryId = params['panelCategoryId'] ? Number(params['panelCategoryId']) : null;
      this.doFetchPage();
    });
  }

  async loadLookupData() {
    try {
      const [categories, discountTypes] = await Promise.all([
        this.panelCategoryService.getDataTableRows(1, 1000, null, null, true),
        this.discountTypeService.getDataTableRows(1, 1000, null, null, true)
      ]);
      this.panelCategories = categories.map(c => ({ id: c.id, name: c.name }));
      this.discountTypes = discountTypes.map(d => ({ id: d.id, name: d.name }));
    } catch (e) { console.error('Error loading lookup data:', e); }
  }

  ngAfterViewInit(): void { this.setColumn(); }
  ngOnDestroy(): void { this._unsubscribeAll.next(); this._unsubscribeAll.complete(); }

  setColumn() {
    this.columns = [
      { name: 'Mã', key: 'code', width: '12%', cellTemplate: this.codeTemplate },
      { name: 'Tên gói', key: 'name', width: '25%', cellTemplate: this.nameTemplate },
      { name: 'Danh mục', key: 'panelCategoryId', width: '15%', cellTemplate: this.categoryTemplate },
      { name: 'Giá gốc', key: 'originalPrice', width: '12%', cellTemplate: this.priceTemplate },
      { name: 'Số xét nghiệm', key: 'testCount', width: '10%', cellTemplate: this.testCountTemplate },
      { name: 'Hành động', key: 'action', width: '26%', cellTemplate: this.actionTemplate },
    ];
    this.cdr.detectChanges();
  }

  filterUpdate(value: any, type: string) {
    if (type === 'code') this.searchCode = value;
    else if (type === 'name') this.searchName = value;
    else if (type === 'panelCategoryId') this.selectedPanelCategoryId = value;
  }

  toggleAdvancedSearch() { this.showAdvancedSearch = !this.showAdvancedSearch; }

  pushQueryParams(): void {
    const params: Record<string, any> = { page: this.page, size: this.selectedOption };
    if (this.searchCode) params['code'] = this.searchCode;
    if (this.searchName) params['name'] = this.searchName;
    if (this.selectedPanelCategoryId) params['panelCategoryId'] = this.selectedPanelCategoryId;
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
    this.service.getDataTableRows(this.page, this.selectedOption, this.searchCode, this.searchName, this.selectedPanelCategoryId)
      .then((data) => { this.rows = data; this.total = this.service.totalCount; this.totalPage = this.service.totalPage; })
      .catch((error) => { console.error('Error:', error); this.toastr.error('Có lỗi xảy ra!'); })
      .finally(() => { this.isSearching = false; });
  }

  resetFilters() { this.searchCode = ''; this.searchName = ''; this.selectedPanelCategoryId = null; this.fetchPage(); }

  openModal(item: Panel, mode: 'view' | 'edit') { this.selectedItem = { ...item }; this.modalMode = mode; this.showModal = true; }
  closeModal() { this.showModal = false; this.selectedItem = null; }
  openModalCreate() {
    this.newItem = { code: '', name: '', shortDescription: '', panelCategoryId: null, discountTypeId: null, originalPrice: 0, discountValue: 0 };
    this.showCreateModal = true;
  }
  closeModalCreate() { this.showCreateModal = false; }
  openModalDelete(item: Panel) { this.selectedItem = { ...item }; this.showDeleteModal = true; }
  closeModalDelete() { this.showDeleteModal = false; this.selectedItem = null; }

  viewItem(item: Panel) { this.openModal(item, 'view'); }
  editItem(item: Panel) { this.openModal(item, 'edit'); }

  getCategoryName(id: number): string { return this.panelCategories.find(c => c.id === id)?.name || '-'; }
  getDiscountTypeName(id: number): string { return this.discountTypes.find(d => d.id === id)?.name || '-'; }
  formatPrice(price: number): string { return price ? price.toLocaleString('vi-VN') + ' đ' : '-'; }

  async saveItem() {
    try {
      this.updating = true;
      const result = await this.service.updatePanel(this.selectedItem!);
      if (result.success !== false) { this.toastr.success('Cập nhật thành công!'); this.closeModal(); this.fetchPage(); }
      else { this.toastr.error(result.message || 'Có lỗi xảy ra!'); }
    } catch (error: any) { this.toastr.error(error.error?.message || 'Có lỗi xảy ra!'); }
    finally { this.updating = false; }
  }

  async createItem() {
    try {
      this.creating = true;
      const result = await this.service.createPanel(this.newItem);
      if (result.success !== false) { this.toastr.success('Tạo mới thành công!'); this.closeModalCreate(); this.fetchPage(); }
      else { this.toastr.error(result.message || 'Có lỗi xảy ra!'); }
    } catch (error: any) { this.toastr.error(error.error?.message || 'Có lỗi xảy ra!'); }
    finally { this.creating = false; }
  }

  async deleteItem() {
    try {
      this.deleting = true;
      const result = await this.service.deletePanel(this.selectedItem!.id!);
      if (result.success !== false) { this.toastr.success('Xóa thành công!'); this.closeModalDelete(); this.fetchPage(); }
      else { this.toastr.error(result.message || 'Có lỗi xảy ra!'); }
    } catch (error: any) { this.toastr.error(error.error?.message || 'Có lỗi xảy ra!'); }
    finally { this.deleting = false; }
  }

  isValidForSave(): boolean { return this.modalMode === 'edit' && !!(this.selectedItem?.code?.trim() && this.selectedItem?.name?.trim() && this.selectedItem?.panelCategoryId); }
  isValidForCreate(): boolean { return !!(this.newItem.code?.trim() && this.newItem.name?.trim() && this.newItem.panelCategoryId); }
}
