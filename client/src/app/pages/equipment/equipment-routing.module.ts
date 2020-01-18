import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { EquipmentComponent } from './equipment.component';
import { RentedComponent } from './rented/rented.component';
import { PendingRentalComponent } from './pending-rental/pending-rental.component';
import { ManualEntryComponent } from './manual-entry/manual-entry.component';

const routes: Routes = [{
  path: '',
  component: EquipmentComponent,
  children: [{
    path: 'rented',
    component: RentedComponent,
  },
  {
    path: 'pending_rental',
    component: PendingRentalComponent,
  },
  {
    path: 'manual_entry',
    component: ManualEntryComponent,
  },
  {
    path: '',
    redirectTo: 'pending_rental',
    pathMatch: 'full',
  }],
},
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EquipmentRoutingModule {
}
