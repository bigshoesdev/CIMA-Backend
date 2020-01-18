import { NgModule } from '@angular/core';

import { PagesComponent } from './pages.component';
import { PagesRoutingModule } from './pages-routing.module';
import { ThemeModule } from '../@theme/theme.module';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';
import { MyDateRangePickerModule } from 'mydaterangepicker';
import { CommonModule } from '@angular/common';
import { AngularEchartsModule } from 'ngx-echarts';

import { Ng2SmartTableModule } from 'ng2-smart-table';
import { HomeComponent } from './home/home.component';
import { GraphComponent } from './graph/graph.component';
import { SearchComponent } from './search/search.component';
import { SettingComponent } from './setting/setting.component';
import { NumberPickerComponent } from './numberpicker/number-picker.component';
import { CustomerInfoComponent } from './customer-info/customer-info.component';
import { CustomerEditComponent } from './customer-edit/customer-edit.component';
import { AddPassComponent } from './add-pass/add-pass.component';
import { FormsModule } from '@angular/forms';
import { EditOtherPassComponent } from './edit-other-pass/edit-other-pass.component';
import { Md2DatepickerModule } from './md2datepicker/module';
import { MonthpickerComponent } from './monthpicker/monthpicker.component';
import { EditSeasonPassComponent } from './edit-season-pass/edit-season-pass.component';
import { EchartsBarComponent } from './graph/echart/echarts-bar.component';
import { ChangepassComponent } from './changepass/changepass.component';
import { AdduserComponent } from './adduser/adduser.component';


const PAGES_COMPONENTS = [
  PagesComponent,
  
];

@NgModule({
  imports: [
    PagesRoutingModule,
    ThemeModule,
    Ng2SmartTableModule,
    FormsModule,
    CommonModule,
    Md2DatepickerModule.forRoot(),
    AngularEchartsModule,
    BsDropdownModule.forRoot(),
    NgxIntlTelInputModule,
    MyDateRangePickerModule
    // MultipleDatePickerModule
  ],
  declarations: [
    ...PAGES_COMPONENTS,
    HomeComponent,
    GraphComponent,
    SearchComponent,
    SettingComponent,
    CustomerInfoComponent,
    CustomerEditComponent,
    AddPassComponent,
    EditOtherPassComponent,
    NumberPickerComponent,
    MonthpickerComponent,
    EditSeasonPassComponent,
    EchartsBarComponent,
    ChangepassComponent,
    AdduserComponent
  ],
})
export class PagesModule {
}
