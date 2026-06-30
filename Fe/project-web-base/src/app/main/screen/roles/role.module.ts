import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import { CoreCommonModule } from '@core/common.module';
import { CoreDirectivesModule } from '@core/directives/directives';
import { CorePipesModule } from '@core/pipes/pipes.module';

import { RoleListComponent } from './role-list/role-list.component';
import { RoleService } from './role.service';
import { AdministratorService } from '../administrators/administrator.service';
import { ContentHeaderModule } from 'app/layout/components/content-header/content-header.module';
import { RoleCreateComponent } from './popup/role-create.component';
import { RoleDetailComponent } from './popup/role-detail.component';
import { RoleChangeStatusComponent } from './popup/role-change-status.component';
import { AssignPermission } from './popup/assign-permission';
import { AddGroupMembersModalComponent } from './popup/add-group-members-modal.component';
import { UserAutocompleteComponent } from 'app/main/components/autocomplete/user/user-autocomplete.component';
import { SharedModule } from '../../shared.module';
import { DynamicTableModule } from 'app/main/components/dynamic-table/dynamic-table.module';
import { SharedPipesModule } from 'app/main/components/pipe/shared-pipes.module';
import { FeatherIconDirective } from '@core/directives/feather.directive';
import { AdvancedSearchFilterModule } from 'app/main/components/advanced-search-filter/advanced-search-filter.module';

const routes: Routes = [
  {
    path: '',
    component: RoleListComponent,
    resolve: {
      uls: RoleService
    },
    data: { animation: 'RoleListComponent' }
  }
];

@NgModule({
  declarations: [FeatherIconDirective, RoleListComponent, RoleCreateComponent, RoleDetailComponent, RoleChangeStatusComponent, AssignPermission, AddGroupMembersModalComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    CoreCommonModule,
    FormsModule,
    NgbModule,
    NgSelectModule,
    ReactiveFormsModule,
    ContentHeaderModule,
    DynamicTableModule,
    NgxDatatableModule,
    CorePipesModule,
    CoreDirectivesModule,
    UserAutocompleteComponent,
    SharedModule,
    SharedPipesModule,
    NgSelectModule,
    AdvancedSearchFilterModule
  ],
  providers: [RoleService, AdministratorService]
})
export class RoleModule {}


