import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { Role } from '../role.service';

@Component({
  selector: 'app-role-change-status',
  templateUrl: './role-change-status.component.html',
  styleUrls: ['./role-change-status.component.scss']
})
export class RoleChangeStatusComponent {
  @Input() visible = false;
  @Input() mode: 'view' | 'edit' = 'view';
  @Input() role?: Role;
  @Input() saving = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Role>();
  public errMsg = "";
  onClose() {
    this.close.emit();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscKey(event: KeyboardEvent) {
    if (this.visible) {
      this.onClose();
    }
  }

  onSave() {
    if (this.role) {
      this.save.emit(this.role);
    }
  }
}
