import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Role } from '../role.service';

@Component({
    selector: 'app-role-create',
    templateUrl: './role-create.component.html',
    styleUrls: ['./role-create.component.scss']
})
export class RoleCreateComponent {
    @Input() visible = false;
    @Input() creating = false;
    @Input() mode: 'view' | 'edit' = 'view';
    @Output() close = new EventEmitter<void>();
    @Output() save = new EventEmitter<Role>();
    public json = require('feather-icons/dist/icons.json');
    public iconOptions = Object.keys(this.json).map(key => ({
        label: key,   // dùng trong ng-template để hiển thị
        value: key      // giá trị
    }));
    public searchIcon = ""
    public selectedIcon: any = null;
    public errMsg = {
        type: "",
        label: ""
    };
    @Input() role: any = {
        name: '',
        description: '',
        active: false,
        position: 0

    };
    onClose() {
        this.close.emit();
    }

     selectOpen() {
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
        if (this.role) {
            if (this.role.icon) {
                this.role.icon = this.role.icon.value
            }
            this.save.emit(this.role);

        }
    }

    ngOnInit() {
        // console.log(this.iconOptions)

    }

    changeStatus(event) {
        if (event.target) {
            this.role.active = event.target.checked
        }
    }
}
