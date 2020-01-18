/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { Component, OnInit } from '@angular/core';
import { AnalyticsService } from './@core/utils/analytics.service';
import { StateService } from './@core/data/state.service';

@Component({
  selector: 'ngx-app',
  template: '<router-outlet></router-outlet>',
})
export class AppComponent implements OnInit {

  refresh_count = 0;

  constructor(protected stateService: StateService, private analytics: AnalyticsService) {
    this.stateService.format_socket();
    // window.onbeforeunload = function() {
    // }
    localStorage.setItem('login', JSON.stringify({}));

  }

  ngOnInit(): void {
    this.analytics.trackPageViews(); 
    // localStorage.setItem('login', JSON.stringify({}));
  
    localStorage.setItem('setting', JSON.stringify({url: "first"}));
  }
}
