import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import { CoreCommonModule } from '@core/common.module';
import { CoreDirectivesModule } from '@core/directives/directives';
import { CorePipesModule } from '@core/pipes/pipes.module';

import { PermissionService } from './permission.service';
import { PermissionsListComponent } from './permission-list/permission-list.component';
import { MapPermissionsModalComponent } from './popup/map-permissions-modal.component';
import { PermissionRolesModalComponent } from './popup/permission-roles-modal.component';
import { ConfirmModalComponent } from 'app/main/components/modals/confirm-modal/confirm-modal.component';
import { SharedModule } from '../../shared.module';
import { ContentHeaderModule } from 'app/layout/components/content-header/content-header.module';
import { SharedPipesModule } from 'app/main/components/pipe/shared-pipes.module';
import { DynamicTableModule } from 'app/main/components/dynamic-table/dynamic-table.module';
import { UserAutocompleteComponent } from 'app/main/components/autocomplete/user/user-autocomplete.component';
import { AdvancedSearchFilterModule } from 'app/main/components/advanced-search-filter/advanced-search-filter.module';
import { AdministratorService } from '../administrators/administrator.service';

// routing
const routes: Routes = [
  {
    path: '',
    component: PermissionsListComponent,
    resolve: {
      uls: PermissionService
    },
    data: { animation: 'PermissionListComponent' }
  },
  {
    path: 'view',
    redirectTo: '/system/permission/view/1' // Redirection
  },
  {
    path: 'edit',
    redirectTo: '/system/permission/edit/1' // Redirection
  }
];

@NgModule({
  declarations: [
    PermissionsListComponent, MapPermissionsModalComponent, PermissionRolesModalComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    CoreCommonModule,
    FormsModule,
    NgbModule,
    NgSelectModule,
    NgxDatatableModule,
    CorePipesModule,
    CoreDirectivesModule,
    ContentHeaderModule,
    SharedModule,
    SharedPipesModule,
    DynamicTableModule,
    UserAutocompleteComponent,
    AdvancedSearchFilterModule
  ],
  providers: [PermissionService, AdministratorService]
})
export class PermissionModule {}
