import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { Administrator } from '../administrator.service';

@Component({
  selector: 'app-administrator-change-status',
  templateUrl: './administrator-change-status.component.html',
  styleUrls: ['./administrator-change-status.component.scss']
})
export class AdministratorChangeStatusComponent {
  @Input() visible = false;
   @Input() chaging = false;
  @Input() mode: 'view' | 'edit' = 'view';
  @Input() admin?: Administrator;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Administrator>();
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
    if (this.admin) {
      this.save.emit(this.admin);
    }
  }
}
