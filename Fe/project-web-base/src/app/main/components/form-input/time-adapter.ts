import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-time-adapter',
  template: `
    <div class="input-group1" style="display: flex; align-items: center; justify-content: flex-start">
      <ngb-timepicker
        [(ngModel)]="timeStruct"
        (ngModelChange)="onTimeChange($event)"
        [spinners]="false"
        [seconds]="false"
        class="time-inline"
      ></ngb-timepicker>
    </div>
  `,
  styleUrls: ['./form-input.component.scss']
})
export class TimeAdapterComponent implements OnInit, OnChanges {
  @Input() minutes: number | null = null; // Input: số phút (0-1439)
  @Input() placeholder: string = 'HH:mm';
  @Output() minutesChange = new EventEmitter<number | null>();

  timeStruct: NgbTimeStruct = { hour: 0, minute: 0, second: 0 };

  ngOnInit(): void {
    if (this.minutes != null) {
      this.syncFromMinutes(this.minutes);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['minutes'] && this.minutes != null) {
      this.syncFromMinutes(this.minutes);
    } else if (changes['minutes'] && this.minutes == null) {
      this.timeStruct = { hour: 0, minute: 0, second: 0 };
    }
  }

  onTimeChange(time: NgbTimeStruct): void {
    this.timeStruct = time;
    this.emitMinutes();
  }

  private emitMinutes(): void {
    if (this.timeStruct) {
      const totalMinutes = this.timeStruct.hour * 60 + this.timeStruct.minute;
      this.minutesChange.emit(totalMinutes);
    } else {
      this.minutesChange.emit(null);
    }
  }

  private syncFromMinutes(minutes: number): void {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    this.timeStruct = {
      hour: hours,
      minute: mins,
      second: 0,
    };
  }
}