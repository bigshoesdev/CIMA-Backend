import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { PagesComponent } from './pages.component';
import { HomeComponent } from './home/home.component';
import { GraphComponent } from './graph/graph.component';
import { SearchComponent } from './search/search.component';
import { SettingComponent } from './setting/setting.component';
import { LoginComponent } from '../auth/login/login.component';
import { CustomerInfoComponent } from './customer-info/customer-info.component';
import { CustomerEditComponent } from './customer-edit/customer-edit.component';
import { AddPassComponent } from './add-pass/add-pass.component';
import { EditOtherPassComponent } from './edit-other-pass/edit-other-pass.component';
import { EditSeasonPassComponent } from './edit-season-pass/edit-season-pass.component';
import { ChangepassComponent } from './changepass/changepass.component';
import { AdduserComponent } from './adduser/adduser.component';

const routes: Routes = [{
  path: '',
  component: PagesComponent,
  children: [{
    path: 'home',
    component: HomeComponent,
  },{
    path: 'change_password/:customer_id',
    component: ChangepassComponent,
  },{
    path: 'adduser',
    component: AdduserComponent,
  },
  {
    path: 'equipment',
    loadChildren: 'app/pages/equipment/equipment.module#EquipmentModule'
  },
  {
    path: 'editotherpass/:passtype/:phone_number',
    component: EditOtherPassComponent,
  },
  {
    path: 'editseasonpass/:passtype/:phone_number',
    component: EditSeasonPassComponent,
  },
  {
    path: 'graph',
    component: GraphComponent,
  },
  {
    path: 'addPass/:phone_number', 
    component: AddPassComponent
  },
  {
    path: 'customerInfo/:phone_number', 
    component: CustomerInfoComponent
  },
  {
    path: 'customerEdit/:phone_number', 
    component: CustomerEditComponent
  },
  {
    path: 'search',
    component: SearchComponent,
  },
  {
    path: 'setting',
    component: SettingComponent,
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  }],
},

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {
}
