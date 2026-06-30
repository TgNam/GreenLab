import { ChangeDetectorRef, Component, NgZone, OnInit, SimpleChanges, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CoreConfigService } from '@core/services/config.service';
import { CoreSidebarService } from '@core/components/core-sidebar/core-sidebar.service';

import { RoleService } from '../role.service';
import { ToastrService } from 'ngx-toastr';
import { CoreTranslationService } from '@core/services/translation.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { UserAutocompleteComponent } from 'app/main/components/autocomplete/user/user-autocomplete.component';
import { BaseComponent } from 'app/main/services/base.component';
import { BaseQueryParamService } from 'app/main/services/base-query-param.service';
declare const feather: any;
@Component({
  selector: 'app-role-list',
  templateUrl: './role-list.component.html',
  styleUrls: ['./role-list.component.scss']
})
export class RoleListComponent extends BaseComponent implements OnInit {
  public sidebarToggleRef = false;
  public rows;
  public selectedOption = 50;
  public ColumnMode = ColumnMode;
  public temp = [];
  public selectedAdmin = null;
  public searchValue = '';
  public showModal = false;
  public modalMode: 'view' | 'edit' = 'view';

  public showModalChangeStatus = false;
  public selectedAdminChangeStatus;

  public showModalCreate = false;
  public isAssignModalVisible = false;
  public selectedEmployeeId = null;
  public selectedEmployeeName = null;
  public totalPage: any = 0;
  public selectedUser: any = null;
  public searchTextAutocomplete = "";
  public showAdvancedSearch = false;
  public isSearching = false; // loading state cho nút search
  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild(UserAutocompleteComponent) childUserAutocomplete!: UserAutocompleteComponent;

  private tempData = [];
  private _unsubscribeAll: Subject<any>;
  statusOptions = [
    { label: 'Hoạt động', value: true },
    { label: 'Ngừng hoạt động', value: false }
  ]
  sizeOptions = [
    { label: '50', value: 50 },
    { label: '100', value: 100 },
    { label: '200', value: 200 },
    { label: '500', value: 500 }
  ]

  constructor(
    protected activatedRoute: ActivatedRoute,
    protected queryParamService: BaseQueryParamService,
    protected titleService: Title,
    private _roleService: RoleService,
    private _coreSidebarService: CoreSidebarService,
    private _coreConfigService: CoreConfigService, 
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private translate: CoreTranslationService,
    private zone: NgZone,
    private router: Router
  ) {
    super(activatedRoute, queryParamService, titleService);
    this._unsubscribeAll = new Subject();
  }

  public page = 1;
  public id = null;
  public createdFrom: string | null = null; // Changed to string format YYYY-MM-dd
  public createdTo: string | null = null; // Changed to string format YYYY-MM-dd
  public name = null;
  public description = "";
  public isActive = null;
  public total = 0;
  public timeType = 0;
  public adminId = null;
  public timeOpts = [{
    label: 'Thời gian tạo', value: 0
  }, {
    label: 'Thời gian cập nhật', value: 1
  }]
  async fetchPage() {
    // Bật loading state
    this.isSearching = true;
    
    if (this.resetPage) {
      this.page = 1;
    }
    this.resetPage = false;
    
    if (this.timeType != 0 && this.timeType != 1) {
      this.timeType = 0;
    }

    // Service sẽ tự động push queryParams lên URL
    try {
      await this._roleService.getDataTableRows(
        this.page, // backend is 0-based, UI is 1-based
        this.selectedOption,
        this.id,
        this.createdFrom,
        this.createdTo,
        this.name,
        this.description,
        this.isActive,
        this.timeType,
        this.selectedUser ? this.selectedUser.id : null
      );
    } catch (error) {
      // Tắt loading nếu có lỗi
      this.isSearching = false;
      console.error('Error fetching data:', error);
    }
  }

