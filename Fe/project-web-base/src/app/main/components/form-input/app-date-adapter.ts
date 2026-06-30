import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgbDateStruct, NgbDatepicker } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-date-adapter',
  template: `
   <div class="input-group" >
    <input
      [class]="size ? 'form-control ' + size : 'form-control'"
      [placeholder]="placeholder"
      name="dp"
      ngbDatepicker
      #d="ngbDatepicker"
      container="body"
      [ngModel]="dateStruct"
      (ngModelChange)="onDateChange($event)"
      (click)="!disabled && d.toggle()"
      [disabled]="disabled"
      [minDate]="minDate || null"
      (keydown.enter)="handleEnter($event, d)" />
      <div class="input-group-append">
    <button [class]="size === 'form-control-sm' ? 'btn btn-outline-secondary btn-sm calendar' : 'btn btn-outline-secondary calendar'" (click)="!disabled && d.toggle()" type="button" [disabled]="disabled">
      <i class="fa fa-calendar"></i>
    </button>
  </div>
   </div>
  `,
  styleUrls: ['./form-input.component.scss']
})
export class DateAdapterComponent implements OnInit, OnChanges {
  @Input() timestamp: string | null = null; // Changed to string format YYYY-MM-dd
  @Input() placeholder: string = 'dd-mm-yyyy';
  @Input() disabled: boolean = false;
  @Input() minDate: NgbDateStruct | null = null; // Optional minDate, only applied if provided
  @Input() size: string | null = null; // Size class (e.g., 'form-control-sm'), if null uses 'form-control'
  @Output() timestampChange = new EventEmitter<string | null>(); // Changed to emit string
  @Output() enterKey = new EventEmitter<Event>();

  dateStruct: NgbDateStruct | null = null;
  private isDatepickerOpen = false;

  ngOnInit(): void {
    // Track datepicker open/close state
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['timestamp'] && this.timestamp != null && this.timestamp !== '') {
      this.dateStruct = this.stringToStruct(this.timestamp);
      this.isDatepickerOpen = false; // Reset state when value changes
    } else {
      this.dateStruct = null;
      this.isDatepickerOpen = false;
    }
  }

  onDateChange(event: NgbDateStruct | null) {
    if (event) {
      const dateString = this.structToString(event);
      this.timestampChange.emit(dateString);
      this.isDatepickerOpen = false; // Close datepicker after selection
    } else {
      this.timestampChange.emit(null);
    }
  }

  private stringToStruct(dateString: string): NgbDateStruct {
    // Parse YYYY-MM-dd format
    if (dateString) {
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        return {
          year: parseInt(parts[0], 10),
          month: parseInt(parts[1], 10),
          day: parseInt(parts[2], 10)
        };
      }
    } catch (error) {
    }
      // Fallback: try to parse as timestamp (for backward compatibility)
      const ts = parseInt(dateString, 10);
      if (!isNaN(ts)) {
        const date = new Date(ts);
        return {
          day: date.getDate(),
          month: date.getMonth() + 1,
          year: date.getFullYear()
        };
      }
    }
    return null;
  }

  private structToString(date: NgbDateStruct): string {
    // Format as YYYY-MM-dd
    const year = date.year.toString();
    const month = date.month.toString().padStart(2, '0');
    const day = date.day.toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  handleEnter(event: KeyboardEvent, datepicker: any) {
    event.preventDefault();
    event.stopPropagation();
    // Nếu đã có giá trị, chuyển sang input tiếp theo luôn
    if (this.timestamp !== null && this.timestamp !== undefined && this.timestamp !== '') {
      if (datepicker && this.isDatepickerOpen) {
        if (datepicker.toggle) {
          datepicker.toggle();
        }
        this.isDatepickerOpen = false;
      }
      setTimeout(() => {
        this.enterKey.emit(event);
      }, 50);
      return;
    }

    // Chưa có giá trị: Enter lần 1 mở datepicker, Enter lần 2 đóng và chuyển sang input khác
    if (this.isDatepickerOpen) {
      // Datepicker đang mở, Enter lần 2: đóng và chuyển sang input khác
      if (datepicker && datepicker.toggle) {
        datepicker.toggle();
      }
      this.isDatepickerOpen = false;
      setTimeout(() => {
        this.enterKey.emit(event);
      }, 150);
    } else {
      // Datepicker chưa mở, Enter lần 1: mở datepicker
      if (datepicker && datepicker.open) {
        datepicker.open();
      }
      this.isDatepickerOpen = true;
    }
  }
}
