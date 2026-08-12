import { Component, Input } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-copy-button',
  templateUrl: './copy-button.component.html',
  styleUrls: ['./copy-button.component.scss']
})
export class CopyButtonComponent {
  @Input() textToCopy: string = '';     // nội dung cần copy
  @Input() title: string = 'Sao chép';  // tooltip hoặc label
  @Input() icon: string = 'fa-copy';    // icon FA, ví dụ: fa-copy, fa-link...
  @Input() colorWhite: boolean = false;
  copied = false;
  constructor(private toastr: ToastrService) {}

  copyText() {
    if (!this.textToCopy) return;

    const textarea = document.createElement('textarea');
    textarea.value = this.textToCopy;
    textarea.style.position = 'fixed'; // tránh scroll
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        this.copied = true;
        setTimeout(() => (this.copied = false), 1500);
        this.toastr.success('Đã sao chép!', 'Thành công');
      }
    } catch (err) {
      console.error('Không thể copy:', err);
    }

    document.body.removeChild(textarea);
  }
}
