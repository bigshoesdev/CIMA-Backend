import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { environment } from '../../config/config';
import { ModalService } from '../../@theme/services/index';
import {Location} from '@angular/common';
import { StateService } from '../../@core/data/state.service';

@Component({
  selector: 'app-adduser',
  templateUrl: './adduser.component.html',
  styleUrls: ['./adduser.component.scss']
})
export class AdduserComponent implements OnInit {

  customer_password = "";
  roles = [
    {
      type: "Admin",
      title: "Admin"
    },
    {
      type: "Staff",
      title: "Staff"
    }
  ];

  adminUserInfo: any;

  role = "Staff";

  name = "";
  user_name = "";

  new_password = "";
  confirm_new_password = "";
  email = "";

  constructor(protected stateService: StateService, private http: Http, private router: Router, private route: ActivatedRoute, private modalService: ModalService, private _location: Location) {
  }

  ngOnInit() {
    this.customer_password = "";
    this.adminUserInfo = JSON.parse(localStorage.getItem('admin_user'));
    if(this.adminUserInfo == null || this.adminUserInfo.user_token == undefined)
    {
      this.stateService.setlogout_show(true);
    }
    else
      this.stateService.setlogout_show(false);

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
  }

  go_save() {
    
    if(this.name == "")
    {
      alert("Please Enter a name.");
      return;
    }

    if(this.user_name == "")
    {
      alert("Please Enter a name.");
      return;
    }

    if(this.new_password == "")
    {
      alert("Please Enter a password.");
      return;
    }

    if(this.confirm_new_password == "")
    {
      alert("Please Enter a confirm password.");
      return;
    }

    if(this.new_password.length < 8)
    {
      alert("This password is too short.");
      return;
    }

    if(this.new_password != this.confirm_new_password)
    {
      alert("Please enter a password correctly.");
      return;
    }

    if(this.validateEmail(this.email) != true)
    {
      alert("Please enter a email correctly.");
      return;
    }

    let temp = {
      name: this.name,
      user_name: this.user_name,
      user_password: this.new_password,
      user_email: this.email,
      role: this.role
    }

    let send_data = {
      userInfo: temp
    }

    this.http.post(environment.api_url + 'adduser', send_data)
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
              this._location.back();
              break;
          }
        },
        err => {
          console.log("Error occured");
        }
      );
  }

  validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }

  go_cancel() {
    this._location.back();
  }

  

}
