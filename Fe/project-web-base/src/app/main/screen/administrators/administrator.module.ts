import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import { CoreCommonModule } from '@core/common.module';
import { CoreDirectivesModule } from '@core/directives/directives';
import { CorePipesModule } from '@core/pipes/pipes.module';
import { ContentHeaderModule } from 'app/layout/components/content-header/content-header.module';

import { AdministratorListComponent } from './administrator-list/administrator-list.component';
import { AdministratorService } from './administrator.service';
import { AdministratorDetailComponent } from './popup/administrator-detail.component';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AdministratorChangeStatusComponent } from './popup/administrator-change-status.component';
import { AdministratorCreateComponent } from './popup/administrator-create.component';
import { FlatpickrModule } from 'app/main/forms/form-elements/flatpickr/flatpickr.module';
import { AdministratorAssignRoleComponent } from './popup/administrator-assign-role';
import { AdministratorAssignRoleCanSetComponent } from './popup/administrator-assign-role-can-set';
import { SharedModule } from '../../shared.module';
import { AdministratorChooseManager } from './popup/administrator-choose-manager.component';
import { UserAutocompleteComponent } from 'app/main/components/autocomplete/user/user-autocomplete.component';
import { DynamicTableModule } from 'app/main/components/dynamic-table/dynamic-table.module';
import { SharedPipesModule } from 'app/main/components/pipe/shared-pipes.module';
import { AdvancedSearchFilterModule } from 'app/main/components/advanced-search-filter/advanced-search-filter.module';

const routes: Routes = [
  {
    path: '',
    component: AdministratorListComponent,
    resolve: { uls: AdministratorService },
    data: { animation: 'AdministratorListComponent' }
  }
];

@NgModule({
  declarations: [AdministratorListComponent, AdministratorDetailComponent, AdministratorChangeStatusComponent, AdministratorCreateComponent, AdministratorAssignRoleComponent, AdministratorAssignRoleCanSetComponent, AdministratorChooseManager],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    CoreCommonModule,
    ContentHeaderModule,
    FormsModule,
    NgbModule,
    FlatpickrModule,
    NgSelectModule,
    DynamicTableModule,
    NgxDatatableModule,
    CorePipesModule,
    CoreDirectivesModule,
    SharedModule,
    UserAutocompleteComponent,
    SharedPipesModule,
    NgbDropdownModule,
    AdvancedSearchFilterModule
  ],
  providers: [AdministratorService]
})
export class AdministratorModule {}


