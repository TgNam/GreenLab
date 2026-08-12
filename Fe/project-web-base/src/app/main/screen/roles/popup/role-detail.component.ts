import { Component, Input, Output, EventEmitter, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { Role } from '../role.service';

@Component({
  selector: 'app-role-detail',
  templateUrl: './role-detail.component.html',
  styleUrls: ['./role-detail.component.scss']
})
export class RoleDetailComponent {
  @Input() visible = false;
  @Input() mode: 'view' | 'edit' = 'view';
  @Input() role?: any;
  @Input() saving = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Role>();
  public errMsg = {
    type: "",
    label: ""
  };
  public json = require('feather-icons/dist/icons.json');
  public iconOptions = Object.keys(this.json).map(key => ({
    label: key,   // dùng trong ng-template để hiển thị
    value: key      // giá trị
  }));
  onClose() {
    this.close.emit();
  }
  changeStatus(event) {
    if (event.target) {
      this.role.active = event.target.checked
    }
  }

  onOpen() {
    const modalContent = document.querySelector('.modal-content');
    const modalBody = document.querySelector('.modal-body');

    if (modalContent) modalContent.classList.add('modal-content-no-overflow');
    if (modalBody) modalBody.classList.add('modal-body-scroll');
  }

  selectClose() {
    const modalContent = document.querySelector('.modal-content');
    const modalBody = document.querySelector('.modal-body');

    if (modalContent) modalContent.classList.remove('modal-content-no-overflow');
    if (modalBody) modalBody.classList.remove('modal-body-scroll');
  }



  onSave() {
    console.log(this.role)
    if (this.role) {
      if (this.role.icon) {
        this.role.icon = this.role.icon.value;
      }
      this.save.emit(this.role);
    }
  }
}
