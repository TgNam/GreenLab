import { TranslationWidth } from '@angular/common';
import { Injectable } from '@angular/core';
import { NgbDatepickerI18n } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';

const I18N_VALUES: any = {
  en: {
    weekdays: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
    ]
  },
  vn: {
    weekdays: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    months: [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ]
  }
};

@Injectable() 
export class CustomDatepickerI18n extends NgbDatepickerI18n {
 
  private currentLang: string = 'en';

  constructor(private translate: TranslateService) {
    super();

    // Lắng nghe sự kiện đổi ngôn ngữ
    this.translate.onLangChange.subscribe(event => {
      console.log('date')
      this.currentLang = event.lang;
    });

    // Gán ngôn ngữ khởi đầu
    this.currentLang = this.translate.currentLang || 'en';
  }

  getWeekdayLabel(weekday: number): string {
    return I18N_VALUES[this.currentLang].weekdays[weekday - 1];
  }

  getMonthShortName(month: number): string {
    return I18N_VALUES[this.currentLang].months[month - 1];
  }

  getMonthFullName(month: number): string {
    return I18N_VALUES[this.currentLang].months[month - 1];
  }

  getDayAriaLabel(date: { year: number; month: number; day: number }): string {
    return `${date.day}-${date.month}-${date.year}`;
  }
}
