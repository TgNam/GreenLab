import { Component, Input, Output, EventEmitter, SimpleChanges, HostListener, OnInit, OnDestroy } from '@angular/core';
import { PermissionService } from '../permission.service';
import { ToastrService } from 'ngx-toastr';
import { CoreTranslationService } from '@core/services/translation.service';

interface Role {
  id: number;
  name: string;
  description: string;
}

interface Administrator {
  id: number;
  full_name: string;
  user_name: string;
  email: string;
  phone: string;
  photo: string;
  status: number;
}

@Component({
  selector: 'app-permission-roles-modal',
  templateUrl: './permission-roles-modal.component.html',
  styleUrls: ['./permission-roles-modal.component.scss']
})
export class PermissionRolesModalComponent implements OnInit, OnDestroy {
  @Input() visible = false;
  @Input() permissionId: number | null = null;
  @Input() permissionName = '';

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  roles: Role[] = [];
  filteredRoles: Role[] = [];
  searchText = '';
  isLoading = false;
  isAddingRole = false;
  isMobile = false;

  // Modal thêm quyền vào nhóm quyền
  showAddRoleModal = false;
  allRoles: Role[] = [];
  selectedRoleId: number | null = null;
  searchRoleText = '';

  // Modal xem nhân viên
  showEmployeesModal = false;
  selectedRole: Role | null = null;
  employees: Administrator[] = [];
  loadingEmployees = false;
  searchEmployeeText = '';

  // Modal xác nhận xóa
  confirmVisible = false;
  confirmType: 'danger' | 'primary' = 'danger';
  confirmMessage = '';
  confirmHeader = '';
  roleToRemove: Role | null = null;

  constructor(
    private _service: PermissionService,
    private toastr: ToastrService,
    private translate: CoreTranslationService
  ) {
    this.checkMobile();
  }

