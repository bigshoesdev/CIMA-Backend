import {Component, OnInit, AfterViewChecked, ElementRef} from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { environment } from '../../config/config';
import { Router, ActivatedRoute } from '@angular/router';
import { elementAt } from 'rxjs/operators/elementAt';
import { ModalService } from '../../@theme/services/index';
import { StateService } from '../../@core/data/state.service';
import $ from 'jquery';

import * as io from 'socket.io-client';
import { Message } from '@angular/compiler/src/i18n/i18n_ast';

@Component({
  moduleId: module.id.toString(),
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent implements AfterViewChecked {
  phone_number = "";
  user_name = "";
  live_count: Number;
  adminUserInfo: any;
  customerList = [];
  user_avatar = "";
  visit_to_date: Number;
  socket = null;

  customer_password = "";

  pass_buttons = [
    {
      type: "season",
      available: false,
      title: "SEASON"
    },
    {
      type: "multi",
      available: false,
      title: "MULTI"
    },
    {
      type: "day",
      available: false,
      title: "DAY"
    },
    {
      type: "promo",
      available: false,
      title: "COMPLEMENTARY"
    },
  ];

  checkout_pass_buttons = [
    {
      type: "season",
      available: false,
      title: "SEASON"
    },
    {
      type: "multi",
      available: false,
      title: "MULTI"
    },
    {
      type: "day",
      available: false,
      title: "DAY"
    },
    {
      type: "promo",
      available: false,
      title: "COMPLEMENTARY"
    },
  ];

  checkin_flag : Boolean;

  flag_daypas : Boolean;

  constructor(protected stateService: StateService, private http: Http, private router: Router, private modalService: ModalService) 
  {
  }

  ngOnInit() {
    if(JSON.parse(localStorage.getItem('login')).user_email == undefined)
    {
      this.router.navigate(['auth/login']);
      return;
    }
    this.modalService.modals = [];
    this.checkin_flag = false;
    this.flag_daypas = false;
    // localStorage.setItem('admin_user', JSON.stringify({}));
    this.customer_password = "";
    this.stateService.deselectall();

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
    
    this.http.post(environment.api_url + 'admin_home_getuser', {})
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
              this.live_count = response.live_count;
              this.visit_to_date = response.visit_to_date;
              console.log("live_count", this.live_count);
              this.customerList = response.customers;
              console.log("customerList", this.customerList);
             
              break;
          }
        },
        err => {
          console.log("Error occured");
        }
      );
  }

  public ngAfterViewChecked(): void {
    $('.user_avatar img').height($('.user_avatar img').width());
    $('.modal-main-avatar img').height($('.modal-main-avatar img').width());
  }       


  go_checkin(phone_number, mode) {
    if(mode == "image")
    {
      console.log("PHONE NUMBER:", phone_number);
     
      let send_data = {
        customer_phone_number: phone_number
      }
  
      console.log("send Data", send_data);
    
      this.http.post(environment.api_url + 'admin_validate_phone_number', send_data)
        .subscribe(
          res => {
            let response = res.json();
            switch(response.result)
            {
              case -1:
                // this.router.navigate(['auth/login']);
                break;
              case 0:
                // this.openModal('error_modal');
                break;
              case 1:
                localStorage.setItem('admin_user', JSON.stringify({}));
                this.router.navigate(['pages/customerInfo',response.phone_number]);
                break;
            }
          },
          err => {
            console.log("Error occured");
          }
        );
    }
    else
    {

      if(this.phone_number.length == 0)
      {
        alert("Please Input phone number!");
        return;
      }

      
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
                alert("Phone Number is incorrect. Please try again later.");
                break;
              case 1:

                console.log("response", response);
                this.user_avatar = response.avatar_url;
                this.user_name = response.personal[0].value;
                for(var i = 0;  i < this.pass_buttons.length; i++)
                {
                  for(var j = 0; j < response.available_pass.length; j++)
                  {
                    if(response.available_pass[j].type == "day")
                    {
                      this.flag_daypas = true;
                    }
                    if(this.pass_buttons[i].type == response.available_pass[j].type)
                    {
                      this.pass_buttons[i].available = true;
                      this.pass_buttons[i].title = ((response.available_pass[j].type == 'promo') ? "complementary" : response.available_pass[j].type).toUpperCase();
                    }
                  }
                }

                for(var i = 0; i < this.checkout_pass_buttons.length; i++)
                {
                  if(this.checkout_pass_buttons[i].type == response.checkin_passtype)
                    this.checkout_pass_buttons[i].available = true;
                  else
                    this.checkout_pass_buttons[i].available = false;
                }

                if(response.checkin_passtype == "")
                  this.openModal("phone_number_modal");
                else
                  alert("This customer is already checked in.")  
                break;
            }
          },
          err => {
            console.log("Error occured");
          }
        );
    }
   
  }

  real_manual_check = function(modal_id, checkin_mode, pass_type)
  {
    this.closeModal(modal_id);

    console.log("pass_type", pass_type);


    this.adminUserInfo = JSON.parse(localStorage.getItem('admin_user'));

    console.log("admin_userInfo", this.adminUserInfo);
    // if(this.adminUserInfo == null || this.adminUserInfo.user_token == undefined)
    // {
    //   this.router.navigate(['auth/login']);
    //   return;
    // }
    

    if(checkin_mode == "in") {
      this.checkin_flag = true;
      this.flag_check_btn = true;
      this.pass_type = pass_type;

      let send_data = {
        user_token: this.adminUserInfo.user_token,
        user_name:  this.adminUserInfo.user_name,
        customer_phone_number: this.phone_number,
        pass_type: this.pass_type,
        status: "in"
      }


      console.log("send data");

      this.http.post(environment.api_url + 'admin_gymin_inout', send_data)
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
              this.http.post(environment.api_url + 'admin_home_getuser', {})
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
                      this.live_count = response.live_count;
                      this.visit_to_date = response.visit_to_date;
                      console.log("live_count", this.live_count);
                      this.customerList = response.customers;
                      console.log("customerList", this.customerList);
                     
                      break;
                  }
                },
                err => {
                  console.log("Error occured");
                }
              );
                break;
            }
          },
          err => {
            console.log("Error occured");
          }
        );
    }   
  }

  

  go_daypass() {
    this.checkin_flag = true;
    this.adminUserInfo = JSON.parse(localStorage.getItem('admin_user'));
    console.log("userInfo ****", this.adminUserInfo);
    let send_data = {
      user_token: this.adminUserInfo.user_token,
      user_name:  this.adminUserInfo.user_name,
      customer_phone_number: this.phone_number,
      pass_type: "day",
      status: "in"
    }

    this.http.post(environment.api_url + 'admin_adddaypas_in', send_data)
        .subscribe(
          res => {
            let response = res.json();
            switch(response.result)
            {
              case -1:
                this.closeModal("phone_number_modal");
                this.openModal("login_modal")
                break;
              case 0:
                break;
              case 1:
                this.closeModal("phone_number_modal");
                localStorage.setItem("admin_user", JSON.stringify({}));
                this.http.post(environment.api_url + 'admin_home_getuser', {})
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
                          this.live_count = response.live_count;
                          this.visit_to_date = response.visit_to_date;
                          console.log("live_count", this.live_count);
                          this.customerList = response.customers;
                          console.log("customerList", this.customerList);
                        
                          break;
                      }
                    },
                    err => {
                      console.log("Error occured");
                    }
                  );
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
            if(this.router.routerState.toString().indexOf("path:'home'") >= 0)
            {
              if(this.checkin_flag == false)
              {
                this.router.navigateByUrl('/pages/setting');
              }
              else
              {
                this.go_daypass();
                this.checkin_flag = false;
              }
                
              
            }
            else
            {
              this.router.navigateByUrl('/pages/setting');
            }


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
