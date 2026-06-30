// src/app/shared/shared.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmModalComponent } from './components/modals/confirm-modal/confirm-modal.component';
import { ModalContentComponent } from './components/modals/modal-content/modal-content.component';
import { CopyButtonComponent } from './components/copy-btn/copy-button.component';
import { SwitchComponent } from './components/switch/switch.component';
import { MultiSelectComponent } from './components/multi-select/multi-select.component';
import { FormInputComponent } from './components/form-input/form-input.component';
import { FormInputModule } from './components/form-input/form-input.module';
import { ImagePreviewComponent } from './components/image-preview/image-preview.component';
import { SharedPipesModule } from './components/pipe/shared-pipes.module';
import { ButtonComponent } from './components/button/button.component';
import { JsonModalComponent } from './components/modals/modal-json/json-modal.component';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { BlockUIModule } from 'ng-block-ui';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

@NgModule({
  declarations: [ConfirmModalComponent, ModalContentComponent, CopyButtonComponent, SwitchComponent, MultiSelectComponent, ImagePreviewComponent, ButtonComponent, JsonModalComponent],
  imports: [CommonModule, FormInputModule, SharedPipesModule, NgxJsonViewerModule, BlockUIModule, NgxExtendedPdfViewerModule],
  exports: [ConfirmModalComponent, ModalContentComponent, CopyButtonComponent, SwitchComponent, MultiSelectComponent, FormInputComponent, ImagePreviewComponent, SharedPipesModule,ButtonComponent, JsonModalComponent, NgxJsonViewerModule, BlockUIModule] // quan trọng: để các module khác dùng được
})
export class SharedModule {}
