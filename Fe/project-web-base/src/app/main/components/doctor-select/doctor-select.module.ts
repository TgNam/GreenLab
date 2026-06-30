import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DoctorSelectComponent } from './doctor-select.component';
import { FormInputModule } from '../form-input/form-input.module';

@NgModule({
  declarations: [DoctorSelectComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FormInputModule
  ],
  exports: [DoctorSelectComponent]
})
export class DoctorSelectModule { }