  @ViewChild('idTemplate', { static: true }) idTemplate!: TemplateRef<any>;
  @ViewChild('infomationTemplate', { static: true }) infomationTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<any>;
  @ViewChild('actionTemplate', { static: true }) actionTemplate!: TemplateRef<any>;
  public columns = [];
  ngAfterViewInit(): void {

    this.translate.onLangChange(event => {
      this.setColumn()
    });
    this.setColumn()
    feather.replace();
  }
  setColumn() {
    this.columns = [
      { name: this.translate.instant('COMMON.INFO'), key: 'info', width: '40%', cellTemplate: this.infomationTemplate },
      { name: this.translate.instant('COMMON.STATUS'), key: 'status', width: '20%', cellTemplate: this.statusTemplate },
      { name: this.translate.instant('COMMON.OPERATION'), width: '40%', key: 'operation', cellTemplate: this.actionTemplate },
    ];
    this.cdr.detectChanges();
  }

  onPageChange(newPage: number) {
    this.page = newPage;
    this.fetchPage();
  }

  onPageSizeChange(event) {
    const val = parseInt(event, 10);
    if (!isNaN(val) && val > 0) {
      this.selectedOption = val;
      this.page = 1;
      this.fetchPage();
    }
  }
  public resetPage = false;
  resetFilters() {
    this.resetPage = true;
    this.name = '';
    this.description = '';
    this.isActive = null;
    this.selectedOption = 50
    this.id = null;
    this.createdFrom = null;
    this.createdTo = null;
    this.timeType = 0;
    this.selectedUser = null;
    this.searchTextAutocomplete = '';
    this.showAdvancedSearch = false; // Reset advanced search toggle on mobile
    if (this.childUserAutocomplete) {
      this.childUserAutocomplete.clearSearch();
    }
    // this.fetchPage()
  }

  toggleAdvancedSearch(): void {
    this.showAdvancedSearch = !this.showAdvancedSearch;
  }

  showSuccessToast(message: string, title = 'Thành công') {
    this.toastr.success(message, title);
  }

  showErrorToast(message: string, title = 'Thất bại') {
    this.toastr.error(message, title);
  }

  filterUpdate(event, type) {
    if (type == 'name') {
      this.name = event.target.value.trim().toLowerCase();
    }
    else if (type == 'description') {
      this.description = event.target.value.trim().toLowerCase();
    }
    else if (type == 'status') {
      this.isActive = event;
    } else if (type == 'id') {
      this.id = event.target.value
    } else if (type == 'createdFrom') {
      this.createdFrom = event;
    } else if (type == 'createdTo') {
      this.createdTo = event;
    }
  }

