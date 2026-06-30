import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FloatingPrintActionsBarComponent } from './floating-print-actions-bar.component';
import { FloatingPrintPanelComponent } from './floating-print-panel.component';
import { FormInputModule } from 'app/main/components/form-input/form-input.module';
import { QzPrintActionsModule } from 'app/main/components/qz-print-actions/qz-print-actions.module';
import { SharedModule } from 'app/main/shared.module';

@NgModule({
  declarations: [FloatingPrintPanelComponent, FloatingPrintActionsBarComponent],
  imports: [CommonModule, FormInputModule, QzPrintActionsModule, SharedModule],
  exports: [FloatingPrintPanelComponent, FloatingPrintActionsBarComponent],
})
export class FloatingPrintPanelModule {}
