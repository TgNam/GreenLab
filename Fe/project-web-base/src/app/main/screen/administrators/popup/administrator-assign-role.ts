import { Component, Input, Output, EventEmitter, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { AdministratorService } from '../administrator.service';
import { Subject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { CoreTranslationService } from '@core/services/translation.service';

@Component({
    selector: 'app-administrator-assign-role',
    templateUrl: './administrator-assign-role.component.html',
    styleUrls: ['./administrator-assign-role.component.scss']
})
export class AdministratorAssignRoleComponent {
    @Input() visible = false;
    @Input() employeeId: number | null = null;
    @Input() employeeName = '';
    @Input() assigning = false;

    @Output() close = new EventEmitter<void>();
    @Output() save = new EventEmitter<number[]>();

    roles = [];
    filteredRoles = [];
    searchText = '';
    inheritRoles = false;
    isLoading = false;
    private _unsubscribeAll;

    constructor(private _service: AdministratorService, private toastr: ToastrService, private translate: CoreTranslationService) {
        this._unsubscribeAll = new Subject();
    }

    @Input() width: string | number;

    ngOnInit() {
        console.log('uinit assign role')
        this.adjustWidthForMobile();
    }

    private adjustWidthForMobile() {
        const isMobile = window.innerWidth < 768;

        // Nếu mobile → override width = 150
        if (isMobile) {
            this.width = 150;
        }
        else {
            this.width = 300;
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['employeeId']) {
            const newId = changes['employeeId'].currentValue;
            this.loadRoles()

        } else if (changes['visible']) {
            const newVisible = changes['visible'].currentValue;
            if (newVisible) {
                // Reset các Set khi mở popup mới
                this.userSelectedRoleIds.clear();
                this.initialAdminRoleIds.clear();
                this.deselectedAdminRoleIds.clear();
                this.loadRoles()
                this.isRoleSelected = false;
                this.selectAllModel = false;
                this.isRoleDetail = false;
                this.searchText = '';
            }
        }
    }
    /**
     * Load roles from API or fake data
     */
    public firstLoad = true;
    public oldRoleIds = new Set();
    // Lưu trữ các role IDs mà người dùng đã chọn (bao gồm cả từ server và người dùng tự chọn)
    private userSelectedRoleIds = new Set<number>();
    // Lưu trữ các role IDs ban đầu từ adminRoles (từ server)
    private initialAdminRoleIds = new Set<number>();
    // Lưu trữ các role IDs từ adminRoles mà người dùng đã bỏ tích
    private deselectedAdminRoleIds = new Set<number>();
    
    async loadRoles() {
        this.isLoading = true;

        // Lưu lại các role IDs đã được chọn trước khi load
        const currentSelectedIds = new Set(this.roles.filter(r => r.selected).map(r => r.id));
        // Merge với userSelectedRoleIds để giữ lại tất cả các lựa chọn
        currentSelectedIds.forEach(id => this.userSelectedRoleIds.add(id));

        // Uncomment when API ready
        try {
            const response: any = await this._service.getAllRoles(this.employeeId);
            const data = response.data;
            // Normalize API response to an array before assigning to roles
            // Support responses that return either an array directly or an object with a 'content' field
            const content = (data && data.result !== undefined) ? data.result : data;
            const adminRoles = data.adminRoles || [];
            const adminRoleStrIds = data.adminRoleIds ? data.adminRoleIds.split(',') : [];
            
            // Lưu các role IDs ban đầu từ adminRoles (chỉ lần đầu tiên)
            if (this.firstLoad) {
                adminRoles.forEach(ar => {
                    this.initialAdminRoleIds.add(ar.id);
                });
            }
            
            this.roles = (Array.isArray(content) ? content : [content]) as any[];
            this.roles = this.roles.filter(r => adminRoleStrIds.includes(String(r.id)));
            
            // Áp dụng lại các lựa chọn: 
            // - Nếu role có trong adminRoles ban đầu và không bị bỏ tích → selected
            // - Nếu role được người dùng chọn thêm → selected
            // - Nếu role từ adminRoles ban đầu nhưng đã bị bỏ tích → không selected
            this.roles.forEach(role => {
                const isInInitialAdminRoles = this.initialAdminRoleIds.has(role.id);
                const isDeselected = this.deselectedAdminRoleIds.has(role.id);
                const isUserSelected = this.userSelectedRoleIds.has(role.id);
                
                // Role được selected nếu:
                // 1. Có trong adminRoles ban đầu VÀ không bị bỏ tích, HOẶC
                // 2. Được người dùng chọn thêm (không phải từ adminRoles ban đầu)
                role.selected = (isInInitialAdminRoles && !isDeselected) || (isUserSelected && !isInInitialAdminRoles);
            });
            
            this.firstLoad = false;
            this.filteredRoles = this.roles;
            this.isLoading = false;
        } catch (error) {
            this.isLoading = false;
            console.error('Lỗi khi lấy roles:', error);
        }

        // Using fake data for now
    }
    public selectAllModel = false;
    public detailModel = false;
    public selectedModel = false;
    selectAll(event) {
        if (event.target) {
            if (event.target.checked) {
                this.selectAllModel = true;
                this.roles.forEach(role => {
                    role.selected = true;
                    this.userSelectedRoleIds.add(role.id);
                    const isInInitialAdminRoles = this.initialAdminRoleIds.has(role.id);
                    if (isInInitialAdminRoles) {
                        this.deselectedAdminRoleIds.delete(role.id);
                    }
                });
            } else {
                this.selectAllModel = false;
                this.roles.forEach(role => {
                    role.selected = false;
                    const isInInitialAdminRoles = this.initialAdminRoleIds.has(role.id);
                    if (isInInitialAdminRoles) {
                        this.deselectedAdminRoleIds.add(role.id);
                    } else {
                        this.userSelectedRoleIds.delete(role.id);
                    }
                });
            }
        }
    }

    async loadRolesDetail() {
        this.isLoading = true;

        // Lưu lại các role IDs đã được chọn trước khi load
        const currentSelectedIds = new Set(this.roles.filter(r => r.selected).map(r => r.id));
        // Merge với userSelectedRoleIds để giữ lại tất cả các lựa chọn
        currentSelectedIds.forEach(id => this.userSelectedRoleIds.add(id));

        // Uncomment when API ready
        try {
            const response: any = await this._service.getAllRolesDetail(this.employeeId);
            const data = response.data;
            // Normalize API response to an array before assigning to roles
            // Support responses that return either an array directly or an object with a 'content' field
            const content = (data && data.result !== undefined) ? data.result : data;
            const adminRoles = data.adminRoles || [];
            const adminRoleStrIds = data.adminRoleIds ? data.adminRoleIds.split(',') : [];
            
            // Lưu các role IDs ban đầu từ adminRoles (chỉ lần đầu tiên)
            if (this.firstLoad) {
                adminRoles.forEach(ar => {
                    this.initialAdminRoleIds.add(ar.id);
                });
            }
            
            this.roles = (Array.isArray(content) ? content : [content]) as any[];
            this.roles = this.roles.filter(r => adminRoleStrIds.includes(String(r.id)));

            // Áp dụng lại các lựa chọn: 
            // - Nếu role có trong adminRoles ban đầu và không bị bỏ tích → selected
            // - Nếu role được người dùng chọn thêm → selected
            // - Nếu role từ adminRoles ban đầu nhưng đã bị bỏ tích → không selected
            this.roles.forEach(role => {
                const isInInitialAdminRoles = this.initialAdminRoleIds.has(role.id);
                const isDeselected = this.deselectedAdminRoleIds.has(role.id);
                const isUserSelected = this.userSelectedRoleIds.has(role.id);
                
                // Role được selected nếu:
                // 1. Có trong adminRoles ban đầu VÀ không bị bỏ tích, HOẶC
                // 2. Được người dùng chọn thêm (không phải từ adminRoles ban đầu)
                role.selected = (isInInitialAdminRoles && !isDeselected) || (isUserSelected && !isInInitialAdminRoles);
            });
            
            this.firstLoad = false;
            this.filteredRoles = this.roles;
            this.isLoading = false;
        } catch (error) {
            this.isLoading = false;
            console.error('Lỗi khi lấy roles:', error);
        }

        // Using fake data for now
    }

    /**
     * Load fake roles for demo
     */

    showSuccessToast(message: string, title = 'Thành công') {
        this.toastr.success(message, title);
    }

    showErrorToast(message: string, title = 'Thất bại') {
        this.toastr.error(message, title);
    }
    /**
     * Filter roles by search text
     */
    filterRoles(searchValue: string): void {
        this.searchText = searchValue.toLowerCase();

        if (!this.isRoleSelected) {
            if (!this.searchText.trim()) {
                this.filteredRoles = [...this.roles];
            } else {
                this.filteredRoles = this.roles.filter(
                    (r) =>
                        r.name.toLowerCase().includes(this.searchText) ||
                        r.description.toLowerCase().includes(this.searchText)
                );
            }
        }
        else {
            if (!this.searchText.trim()) {
                this.filteredRoles = this.roles.filter(
                    (r) =>
                        r.selected
                );
            } else {
                this.filteredRoles = this.roles.filter(
                    (r) =>
                        r.selected && (r.name.toLowerCase().includes(this.searchText) ||
                            r.description.toLowerCase().includes(this.searchText))
                );
            }
        }
    }

    public isRoleSelected = false;

    filterCheckRole(event) {
        if (event.target.checked) {
            this.isRoleSelected = true;
            this.filteredRoles = this.roles.filter(
                (r) =>
                    r.selected && (r.name.toLowerCase().includes(this.searchText) ||
                        r.description.toLowerCase().includes(this.searchText))
            );
        }
        else {
            this.isRoleSelected = false;
            this.filteredRoles = this.roles.filter(
                (r) =>
                (r.name.toLowerCase().includes(this.searchText) ||
                    r.description.toLowerCase().includes(this.searchText))
            );
        }
    }

    /**
     * Handle checkbox change
     */
    onRoleChange(role): void {
        const index = this.roles.findIndex((r) => r.id === role.id);
        if (index !== -1) {
            let isSelected = false;
            if (role.selected.target) {
                isSelected = role.selected.target.checked;
                this.roles[index].selected = isSelected;
            }
            else {
                isSelected = role.selected;
                this.roles[index].selected = isSelected;
            }
            
            // Cập nhật userSelectedRoleIds và deselectedAdminRoleIds khi người dùng thay đổi lựa chọn
            const isInInitialAdminRoles = this.initialAdminRoleIds.has(role.id);
            
            if (isSelected) {
                this.userSelectedRoleIds.add(role.id);
                // Nếu role này từ adminRoles ban đầu và được tích lại, xóa khỏi deselectedAdminRoleIds
                if (isInInitialAdminRoles) {
                    this.deselectedAdminRoleIds.delete(role.id);
                }
            } else {
                // Nếu role này từ adminRoles ban đầu và bị bỏ tích, thêm vào deselectedAdminRoleIds
                if (isInInitialAdminRoles) {
                    this.deselectedAdminRoleIds.add(role.id);
                }
                // Xóa khỏi userSelectedRoleIds nếu không phải từ adminRoles ban đầu
                if (!isInInitialAdminRoles) {
                    this.userSelectedRoleIds.delete(role.id);
                }
            }
        }
    }

    /**
     * Select all / deselect all
     */
    selectAllRoles(event: any): void {
        const isChecked = event.target.checked;
        this.roles.forEach((r) => {
            r.selected = isChecked;
            const isInInitialAdminRoles = this.initialAdminRoleIds.has(r.id);
            
            if (isChecked) {
                this.userSelectedRoleIds.add(r.id);
                if (isInInitialAdminRoles) {
                    this.deselectedAdminRoleIds.delete(r.id);
                }
            } else {
                if (isInInitialAdminRoles) {
                    this.deselectedAdminRoleIds.add(r.id);
                } else {
                    this.userSelectedRoleIds.delete(r.id);
                }
            }
        });
        this.filteredRoles.forEach((r) => {
            r.selected = isChecked;
            const isInInitialAdminRoles = this.initialAdminRoleIds.has(r.id);
            
            if (isChecked) {
                this.userSelectedRoleIds.add(r.id);
                if (isInInitialAdminRoles) {
                    this.deselectedAdminRoleIds.delete(r.id);
                }
            } else {
                if (isInInitialAdminRoles) {
                    this.deselectedAdminRoleIds.add(r.id);
                } else {
                    this.userSelectedRoleIds.delete(r.id);
                }
            }
        });
    }

    public isRoleDetail = false;
    async loadDetail(event) {
        if (event.target) {
            if (event.target.checked) {
                this.isRoleDetail = true;
                this.loadRolesDetail();
            }
            else {
                this.isRoleDetail = false;
                this.loadRoles();
            }
        }
        else {
            this.isRoleDetail = false;
        }
    }

    hasPermissions(role): boolean {
        return !!role?.permissions && Object.keys(role.permissions).length > 0;
    }

    hasEmployees(role): boolean {
        return !!role?.employees && Object.keys(role.employees).length > 0;
    }

    /**
     * Count selected roles
     */
    get selectedRolesCount(): number {
        return this.roles.filter((r) => r.selected).length;
    }

    /**
     * Get IDs of selected roles
     */
    getSelectedRoleIds(): number[] {
        return this.roles.filter((r) => r.selected).map((r) => r.id);
    }

    /**
     * Save selected roles
     */
    async onSave() {
        try {
            const selectedIds = this.getSelectedRoleIds();
            console.log(selectedIds);
            this.assigning = true;
            let response = await this._service.assignRoles(this.employeeId, selectedIds)
            this.assigning = false;
            if (response == null || !response.error) {
                let message = this.translate.instant('ADMINISTRATOR.ASSIGN_ROLE_SUCCESS') + this.employeeName;
                let successMsg = this.translate.instant('COMMON.SUCCESS');
                this.showSuccessToast(message, successMsg);
                this.close.emit();
            }
        } catch (error) {
            console.log(error)
            this.assigning = false;
        }
        // Uncomment when using real API
        // this.roleService.assignRoles(this.employeeId, selectedIds).subscribe({
        //   next: (response) => {
        //     console.log('Roles assigned successfully:', response);
        //     this.save.emit(selectedIds);
        //     this.onClose();
        //   },
        //   error: (err) => {
        //     console.error('Error assigning roles:', err);
        //     alert('Lỗi khi gán vai trò. Vui lòng thử lại.');
        //   }
        // });

        // Fake success

    }

    /**
     * Close modal
     */
    onClose(): void {
        this.resetForm();
        this.close.emit();
    }

    /**
     * Reset form
     */
    private resetForm(): void {
        this.roles.forEach((r) => (r.selected = false));
        this.filteredRoles = [...this.roles];
        this.searchText = '';
        this.inheritRoles = false;
        this.close.emit();
    }
}
