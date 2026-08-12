import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SharedModule } from 'app/main/shared.module';
import { DynamicTableModule } from 'app/main/components/dynamic-table/dynamic-table.module';

import { CommonLogViewPopupComponent } from './common-log-view-popup.component';

@NgModule({
  declarations: [CommonLogViewPopupComponent],
  imports: [CommonModule, FormsModule, SharedModule, DynamicTableModule],
  exports: [CommonLogViewPopupComponent]
})
export class CommonLogViewPopupModule {}

