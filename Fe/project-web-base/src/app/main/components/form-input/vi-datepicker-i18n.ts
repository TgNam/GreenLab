import { Injectable } from '@angular/core';
import { NgbDatepickerI18n } from '@ng-bootstrap/ng-bootstrap';

const VI_MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

const VI_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

@Injectable()
export class ViDatepickerI18n extends NgbDatepickerI18n {
  getWeekdayLabel(weekday: number): string {
    return VI_DAYS[weekday - 1];
  }

  getMonthShortName(month: number): string {
    return VI_MONTHS[month - 1];
  }

  getMonthFullName(month: number): string {
    return VI_MONTHS[month - 1];
  }

  getDayAriaLabel(date: import('@ng-bootstrap/ng-bootstrap').NgbDateStruct): string {
    return `${date.day}-${date.month}-${date.year}`;
  }
}
