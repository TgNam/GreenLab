import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { NgbModule, NgbNavModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';

import { CoreCommonModule } from '@core/common.module';
import { CoreDirectivesModule } from '@core/directives/directives';
import { CorePipesModule } from '@core/pipes/pipes.module';
import { ContentHeaderModule } from 'app/layout/components/content-header/content-header.module';
import { AdvancedSearchFilterModule } from 'app/main/components/advanced-search-filter/advanced-search-filter.module';
import { SharedModule } from '../../shared.module';
import { SharedPipesModule } from 'app/main/components/pipe/shared-pipes.module';
import { DynamicTableModule } from 'app/main/components/dynamic-table/dynamic-table.module';

import { SmsTemplateListComponent } from './sms-template-list/sms-template-list.component';
import { SmsTemplateService } from './sms-template.service';

const routes: Routes = [
  {
    path: '',
    component: SmsTemplateListComponent,
    data: { animation: 'SmsTemplateListComponent' }
  }
];

@NgModule({
  declarations: [SmsTemplateListComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    CoreCommonModule,
    ContentHeaderModule,
    FormsModule,
    NgbModule,
    NgbNavModule,
    NgbTooltipModule,
    NgSelectModule,
    CorePipesModule,
    CoreDirectivesModule,
    SharedModule,
    SharedPipesModule,
    DynamicTableModule,
    AdvancedSearchFilterModule
  ],
  providers: [SmsTemplateService]
})
export class SmsTemplateModule {}
