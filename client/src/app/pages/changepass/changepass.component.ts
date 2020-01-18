import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { environment } from '../../config/config';
import { ModalService } from '../../@theme/services/index';
import {Location} from '@angular/common';
import { StateService } from '../../@core/data/state.service';

@Component({
  selector: 'app-changepass',
  templateUrl: './changepass.component.html',
  styleUrls: ['./changepass.component.scss']
})
export class ChangepassComponent implements OnInit {

  confirm_new_password = "";
  new_password = "";
  user_name = ""; 
  staffInfo : any;
  customer_id = "";
  adminUserInfo: any;
  customer_password = "";

  
  constructor(protected stateService: StateService, private http: Http, private router: Router, private route: ActivatedRoute, private modalService: ModalService, private _location: Location) {
  }


  ngOnInit() {

    this.modalService.modals = [];
    this.customer_password = "";
    this.adminUserInfo = JSON.parse(localStorage.getItem('admin_user'));
    if(this.adminUserInfo == null || this.adminUserInfo.user_token == undefined)
    {
      this.stateService.setlogout_show(true);
      // this.router.navigate(['auth/login']);
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

    this.staffInfo = JSON.parse(localStorage.getItem('staffInfo'));
    this.route.paramMap.subscribe(params => {
      this.customer_id = params.get('customer_id');
    });
    for(var i = 0;  i < this.staffInfo.length; i++)
    {
      if(this.staffInfo[i].user_id == this.customer_id)
      {
        this.user_name = this.staffInfo[i].user_name;
      }
    }

  }

  go_cancel() {
    this._location.back();
  }

  go_save() {
    if(this.new_password.length < 8)
    {
      alert("This password is too short.");
      return;
    }

    if(this.new_password != this.confirm_new_password)
    {
      alert("Please enter the password correctly.");
      return;
    }
    
    for(var i = 0; i < this.staffInfo.length; i++)
    {
      if(this.staffInfo[i].user_id == this.customer_id)
      {
        this.staffInfo[i].user_name = this.user_name;
        this.staffInfo[i].user_password = this.new_password;
      }
    }

    let send_data = {
      userInfo: this.staffInfo
    }

    this.http.post(environment.api_url + 'admin_update_users', send_data)
      .subscribe(
        res => {
          let response = res.json();
          switch(response.result)
          {
            case -1:
              this.router.navigate(['auth/login']);
              break;
            case 0:
              break;
            case 1:
              console.log("response", response);
              this._location.back();
              break;
          }
        },
        err => {
          console.log("Error occured");
        }
      );

  }

  
}
