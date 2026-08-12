import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormInputComponent } from './form-input.component';
import { FlatpickrModule } from 'app/main/forms/form-elements/flatpickr/flatpickr.module';
import { Ng2FlatpickrModule } from 'ng2-flatpickr';
import { BrowserModule } from '@angular/platform-browser';
import { TimePickerI18nModule } from 'app/main/forms/form-elements/date-time-picker/time-picker-i18n/time-picker-i18n.module';
import { DatePickerI18nModule } from 'app/main/forms/form-elements/date-time-picker/date-picker-i18n/date-picker-i18n.module';
import { NgbDateParserFormatter, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CustomDateParserFormatter } from './custom-date-formatter';
import { DateAdapterComponent } from './app-date-adapter';
import { DatetimeAdapterComponent } from './date-time-adapter.component';
import { SharedPipesModule } from '../pipe/shared-pipes.module';
import { TimeAdapterComponent } from './time-adapter';
import { DatetimeAdapterComponent as FlatpickrDatetimeAdapterComponent } from './app-datetime-adapter';
import { LightboxModule } from 'ngx-lightbox';

@NgModule({
  declarations: [FormInputComponent, DateAdapterComponent, DatetimeAdapterComponent, TimeAdapterComponent, FlatpickrDatetimeAdapterComponent],
  imports: [CommonModule, NgbModule, TimePickerI18nModule,
    DatePickerI18nModule,
    Ng2FlatpickrModule, FormsModule, ReactiveFormsModule, NgSelectModule, SharedPipesModule, LightboxModule],
  exports: [FormInputComponent],
  providers: [
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter }
  ],
})
export class FormInputModule { }
