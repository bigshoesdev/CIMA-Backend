import { Component } from '@angular/core';

@Component({
  selector: 'ngx-footer',
  styleUrls: ['./footer.component.scss'],
  template: `
      <span class="created-by" style="padding-left: 15px;">Created with ♥ by <b><a href="https://akveo.com" target="_blank">Akveo</a></b> 2017</span>
      <div class="socials" style="padding-right: 15px">
        <a href="#" target="_blank" class="ion ion-social-github"></a>
        <a href="#" target="_blank" class="ion ion-social-facebook"></a>
        <a href="#" target="_blank" class="ion ion-social-twitter"></a>
        <a href="#" target="_blank" class="ion ion-social-linkedin"></a>
      </div>
  `,
})
export class FooterComponent {
}
