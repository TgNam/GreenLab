import { Component, Input, Output, EventEmitter, SimpleChanges, ViewChild } from '@angular/core';
import { Administrator, AdministratorService } from '../administrator.service';
import { CoreTranslationService } from '@core/services/translation.service';
import { FormInputComponent } from 'app/main/components/form-input/form-input.component';

@Component({
  selector: 'app-administrator-detail',
  templateUrl: './administrator-detail.component.html',
  styleUrls: ['./administrator-detail.component.scss']
})
export class AdministratorDetailComponent {
  @Input() visible = false;
  @Input() mode: 'view' | 'edit' = 'view';
  @Input() admin?: any;
  @Input() positions = [];
  @Input() updating = false;
  public departments = []
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Administrator>();
  public errMsg = [];
  onClose() {
    this.errMsg = []

    this.close.emit();
  }

  constructor(private _service: AdministratorService, private translateService: CoreTranslationService) {
  }

  @ViewChild('adminPhotoUpload') adminPhotoUpload?: FormInputComponent;
  @ViewChild('adminSignatureUpload') adminSignatureUpload?: FormInputComponent;

  changeStatus(event) {
    if (event.target) {
      this.admin.status = event.target.checked
    }
  }

  async getDepartments() {
    const response = await this._service.getDepartments();
    this.departments = response.data.map(item => ({
      label: item.name,
      value: item.short_name
    }));

  }
  public searchPosition = '';
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

  previewUrl: string | ArrayBuffer | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && !changes['visible'].firstChange) {
      const newId = changes['visible'].currentValue;
      if (newId) {
        this.errMsg = []
        this.previewAvatar = null;
        this.previewPhoto = null;
        this.previewUrl = null;

        setTimeout(() => {
          this.adminPhotoUpload?.resetImageFileInput();
          this.adminSignatureUpload?.resetImageFileInput();
        });

        if (this.admin?.departmentName) {
          this.searchDepartment = this.admin?.departmentName
        }
        if (this.admin?.workAreaName) {
          this.searchWorkArea = this.admin?.workAreaName
        }
        this.getDepartments();
        this.getWorkAreas();
      }
    } else if (changes['admin'] && !changes['admin'].firstChange) {
      const newAdmin = changes['admin'].currentValue;
      if (newAdmin) {
        if (newAdmin.departmentName) {
          this.searchDepartment = newAdmin.departmentName
        }
        if (newAdmin.workAreaName) {
          this.searchWorkArea = newAdmin.workAreaName
        }
      }
    }
  }

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
        this.previewUrl = null;
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
        const result = e.target?.result;
        if (typeof result === 'string') {
          this.previewPhoto = result;
          this.previewUrl = result;
        } else {
          this.previewPhoto = null;
          this.previewUrl = null;
        }
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
        const result = e.target?.result;
        if (typeof result === 'string') {
          this.previewAvatar = result;
        } else {
          this.previewAvatar = null;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  /** Xóa ảnh đại diện (preview hoặc ảnh server), lưu sẽ gửi photo null. */
  onPhotoClear(): void {
    console.log('onPhotoClear');
    this.previewPhoto = null;
    this.previewUrl = null;
    this.admin.photo = null;
    this.errMsg = this.errMsg.filter(err => err.type !== 'photo');
  }

  /** Xóa chữ ký số đã chọn / từ server. */
  onAvatarClear(): void {
    console.log('onAvatarClear');
    this.previewAvatar = null;
    this.admin.digital_signature = null;
    this.errMsg = this.errMsg.filter(err => err.type !== 'avatar');
  }

  validateParam(type: string, value: string): void {
    let val = (value || '');
    if (type != 'password')
      val = val.trim();

    // Đảm bảo errMsg luôn là mảng
    if (!Array.isArray(this.errMsg)) {
      this.errMsg = [];
    }

    let errorLabel: string | null = null;

    switch (type) {
      case 'phone': {
        // Hỗ trợ format: +84xxxxxxxxx (10 số sau +84) hoặc 0xxxxxxxxx (10 số sau 0)
        const phoneRegex = /^(\+84|0)(3[2-9]|5[2|6|8|9]|7[0|6-9]|8[8|1-5]|9[0-9])[0-9]{7}$/;
        if (!phoneRegex.test(val)) {
          errorLabel = this.translateService.instant('ERROR.INVALID_PHONE');
        }
        break;
      }
      case 'username': {
        // Chỉ cho phép chữ thường a-z, số 0-9, có thể thêm _ hoặc . nếu muốn
        const usernameRegex = /^[a-z0-9_.]+$/;
        if (!usernameRegex.test(val)) {
          errorLabel = this.translateService.instant('ERROR.INVALID_USERNAME');
        }
        break;
      }
      case 'password': {
        const passwordRegex =
          /^(?!.*\s)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]{8,}$/;

        if (val !== '' && !passwordRegex.test(val)) {
          errorLabel =
            this.translateService.instant('ERROR.INVALID_PASSWORD');
        }
        break;
      }

      default:
        return;
    }

    const existingIndex = this.errMsg.findIndex(e => e.type === type);

    if (errorLabel) {
      // ❌ Invalid → thêm mới hoặc cập nhật lỗi
      if (existingIndex === -1) {
        this.errMsg.push({ type, label: errorLabel });
      } else {
        this.errMsg[existingIndex].label = errorLabel;
      }
    } else {
      // ✅ Valid → xóa lỗi nếu tồn tại
      if (existingIndex !== -1) {
        this.errMsg.splice(existingIndex, 1);
      }
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
