import { Component, OnInit } from '@angular/core';
import {Location} from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { environment } from '../../config/config';
import { ModalService } from '../../@theme/services/index';
import { concat } from 'rxjs/operator/concat';
import { StateService } from '../../@core/data/state.service';
import { NumberPickerComponent } from '../numberpicker/number-picker.component';
import { MonthpickerComponent } from '../monthpicker/monthpicker.component';

@Component({
  selector: 'app-add-pass',
  templateUrl: './add-pass.component.html',
  styleUrls: ['./add-pass.component.scss']
})
export class AddPassComponent implements OnInit {

  customer_password = "";
  adminUserInfo: any;
  available_pass = [];
  start_date = new Date().toDateString();
  selected_pass_type = "";
  datePickerConfig = {
    format: "YYYY/MM"
  }
  customer_id = "";

  stripe_customer_id = "";
  stripe_subscription_id = "";
  

  sidebars = [];

  quantity = 1;

  note = "";

  pass_type = [
    {
      type: "season",
      title: "SEASON"
    },
    {
      type: "promo",
      title: "COMPLEMENTARY"
    },
    {
      type: "multi_5",
      title: "MULTI_FIVE"
    },
    {
      type: "multi_10",
      title: "MULTI_TEN"
    },
    {
      type: "day",
      title: "DAY"
    }
  ];

  phone_number = "";

  flag_add : Boolean;

