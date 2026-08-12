import { ChangeDetectorRef, Component, TemplateRef, ViewChild, type OnInit } from "@angular/core"
import { PermissionService } from "../permission.service"
import { ToastrService } from "ngx-toastr"
import { CoreTranslationService } from "@core/services/translation.service"
import { ActivatedRoute, Router } from "@angular/router"
import { Title } from "@angular/platform-browser"
import { BaseComponent } from "app/main/services/base.component"
import { BaseQueryParamService } from "app/main/services/base-query-param.service"
import { UserAutocompleteComponent } from 'app/main/components/autocomplete/user/user-autocomplete.component'
import { AdministratorService } from '../../administrators/administrator.service'

interface Permission {
  id: number
  name: string
  uri: string
  actions: string[]
}

interface PermissionGroup {
  id: number
  name: string
  uri: string
  permissions: Permission[]
}

interface UndefinedPermission {
  id: number
  name: string
  uri: string
  description: string
}

@Component({
  selector: "app-permissions-list",
  templateUrl: "./permission-list.component.html",
  styleUrls: ['./permission-list.component.scss']
})
export class PermissionsListComponent extends BaseComponent implements OnInit {
  activeTab: "defined" | "undefined" = "defined"

  // Tab 1: Defined Permissions
  allPermissions = []
  filteredPermissions = []
  searchName = ""
  searchUri = ""
  searchNameUnmapped = ""
  searchUriUnmapped = ""
  searchFilterParent = null;
  searchSkip = null;
  searchHidden = null;
  totalPages = 1
  page = 1
  size = 200
  pageUnmapped = 1
  sizeUnmapped = 50
  parentOptions = [
    { label: "Cấp cha", value: true },
    { label: "Cấp con", value: false }
  ]
  skipOptions = [
    { label: "Có", value: true },
    { label: "Không", value: false }
  ]
  hiddenOptions = [
    { label: "Có", value: true },
    { label: "Không", value: false }
  ]
  sizeOptions = [
    { label: '200', value: 200 },
    { label: '500', value: 500 },
    { label: '1000', value: 1000 }
  ]
  // Tab 2: Undefined Permissions
  allUnmapPermission = []
  filteredUndefinedPermissions = []
  searchNameUndefined = ""
  searchUriUndefined = ""
  totalPagesUndefined = 1
  public ttps = 0;
  public ttpsUnmapped = 0;
  public permissionsModal = [];
  public isSearching = false; // loading state cho nút search
  public selectedUser: any = null; // Admin được chọn để filter permissions
  public searchTextAutocomplete = ""; // Text trong autocomplete
  public showAdvancedSearch = false;
  private previousParams: any = null;
  constructor(
    protected activatedRoute: ActivatedRoute,
    protected queryParamService: BaseQueryParamService,
    protected titleService: Title,
    private _service: PermissionService,
    private _toastrService: ToastrService,
    private cdr: ChangeDetectorRef,
    private translate: CoreTranslationService,
    private router: Router,
    private _administratorService: AdministratorService
  ) {
    super(activatedRoute, queryParamService, titleService);
  }

