import { Component, OnInit } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { environment } from '../../config/config';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { NbThemeService } from '@nebular/theme';
import {Location} from '@angular/common';
import { StateService } from '../../@core/data/state.service';
import { PACKAGE_ROOT_URL } from '@angular/core/src/application_tokens';


@Component({
  selector: 'app-auth-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})


export class LoginComponent implements OnInit {

  user : any = {};
  previous_url: string;
  admin_user : any;

  private static previousRoutesUrl = new Array<string>();

  public scrollPos: any = {};
  public interval: any;
  public lastRoute: string;

  constructor(protected stateService: StateService, private themeService: NbThemeService, private http: Http, private router: Router, private _location: Location) { 
  }
  
  ngOnInit() {
    console.log("login start");
    this.user = {
      email : '',
      password: ''    }

  
    this.themeService.changeTheme('cosmic');
    this.stateService.setlogout_show(true);

    JSON.parse(localStorage.getItem('setting'));

    let setting = JSON.parse(localStorage.getItem('setting'));
    console.log("first url", setting.url);
    if(setting.url == "first")
    {
      this.previous_url = setting.url;
      let temp = JSON.parse(localStorage.getItem('admin_user'));
      if(temp == null || temp.user_token == undefined)
      {
      }
      else
      {
        this.router.navigate(['pages']);
      }
    }
    else if(setting.url == "setting")
      this.previous_url = setting.url;
    console.log("********" ,this.previous_url);
    localStorage.setItem('setting', JSON.stringify({}));
  }

  login () {
    console.log("---start validation");

    this.http.post(environment.api_url + 'admin_signin', this.user)
      .subscribe(
        res => {
          let response = res.json();
          if(response.result  == 1)
          {
            console.log("response", response.user);
            localStorage.setItem('login', JSON.stringify(response.user));
            localStorage.setItem('admin_user', JSON.stringify({}));
            this.router.navigate(['pages']);
            // if(this.previous_url == "setting")
            // {
            //   if(response.user.role == "Admin")
            //   {
            //     this._location.back();
            //   }
            //   else
            //     this.router.navigate(['pages']);
            // }
            // else
            // {
            //   if(this.previous_url != "first")
            //     this._location.back();
            //   else
            //     this.router.navigate(['pages']);
            // }
          }
          else
          {
            localStorage.setItem('login', JSON.stringify({}));
            alert("User_Login: failed, email or password is inccorrect.");
          }
        },
        err => {
          localStorage.setItem('login', JSON.stringify({}));
          alert("Error occured");
        }
      );
  }
}

