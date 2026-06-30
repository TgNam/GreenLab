import { Component, Input, Output, EventEmitter, type OnInit, SimpleChanges, ViewChild } from "@angular/core"
import { ToastrService } from "ngx-toastr"
import { UserAutocompleteComponent } from "app/main/components/autocomplete/user/user-autocomplete.component"
import { AdministratorService } from "../administrator.service"
import { CoreTranslationService } from "@core/services/translation.service"

interface GroupMember {
    userId: string
    userName: string
    email: string
    status: "active" | "inactive"
    joinedDate: Date
}

interface SearchResult {
    items: Array<{
        id: string
        user_name: string
        email: string
        avatar?: string
    }>
    total: number
    hasMore: boolean
}

@Component({
    selector: "app-administrator-choose-manager",
    templateUrl: "./administrator-choose-manager.component.html",
    styleUrls: ['./administrator-choose-manager.component.scss']
})
export class AdministratorChooseManager implements OnInit {
    @Input() visible = false
    @Input() chosing = false;
    @Input() selectedAdminId = 0
    @Output() close = new EventEmitter<void>()
    @Output() save = new EventEmitter<{ selectedUser: any, selectedAdminId: number }>()

    members = []
    filteredMembers: GroupMember[] = []
    searchText = ""
    selectedUser: any = null

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible']) {
            const newId = changes['visible'].currentValue;
            if (newId) {
                this.searchText = "";
                this.selectedUser = null;
                this.searchTextAutocomplete = ""
                this.userAutocomplete.clearSearch()

            }
        }
    }

    constructor(private _service: AdministratorService, private toastr: ToastrService, private translate: CoreTranslationService) { }

    showSuccessToast(message: string, title = 'Thành công') {
        this.toastr.success(message, title);
    }

    showErrorToast(message: string, title = 'Thất bại') {
        this.toastr.error(message, title);
    }


    ngOnInit() {

    }

    /**
     * Hàm search được truyền cho component autocomplete
     * Mô phỏng gọi API với phân trang
     */
    searchUsers = (searchText: string, page = 1): Promise<{ data: any[], hasMore: boolean }> => {
        return new Promise((resolve) => {
            setTimeout(async () => {
                if (typeof searchText === 'string') {
                    try {
                        const pageSize = 20;
                        const response = await this._service.searchAdmin(
                            this.members.map(m => m.id),
                            searchText,
                            page - 1
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
    async addMember() {
        if (!this.selectedUser) return

        // Kiểm tra xem nhân viên đã có trong nhóm chưa

        try {
            this.chosing = true;
            let response = await this._service.assignManager(this.selectedAdminId, this.selectedUser.id)
            this.chosing = false;
            if (response == null || !response.error) {
                let message = this.translate.instant('ADMINISTRATOR.CHOOSE_MANAGER_SUCCESS');
                let successMsg = this.translate.instant('COMMON.SUCCESS');
                this.showSuccessToast(message, successMsg);
                this.userAutocomplete.setSearchText("");
                this.userAutocomplete.clearSearch()
                this.save.emit({ selectedUser: this.selectedUser, selectedAdminId: this.selectedAdminId });
                this.selectedUser = null

            }
        } catch (error) {
            console.log(error);
            this.chosing = false;
        }
    }

    /**
     * Xóa nhân viên khỏi nhóm
  
  
    /**
     * Lọc danh sách nhân viên theo tên tìm kiếm
     */
    searchTextAutocomplete = "";


    /**
     * Đóng modal
     */
    onClose() {
        this.close.emit()
    }

    /**
     * Lưu danh sách nhân viên
     */
    async onSave() {
        try {
            this.chosing = true;
            let response = await this._service.assignManager(this.selectedAdminId, this.selectedUser.id)
            this.chosing = false;
            if (response == null || !response.error) {
                let message = this.translate.instant('ADMINISTRATOR.CHOOSE_MANAGER_SUCCESS');
                let successMsg = this.translate.instant('COMMON.SUCCESS');
                this.showSuccessToast(message, successMsg);
                this.userAutocomplete.setSearchText("");
                this.save.emit({ selectedUser: this.selectedUser, selectedAdminId: this.selectedAdminId });
                this.selectedUser = null
                this.onClose()
            }
        } catch (error) {
            console.log(error);
            this.chosing = false;
        }
    }
}