  ngOnInit(): void {
    // Set page title
    this.setPageTitle(this.translate.instant('PERMISSION.TITLE') || 'Quản lý quyền');

    // Init query params
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

    this.size = this.sizeOptions.some(s => s.value == Number(params['size']))
      ? Number(params['size'])
      : 200;

    this.searchName = params['name'] || null;
    this.searchUri = params['uri'] || null;

    this.searchFilterParent = params['filterParent'] === 'true'
      ? true
      : params['filterParent'] === 'false'
        ? false
        : null;
    this.searchSkip = params['skip'] === 'true'
      ? true
      : params['skip'] === 'false'
        ? false
        : null;
    this.searchHidden = params['hidden'] === 'true'
      ? true
      : params['hidden'] === 'false'
        ? false
        : null;

    // Load selectedUser from adminId param
    const adminId = this.parseNum(params['adminId']);
    if (adminId && (!this.selectedUser || this.selectedUser.id !== adminId)) {
      try {
        const res: any = await this._administratorService.getById(adminId);
        // getById có thể trả về response.data hoặc trực tiếp Administrator
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

    // Fetch data
    this.fetch({
      name: this.searchName,
      uri: this.searchUri,
      page: this.page,
      size: this.size,
      hidden: this.searchHidden,
      skip: this.searchSkip,
      filterParent: this.searchFilterParent,
      adminId: this.selectedUser ? this.selectedUser.id : null
    });
  }

  parseNum(v: any): number | null {
    const n = Number(v);
    return isNaN(n) ? null : n;
  }

  @ViewChild('infoTemplate', { static: true }) infoTemplate!: TemplateRef<any>;
  @ViewChild('functionTemplate', { static: true }) functionTemplate!: TemplateRef<any>;
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
      { name: this.translate.instant('PERMISSION.FUNCTION_NAME'), key: 'info', width: '40%', cellTemplate: this.infoTemplate },
      { name: this.translate.instant('PERMISSION.FUNCTION'), key: 'function', width: '40%', cellTemplate: this.functionTemplate },
      { name: this.translate.instant('COMMON.OPERATION'), key: 'action', width: '20%', cellTemplate: this.actionTemplate }
    ];
    ;
    this.cdr.detectChanges();
  }

  async fetch(body) {
    try {
      let response = await this._service.getDataTableRows(body);
      const content = (response && response.data && response.data.result.content !== undefined) ? response.data.result.content : response.data;
      this.allPermissions = (Array.isArray(content) ? content : [content]) as any[];
      this.allPermissions = this.allPermissions.map(parent => ({
        ...parent,
        children: parent.children.filter(child => child.id !== parent.id)
      }));
      this.totalPages = response.data.total
      this.ttps = response.data.result.totalPages
      this.isSearching = false; // Tắt loading khi nhận được data
    } catch (error) {
      this.isSearching = false; // Tắt loading nếu có lỗi
      console.error('Error fetching permissions:', error);
      throw error;
    }
  }

