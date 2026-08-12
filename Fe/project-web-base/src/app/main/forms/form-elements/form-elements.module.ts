import { NgModule } from '@angular/core';

import { DateTimePickerModule } from 'app/main/forms/form-elements/date-time-picker/date-time-picker.module';
import { FlatpickrModule } from 'app/main/forms/form-elements/flatpickr/flatpickr.module';

@NgModule({
  declarations: [],
  imports: [DateTimePickerModule, FlatpickrModule]
})
export class FormElementsModule {}
