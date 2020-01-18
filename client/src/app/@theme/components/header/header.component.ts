import { Component, Input, OnInit } from '@angular/core';

import { NbMenuService, NbSidebarService } from '@nebular/theme';
import { AnalyticsService } from '../../../@core/utils/analytics.service';
import { Router, ActivatedRoute } from '@angular/router';
import { StateService } from '../../../@core/data/state.service';
import { environment } from '../../../config/config';
import { ModalService } from '../../services/index';  
import * as io from 'socket.io-client'
import { from } from 'rxjs/observable/from';

@Component({
  selector: 'ngx-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit {


  @Input() position = 'normal';

  user: any;

  sidebars = [];

  socket = null;

  constructor(protected stateService: StateService, private sidebarService: NbSidebarService,
              private router: Router, private modalService : ModalService) {
    this.stateService.getSidebarStates()
      .subscribe((sidebars: any[]) => this.sidebars = sidebars);
    this.sidebars = this.sidebars.map((s: any) => {
        s.selected = false;
        return s;
      });

    
  }

  ngOnInit() {
   
  }

  toggleSidebar(): boolean {
    this.sidebarService.toggle(true, 'menu-sidebar');
    return false;
  }

  logout() {
  }

  toggleSettings(): boolean {
    this.sidebarService.toggle(false, 'settings-sidebar');
    return false;
  }

  sidebarSelect(sidebars: any): boolean {
    this.sidebars = this.sidebars.map((s: any) => {
      s.selected = false;
      return s;
    });



    console.log("url", sidebars.url);

    if(sidebars.url == 'pages/setting')
    {
      // localStorage.setItem('admin_user', JSON.stringify({}));
      // this.router.navigateByUrl('/' + sidebars.url);
      console.log(this.router.routerState.toString());
      if(this.router.routerState.toString().indexOf("path:'adduser'") >= 0 || this.router.routerState.toString().indexOf("path:'setting'") >= 0 || this.router.routerState.toString().indexOf("path:'change_password") >= 0)
      {
        this.router.navigateByUrl('/' + sidebars.url);
      }
      else
      {
        this.modalService.open("login_modal");
      }

    }
    else
    {
      sidebars.selected = true;
      this.router.navigateByUrl('/' + sidebars.url);
    }
    
    return false;
  }

  logoTap()
  {
    this.sidebars = this.sidebars.map((s: any) => {
      s.selected = false;
      return s;
    });
    this.router.navigate(["pages"]);
  }
}