  async loadPermissions() {
    try {
      if (this.resetPage)
        this.page = 1

      this.resetPage = false;
      // Service sẽ tự động push queryParams
      await this.fetch({
        name: this.searchName,
        uri: this.searchUri,
        page: this.page,
        size: this.size,
        hidden: this.searchHidden,
        skip: this.searchSkip,
        filterParent: this.searchFilterParent,
        adminId: this.selectedUser ? this.selectedUser.id : null
      });
    } catch (error) {
      this.isSearching = false; // Tắt loading nếu có lỗi
      console.log(error)
    }
    // this.allPermissions = [
    //   {
    //     id: 1,
    //     name: "Danh sách thành phố 1231",
    //     uri: "/cservice/city/",
    //     permissions: [
    //       {
    //         id: 101,
    //         name: "Clone City",
    //         uri: "/cservice/city/clone_city",
    //         actions: ["Clone City (/cservice/city/clone_city)"],
    //       },
    //       {
    //         id: 102,
    //         name: "Clone District",
    //         uri: "/cservice/city/clone_district",
    //         actions: ["Clone District (/cservice/city/clone_district)"],
    //       },
    //       {
    //         id: 103,
    //         name: "Clone danh sách Phường/Xã bên Shipchung",
    //         uri: "/cservice/city/clone_ward",
    //         actions: ["Clone danh sách Phường/Xã bên Shipchung (/cservice/city/clone_ward)"],
    //       },
    //       {
    //         id: 104,
    //         name: "Lấy thông tin thành phố",
    //         uri: "/cservice/city/get",
    //         actions: ["Lấy thông tin thành phố (/cservice/city/get)"],
    //       },
    //       {
    //         id: 105,
    //         name: "Sửa thông tin thành phố",
    //         uri: "/cservice/city/edit",
    //         actions: ["Sửa thông tin thành phố (/cservice/city/edit)"],
    //       },
    //       {
    //         id: 106,
    //         name: "Sửa thông tin quận/huyện",
    //         uri: "/cservice/city/district/edit",
    //         actions: ["Sửa thông tin quận/huyện (/cservice/city/district/edit)"],
    //       },
    //       {
    //         id: 107,
    //         name: "Sửa thông tin phường/xã",
    //         uri: "/cservice/city/ward/edit",
    //         actions: ["Sửa thông tin phường/xã (/cservice/city/ward/edit)"],
    //       },
    //       {
    //         id: 108,
    //         name: "Xóa quận/huyện",
    //         uri: "/cservice/city/district/del",
    //         actions: ["Xóa quận/huyện (/cservice/city/district/del)"],
    //       },
    //       {
    //         id: 109,
    //         name: "Xóa phường/xã",
    //         uri: "/cservice/city/ward/del",
    //         actions: ["Xóa phường/xã (/cservice/city/ward/del)"],
    //       },
    //       {
    //         id: 110,
    //         name: "Danh sách Quận/Huyện theo CityId",
    //         uri: "/cservice/city/districts",
    //         actions: ["Danh sách Quận/Huyện theo CityId (/cservice/city/districts)", "Bắt buộc"],
    //       },
    //     ],
    //   },
    //   {
    //     id: 2,
    //     name: "Quản trị nhóm quyền",
    //     uri: "/cservice/role/",
    //     permissions: [
    //       {
    //         id: 201,
    //         name: "Sửa thông tin nhóm quyền",
    //         uri: "/cservice/role/edit",
    //         actions: ["Sửa thông tin nhóm quyền (/cservice/role/edit)"],
    //       },
    //       {
    //         id: 202,
    //         name: "Cấp quyền cho nhóm",
    //         uri: "/cservice/role/mapPermissionToRole",
    //         actions: ["Cấp quyền cho nhóm (/cservice/role/mapPermissionToRole)"],
    //       },
    //       {
    //         id: 203,
    //         name: "Lấy tất cả nhóm quyền",
    //         uri: "/cservice/role/getRolePermissionActive",
    //         actions: ["Lấy tất cả nhóm quyền (/cservice/role/getRolePermissionActive)"],
    //       },
    //       {
    //         id: 204,
    //         name: "Thêm nhóm quyền mới",
    //         uri: "/cservice/role/add",
    //         actions: ["Thêm nhóm quyền mới (/cservice/role/add)"],
    //       },
    //     ],
    //   },
    //   {
    //     id: 3,
    //     name: "Quản lý ngân hàng",
    //     uri: "/cservice/systembank/",
    //     permissions: [
    //       {
    //         id: 301,
    //         name: "Cấp nhật ngân hàng",
    //         uri: "/cservice/systembank/edit",
    //         actions: ["Cấp nhật ngân hàng (/cservice/systembank/edit)"],
    //       },
    //       {
    //         id: 302,
    //         name: "Thay đổi trạng thái",
    //         uri: "/cservice/systembank/changeActive",
    //         actions: ["Thay đổi trạng thái (/cservice/systembank/changeActive)"],
    //       },
    //       {
    //         id: 303,
    //         name: "Tạo dữ liệu mặc định",
    //         uri: "/cservice/systembank/createDataDefault",
    //         actions: ["Tạo dữ liệu mặc định (/cservice/systembank/createDataDefault)"],
    //       },
    //       {
    //         id: 304,
    //         name: "Thêm mới ngân hàng",
    //         uri: "/cservice/systembank/add",
    //         actions: ["Thêm mới ngân hàng (/cservice/systembank/add)"],
    //       },
    //       {
    //         id: 305,
    //         name: "Lấy ngân hàng",
    //         uri: "/cservice/systembank/get",
    //         actions: ["Lấy ngân hàng (/cservice/systembank/get)"],
    //       },
    //       {
    //         id: 306,
    //         name: "Danh sách ngân hàng",
    //         uri: "/cservice/systembank/",
    //         actions: ["Danh sách ngân hàng (/cservice/systembank/)"],
    //       },
    //       {
    //         id: 307,
    //         name: "Xóa ngân hàng",
    //         uri: "/cservice/systembank/delete",
    //         actions: ["Xóa ngân hàng (/cservice/systembank/delete)"],
    //       },
    //     ],
    //   },
    // ]

  }

