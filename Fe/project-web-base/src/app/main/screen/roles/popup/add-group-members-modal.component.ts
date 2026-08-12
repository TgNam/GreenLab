import { Component, Input, Output, EventEmitter, type OnInit, SimpleChanges, ViewChild, HostListener } from "@angular/core"
import { RoleService } from "../role.service"
import { ToastrService } from "ngx-toastr"
import { UserAutocompleteComponent } from "app/main/components/autocomplete/user/user-autocomplete.component"
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
  selector: "app-add-group-members-modal",
  templateUrl: "./add-group-members-modal.component.html",
  styleUrls: ['./add-group-members-modal.component.scss']
})
export class AddGroupMembersModalComponent implements OnInit {
  @Input() visible = false
  @Input() loading = false
  @Input() groupName = ""
  @Input() groupId = 0
  @Output() close = new EventEmitter<void>()
  @Output() save = new EventEmitter<GroupMember[]>()

  members = []
  filteredMembers: GroupMember[] = []
  searchText = ""
  selectedUser: any = null
  isMobile = false
  isDataLoaded = false;
  @ViewChild(UserAutocompleteComponent) childUserAutocomplete!: UserAutocompleteComponent;
  async ngOnChanges(changes: SimpleChanges) {
    if (changes['visible'] && !changes['visible'].firstChange) {
      const newId = changes['visible'].currentValue;
      if (newId) {
        
        this.isDataLoaded = false;
        await this.loadStaffInRole()
        this.isDataLoaded = true;
        this.selectedUser = null;
        this.searchText = "";
        this.searchTextAutocomplete = "";
        this.childUserAutocomplete.clearSearch()
      }
    }
  }

  constructor(private _roleService: RoleService, private toastr: ToastrService, private translate: CoreTranslationService) { }

  showSuccessToast(message: string, title = 'Thành công') {
    this.toastr.success(message, title);
  }

  showErrorToast(message: string, title = 'Thất bại') {
    this.toastr.error(message, title);
  }

  async loadStaffInRole() {
    const response = await this._roleService.getAdminInRole(this.groupId);
    this.members = response.data
    // this.members = [...this.fakeMembers]
    this.filteredMembers = [...this.members]
  }

  ngOnInit() {
    this.checkMobile()
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkMobile()
  }

  checkMobile() {
    this.isMobile = window.innerWidth < 768
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
            const response = await this._roleService.searchAdmin(
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
    if (this.members.some((m) => m.userId === this.selectedUser.id)) {
      let message = this.translate.instant('ROLE.STAFF_ALREADY_IN_GROUP');
      let successMsg = this.translate.instant('COMMON.FAILED');
      this.showErrorToast(message, successMsg);
      return
    }
    try {
      this.loading = true;
      let response = await this._roleService.addAdmin(this.selectedUser.id, this.groupId)
      this.loading = false;
      if (response == null || !response.error) {
        this.members.unshift(this.selectedUser)
        this.filterMembers(this.searchText)
        let message = this.translate.instant('ROLE.ADD_STAFF_GROUP_SUCCESS');
        let successMsg = this.translate.instant('COMMON.SUCCESS');
        this.showSuccessToast(message, successMsg);
        this.selectedUser = null
        this.userAutocomplete.setSearchText("");
      }
    } catch (error) {
      this.loading = false;

      console.log(error);
    }
  }

  /**
   * Xóa nhân viên khỏi nhóm
   */
  removeMember(userId: string) {
    try {
      let response = this._roleService.removeAdmin(userId, this.groupId)

      if (response == null || !response.error) {
        this.showSuccessToast('Xóa nhân viên khỏi nhóm quyền thành công')
        this.members = this.members.filter((m) => m.id !== userId)
        this.filterMembers(this.searchText)
        this.selectedUser = null
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Lọc danh sách nhân viên theo tên tìm kiếm
   */
  searchTextAutocomplete = "";
  filterMembers(searchText: string) {
    this.searchText = searchText
    if (!searchText) {
      this.filteredMembers = [...this.members]
    } else {
      this.filteredMembers = this.members.filter(
        (member) =>
          member.user_name.toLowerCase().includes(searchText.trim().toLowerCase()) ||
          member.email.toLowerCase().includes(searchText.trim().toLowerCase()) ||
          member.full_name.toLowerCase().includes(searchText.trim().toLowerCase()),
      )
    }
  }

  /**
   * Đóng modal
   */
  onClose() {
    this.close.emit()
  }

  /**
   * Lưu danh sách nhân viên
   */
  onSave() {
    this.save.emit(this.members)
    this.onClose()
  }
}