  constructor(protected stateService: StateService, private http: Http, private _location: Location, private router: Router, private modalService: ModalService, private route: ActivatedRoute,) 
  {
  }
  ngOnInit() {
    this.flag_add = false;
    this.modalService.modals = [];
    this.customer_password = "";
    this.route.paramMap.subscribe(params => {
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
              this.available_pass = response.available_pass;
              this.customer_id = response.customer_id;
              // this.start_date = new Date();

              for(var i = 0;  i < this.pass_type.length; i++)
              {
                if(this.pass_type[i].type == "promo" )
                {
                  console.log("ok1");
                  if(response.used_promo == true)
                  {
                    console.log("ok2");
                    this.pass_type.splice(i, 1);
                  }
                }
              }

              for(var i = 0;  i < this.pass_type.length; i++)
              {
                if(this.pass_type[i].type == "season" )
                {
                  if(response.stripe_customer_id != "" && response.stripe_subscription_id != "")
                  {
                    this.pass_type.splice(i, 1);
                  }
                }
              }
              
              this.selected_pass_type = this.pass_type[0].type;

              console.log("")
              this.quantity = 1;

              this.stripe_customer_id = response.stripe_customer_id;
              this.stripe_subscription_id = response.stripe_subscription_id;

              console.log("str customer:", this.stripe_customer_id);
              console.log("str subscription:", this.stripe_subscription_id);

              break;
          }
        },
        err => {
          console.log("Error occured");
        }
      );

    
  }

  selectPass(pass_type) {
    this.selected_pass_type = pass_type;
    
  }

  add_pass()
  {
    this.flag_add = true;
    this.adminUserInfo = JSON.parse(localStorage.getItem('admin_user'));
    if(this.adminUserInfo == null || this.adminUserInfo.user_token == undefined)
    {
      // this.router.navigate(['auth/login']);
      this.openModal("login_modal");
      return;
    }

    let from = new Date(this.start_date).getTime();
    let temp_from = new Date(this.start_date);

    let to, message;
    switch(this.selected_pass_type)
    {
      case "promo":
        to = "";
        message = "COMPLEMENTARY PASS";
        let temp = {
          type: this.selected_pass_type,
          from: from,
          to: to,
          quantity: (this.selected_pass_type == "promo") ? 1 : this.quantity,
          used: false,
          message: message,
          status: "add",
          expire: "",
          changing: "COMPLEMENTARY PASS ADDED"
        }
        this.available_pass.push(temp);
        break;
      case "multi_5":
        console.log("from: 1", from);
        temp_from.setFullYear(temp_from.getFullYear() + 1 );
        to = temp_from.getTime();
        console.log("to: 1", to);
        message = "MULTI PASS";
        var flag = false;
        for(var i =0; i < this.available_pass.length; i++)
        {
          if(this.available_pass[i].type == "multi")
          {
            this.available_pass[i].from = (this.available_pass[i].from <= from) ? this.available_pass[i].from : from;
            this.available_pass[i].to = (this.available_pass[i].to >= to) ? this.available_pass[i].to : to;
            this.available_pass[i].quantity += this.quantity * 5;
            this.available_pass[i].status  += "edit";
            this.available_pass[i].expire = new Date(this.available_pass[i].to).toDateString();
            this.available_pass[i].changing = "CHANGED " + message + " INTO " + this.available_pass[i].quantity;
            flag = true;
            break;
          }
        }
        if(flag == false)
        {
          console.log("from: 2", from);
          console.log("to: 2", to);
          let temp = {
            type: "multi",
            from: from,
            to: to,
            quantity: this.quantity * 5,
            used: false,
            message: message,
            status: "add",
            first_add: this.quantity,
            expire: new Date(to).toDateString(),
            changing: "CHANGED " + message + " INTO " + this.quantity * 5
          }
          this.available_pass.push(temp);
        }
        break;

      case "multi_10":
        temp_from.setFullYear(temp_from.getFullYear() + 1 );
        to = temp_from.getTime();
        message = "MULTI PASS";
        var flag = false;
        for(var i =0; i < this.available_pass.length; i++)
        {
          if(this.available_pass[i].type == "multi")
          {
            this.available_pass[i].from = (this.available_pass[i].from <= from) ? this.available_pass[i].from : from;
            this.available_pass[i].to = (this.available_pass[i].to >= to) ? this.available_pass[i].to : to;
            this.available_pass[i].quantity += this.quantity * 10;
            this.available_pass[i].status  += "edit";
            this.available_pass[i].expire = new Date(this.available_pass[i].to).toDateString();
            this.available_pass[i].changing = "CHANGED " + message + " INTO " + this.available_pass[i].quantity;
            flag = true;
            break;
          }
        }
        if(flag == false)
        {
          let temp = {
            type: "multi",
            from: from,
            to: to,
            quantity: this.quantity * 10,
            used: false,
            message: message,
            status: "add",
            first_add: this.quantity,
            expire: new Date(to).toDateString(),
            changing: "CHANGED " + message + " INTO " + this.quantity * 10
          }
          this.available_pass.push(temp);
        }
        break;
        
      case "day":
        temp_from.setDate(temp_from.getDate() + 7);
        to = temp_from.getTime();
        message = "DAY PASS";
        var flag = false;
        for(var i =0; i < this.available_pass.length; i++)
        {
          if(this.available_pass[i].type == "day")
          {
            this.available_pass[i].from = (this.available_pass[i].from <= from) ? this.available_pass[i].from : from;
            this.available_pass[i].to = (this.available_pass[i].to >= to) ? this.available_pass[i].to : to;
            this.available_pass[i].quantity += this.quantity;
            this.available_pass[i].status  += "edit";
            this.available_pass[i].expire = new Date(this.available_pass[i].to).toDateString();
            this.available_pass[i].changing = "CHANGED " + message + " INTO " + this.available_pass[i].quantity;
            flag = true;
            break;
          }
        }
        if(flag == false)
        {
          let temp = {
            type: this.selected_pass_type,
            from: from,
            to: to,
            quantity: this.quantity,
            used: false,
            message: message,
            status: "add",
            first_add: this.quantity, 
            expire: new Date(to).toDateString(),
            changing: "CHANGED " + message + " INTO " + this.quantity
          }
          this.available_pass.push(temp);
        }
        break;
      case "season":
        if(this.stripe_customer_id == "")
        {
          alert("Please Insert Stripe Customer ID.");
          return;
        }
        if(this.stripe_subscription_id == "")
        {
          alert("Please Insert Stripe Subscription ID.");
          return;
        }
        message = "SEASON PASS";
        let temp1 = {
          type: this.selected_pass_type,
          from: from,
          to: "",
          quantity: 1,
          used: false,
          message: "",
          status: "add",
          expire: "",
          changing: "SEASON PASS ADDED"
        }
        this.available_pass.push(temp1);
        break;
      
    }

   
    // console.log("customerInfo", this.customerInfo);
    // this.available_pass = this.customerInfo.available_pass;
   
    // localStorage.setItem('customerInfo', JSON.stringify(this.customerInfo));
    let send_data = {
      user_token: this.adminUserInfo.user_token,
      pass: this.available_pass,
      customer_id: this.customer_id,
      stripe_customer_id: this.stripe_customer_id,
      stripe_subscription_id: this.stripe_subscription_id
    }
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
    // admin_pass_update
  }

  onNumberChanged($event) {
    this.quantity = $event;
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
            if(this.flag_add == false)
              this.router.navigateByUrl('/pages/setting');
            else
              this.add_pass();

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
