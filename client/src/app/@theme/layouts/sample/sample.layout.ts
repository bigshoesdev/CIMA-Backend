import { Component, OnDestroy } from '@angular/core';
import {
  NbMediaBreakpoint,
  NbMediaBreakpointsService,
  NbMenuItem,
  NbMenuService,
  NbSidebarService,
  NbThemeService,
} from '@nebular/theme';

import { StateService } from '../../../@core/data/state.service';

import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/withLatestFrom';
import 'rxjs/add/operator/delay';

// TODO: move layouts into the framework
@Component({
  selector: 'ngx-sample-layout',
  styleUrls: ['./sample.layout.scss'],
  template: `
    <nb-layout  windowMode>
      <nb-layout-header fixed>
        <ngx-header [position]="normal"></ngx-header>
      </nb-layout-header>

      <nb-layout-column class="main-content">
        <ng-content select="router-outlet"></ng-content>
      </nb-layout-column>
      
      <nb-sidebar class="settings-sidebar"
                   tag="settings-sidebar"
                   state="collapsed"
                   fixed
                   [right]="true">
        <ngx-theme-settings></ngx-theme-settings>
      </nb-sidebar>
    </nb-layout>
  `,
})
export class SampleLayoutComponent  implements OnDestroy {

  layout: any = {};
  sidebar: any = {};

  constructor() {
   
  }

  ngOnDestroy() {
    // localStorage.setItem('admin_user', JSON.stringify({}));
  }
}
