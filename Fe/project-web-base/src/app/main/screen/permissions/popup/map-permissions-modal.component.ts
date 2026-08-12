import { Component, type OnInit, Output, EventEmitter, Input, SimpleChanges } from "@angular/core"
import { PermissionService } from "../permission.service"
import { ToastrService } from "ngx-toastr"
import { CoreTranslationService } from "@core/services/translation.service"

interface MapFunction {
    id: number
    name: string
    uri: string
    order: number
    selected: boolean
    isPermissionSet: boolean
    isParent: boolean
    isMenu: boolean
}

@Component({
    selector: "app-map-permissions-modal",
    templateUrl: "./map-permissions-modal.component.html",
    styleUrls: ['./map-permissions-modal.component.scss']
})
export class MapPermissionsModalComponent {
    @Input() visible = false
    @Input() uri = ''
    @Input() mode = ''
    @Input() disabledSave = false
    @Output() close = new EventEmitter<void>()
    @Output() save = new EventEmitter<any>()
    parentPermission = null;
    selectedCategory = ""
    categories: string[] = ["helpCategory", "systemBank", "userRole", "department", "position"]

    @Input() allFunctions = []
    filteredFunctions = []
    systemHasParent = false

    get selectedFunctionsCount(): number {
        return this.filteredFunctions.filter((f) => f.selected).length
    }

    constructor(private _service: PermissionService, private toastr: ToastrService, private translate: CoreTranslationService) {

    }

    showSuccessToast(message: string, title = 'Thành công') {
        this.toastr.success(message, title);
    }

    showErrorToast(message: string, title = 'Thất bại') {
        this.toastr.error(message, title);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['uri'] && !changes['uri'].firstChange) {
            const newId = changes['uri'].currentValue;
            this.parentPermission = null;
            if (newId && this.mode == 'map') {
                this.loadPermission();
            }
        } else if (changes['mode'] && !changes['mode'].firstChange) {
            this.parentPermission = null;
        }
    }

    onParentIdChange(selectedFunc: any, newValue) {
        setTimeout(() => {
            this.allFunctions.forEach(func => {
                func.parentId = (func === selectedFunc); // chỉ checkbox được click là true, còn lại false
                if (func.parent != null && func.parent != undefined) {
                    func.parent = (func.method === selectedFunc.method && func.uri === selectedFunc.uri)
                }
            });
            if (!this.parentPermission && !newValue) {
                this.hasAnyParent = false
            }
            else {
                this.hasAnyParent = true;
            }
        })
    }
    hasAnyParent = true;


    async loadPermission() {
        try {
            const data = await this._service.getPermissionScanUri(this.uri);
            const response = data.data;
            this.allFunctions = response.result;
            if (response.parentPermission) {
                this.parentPermission = response.parentPermission;
                this.systemHasParent = true
            }
        } catch (error) {
            console.log(error)
        }
    }



    selectAllFunctions(event: any): void {
        const isChecked = event.target.checked
        this.filteredFunctions.forEach((func) => {
            func.selected = isChecked
        })
    }

    onFunctionSelect(func: MapFunction): void {
    }

    onFunctionChange(func: MapFunction): void {
    }

    onSystemParentChange(): void {
    }

    async onSave() {
        try {
            let hasParent = false;
            if (this.allFunctions.find(p => p.parent || p.parentId == 0) || this.parentPermission) {
                hasParent = true;
            }
            if (this.mode == 'map' && !hasParent) {
                this.showErrorToast('Vui lòng chọn quyền cha');
                return;
            }
            if (this.parentPermission) {
                this.allFunctions.push(this.parentPermission)
            }
            this.disabledSave = true
            let response = await this._service.mapPermission(this.allFunctions);
            this.disabledSave = false
            if (response == null || !response.error) {

                if (this.mode == 'map') {
                    this.showSuccessToast('Map quyền thành công')
                }
                else if (this.mode == 'edit') {
                    let message = this.translate.instant('PERMISSION.EDIT_SUCCESS');
                    let successMsg = this.translate.instant('COMMON.SUCCESS');
                    this.showSuccessToast(message, successMsg);
                }
                this.visible = false
                this.selectedCategory = ""
                this.systemHasParent = false
                this.filteredFunctions.forEach((f) => (f.selected = false))

                this.save.emit()
            }
        } catch (error) {
            console.log(error);
        }
        //this.onClose()
    }

    onCancel(): void {
        this.onClose()
    }

    onClose(): void {
        this.visible = false
        this.selectedCategory = ""
        this.systemHasParent = false
        this.filteredFunctions.forEach((f) => (f.selected = false))
        this.close.emit()
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

    handleConfirm() {

        try {
            if (this.confirmAction) this.confirmAction();
            let response = this._service.deletePermission(this.deleteId);
            if (response == null || !response.error) {
                this.confirmVisible = false;
                this.showSuccessToast('Xóa quyền thành công')
                this.save.emit()
            }
        } catch (error) {
            console.log(error);
        }
    }
    deleteId = 0;

    removeFunction(i: number) {
        const func = this.allFunctions[i];
        if (func.parent) {
            this.showErrorToast('Vui lòng không xóa quyền cha');
            return;
        }
        this.deleteId = func.id
        this.openConfirm(
            'danger',
            'Xóa quyền',
            `Bạn có chắc chắn muốn xóa "${func.name}" khỏi danh sách không?`,
            () => {
                this.allFunctions.splice(i, 1);
            }
        );
    }

}
