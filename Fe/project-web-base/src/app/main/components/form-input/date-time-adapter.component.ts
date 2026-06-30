import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { NgbDateStruct, NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-date-time-adapter',
  template: `
   <div class="input-group" style="display: flex; align-items: center">
    <input
      [class]="size ? 'form-control ' + size : 'form-control'"
      [placeholder]="placeholder"
      name="dp"
      ngbDatepicker
      #d="ngbDatepicker"
      [ngModel]="dateStruct"
      (ngModelChange)="onDateChange($event)"
      (click)="onInputClick(d)"
      (keydown.enter)="onEnterKey()"
      [disabled]="disabled" />
      <div class="input-group-append" style="display: flex; justify-content: center; align-items: center">
    <button style="margin-right: 10px; border-top-right-radius: 4px; border-bottom-right-radius: 4px;" [class]="size === 'form-control-sm' ? 'btn btn-outline-secondary btn-sm calendar' : 'btn btn-outline-secondary calendar'" (click)="onButtonClick(d)" type="button" [disabled]="disabled">
      <i class="fa fa-calendar"></i>
    </button>
     <ngb-timepicker
      [(ngModel)]="timeStruct"
      (ngModelChange)="onTimeChange($event)"
      [spinners]="false"
      [seconds]="false"
      [disabled]="disabled"
      class="time-inline"
    ></ngb-timepicker>
  </div>

  <!-- Time picker (inline) -->
  
</div>


    <!-- Time picker -->
    
  `,
  styleUrls: ['./form-input.component.scss']
})
export class DatetimeAdapterComponent implements OnInit, OnChanges {
  @Input() timestamp: string | null = null; // Changed to string format YYYY-MM-dd HH:MM
  @Input() placeholder: string = 'dd-mm-yyyy';
  @Input() disabled: boolean = false;
  @Input() onEnter?: () => void; // Optional function to call on Enter key or click
  @Input() size: string | null = null; // Size class (e.g., 'form-control-sm'), if null uses 'form-control'
  @Output() timestampChange = new EventEmitter<string | null>(); // Changed to emit string

  dateStruct: NgbDateStruct | null = null;
  timeStruct: NgbTimeStruct = { hour: 0, minute: 0, second: 0 };

  ngOnInit(): void {
    if (this.timestamp) {
      this.syncFromString(this.timestamp);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['timestamp'] && this.timestamp != null && this.timestamp !== '') {
      this.syncFromString(this.timestamp);
    } else if (changes['timestamp'] && (this.timestamp == null || this.timestamp === '')) {
      this.dateStruct = null;
      this.timeStruct = { hour: 0, minute: 0, second: 0 };
    }
  }

  onDateChange(date: NgbDateStruct | null): void {
    this.dateStruct = date;
    this.emitCombinedString();
  }

  onTimeChange(time: NgbTimeStruct): void {
    this.timeStruct = time;
    this.emitCombinedString();
  }

  onInputClick(datepicker: any): void {
    if (!this.disabled) {
      datepicker.toggle();
      // Gọi hàm enter nếu có
      if (this.onEnter) {
        this.onEnter();
      }
    }
  }

  onButtonClick(datepicker: any): void {
    if (!this.disabled) {
      datepicker.toggle();
      // Gọi hàm enter nếu có
      if (this.onEnter) {
        this.onEnter();
      }
    }
  }

  onEnterKey(): void {
    if (!this.disabled && this.onEnter) {
      this.onEnter();
    }
  }

  private emitCombinedString(): void {
    if (this.dateStruct) {
      // Format as YYYY-MM-dd HH:MM
      const year = this.dateStruct.year.toString();
      const month = this.dateStruct.month.toString().padStart(2, '0');
      const day = this.dateStruct.day.toString().padStart(2, '0');
      const hour = this.timeStruct.hour.toString().padStart(2, '0');
      const minute = this.timeStruct.minute.toString().padStart(2, '0');
      const dateTimeString = `${year}-${month}-${day} ${hour}:${minute}`;
      this.timestampChange.emit(dateTimeString);
    } else {
      this.timestampChange.emit(null);
    }
  }

  private syncFromString(dateTimeString: string): void {
    // Parse YYYY-MM-dd HH:MM format
    if (dateTimeString) {
      const parts = dateTimeString.split(' ');
      if (parts.length === 2) {
        const datePart = parts[0].split('-');
        const timePart = parts[1].split(':');

        if (datePart.length === 3 && timePart.length >= 2) {
          this.dateStruct = {
            year: parseInt(datePart[0], 10),
            month: parseInt(datePart[1], 10),
            day: parseInt(datePart[2], 10),
          };
          this.timeStruct = {
            hour: parseInt(timePart[0], 10),
            minute: parseInt(timePart[1], 10),
            second: timePart.length > 2 ? parseInt(timePart[2], 10) : 0,
          };
          return;
        }
      }

      // Fallback: try to parse as timestamp (for backward compatibility)
      const ts = parseInt(dateTimeString, 10);
      if (!isNaN(ts)) {
        const date = new Date(ts);
        this.dateStruct = {
          day: date.getDate(),
          month: date.getMonth() + 1,
          year: date.getFullYear(),
        };
        this.timeStruct = {
          hour: date.getHours(),
          minute: date.getMinutes(),
          second: date.getSeconds(),
        };
      }
    }
  }
}
