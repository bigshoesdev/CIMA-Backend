import { Component } from '@angular/core';

@Component({
  selector: 'ngx-pages',
  template: `
    <ngx-sample-layout>
      <router-outlet></router-outlet>
      
    </ngx-sample-layout>
  `,
})
export class PagesComponent {

}
