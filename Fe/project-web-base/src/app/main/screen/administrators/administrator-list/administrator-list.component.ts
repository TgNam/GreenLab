import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChild, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { CoreConfigService } from '@core/services/config.service';
import { AdministratorService } from '../administrator.service';
import { AdministratorDetailComponent } from '../popup/administrator-detail.component';
import { ToastrService } from 'ngx-toastr';
import { ToastsComponent } from 'app/main/components/toasts/toasts.component';
import { CustomToastrComponent } from 'app/main/extensions/toastr/custom-toastr/custom-toastr.component';
import { UserAutocompleteComponent } from 'app/main/components/autocomplete/user/user-autocomplete.component';
import { CoreTranslationService } from '@core/services/translation.service';
import { FormInputComponent } from 'app/main/components/form-input/form-input.component';
import { ActivatedRoute, NavigationEnd, NavigationExtras, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { error } from 'console';
import { BaseComponent } from 'app/main/services/base.component';
import { BaseQueryParamService } from 'app/main/services/base-query-param.service';

@Component({
  selector: 'app-administrator-list',
  templateUrl: './administrator-list.component.html',
  styleUrls: ['./administrator-list.component.scss']
})
export class AdministratorListComponent extends BaseComponent implements OnInit {
  public rows = [];
  statusOptions = [
    { label: this.translate.instant('COMMON.ACTIVE'), value: true },
    { label: this.translate.instant('COMMON.INACTIVE'), value: false }
  ]
  sizeOptions = [
    { label: '50', value: 50 },
    { label: '100', value: 100 },
    { label: '200', value: 200 },
    { label: '500', value: 500 }
  ]
  public formattedRows;
  public selectedOption = 50;
  public ColumnMode = ColumnMode;
  public searchValue = '';
  public page = 1;
  public total = 0;
  public totalPage = 0;
  public name = "";
  public username = "";
  public phone = "";
  public id = null;
  public createdFrom: string | null = null; // Changed to string format YYYY-MM-dd
  public createdTo: string | null = null; // Changed to string format YYYY-MM-dd
  public isActive: boolean | null = null;
  public selectedAdmin;
  public showModal = false;
  public modalMode: 'view' | 'edit' = 'view';

  public showModalChangeStatus = false;
  public selectedAdminChangeStatus;

  public showModalCreate = false;
  public isAssignModalVisible = false;
  public isAssignModalCanSetVisible = false;
  public selectedEmployeeId = null;
  public selectedEmployeeName = null;
  public selectedEmployeeCanSetId = null;
  public selectedEmployeeCanSetName = null;
  public showModalChooseManager = false;
  public selectedChooseManagerId = 0;
  public showAdvancedSearch = false;
  public isSearching = false; // loading state cho nút search

  @ViewChild(DatatableComponent) table: DatatableComponent;

  private tempData = [];
  private _unsubscribeAll: Subject<any>;
  public isUpdatingUrl = false;

  constructor(
    protected activatedRoute: ActivatedRoute,
    protected queryParamService: BaseQueryParamService,
    protected titleService: Title,
    private cdr: ChangeDetectorRef,
    private _service: AdministratorService,
    private _coreConfigService: CoreConfigService,
    private toastr: ToastrService,
    private translate: CoreTranslationService,
    private router: Router
  ) {
    super(activatedRoute, queryParamService, titleService);  // super phải đứng đầu
    this._unsubscribeAll = new Subject();
  }

  public createdRange: any; // [startDate, endDate]

  onDateRangeChange(event: any) {
    if (Array.isArray(event) && event.length === 2) {
      const [from, to] = event;
      this.filterUpdate(from, 'createdFrom');
      this.filterUpdate(to, 'createdTo');
    }
  }

  showSuccessToast(message: string, title = 'Thành công') {
    this.toastr.success(message, title);
  }

  showErrorToast(message: string, title = 'Thất bại') {
    this.toastr.error(message, title);
  }

  async onAssignRoleSave(event) {
    this.isAssignModalVisible = false
  }

  async onAssignModalClose() {
    this.isAssignModalVisible = false

  }

  async onAssignRoleCanSetSave(event) {
    this.isAssignModalCanSetVisible = false
  }

  async onAssignModalCanSetClose() {
    this.isAssignModalCanSetVisible = false

  }
  @ViewChild('idTemplate', { static: true }) idTemplate!: TemplateRef<any>;
  // @ViewChild('avatarTemplate', { static: true }) avatarTemplate!: TemplateRef<any>;
  @ViewChild('employeeTemplate', { static: true }) employeeTemplate!: TemplateRef<any>;
  @ViewChild('otherInfoTemplate', { static: true }) otherInfoTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<any>;
  @ViewChild('actionTemplate', { static: true }) actionTemplate!: TemplateRef<any>;
  public columns = [];
  ngAfterViewInit(): void {
    this.translate.onLangChange(event => {
      this.setColumn()
    });
    this.setColumn()
  }
  setColumn() {
    this.columns = [
      { name: this.translate.instant('COMMON.ID'), key: 'id', width: '10%', minWidth: 120, cellTemplate: this.idTemplate },
      { name: this.translate.instant('COMMON.EMPLOYEE_INFO'), key: 'employee_info', width: '30%', minWidth: 300, cellTemplate: this.employeeTemplate },
      { name: this.translate.instant('COMMON.OTHER_INFO'), key: 'other_info', width: '25%', minWidth: 220, cellTemplate: this.otherInfoTemplate },
      { name: this.translate.instant('COMMON.STATUS'), width: '10%', key: 'status', minWidth: 120, cellTemplate: this.statusTemplate },
      { name: this.translate.instant('COMMON.OPERATION'), key: 'operation', width: '25%', minWidth: 100, cellTemplate: this.actionTemplate },

    ];
    this.cdr.detectChanges();
  }
  async openModal(row: any, mode: 'view' | 'edit') {
    this.selectedAdmin = { ...row };
    this.modalMode = mode;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  public updating = false;
  async saveAdmin(updated) {
    try {
      this.updating = true
      if (updated.status || updated.status == 1) {
        updated.status = 1;
      }
      else {
        updated.status = 0;
      }
      let response = await this._service.update(updated);
      this.updating = false;
      if (response == null || !response.error || response.code == 'SUCCESS') {
        this.rows = this.rows.map(row =>
          row.id === response.data.id
            ? { ...row, ...response.data }
            : row
        );
        let message = this.translate.instant('ADMINISTRATOR.EDIT_SUCCESS');
        let successMsg = this.translate.instant('COMMON.SUCCESS');
        this.showSuccessToast(message, successMsg);
        this.cdr.detectChanges();
        this.closeModal();
        // this.fetchPage();
      }
    } catch (error) {
      console.log(error)
      this.updating = false;
    }
  }

  filterUpdate(event, type) {
    if (type == 'name') {
      this.name = event.target.value.trim().toLowerCase();
    }
    else if (type == 'phone') {
      this.phone = event.target.value.trim().toLowerCase();
    }
    else if (type == 'status') {
      this.isActive = event;
      //  this.fetchPage()
    } else if (type == 'createdFrom') {
      this.createdFrom = event;
    } else if (type == 'createdTo') {
      this.createdTo = event;
    }
  }
  private previousParams: any = null;
  public layoutAnimation = null;
  private firstLoad = true;
  async ngOnInit() {
    // Set page title
    this.setPageTitle(this.translate.instant('ADMINISTRATOR.TITLE') || 'Quản lý quản trị viên');

    // 1. Subscribe config chỉ để animation
    this._coreConfigService.config
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(config => {
        this.layoutAnimation = config.layout.animation;
      });

    // 2. Subscribe role list only once
    this._service.onListChange.pipe(takeUntil(this._unsubscribeAll)).subscribe(response => {
      this.rows = response;
      this.tempData = this.rows;
      this.total = this._service.totalCount;
      this.totalPage = this._service.totalPage;
      this.isSearching = false; // Tắt loading khi nhận được data
    });
    await this.getDepartments()
    await this.getPositions()
    await this.getWorkAreas()
    //await this.getAreas()
    this.initQueryParams(this.processParams.bind(this));
    // 3. Fetch page (với delay nếu animation = zoomIn)
  }
  public areas = [];

  async getAreas() {
    const response = await this._service.getAreas();
    this.areas = response.data.map(d => ({
      label: d.name,
      value: d.code
    }));
  }

  async processParams(params: any) {
    this.page = this.parseNum(params['page']) || 1;
    if (this.page < 1) {
      this.page = 1;
    }
    if (this.page > 10000) {
      this.page = 1;
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
          // this.router.navigate([], {
          //   queryParams: { ...params, page: 1 },
          //   replaceUrl: true
          // });
          // return;
        }
      }
    }

    this.timeType = params['timeType'] == 1 ? 1 : 0;

    this.selectedOption = this.sizeOptions.some(s => s.value == Number(params['size']))
      ? Number(params['size'])
      : 50;

    this.id = this.parseNum(params['id']);

    // Parse date strings from query params (format: YYYY-MM-dd)
    this.createdFrom = params['createdFrom'] || null;
    this.createdTo = params['createdTo'] || null;

    this.name = params['name'] || null;
    try {
      let number = Number(params['phone'])
      if (isNaN(number)) {
        throw new Error()
      }
      this.phone = params['phone'] || null;
    } catch (error) {
      this.phone = null;
    }
    this.isActive = params['isActive'] === 'true'
      ? true
      : params['isActive'] === 'false'
        ? false
        : null;

    // managerId
    const managerId = this.parseNum(params['managerId']);
    if (managerId) {
      try {
        const res = await this._service.getById(managerId);
        this.selectedUser = res;
        this.searchTextAutocomplete = res.user_name;
      } catch (_) { }
    }
    if (this.departments.find(d => d.value == params['department_id'])) {
      this.selectedDeparment = params['department_id'] || null;
    }
    if (this.workAreas.find(d => d.value == params['workAreaId'])) {
      this.selectedWorkArea = params['workAreaId'] || null;
    }
    if (this.areas.find(d => d.value == params['areaId'])) {
      this.selectedArea = params['areaId'] || null;
    }
    this.username = params['username'] || '';
    const fetch = () => {
      this._service.getDataTableRows(
        this.page,
        this.selectedOption,
        this.id,
        this.createdFrom,
        this.createdTo,
        this.name,
        this.phone,
        this.isActive,
        this.selectedUser ? this.selectedUser.id : null,
        this.selectedDeparment,
        this.selectedWorkArea,
        this.username,
        this.timeType,
        this.selectedArea
      );
    };

    if (this.layoutAnimation === 'zoomIn') {
      setTimeout(fetch, 450);
    } else {
      fetch();
    }

  }

  parseNum(v: any): number | null {
    const n = Number(v);
    return isNaN(n) ? null : n;
  }

  onTimeTypeChange(event) {
    this.timeType = event
  }
  public resetPage = false;
  async fetchPage() {
    // Bật loading state
    this.isSearching = true;
    
    // backend is 0-based, UI is 1-based
    const params: any = {};
    if (this.resetPage)
      this.page = 1
    if (this.page) params.page = this.page;

    this.resetPage = false;
    if (this.timeType != 0 && this.timeType != 1) {
      this.timeType = 0;
    }
    params.timeType = this.timeType;
    if (this.selectedOption) params.size = this.selectedOption;
    if (this.id) params.id = this.id;
    if (this.createdFrom) params.createdFrom = this.createdFrom;
    if (this.createdTo) params.createdTo = this.createdTo;
    if (this.name) params.name = this.name;
    if (this.phone) params.phone = this.phone;
    if (this.isActive != null) params.isActive = this.isActive;
    if (this.selectedArea) params.areaId = this.selectedArea;
    params.managerId = this.selectedUser ? this.selectedUser.id : null;
    if (this.selectedDeparment) params.department_id = this.selectedDeparment;
    if (this.selectedWorkArea) params.workAreaId = this.selectedWorkArea;
    if (this.username) params.username = this.username;
    // Cập nhật URL mà không reload trang
    try {
      // Pass date strings directly (format: YYYY-MM-dd) instead of timestamps
      await this._service.getDataTableRows(this.page, this.selectedOption, this.id ? Number(this.id) : null, this.createdFrom, this.createdTo, this.name, this.phone, this.isActive, this.selectedUser ? this.selectedUser.id : null, this.selectedDeparment, this.selectedWorkArea, this.username, this.timeType);
    } catch (error) {
      // Tắt loading nếu có lỗi (onListChange sẽ không emit khi có lỗi)
      this.isSearching = false;
      console.error('Error fetching data:', error);
    }
  }
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }).format(date);
  }
  onPageChange(newPage: number) {
    this.page = newPage;
    this.fetchPage();

    // console.log('pagechange1', this.page, this.isUpdatingUrl)

  }

  onPageSizeChange(event) {
    const val = parseInt(event, 10);
    if (!isNaN(val) && val > 0) {
      this.selectedOption = val;
      this.page = 1;
      this.fetchPage();
    }
  }
  public timeType = 0;
  public timeOpts = [{
    label: 'Thời gian tạo', value: 0
  }, {
    label: 'Thời gian cập nhật', value: 1
  }]
  public searchDepartment = '';
  public searchWorkArea = '';
  public searchArea = '';
  resetFilters() {
    //this.page = 1;
    this.resetPage = true;
    this.name = '';
    this.phone = '';
    this.isActive = null;
    this.selectedOption = 50
    this.username = ''
    this.id = null;
    this.createdFrom = null;
    this.createdTo = null;
    this.selectedUser = null;
    this.selectedWorkArea = null;
    this.selectedArea = null;
    this.selectedDeparment = null;
    this.searchTextAutocomplete = ''
    this.searchDepartment = '';
    this.searchWorkArea = '';
    this.timeType = 0;
    this.showAdvancedSearch = false; // Reset advanced search toggle on mobile
    this.childUserAutocomplete.clearSearch()
    // this.router.navigate([], {
    //   queryParams: {},       // xóa hết param
    //   replaceUrl: true       // thay thế URL hiện tại
    // });
    // this.fetchPage()

  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  async openModalChangeStatus(row: any) {
    this.selectedAdminChangeStatus = { ...row };
    this.showModalChangeStatus = true;
  }

  closeModalChangeStatus() {
    this.showModalChangeStatus = false;
  }

  public chaging = false;
  async changeStatus(updated) {
    try {
      this.chaging = true;
      await this._service.changeStatus(updated);
      this.chaging = false;
      let message = this.translate.instant('ADMINISTRATOR.CHANGE_STATUS_SUCCESS');
      let successMsg = this.translate.instant('COMMON.SUCCESS');
      this.showSuccessToast(message, successMsg);
      this.closeModalChangeStatus();
      this.fetchPage();
    } catch (error) {
      console.log(error)
      this.chaging = false;
    }
  }

  async saveManager(selectedUser: any, selectedAdminId: number) {
    this.showModalChooseManager = false;
    const index = this.rows.findIndex(r => r.id === selectedAdminId);
    if (index !== -1) {

      this.rows[index].manager_username = selectedUser.user_name;
    }
    // await this.fetchPage();
  }

  async openModalCreate() {
    this.showModalCreate = true;
  }

  closeModalCreate() {
    this.showModalCreate = false;
  }



  public creating = false;
  async create(created) {
    try {
      this.creating = true;
      if (created.status || created.status == 1) {
        created.status = 1;
      }
      else {
        created.status = 0;
      }
      let response = await this._service.create(created);
      this.creating = false;
      if (response == null || !response.error) {
        let message = this.translate.instant('ADMINISTRATOR.CREATE_SUCCESS');
        let successMsg = this.translate.instant('COMMON.SUCCESS');
        this.showSuccessToast(message, successMsg);
        this.closeModalCreate();
        this.page = 1;
        this.fetchPage();
      }
    } catch (error) {
      console.log(error)
      this.creating = false;
    }
  }

  @ViewChild(UserAutocompleteComponent) childUserAutocomplete!: UserAutocompleteComponent;
  @ViewChild(FormInputComponent) childFormInput!: FormInputComponent;
  selectedUser: any = ""
  departments = []
  workAreas = []

  selectedDeparment: string | null = null;
  selectedWorkArea: string | null = null;
  selectedArea: string | null = null;

  async getDepartments() {
    const response = await this._service.getDepartments();
    this.departments = response.data.map(d => ({
      label: d.name,
      value: d.short_name
    }));
  }
  public positions = [];
  async getPositions() {
    const response = await this._service.getPositions();
    this.positions = Object.entries(response.data).map(([key, value]) => ({
      label: value,        // "Bác sỹ"
      value: key           // "BAC_SI"
    }));
    console.log(this.positions)
  }

  async getWorkAreas() {
    const response = await this._service.getWorkAreas();
    this.workAreas = response.data.map(d => ({
      label: d.name,
      value: d.short_name
    }));

  }

  searchUsers = (searchText: string, page = 1): Promise<{ data: any[], hasMore: boolean }> => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        if (typeof searchText === 'string') {
          try {
            const pageSize = 20;
            const response = await this._service.searchAdmin(
              [],
              searchText,
              page 
            );

            resolve({
              data: response.data,
              hasMore: Array.isArray(response.data) && response.data.length >= pageSize
            });
          } catch (err) {
            resolve({ data: [], hasMore: false });
          }
        } else {
          resolve({ data: [], hasMore: false });
        }
      }, 300);
    });
  }

  @ViewChild(UserAutocompleteComponent) userAutocomplete!: UserAutocompleteComponent;

  /**
   * Callback khi chọn user từ autocomplete
   */
  onUserSelected = (user) => {
    this.selectedUser = user
  }

  /**
   * Thêm nhân viên vào nhóm
   */

  /**
   * Xóa nhân viên khỏi nhóm
 
 
  /**
   * Lọc danh sách nhân viên theo tên tìm kiếm
   */
  searchTextAutocomplete = "";

  toggleAdvancedSearch(): void {
    this.showAdvancedSearch = !this.showAdvancedSearch;
  }

}


