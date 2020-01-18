import { NgModule } from '@angular/core';

import { ThemeModule } from '../../@theme/theme.module';
import { EquipmentComponent } from './equipment.component';
import { PendingRentalComponent } from './pending-rental/pending-rental.component';
import { ManualEntryComponent } from './manual-entry/manual-entry.component';
import { RentedComponent } from './rented/rented.component';
import { EquipmentRoutingModule } from './equipment-routing.module';
import { ChildNumberPickerComponent } from './child-number-picker.component';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';


@NgModule({
  imports: [
    ThemeModule,
    EquipmentRoutingModule,
    BsDropdownModule.forRoot(),
    NgxIntlTelInputModule
  ],
  declarations: [
    EquipmentComponent,
    PendingRentalComponent,
    ManualEntryComponent,
    RentedComponent,
    ChildNumberPickerComponent],
})
export class EquipmentModule {
}
