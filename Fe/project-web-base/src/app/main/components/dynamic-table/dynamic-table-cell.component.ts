import { Component, Input, ChangeDetectionStrategy, TemplateRef } from '@angular/core';

/**
 * Ô bảng dùng template: OnPush, chỉ render lại khi input đổi.
 * Giúp giảm re-render khi bảng có nhiều dòng.
 */
@Component({
  selector: 'app-dynamic-cell',
  templateUrl: './dynamic-table-cell.component.html',
  styleUrls: ['./dynamic-table-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicTableCellComponent {
  @Input() template: TemplateRef<any> | null = null;
  @Input() row: any;
  @Input() value: any;
  @Input() index: number;
  @Input() column: any;
}
