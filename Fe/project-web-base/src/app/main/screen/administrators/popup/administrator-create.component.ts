import { Component, Input, Output, EventEmitter, SimpleChanges, ViewChild } from '@angular/core';
import { Administrator, AdministratorService } from '../administrator.service';
import { CoreTranslationService } from '@core/services/translation.service';
import { FormInputComponent } from 'app/main/components/form-input/form-input.component';

@Component({
    selector: 'app-administrator-create',
    templateUrl: './administrator-create.component.html',
    styleUrls: ['./administrator-create.component.scss']
})
export class AdministratorCreateComponent {
    @Input() visible = false;
    public departments = [];
    @Input() creating = false;
    @Input() positions = [];
    @Input() mode: 'view' | 'edit' = 'view';
    @Output() close = new EventEmitter<void>();
    @Output() save = new EventEmitter<Administrator>();
    public errMsg = [];
    public admin: any = {
        phone: '',
        email: '',
        full_name: '',
        user_name: '',
        status: 0,
        password: '',
        position: '',
        department_id: "",
        work_area_id: ""
    };

    constructor(private _service: AdministratorService, private translateService: CoreTranslationService) {
    }
    
    @ViewChild('adminPhotoUpload') adminPhotoUpload?: FormInputComponent;
    @ViewChild('adminSignatureUpload') adminSignatureUpload?: FormInputComponent;
    
    previewPhoto: string | null = null;

    onPhotoSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];

            // Validate file type - chỉ cho phép jpg, png, webp
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            const fileType = file.type.toLowerCase();
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            
            const isValidType = allowedTypes.includes(fileType) || 
                               (fileExtension && ['jpg', 'jpeg', 'png', 'webp'].includes(fileExtension));

            if (!isValidType) {
                // Xóa lỗi cũ nếu có
                this.errMsg = this.errMsg.filter(err => err.type !== 'photo');
                // Thêm lỗi mới
                this.errMsg.push({
                    type: 'photo',
                    label: this.translateService.instant('ERROR.INVALID_IMAGE_FORMAT') || 'Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP'
                });
                
                this.previewPhoto = null;
                this.admin.photo = null;
                return;
            }

            // Xóa lỗi nếu file hợp lệ
            this.errMsg = this.errMsg.filter(err => err.type !== 'photo');

            // Gán file vào admin.photo để gửi lên server khi lưu
            this.admin.photo = file;

            // Hiển thị ảnh xem trước
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.previewPhoto = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    previewAvatar: string | null = null;

    onAvatarSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];

            // Validate file type - chỉ cho phép jpg, png, webp
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            const fileType = file.type.toLowerCase();
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            
            const isValidType = allowedTypes.includes(fileType) || 
                               (fileExtension && ['jpg', 'jpeg', 'png', 'webp'].includes(fileExtension));

            if (!isValidType) {
                // Xóa lỗi cũ nếu có
                this.errMsg = this.errMsg.filter(err => err.type !== 'avatar');
                // Thêm lỗi mới
                this.errMsg.push({
                    type: 'avatar',
                    label: this.translateService.instant('ERROR.INVALID_IMAGE_FORMAT') || 'Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP'
                });
                
                this.previewAvatar = null;
                this.admin.digital_signature = null;
                return;
            }

            // Xóa lỗi nếu file hợp lệ
            this.errMsg = this.errMsg.filter(err => err.type !== 'avatar');

            // Gán file vào admin.digital_signature để gửi lên server khi lưu
            this.admin.digital_signature = file;
            
            // Hiển thị ảnh xem trước
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.previewAvatar = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    /** Xóa ảnh đại diện đã chọn (về ảnh mặc định). */
    onPhotoClear(): void {
        console.log('onPhotoClear');
        this.previewPhoto = null;
        this.admin.photo = null;
        this.errMsg = this.errMsg.filter(err => err.type !== 'photo');
    }

    /** Xóa ảnh chữ ký đã chọn (về ảnh mặc định). */
    onAvatarClear(): void {
        console.log('onAvatarClear');
        this.previewAvatar = null;
        this.admin.digital_signature = null;
        this.errMsg = this.errMsg.filter(err => err.type !== 'avatar');
    }

    async getDepartments() {
        const response = await this._service.getDepartments();
        this.departments = response.data.map(item => ({
            label: item.name,
            value: item.short_name
        }));

    }

    public searchDepartment = '';
    public searchWorkArea = '';
    public searchArea = '';
    public workAreas = [];
    public areas = [];
    async getAreas() {
        const response = await this._service.getAreas();
        this.areas = response.data.map(item => ({
            label: item.name,
            value: item.code
        }));
    }
    async getWorkAreas() {
        const response = await this._service.getWorkAreas();
        this.workAreas = response.data.map(item => ({
            label: item.name,
            value: item.short_name
        }));
    }


    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible']) {
            const newId = changes['visible'].currentValue;
            if (newId) {
                this.admin = {
                    phone: '',
                    email: '',
                    full_name: '',
                    user_name: '',
                    status: 0,
                    password: '',
                    photo: '',
                    digital_signature: '',
                    position: ''
                }
                this.previewPhoto = null;
                this.previewAvatar = null;
                this.searchDepartment = '';
                this.searchWorkArea = '';
                this.errMsg = [];

                setTimeout(() => {
                    this.adminPhotoUpload?.resetImageFileInput();
                    this.adminSignatureUpload?.resetImageFileInput();
                });

                this.getDepartments();
                //this.getAreas();
                this.getWorkAreas();
            }
        }
    }


    onClose() {
        this.close.emit();
    }

    onOpen = () => {
        const modalContent = document.querySelector('.modal-content');
        const modalBody = document.querySelector('.modal-body');
        //  if (modalContent) modalContent.classList.add('modal-content-no-overflow');
       // if (modalBody) modalBody.classList.add('modal-body-scroll');
    }

    selectClose = () => {
        const modalContent = document.querySelector('.modal-content');
        const modalBody = document.querySelector('.modal-body');

        // if (modalContent) modalContent.classList.remove('modal-content-no-overflow');
        // if (modalBody) modalBody.classList.remove('modal-body-scroll');
    }

    validateParam(type: string, value: string) {
        if (!this.admin) return;
        let val = (value || '');
        if (type != 'password')
            val = val.trim();

        // đảm bảo errMsg luôn là mảng
        if (!Array.isArray(this.errMsg)) {
            this.errMsg = [];
        }

        // helper thêm lỗi nếu chưa có
        const addError = (type: string, label: string) => {
            if (!this.errMsg.some(err => err.type === type)) {
                this.errMsg.push({ type, label });
            }
        };

        // helper xóa lỗi theo type
        const removeError = (type: string) => {
            this.errMsg = this.errMsg.filter(err => err.type !== type);
        };

        switch (type) {
            case 'phone': {
                // Hỗ trợ format: +84xxxxxxxxx (10 số sau +84) hoặc 0xxxxxxxxx (10 số sau 0)
                const phoneRegex = /^(\+84|0)(3[2-9]|5[2|6|8|9]|7[0|6-9]|8[8|1-5]|9[0-9])[0-9]{7}$/;

                if (!phoneRegex.test(val)) {
                    addError('phone', this.translateService.instant('ERROR.INVALID_PHONE'));
                } else {
                    removeError('phone');
                }
                break;
            }


            case 'email': {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(val)) {
                    addError('email', this.translateService.instant('ERROR.INVALID_EMAIL'));
                } else {
                    removeError('email');
                }
                break;
            }

            case 'username': {
                // Chỉ cho phép chữ thường a-z, số 0-9, có thể thêm _ hoặc . nếu muốn
                const usernameRegex = /^[a-z0-9_.]+$/;

                if (!usernameRegex.test(val)) {
                    addError('username', this.translateService.instant('ERROR.INVALID_USERNAME'));
                } else {
                    removeError('username');
                }
                break;
            }

            case 'password': {
                const passwordRegex =
          /^(?!.*\s)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]{8,}$/;

                if (!passwordRegex.test(val)) {
                    addError(
                        'password',
                        this.translateService.instant('ERROR.INVALID_PASSWORD')
                    );
                } else {
                    removeError('password');
                }
                break;
            }
        }
    }

    changeStatus(event) {
        if (event.target) {
            this.admin.status = event.target.checked
        }
    }

    onSave() {
        if (this.admin) {
            // Convert +84 phone number to 0 format before submit
            if (this.admin.phone && this.admin.phone.startsWith('+84')) {
                this.admin.phone = '0' + this.admin.phone.substring(3);
            }
            this.save.emit(this.admin);

        }
    }
}