  ngOnInit(): void {
    this.checkMobile();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.checkMobile();
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth < 768;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && changes['visible'].currentValue) {
      this.resetModal();
      if (this.permissionId) {
        this.loadRoles().then(() => {
          // Sau khi load roles xong, load allRoles và lọc bỏ các role đã có
          this.loadAllRoles();
        });
      }
    }
  }

  selectOpen() {
    // Target vào modal "thêm quyền" cụ thể (có class permission-role-add-modal)
    const addRoleModal = document.querySelector('.permission-role-add-modal');
    if (addRoleModal) {
      const modalContent = addRoleModal.querySelector('.modal-content');
      const modalBody = addRoleModal.querySelector('.modal-body');

      if (modalContent) modalContent.classList.add('modal-content-no-overflow');
      if (modalBody) modalBody.classList.add('modal-body-scroll');
    }
  }

  selectClose() {
    // Target vào modal "thêm quyền" cụ thể (có class permission-role-add-modal)
    const addRoleModal = document.querySelector('.permission-role-add-modal');
    if (addRoleModal) {
      const modalContent = addRoleModal.querySelector('.modal-content');
      const modalBody = addRoleModal.querySelector('.modal-body');

      if (modalContent) modalContent.classList.remove('modal-content-no-overflow');
      if (modalBody) modalBody.classList.remove('modal-body-scroll');
    }
  }

  resetModal(): void {
    this.roles = [];
    this.filteredRoles = [];
    this.searchText = '';
    this.showAddRoleModal = false;
    this.showEmployeesModal = false;
    this.selectedRoleId = null;
    this.selectedRole = null;
    this.employees = [];
    this.searchEmployeeText = '';
    this.searchRoleText = '';
  }

  async loadRoles(): Promise<void> {
    if (!this.permissionId) return;

    this.isLoading = true;
    try {
      const response: any = await this._service.getRolesByPermission(this.permissionId);
      // API trả về Response<List<RoleOutput>>
      if (response && response.data) {
        this.roles = Array.isArray(response.data) ? response.data : [response.data];
      } else if (Array.isArray(response)) {
        this.roles = response;
      } else {
        this.roles = [];
      }
      this.filteredRoles = [...this.roles];
    } catch (error) {
      console.error('Error loading roles:', error);
      this.showErrorToast('Không thể tải danh sách nhóm quyền', 'Lỗi');
      this.roles = [];
      this.filteredRoles = [];
    } finally {
      this.isLoading = false;
    }
  }

  async loadAllRoles(): Promise<void> {
    try {
      const response: any = await this._service.getAllRoles();
      // API trả về Response<List<RoleOutput>>
      let rolesData: Role[] = [];
      if (response && response.data) {
        rolesData = Array.isArray(response.data) ? response.data : [response.data];
      } else if (Array.isArray(response)) {
        rolesData = response;
      }
      
      // Lọc bỏ các role đã có trong danh sách roles hiện tại
      if (this.roles.length > 0) {
        const existingRoleIds = this.roles.map(r => r.id);
        rolesData = rolesData.filter(r => !existingRoleIds.includes(r.id));
      }
      
      // Map thành format {label, value} để tương thích với app-form-input
      this.allRoles = rolesData.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        label: role.name,
        value: role.id
      }));
    } catch (error) {
      console.error('Error loading all roles:', error);
      this.allRoles = [];
    }
  }

  filterRoles(): void {
    if (!this.searchText.trim()) {
      this.filteredRoles = [...this.roles];
    } else {
      const searchLower = this.searchText.toLowerCase();
      this.filteredRoles = this.roles.filter(
        (r) =>
          r.name.toLowerCase().includes(searchLower) ||
          (r.description && r.description.toLowerCase().includes(searchLower))
      );
    }
  }

  openAddRoleModal(): void {
    this.showAddRoleModal = true;
    this.selectedRoleId = null;
  }

  closeAddRoleModal(): void {
    this.showAddRoleModal = false;
    this.selectedRoleId = null;
  }

  async addPermissionToRole(): Promise<void> {
    if (!this.selectedRoleId || !this.permissionId) {
      this.showErrorToast('Vui lòng chọn nhóm quyền', 'Lỗi');
      return;
    }

    this.isAddingRole = true;
    try {
      const response: any = await this._service.addPermissionToRole(this.permissionId, this.selectedRoleId);
      if (response && response.error) {
        this.showErrorToast(response.message || 'Không thể thêm quyền vào nhóm quyền', 'Lỗi');
      } else {
        this.showSuccessToast('Thêm quyền vào nhóm quyền thành công');
        this.closeAddRoleModal();
        await this.loadRoles();
        await this.loadAllRoles(); // Reload để cập nhật danh sách
        this.save.emit();
      }
    } catch (error) {
      console.error('Error adding permission to role:', error);
      this.showErrorToast('Không thể thêm quyền vào nhóm quyền', 'Lỗi');
    } finally {
      this.isAddingRole = false;
    }
  }

  async openEmployeesModal(role: Role): Promise<void> {
    this.selectedRole = role;
    this.showEmployeesModal = true;
    this.employees = [];
    this.loadingEmployees = true;
    this.searchEmployeeText = '';

    try {
      const response: any = await this._service.getAdminByRoles(role.id);
      // API trả về Response<List<AdministratorOutput>>
      if (response && response.data) {
        this.employees = Array.isArray(response.data) ? response.data : [response.data];
      } else if (Array.isArray(response)) {
        this.employees = response;
      } else {
        this.employees = [];
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      this.showErrorToast('Không thể tải danh sách nhân viên', 'Lỗi');
      this.employees = [];
    } finally {
      this.loadingEmployees = false;
    }
  }

  closeEmployeesModal(): void {
    this.showEmployeesModal = false;
    this.selectedRole = null;
    this.employees = [];
    this.searchEmployeeText = '';
  }

  filterEmployees(): Administrator[] {
    if (!this.searchEmployeeText.trim()) {
      return this.employees;
    }
    const searchLower = this.searchEmployeeText.toLowerCase();
    return this.employees.filter(
      (emp) =>
        (emp.full_name && emp.full_name.toLowerCase().includes(searchLower)) ||
        (emp.user_name && emp.user_name.toLowerCase().includes(searchLower)) ||
        (emp.email && emp.email.toLowerCase().includes(searchLower))
    );
  }

  openRemoveConfirm(role: Role): void {
    this.roleToRemove = role;
    this.confirmHeader = this.translate.instant('COMMON.CONFIRM');
    this.confirmMessage = this.translate.instant('PERMISSION.CONFIRM_REMOVE_PERMISSION', {
      permissionName: this.permissionName,
      roleName: role.name
    });
    this.confirmType = 'danger';
    this.confirmVisible = true;
  }

  closeConfirm(): void {
    this.confirmVisible = false;
    this.roleToRemove = null;
  }

  async confirmRemove(): Promise<void> {
    if (!this.roleToRemove || !this.permissionId) {
      this.closeConfirm();
      return;
    }

    try {
      const response: any = await this._service.removePermissionFromRole(this.permissionId, this.roleToRemove.id);
      if (response && response.error) {
        this.showErrorToast(response.message || 'Không thể xóa quyền khỏi nhóm quyền', 'Lỗi');
      } else {
        this.showSuccessToast('Xóa quyền khỏi nhóm quyền thành công');
        this.closeConfirm();
        await this.loadRoles();
        await this.loadAllRoles(); // Reload để cập nhật danh sách
        this.save.emit();
      }
    } catch (error) {
      console.error('Error removing permission from role:', error);
      this.showErrorToast('Không thể xóa quyền khỏi nhóm quyền', 'Lỗi');
    }
  }

  onClose(): void {
    this.visible = false;
    this.resetModal();
    this.close.emit();
  }

  showSuccessToast(message: string, title = 'Thành công'): void {
    this.toastr.success(message, title);
  }

  showErrorToast(message: string, title = 'Thất bại'): void {
    this.toastr.error(message, title);
  }
}