  async loadUnmapPermission() {
    try {
      let response = await this._service.getPermissionUnmap(this.pageUnmapped - 1, this.sizeUnmapped, this.searchNameUnmapped, this.searchUriUnmapped);
      const data = (response && response.content !== undefined) ? response.content : response;
      const content = data.data;
      this.allUnmapPermission = (Array.isArray(content) ? content : [content]) as any[];
      this.totalPagesUndefined = response.totalElements;
      this.ttpsUnmapped = response.totalPages
      this.isSearching = false; // Tắt loading khi nhận được data
    } catch (error) {
      this.isSearching = false; // Tắt loading nếu có lỗi
      console.error('Error fetching unmapped permissions:', error);
    }
  }

  onPageSizeChange(event) {
    const val = parseInt(event, 10);
    if (!isNaN(val) && val > 0) {
      this.size = val;
      this.page = 1;
      this.loadPermissions();
    }
  }

  onPageSizeUnmappedChange(event) {
    const val = parseInt(event, 10);
    if (!isNaN(val) && val > 0) {
      this.size = val;
      this.page = 1;
      this.loadUnmapPermission();
    }
  }

  onPageChange(newPage: number) {
    if (this.activeTab == 'defined') {
      this.page = newPage;
      this.loadPermissions();
    }
    else {
      this.pageUnmapped = newPage;
      this.loadUnmapPermission()
    }
  }

  switchTab(tab: "defined" | "undefined"): void {
    this.activeTab = tab
  }



  search(): void {
    // Bật loading state
    this.isSearching = true;
    this.resetPage = true;
    if (this.activeTab == 'defined') {
      this.loadPermissions();
    }
    else {
      this.loadUnmapPermission();
    }
  }
  public resetPage = false;
  resetSearch(): void {
    if (this.activeTab == 'defined') {
      this.searchName = '';
      this.searchUri = '';
      this.searchHidden = null;
      this.searchSkip = null;
      this.searchFilterParent = null;
      this.selectedUser = null;
      this.searchTextAutocomplete = '';
      this.showAdvancedSearch = false; // Reset advanced search toggle on mobile
      if (this.childUserAutocomplete) {
        this.childUserAutocomplete.clearSearch();
      }
      // this.page = 1;
      this.resetPage = true;
      this.size = 200;
      //this.loadPermissions();
    }

  }

  toggleAdvancedSearch(): void {
    this.showAdvancedSearch = !this.showAdvancedSearch;
  }
  mapMode = '';
  isMapModalVisible = false;
  mapModalUri = '';

  // mở modal
  openMapPermissionsModal(uri) {
    this.isMapModalVisible = true;
    this.mapModalUri = uri;
  }

  openMapPermissionsEditModal(group) {
    let allFunctions = [];
    allFunctions.push({
      uri: group.uri,
      method: group.method,
      name: group.name,
      parent: group.parent_id == 0,
      hidden: group.hidden,
      skip: group.skip,
      id: group.id,
      parent_id: 0
    })
    for (let j = 0; j < group.children.length; j++) {
      allFunctions.push({
        uri: group.children[j].uri,
        method: group.children[j].method,
        name: group.children[j].name,
        parent: false,
        hidden: group.children[j].hidden,
        skip: group.children[j].skip,
        id: group.children[j].id,
        parent_id: group.children[j].parent_id
      })
    }

    this.permissionsModal = allFunctions;
    console.log(this.permissionsModal)
    this.isMapModalVisible = true;
  }

  // khi modal đóng mà không lưu
  onMapModalClose() {
    this.isMapModalVisible = false;
  }

