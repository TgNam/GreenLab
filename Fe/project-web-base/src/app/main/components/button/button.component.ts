import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent {
  @Input() text: string = 'Button';
  @Input() type: 'primary' | 'danger' | 'secondary-outline' | 'success' = 'primary';
  @Input() disabled: boolean = false;
  @Input() disabled2: boolean = false;
  @Input() onlyDisabled: boolean = false;
  @Input() loading: boolean = false; // loading state - hiển thị spinner thay text
  @Input() icon: string = ''; // icon class (ví dụ: 'fa fa-search')
  @Input() customStyle: any = {}; // cho phép style inline
  @Input() buttonClass: string = ''; // cho phép thêm class CSS vào button (ví dụ: 'btn-sm')
  
  //input class để khi thêm sẽ cộng với type bên trên
  @Input() classColor: string = '';
  @Output() clickBtn = new EventEmitter<void>();
  public isHover = false;
  @Input() textLoading: string = '';
  handleClick() {
    if (!this.disabled && !this.loading) {
      this.clickBtn.emit();
    }
  }
  
  getButtonClasses(): string {
    const baseClasses = 'btn position-relative disabled-btn';
    let typeClass = '';
  
    if (!this.classColor) {
      const typeClasses: any = {
        'btn-primary': this.type === 'primary',
        'btn-danger': this.type === 'danger',
        'btn-success': this.type === 'success',
        'btn-secondary-outline': this.type === 'secondary-outline'
      };
  
      typeClass = Object.entries(typeClasses)
        .find(([_, condition]) => condition)?.[0] || '';
    } else {
      const colors = this.classColor.trim().split(' ');
      typeClass = colors.map(color => `${color}-${this.type}`).join(' ');
    }
  
    return `${baseClasses} ${typeClass} ${this.buttonClass || ''}`.trim();
  }
}
