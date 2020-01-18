import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { LocalDataSource } from 'ng2-smart-table';
import { environment } from '../../config/config';
import { ModalService } from '../../@theme/services/index';
import { Location} from '@angular/common';
import { StateService } from '../../@core/data/state.service';


@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss']
})
export class SettingComponent implements OnInit {

  source: LocalDataSource = new LocalDataSource();

  admin_users = [];

  adminUserInfo: any;

  role = [
    {
      type: "Admin",
      title: "Admin"
    },
    {
      type: "Staff",
      title: "Staff"
    }
  ];


  constructor(protected stateService: StateService, private http: Http, private router: Router, private _location: Location) {
    // setselcted_setting 
  }

  

  ngOnInit() {

    this.adminUserInfo = JSON.parse(localStorage.getItem('admin_user'));
    console.log("admin_userInfo", this.adminUserInfo);

    if(this.adminUserInfo == null || this.adminUserInfo.role != "Admin")
    {
            // this.router.navigate(['auth/login']);
        

    }

    else
    {
      this.stateService.setselcted_setting(3);

      this.http.post(environment.api_url + 'getPendingRental', {})
        .subscribe(
          res => {
            let response = res.json();
            switch(response.result)
            {
              case -1:
                break;
              case 0:
                break;
              case 1:
                this.stateService.setpurchased_customercount(response.info.length);
                break;
            }
          },
          err => {
            console.log("Error occured");
          }
        );
      let send_data = {
        user_token: this.adminUserInfo.user_token
      }
      this.http.post(environment.api_url + 'admin_users', send_data)
        .subscribe(
          res => {
            let response = res.json();
            switch(response.result)
            {
              case -1:
                // this.router.navigate(['auth/login']);
                break;
              case 0:
                break;
              case 1:
                console.log("response", response);
            
                this.admin_users = response.users;

                console.log("admin_users", this.admin_users);
              
                // this.source.load(this.admin_users);
              
                break;
            }
          },
          err => {
            console.log("Error occured");
          }
        );
    }
  
  }

  go_save() {
    console.log("admin_users", this.admin_users);
    for(var i = 0; i < this.admin_users.length; i++)
      this.admin_users[i].edit = false;
    let send_data = {
      userInfo: this.admin_users
    }

    this.http.post(environment.api_url + 'admin_update_users', send_data)
      .subscribe(
        res => {
          let response = res.json();
          switch(response.result)
          {
            case -1:
              // this.router.navigate(['auth/login']);
              break;
            case 0:
              break;
            case 1:
              console.log("response", response);
              this.router.navigate(['pages']);
              break;
          }
        },
        err => {
          console.log("Error occured");
        }
      );
  }

  go_change_password(user_id) {
    if (window.confirm('Change user password? New password will be sent to user’s email address.')) {
      console.log("admin users", this.admin_users);
      localStorage.setItem('staffInfo', JSON.stringify(this.admin_users));
      this.router.navigate(['pages/change_password', user_id]);
    } else {
     
    }
   
  }

  delete_user(user) {
    for(var i = 0;  i < this.admin_users.length; i++)
    {
      if(this.admin_users[i].user_id == user.user_id)
        this.admin_users.splice(i, 1);
    }
  }
  
  go_cancel() {
    this._location.back();
  }

  go_adduser() {
    this.adminUserInfo = JSON.parse(localStorage.getItem('admin_user'));
    console.log("admin_userInfo", this.adminUserInfo);

    if(this.adminUserInfo == null || this.adminUserInfo.role != "Admin")
    {
      return;
    }
    this.router.navigate(['pages/adduser']);
  }
}