  // khi modal bấm lưu
  onMapModalSave(event: any) {
    // ví dụ:
    // event = {
    //   category: "helpCategory",
    //   functions: [ ... danh sách function được chọn ... ],
    //   systemHasParent: false
    // }

    // Sau đó bạn có thể gọi API để lưu quyền ở đây
    this.isMapModalVisible = false;
    setTimeout(() => {
      this.loadUnmapPermission()
      this.loadPermissions()
    }, 300)
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

  showSuccessToast(message: string, title = 'Thành công') {
    this._toastrService.success(message, title, {
      closeButton: true,
      tapToDismiss: false,
      progressBar: true,
      toastClass: 'toast ngx-toastr toast-success',
      positionClass: 'toast-top-right'
    });
  }

  showErrorToast(message: string, title = 'Thất bại') {
    this._toastrService.error(message, title, {
      closeButton: true,
      tapToDismiss: false,
      progressBar: true,
      toastClass: 'toast ngx-toastr toast-error',
      positionClass: 'toast-top-right'

    });
  }

  public deleting = false;
  async handleConfirm() {
    try {
      if (this.confirmAction) this.confirmAction();
      this.deleting = true;
      let response = await this._service.deletePermission(this.deleteId);
      if (response == null || !response.error) {
        this.deleting = false;
        this.confirmVisible = false;
        this.showSuccessToast('Xóa quyền thành công');
        // Reload danh sách permissions sau khi xóa thành công
        setTimeout(() => {
          this.loadPermissions();
        }, 300);
      } else {
        this.confirmVisible = false;
        this.showErrorToast('Xóa quyền thất bại');
      }
    } catch (error) {
      console.log(error);
      this.confirmVisible = false;
      this.showErrorToast('Xóa quyền thất bại');
    }
  }
  deleteId = 0;

  removeFunction(group, row) {
    console.log(row)
    this.deleteId = row.id
    this.openConfirm(
      'danger',
      'Xóa quyền',
      `Bạn có chắc chắn muốn xóa "${row.name}" khỏi danh sách không?`,
      () => {
        group.children = group.children.filter(child => child.id !== row.id);
        setTimeout(() => {
          this.loadUnmapPermission()
        }, 300)
      }
    );
  }

  /**
   * Xóa quyền (cha hoặc con)
   */
  deletePermission(permission: any) {
    this.deleteId = permission.id;
    const permissionName = permission.name || 'quyền này';
    this.openConfirm(
      'danger',
      'Xóa quyền',
      `Bạn có chắc chắn muốn xóa "${permissionName}" không?`,
      () => {
        // Nếu là quyền con, loại bỏ khỏi danh sách children của quyền cha
        if (permission.parent_id && permission.parent_id > 0) {
          const parentPermission = this.allPermissions.find(p => p.id === permission.parent_id);
          if (parentPermission && parentPermission.children) {
            parentPermission.children = parentPermission.children.filter(child => child.id !== permission.id);
          }
        } else {
          // Nếu là quyền cha, loại bỏ khỏi danh sách chính
          this.allPermissions = this.allPermissions.filter(p => p.id !== permission.id);
        }
      }
    );
  }

  @ViewChild(UserAutocompleteComponent) childUserAutocomplete!: UserAutocompleteComponent;

  /**
   * Search function for user autocomplete
   */
  searchUsers = (searchText: string, page = 1): Promise<{ data: any[], hasMore: boolean }> => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        if (typeof searchText === 'string') {
          try {
            const pageSize = 20;
            const response = await this._administratorService.searchAdmin(
              [],
              searchText,
              page - 1
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

  /**
   * Callback khi chọn user từ autocomplete
   */
  onUserSelected = (user) => {
    this.selectedUser = user;
  }

  // Modal quản lý nhóm quyền
  public showRolesModal = false;
  public selectedPermission: any = null;
  public selectedPermissionId: number | null = null;

  /**
   * Mở modal quản lý nhóm quyền cho permission
   */
  openRolesModal(permission: any) {
    this.selectedPermission = permission;
    // Lấy permission ID từ permission (parent permission)
    let permissionId = permission.id;
    
    // Nếu không có ID trực tiếp, thử lấy từ children
    if (!permissionId && permission.children && permission.children.length > 0) {
      permissionId = permission.children[0].id;
    }
    
    if (permissionId) {
      this.selectedPermissionId = permissionId;
      this.showRolesModal = true;
    } else {
      this.showErrorToast('Không tìm thấy ID của quyền', 'Lỗi');
    }
  }

  /**
   * Đóng modal roles
   */
  closeRolesModal() {
    this.showRolesModal = false;
    this.selectedPermission = null;
    this.selectedPermissionId = null;
  }

  /**
   * Callback khi modal roles lưu thành công
   */
  onRolesModalSave() {
    // Có thể reload danh sách permissions nếu cần
    // this.loadPermissions();
  }

}
