import { Component } from '@angular/core';
import {Router, ActivatedRoute } from '@angular/router';

import { StateService } from '../../../@core/data/state.service';

@Component({
  selector: 'ngx-theme-settings',
  styleUrls: ['./theme-settings.component.scss'],
  template: `
    <div class="settings-row">
      <a *ngFor="let sidebar of sidebars"
          [attr.title]="sidebar.name"
          (click)="sidebarSelect(sidebar)">
          <div [class.selected]="sidebar.selected" class="menu_button"><img [src]="'assets/images/' + sidebar.img"/></div>
          <div *ngIf="sidebar.count > 0" class="red_circle">{{sidebar.count}}</div>
      </a>
    </div>
  `,
})
export class ThemeSettingsComponent {
  sidebars = [];

  constructor(protected stateService: StateService, private router: Router) {

    this.stateService.getSidebarStates()
      .subscribe((sidebars: any[]) => this.sidebars = sidebars);
  }

  sidebarSelect(sidebars: any): boolean {
    this.sidebars = this.sidebars.map((s: any) => {
      s.selected = false;
      return s;
    });

    sidebars.selected = true;
    console.log("url", sidebars.url);
    this.router.navigate([sidebars.url]);
    return false;
  }
}
