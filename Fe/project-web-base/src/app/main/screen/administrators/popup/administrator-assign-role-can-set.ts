import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { AdministratorService } from '../administrator.service';
import { Subject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { CoreTranslationService } from '@core/services/translation.service';

@Component({
    selector: 'app-administrator-assign-role-can-set',
    templateUrl: './administrator-assign-role-can-set.component.html',
    styleUrls: ['./administrator-assign-role-can-set.scss']
})
export class AdministratorAssignRoleCanSetComponent {
    @Input() visible = false;
    @Input() assigning = false;
    @Input() employeeId: number | null = null;
    @Input() employeeName = '';

    @Output() close = new EventEmitter<void>();
    @Output() save = new EventEmitter<number[]>();

    roles = [];
    filteredRoles = [];
    searchText = '';
    inheritRoles = false;
    isLoading = false;
    private _unsubscribeAll;

     @Input() width: string | number;

    ngOnInit() {
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

    constructor(private _service: AdministratorService, private toastr: ToastrService, private translate: CoreTranslationService) {
        this._unsubscribeAll = new Subject();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['employeeId']) {
            this.loadRoles()

        } else if (changes['visible']) {
            const newVisible = changes['visible'].currentValue;
            if (newVisible) {
                this.loadRoles()
                this.isRoleSelected = false;
                this.selectAllModel = false;
                this.searchText = ''
            }
        }
    }
    /**
     * Load roles from API or fake data
     */
    public oldRoleIds = new Set();
    async loadRoles() {
        this.isLoading = true;

        // Uncomment when API ready
        try {
            const response: any = await this._service.getAllRolesCanSet(this.employeeId);
            // Normalize API response to an array before assigning to roles
            // Support responses that return either an array directly or an object with a 'content' field
           const data = response.data;
            const content = (data && data.result !== undefined) ? data.result : data;
            const adminRoleIds = data.adminRoleIds ? data.adminRoleIds.split(',') : [];
                        console.log(adminRoleIds)
            this.oldRoleIds = new Set(this.roles.filter(r => r.selected).map(r => r.id));
            this.roles = (Array.isArray(content) ? content : [content]) as any[];
            this.roles.forEach(role => {
                role.selected = adminRoleIds.includes(String(role.id)) && (this.oldRoleIds.size == 0 || this.oldRoleIds.has(role.id));
            });
            this.filteredRoles = this.roles;
            this.isLoading = false;
        } catch (error) {
            this.isLoading = false;
            console.error('Lỗi khi lấy roles:', error);
        }

        // Using fake data for now
    }

    async loadRolesDetail() {
        this.isLoading = true;

        // Uncomment when API ready
        try {
            const response: any = await this._service.getAllRolesDetail(this.employeeId);
            // Normalize API response to an array before assigning to roles
            // Support responses that return either an array directly or an object with a 'content' field
            const data = response.data;
            const content = (data && data.result !== undefined) ? data.result : data;
            const adminRoles = data.adminRoles || [];
            const adminRoleIds = new Set(adminRoles.map(ar => ar.id));
            console.log(adminRoleIds)
            this.oldRoleIds = new Set(this.roles.filter(r => r.selected).map(r => r.id));
            this.roles = (Array.isArray(content) ? content : [content]) as any[];
            this.roles.forEach(role => {
                role.selected = adminRoleIds.has(role.id) && this.oldRoleIds.has(role.id);
            });
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

    public selectAllModel = false;

    selectAll(event) {
        if (event.target) {
            if (event.target.checked) {
                this.selectAllModel = true;
                this.roles.forEach(role => {
                    role.selected = true;
                });
            } else {
                this.selectAllModel = false;
                this.roles.forEach(role => {
                    role.selected = false;
                });
            }
        }
        // else {
        //     this.selectAllModel = false;
        // }
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
            if (role.selected.target) {
                this.roles[index].selected = role.selected.target.checked;
            }
            else {
                this.roles[index].selected = role.selected
            }
        }
    }

    /**
     * Select all / deselect all
     */
    selectAllRoles(event: any): void {
        const isChecked = event.target.checked;
        this.roles.forEach((r) => (r.selected = isChecked));
        this.filteredRoles.forEach((r) => (r.selected = isChecked));
    }

    async loadDetail(event) {
        if (event.target) {
            if (event.target.checked) {
                this.loadRolesDetail();
            }
            else {
                this.loadRoles();
            }
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

            this.assigning = true;
            let response = await this._service.assignRolesCanSet(this.employeeId, selectedIds)
            this.assigning = false;
            if (response == null || !response.error || response.code == 'SUCCESS') {
                let message = this.translate.instant('ADMINISTRATOR.ASSIGN_ROLE_CAN_SET_SUCCESS') + this.employeeName;
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
