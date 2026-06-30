import { Component, Input, Output, EventEmitter, OnInit, ViewEncapsulation } from "@angular/core";
import { RoleService } from "../role.service";
import { Console } from "console";

interface Permission {
    id: string;
    name: string;
    selected: boolean;
    isMapped?: boolean;
}

interface PermissionGroup {
    id: string;
    uri: string;
    name: string;
    selected: boolean;
    permissions: Permission[];
    filteredPermissions: Permission[];
    searchText: string;
}

@Component({
    selector: "assign-permission",
    templateUrl: "./assign-permission.html",
    styleUrls: ['./assign-perrmission.scss']
})
export class AssignPermission implements OnInit {
    @Input() visible = false;
    @Input() loading = false
    @Input() selectedGroup = "Độc Dev";
    @Input() selectedGroupId = 0;
    @Output() close = new EventEmitter<void>();
    @Output() save = new EventEmitter<any>();

    searchText = "";
    viewMappedOnly = false;
    permissionGroups: PermissionGroup[] = [];
    filteredGroups: PermissionGroup[] = [];
    permissionsLoaded = false;

    constructor(private _roleService: RoleService) { }

    ngOnInit(): void {
        this.loadPermissions();
    }

    async loadPermissions() {
        const data = await this._roleService.getPermissions();
        const response = data.data;
        const responseRolePermissionData = await this._roleService.getRolePermissions(this.selectedGroupId)
        const responseRolePermission = responseRolePermissionData.data;
        const selectedIds = new Set(responseRolePermission.map((p: any) => p.id)); // danh sách id quyền đã có

        this.permissionGroups = response.map((g: any) => {
            const permissions = g.permissions ?? g.children ?? [];

            // Đánh dấu permission được chọn
            const updatedPermissions = permissions.map((p: any) => ({
                ...p,
                selected: selectedIds.has(p.id)
            }));

            // Kiểm tra nếu tất cả permissions đều selected
            const allSelected = updatedPermissions.length > 0 && updatedPermissions.every((p: any) => p.selected);

            return {
                ...g,
                permissions: updatedPermissions,
                filteredPermissions: [...updatedPermissions],
                searchText: "",
                selected: allSelected
            };
        });

        // Gán trực tiếp, không copy mới
        this.originalGroups = this.permissionGroups;

        this.filteredGroups = this.permissionGroups;
        this.applyFilters();
        
        // Đánh dấu đã load xong để render HTML
        this.permissionsLoaded = true;
    }

    originalGroups: any[] = [];
    /** Giữ reference, không gán lại filteredGroups */
    applyFilters(): void {
        const globalSearch = (this.searchText || '').trim().toLowerCase();
        // Luôn filter từ dữ liệu gốc
        this.filteredGroups = this.permissionGroups
            .filter(group =>
                group.name.toLowerCase().includes(globalSearch) || group.uri.toLowerCase().includes(globalSearch)
            )
            .map(group => {
                let perms = [...group.permissions];
                // Lọc mapped only
                if (this.viewMappedOnly) {
                    perms = perms.filter(p => !!p.selected);
                }
                group.selected = perms.length > 0 && perms.every(p => p.selected);

                return { ...group, filteredPermissions: perms };
            });
    }

    applyFilters2(group, text): void {
        let filteredGroup = this.permissionGroups.filter(g => g.id == group.id)[0];
        filteredGroup.searchText = text
        group.filteredPermissions = filteredGroup.filteredPermissions.filter(p => p.name.toLowerCase().includes((text || '').trim().toLowerCase()));


    }

    trackByGroupId(index: number, group: any): any {
        return group.id; // hoặc group.name nếu name là unique
    }

    trackByPermissionId(index: number, permission: any): any {
        return permission.id; // hoặc group.name nếu name là unique
    }

    selectAllPermissions(event: any): void {
        const isChecked = event.target.checked;
        this.permissionGroups.forEach((group) => {
            group.permissions.forEach((p) => (p.selected = isChecked));
            group.filteredPermissions.forEach((p) => (p.selected = isChecked));
            group.selected = isChecked;
        });
    }

    onGroupChange(group: PermissionGroup): void {
        group.permissions.forEach((p) => (p.selected = group.selected));
        group.filteredPermissions.forEach((p) => (p.selected = group.selected));
    }

    onPermissionChange(group: PermissionGroup, permission: Permission): void {
        const allSelected = group.permissions.every((p) => p.selected);
        group.selected = allSelected;
    }

    onSave(): void {
        let selectedPermissionIds = [];
        this.permissionGroups.forEach(group => {
            group.permissions
                .filter(p => p.selected)
                .forEach(p => {
                    if (!selectedPermissionIds.includes(p.id))
                        selectedPermissionIds.push(p.id)
                });
        });



        this.save.emit({
            group: this.selectedGroup,
            permissions: selectedPermissionIds
        });
    }

    onClose(): void {
        this.close.emit();
    }
}
