import { Component, OnInit } from '@angular/core';
import {Location} from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { environment } from '../../config/config';
import { elementAt } from 'rxjs/operators/elementAt';
import { ModalService } from '../../@theme/services/index';
import { concat } from 'rxjs/operator/concat';
import { StateService } from '../../@core/data/state.service';
import { stagger } from '@angular/animations/src/animation_metadata';

@Component({
  selector: 'app-edit-other-pass',
  templateUrl: './edit-other-pass.component.html',
  styleUrls: ['./edit-other-pass.component.scss']
})
export class EditOtherPassComponent implements OnInit {

  pass_type = "";
  adminUserInfo: any;
  add_count = 1;
  remove_count = 1;
  customerInfo: any;
  expire_date = "";
  quantity = "";
  start_date = "";
  passInfo: any;
  note = "";
  status = "";
  phone_number = "";
  customer_id = "";
  customer_password = "";
  flag_save : Boolean;


  constructor(protected stateService: StateService, private http: Http, private _location: Location, private router: Router, private modalService: ModalService, private route: ActivatedRoute,) 
  {
  }

  ngOnInit() {
    this.customer_password = "";
    this.modalService.modals = [];

    this.flag_save = false;
    this.route.paramMap.subscribe(params => {
      this.pass_type = params.get('passtype');
      this.phone_number = params.get('phone_number');
    });

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
        customer_phone_number : this.phone_number
      }
  
      console.log("send Data", send_data);
    
      this.http.post(environment.api_url + 'admin_getCustomerInfo', send_data)
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
                this.customer_id = response.customer_id;
                for(var i = 0;  i< response.available_pass.length; i++)
                {
                  if(response.available_pass[i].type == this.pass_type)
                  {
                    this.start_date = new Date(response.available_pass[i].from).toDateString();
                    this.expire_date = new Date(response.available_pass[i].to).toDateString();
                    this.quantity = response.available_pass[i].quantity;
                    this.passInfo = response.available_pass[i];
                  }
                }
                console.log("pass_type", this.pass_type);
                break;
            }
          },
          err => {
            console.log("Error occured");
          }
        );
   
  }

  add_quantity($event) {
    console.log("count", $event);
    this.add_count = $event;
  }

  remove_quantity($event) {
    console.log("count", $event);
    this.remove_count = $event;
  }

  save() {
    this.flag_save = true;
    this.adminUserInfo = JSON.parse(localStorage.getItem('admin_user'));
    if(this.adminUserInfo == null || this.adminUserInfo.user_token == undefined)
    {
      // this.router.navigate(['auth/login']);
      this.openModal("login_modal");
      return;
    }
    console.log("status", this.status);
    this.passInfo.to = new Date(this.expire_date).getTime();

    if(this.passInfo.to < this.passInfo.from)
    {
      alert("Please input correct expiration date.");
      return;
    }

    switch(this.status)
    {
      case "":
        this.passInfo.status += "edit";
        break;
      case "add":
        this.passInfo.quantity += this.add_count;
        this.passInfo.status += "edit";
        this.passInfo.changing = "CHANGED " + this.pass_type.toUpperCase() + " PASS INTO " + this.passInfo.quantity;
        break;
      case "remove":
        this.passInfo.quantity -= this.remove_count;
        if(this.passInfo.quantity < 0)
          this.passInfo.quantity = 0;
        this.passInfo.status += "edit";
        this.passInfo.changing = "CHANGED " + this.pass_type.toUpperCase() + " PASS INTO " + this.passInfo.quantity;
        break;
    }

    let temp = [];
    temp.push(this.passInfo);
    let send_data = {
      user_token: this.adminUserInfo.user_token,
      pass: temp,
      customer_id: this.customer_id
    }

    console.log("pass info", this.passInfo);

    this.http.post(environment.api_url + 'admin_pass_update', send_data)
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
              localStorage.setItem('admin_user', JSON.stringify({}));
              this._location.back();
              break;
          }
        },
        err => {
          console.log("Error occured");
        }
      );
  }

  openModal(id: string){
    this.modalService.open(id);
  }

  closeModal(id: string){
    this.modalService.close(id);
  }

  login () {
    console.log("---start validation");

    var send_data = {
      password: this.customer_password
    }

    this.http.post(environment.api_url + 'admin_signin', send_data)
      .subscribe(
        res => {
          this.closeModal("login_modal");
          let response = res.json();
          if(response.result  == 1)
          {
            this.customer_password = "";
            console.log("response 1");
            localStorage.setItem('admin_user', JSON.stringify(response.user));
            if(this.flag_save == false)
              this.router.navigateByUrl('/pages/setting');
            else
              this.save();
          }
          else
          {
            localStorage.setItem('admin_user', JSON.stringify({}));
            alert("User_Login: failed, email or password is inccorrect.");
            if(this.router.routerState.toString().indexOf("path:'home'") >= 0)
            {
              this.stateService.deselectall();
            }
          }
        },
        err => {
         
          this.closeModal("login_modal");
          localStorage.setItem('admin_user', JSON.stringify({}));
          alert("Error occured");
        }
      );
  }

  
  
}