  toggleSidebar(name): void {
    this._coreSidebarService.getSidebarRegistry(name).toggleOpen();
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['rows']) {
      setTimeout(() => feather.replace(), 0);
    }
  }
  public layoutAnimation = null;
  private previousParams: any = null;
  
  ngOnInit(): void {
    // Set page title
    this.setPageTitle(this.translate.instant('ROLE.TITLE') || 'Quản lý nhóm quyền');

    // 1. Subscribe config chỉ để animation
    this._coreConfigService.config
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(config => {
        this.layoutAnimation = config.layout.animation;
      });

    // 2. Subscribe role list only once
    this._roleService.onListChange
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(response => {
        this.rows = response;
        this.tempData = response;
        this.total = this._roleService.totalCount;
        this.totalPage = this._roleService.totalPage;
        this.isSearching = false; // Tắt loading khi nhận được data
      });

    // 3. Init query params
    this.initQueryParams(this.processParams.bind(this));
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
        }
      }
    }

    this.timeType = params['timeType'] == 1 ? 1 : 0;

    this.selectedOption = this.sizeOptions.some(s => s.value == Number(params['size']))
      ? Number(params['size'])
      : 50;

    this.id = this.parseNum(params['id']);
    
    // Parse date strings from query params (format: YYYY-MM-dd)
    this.createdFrom = params['createdTimeFrom'] || null;
    this.createdTo = params['createdTimeTo'] || null;
    
    this.name = params['name'] || null;
    this.description = params['description'] || null;
    this.isActive = params['isActive'] === 'true'
      ? true
      : params['isActive'] === 'false'
        ? false
        : null;

    // Load selectedUser from adminId param
    const adminId = this.parseNum(params['adminId']);
    if (adminId && (!this.selectedUser || this.selectedUser.id !== adminId)) {
      try {
        const res = await this._roleService.getAdministratorById(adminId);
        // getAdministratorById có thể trả về response.data hoặc trực tiếp Administrator
        const adminData = res?.data || res;
        if (adminData && adminData.id) {
          this.selectedUser = adminData;
          this.searchTextAutocomplete = adminData.user_name || adminData.full_name || '';
        } else {
          this.selectedUser = null;
          this.searchTextAutocomplete = '';
        }
      } catch (_) {
        this.selectedUser = null;
        this.searchTextAutocomplete = '';
      }
    } else if (!adminId) {
      this.selectedUser = null;
      this.searchTextAutocomplete = '';
    }

    // Fetch data - Service sẽ tự động push queryParams lên URL
    const fetch = async () => {
      try {
        await this._roleService.getDataTableRows(
          this.page,
          this.selectedOption,
          this.id,
          this.createdFrom,
          this.createdTo,
          this.name,
          this.description,
          this.isActive,
          this.timeType,
          adminId || (this.selectedUser ? this.selectedUser.id : null)
        );
      } catch (error) {
        this.isSearching = false;
        console.error('Error fetching data:', error);
      }
    };

    if (this.layoutAnimation === 'zoomIn') {
      setTimeout(fetch, 450);
    } else {
      fetch();
    }
  }

  onTimeTypeChange(event) {
    this.timeType = event
  }

  parseNum(v: any): number | null {
    const n = Number(v);
    return isNaN(n) ? null : n;
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  async openModal(row: any, mode: 'view' | 'edit') {
    this.selectedAdmin = { ...row };
    this.modalMode = mode;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  public isUpdating = false;
  async saveAdmin(updated) {
    try {
      this.isUpdating = true;
      let response = await this._roleService.updateRole(updated);
      this.isUpdating = false;
      if (response == null || !response.error || response.code == 'SUCCESS') {
        const index = this.rows.findIndex(r => r.id === response.data.id);
        if (index !== -1) {
          Object.assign(this.rows[index], response.data);
        }
        let message = this.translate.instant('ROLE.EDIT_SUCCESS');
        let successMsg = this.translate.instant('COMMON.SUCCESS');
        this.showSuccessToast(message, successMsg);
        this.closeModal();
       // this.fetchPage();
      }
    } catch (error) {
      console.log(error)
      this.isUpdating = false;
    }
  }

  async openModalChangeStatus(row: any) {
    this.selectedAdminChangeStatus = { ...row };
    this.showModalChangeStatus = true;
  }

  closeModalChangeStatus() {
    this.showModalChangeStatus = false;
  }

  public changing = false;
  async changeStatus(updated) {
    try {
      this.changing = true;
      let response = await this._roleService.changeStatus(updated);
      this.changing = false;
      if (response == null || !response.error) {
        let message = this.translate.instant('ROLE.CHANGE_STATUS_SUCCESS');
        let successMsg = this.translate.instant('COMMON.SUCCESS');
        this.showSuccessToast(message, successMsg);
        this.closeModalChangeStatus();
        this.fetchPage();
      }
    } catch (error) {
      console.log(error)
      this.changing = false;
    }
  }

  async openModalCreate() {
    this.showModalCreate = true;
  }

  closeModalCreate() {
    this.showModalCreate = false;
  }
  public isCreating = false
  public creatingRole = {
    name: '',
    description: '',
    active: true,
    position: 0

  }
  async create(created) {
    try {
      this.isCreating = true;
      let response = await this._roleService.createRole(created);
      this.isCreating = false;
      if (response == null || !response.error) {
        this.creatingRole = {
          name: '',
          description: '',
          active: true,
          position: 0

        }
        let message = this.translate.instant('ROLE.CREATE_SUCCESS');
        let successMsg = this.translate.instant('COMMON.SUCCESS');
        this.showSuccessToast(message, successMsg);
        this.closeModalCreate();
        this.fetchPage();
      }
    } catch (error) {
      console.log(error)
      this.isCreating = false;
    }
  }

  showAssignPermission = false
  selectedGroupName = "Nhóm quản trị viên"
  selectedGroupNameId = 0;
  showPermissionDialog(row) {
    this.showAssignPermission = true
    this.selectedGroupNameId = row.id;
    this.selectedGroupName = row.name;
  }

  onPermissionClose() {
    this.showAssignPermission = false
  }
  public assigning = false;
  async onPermissionSave(event: any) {
    try {
      this.assigning = true;
      let response = await this._roleService.updatePermission(this.selectedGroupNameId, event.permissions)
      this.assigning = false;
      if (response == null || !response.error) {
        this.showAssignPermission = false
        let message = this.translate.instant('ROLE.ASSIGN_PERMISSION_SUCCESS');
        let successMsg = this.translate.instant('COMMON.SUCCESS');
        this.showSuccessToast(message, successMsg);
      }
    //  this.fetchPage()
    } catch (error) {
      console.log(error)
      this.assigning = false;

    }
    // 👉 event = {
    //   group: "Nhóm quản trị viên",
    //   permissions: [
    //     [ { groupId: '1', permissionId: '1-2', name: 'Lấy thông tin của 1 nhóm quyền' } ],
    //     [ { groupId: '2', permissionId: '2-4', name: 'Dán quyền' } ]
    //   ]
    // }
  }

  showModalMember = false
  groupMemberId = 0;
  groupMemberName = "";

  openMemberModal(row) {
    this.showModalMember = true
    this.groupMemberId = row.id;
    this.groupMemberName = row.name;
  }

  closeMemberModal() {
    this.showModalMember = false
  }

  saveMembers(members: any[]) {
    this.fetchPage()
    this.closeModal()
  }

  async cloneRole(roleId) {
    try {
      let response = await this._roleService.cloneRole(roleId);
      if (response == null || !response.error) {
        let message = this.translate.instant('ROLE.CLONE_SUCCESS');
        let successMsg = this.translate.instant('COMMON.SUCCESS');
        this.showSuccessToast(message, successMsg);
        this.fetchPage()
      }
    } catch (error) {
      console.log(error);
    }
  }


  confirmVisible = false;
  confirmType: 'danger' | 'primary' = 'danger';
  confirmMessage = '';
  confirmHeader = '';
  confirmAction: (() => void) | null = null;

  openConfirm(type: 'danger' | 'primary', header: string, message: string, action: () => void) {
    this.confirmType = type;
    this.confirmHeader = header;
    this.confirmMessage = message;
    this.confirmAction = action;
    this.confirmVisible = true;
  }

  handleCancel() {
    this.confirmVisible = false;
  }

  public deleting = false;
  async handleConfirm() {
    try {
      this.deleting = true;
      if (this.confirmAction) this.confirmAction();
      let response = await this._roleService.deleteRole(this.deleteId);
      this.confirmVisible = false;
      this.deleting = false;
      if (response == null || !response.error) {
        let message = this.translate.instant('ROLE.DELETE_SUCCESS');
        let successMsg = this.translate.instant('COMMON.SUCCESS');
        this.showSuccessToast(message, successMsg);
      }
    } catch (error) {
      console.log(error);
      this.deleting = false;
    }
  }
  deleteId = 0;

  removeFunction(row) {
    this.deleteId = row.id
    this.openConfirm(
      'danger',
      'Xóa quyền',
      `Bạn có chắc chắn muốn xóa nhóm quyền "${row.name}" khỏi danh sách không?`,
      () => {
        this.fetchPage()
      }
    );
  }

  /**
   * Search function for user autocomplete
   */
  searchUsers = (searchText: string, page = 1): Promise<{ data: any[], hasMore: boolean }> => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        if (typeof searchText === 'string') {
          try {
            const pageSize = 20;
            const response = await this._roleService.searchAdmin(
              [],
              searchText,
              page
            );

            resolve({
              data: response.data,
              hasMore: response.data.length >= pageSize
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

  /**
   * Callback khi chọn user từ autocomplete
   */
  onUserSelected = (user) => {
    this.selectedUser = user;
  }
}


