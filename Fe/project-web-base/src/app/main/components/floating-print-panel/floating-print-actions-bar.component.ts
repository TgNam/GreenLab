import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';

/**
 * Thanh nút nổi cố định (góc phải dưới): bấm để mở popup cấu hình in (`app-floating-print-panel` + `app-modal-content`).
 * Gắn class trên `document.body` để theme customizer chừa chỗ, đồng bộ với logic cũ của panel in.
 */
@Component({
  selector: 'app-floating-print-actions-bar',
  templateUrl: './floating-print-actions-bar.component.html',
  styleUrls: ['./floating-print-actions-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingPrintActionsBarComponent implements AfterViewInit, OnDestroy {
  @Input() fab_icon = 'fa fa-print';
  @Input() fab_title = '';

  @Output() fab_click = new EventEmitter<void>();

  private static readonly BODY_CLASS_FAB_SLOT = 'has-app-floating-print-panel';
  private static mount_count = 0;

  ngAfterViewInit(): void {
    FloatingPrintActionsBarComponent.mount_count += 1;
    if (FloatingPrintActionsBarComponent.mount_count === 1 && typeof document !== 'undefined') {
      document.body.classList.add(FloatingPrintActionsBarComponent.BODY_CLASS_FAB_SLOT);
    }
  }

  ngOnDestroy(): void {
    FloatingPrintActionsBarComponent.mount_count -= 1;
    if (FloatingPrintActionsBarComponent.mount_count <= 0 && typeof document !== 'undefined') {
      FloatingPrintActionsBarComponent.mount_count = 0;
      document.body.classList.remove(FloatingPrintActionsBarComponent.BODY_CLASS_FAB_SLOT);
    }
  }

  private isActuallyDragging = false;

  onFabClick(): void {
    if (this.isActuallyDragging) {
      return;
    }
    this.fab_click.emit();
  }

  position = { x: 0, y: 0 };
  private dragStartPos = { x: 0, y: 0 };
  private isDragging = false;
  private offset = { x: 0, y: 0 };
  private readonly STORAGE_KEY = this.fab_title + '_fab_position';

  ngOnInit() {
    // 1. Load tọa độ từ localStorage khi khởi tạo
    const savedPosition = localStorage.getItem(this.STORAGE_KEY);
    if (savedPosition) {
      this.position = JSON.parse(savedPosition);
    } else {
      this.setDefaultPosition();
    }
  }
  FAB_SIZE = 44;

  setDefaultPosition() {
    const defaultX = window.innerWidth - this.FAB_SIZE - 15;

    const defaultY = (window.innerHeight / 2) - (this.FAB_SIZE / 2) + 100;

    this.position = { x: defaultX, y: defaultY };
  }

  // Khi nhấn chuột xuống nút
  onMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.isActuallyDragging = false;
    // Tính toán khoảng cách từ con trỏ đến mép nút để tránh nút bị "nhảy" tâm
    this.dragStartPos = { x: event.clientX, y: event.clientY };
    this.offset = {
      x: event.clientX - this.position.x,
      y: event.clientY - this.position.y
    };

    // Ngăn chặn việc bôi đen văn bản khi đang kéo
    event.preventDefault();
  }

  // Lắng nghe sự kiện di chuyển chuột trên toàn bộ window
  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const distanceX = Math.abs(event.clientX - this.dragStartPos.x);
    const distanceY = Math.abs(event.clientY - this.dragStartPos.y);

    if (distanceX > 5 || distanceY > 5) {
      this.isActuallyDragging = true;
    }

    // 1. Tính toán vị trí thô (chưa chặn biên)
    let newX = event.clientX - this.offset.x;
    let newY = event.clientY - this.offset.y;

    // 2. Xác định giới hạn tối đa (chiều rộng/cao màn hình - kích thước nút)
    const maxX = window.innerWidth - this.FAB_SIZE;
    const maxY = window.innerHeight - this.FAB_SIZE;

    // 3. Chặn biên (Clamp): Không cho nhỏ hơn 0 và không lớn hơn max
    this.position = {
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    };
  }

  @HostListener('window:resize')
  onResize() {
    // Đảm bảo nút luôn nằm trong khung hình khi resize trình duyệt
    const maxX = window.innerWidth - this.FAB_SIZE;
    const maxY = window.innerHeight - this.FAB_SIZE;

    this.position.x = Math.max(0, Math.min(this.position.x, maxX));
    this.position.y = Math.max(0, Math.min(this.position.y, maxY));
  }

  // Khi thả chuột ra
  @HostListener('window:mouseup')
  onMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;

      if (this.isActuallyDragging) {
        const spacing = 10; // Khoảng cách cách lề

        // Tọa độ các cạnh
        const distLeft = this.position.x;
        const distRight = window.innerWidth - (this.position.x + this.FAB_SIZE);
        const distTop = this.position.y;
        const distBottom = window.innerHeight - (this.position.y + this.FAB_SIZE);

        // Tìm khoảng cách nhỏ nhất
        const minDist = Math.min(distLeft, distRight, distTop, distBottom);

        // Hít về cạnh gần nhất
        if (minDist === distLeft) {
          this.position.x = spacing;
        } else if (minDist === distRight) {
          this.position.x = window.innerWidth - this.FAB_SIZE - spacing;
        } else if (minDist === distTop) {
          this.position.y = spacing;
        } else {
          this.position.y = window.innerHeight - this.FAB_SIZE - spacing;
        }

        // Lưu lại vị trí sau khi hít
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.position));
      }
    }
  }
}
