// import { Component, OnInit } from '@angular/core';
import {Location} from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { environment } from '../../config/config';
import { ModalService } from '../../@theme/services/index';
import { StateService } from '../../@core/data/state.service';
import {Component, AfterViewChecked, ElementRef} from '@angular/core';
import $ from 'jquery';



@Component({
  selector: 'app-edit-season-pass',
  templateUrl: './edit-season-pass.component.html',
  styleUrls: ['./edit-season-pass.component.scss']
})
export class EditSeasonPassComponent implements AfterViewChecked {

  pass_type = "";
  start_date = "";
  adminUserInfo: any;
  customerInfo: any;
  status = "";
  terminate_date = "";
  freeze_from_date = "";
  freeze_to_date = "";

  customer_password = "";

  passInfo = {
    type: "",
    from: 0,
    to: "",
    quantity: "",
    used: false,
    message: "",
    status: "",
    expire: "",
    terminate: "",
    freeze_from: "",
    freeze_to: "",
    season_status: "",
    changing: ""
  }
  phone_number= "";
  customer_id = "";

  constructor(protected stateService: StateService, private http: Http, private _location: Location, private router: Router, private modalService: ModalService, private route: ActivatedRoute,) 
  {
  }

  ngOnInit() {
    this.customer_password = "";
    this.modalService.modals = [];

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
                    this.passInfo.type = response.available_pass[i].type;
                    this.passInfo.from = response.available_pass[i].from;
                    this.passInfo.to = response.available_pass[i].to;
                    this.passInfo.quantity = response.available_pass[i].quantity;
                    this.passInfo.used = response.available_pass[i].used;
                    this.passInfo.message = response.available_pass[i].message;
                    this.passInfo.expire = response.available_pass[i].expire;
                    this.status = response.available_pass[i].season_status;
                    this.terminate_date = response.available_pass[i].terminate;
                    this.freeze_from_date = response.available_pass[i].freeze_from;
                    this.freeze_to_date = response.available_pass[i].freeze_to;
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

    // this.customerInfo = JSON.parse(localStorage.getItem('customerInfo'));

    // console.log("customerInfo", this.customerInfo);

    // for(var i = 0;  i< this.customerInfo.available_pass.length; i++)
    // {
    //   if(this.customerInfo.available_pass[i].type == this.pass_type)
    //   {
    //     this.start_date = new Date(this.customerInfo.available_pass[i].from).toDateString();
    //     this.passInfo.type = this.customerInfo.available_pass[i].type;
    //     this.passInfo.from = this.customerInfo.available_pass[i].from;
    //     this.passInfo.to = this.customerInfo.available_pass[i].to;
    //     this.passInfo.quantity = this.customerInfo.available_pass[i].quantity;
    //     this.passInfo.used = this.customerInfo.available_pass[i].used;
    //     this.passInfo.message = this.customerInfo.available_pass[i].message;
    //     this.passInfo.expire = this.customerInfo.available_pass[i].expire;
    //     this.status = this.customerInfo.available_pass[i].season_status;
    //     if(this.customerInfo.available_pass[i].terminate )
    //     this.terminate_date = this.customerInfo.available_pass[i].terminate;
    //     this.freeze_from_date = this.customerInfo.available_pass[i].freeze_from;
    //     this.freeze_to_date = this.customerInfo.available_pass[i].freeze_to;
    //   }
    // }
    // console.log("status", this.status);
  }

  public ngAfterViewChecked(): void {
    $('.season_monthpicker')[0].value = this.terminate_date;
    $('.season_monthpicker')[1].value = this.freeze_from_date;
    $('.season_monthpicker')[2].value = this.freeze_to_date;
  }       


  save() {
    this.adminUserInfo = JSON.parse(localStorage.getItem('admin_user'));
    if(this.adminUserInfo == null || this.adminUserInfo.user_token == undefined)
    {
      // this.router.navigate(['auth/login']);
      return;
    }


    console.log("terminate", this.terminate_date);
    console.log("freeze_from_date", this.freeze_from_date);
    console.log("freeze_to_date", this.freeze_to_date);
    switch(this.status)
    {
      case "":
        alert("Select freeze mode!");
        break;
      case "freeze":
        if(this.freeze_from_date >= this.freeze_to_date || this.freeze_from_date == "" || this.freeze_to_date == "" )
          alert("Select date correctly.")
        else if(new Date(this.freeze_from_date).getTime() <= this.passInfo.from)
          alert("Select date after season pass creation time.")
        else
        {
          this.passInfo.season_status = "freeze";
          this.passInfo.terminate = "";
          this.passInfo.freeze_from = this.freeze_from_date;
          this.passInfo.freeze_to = this.freeze_to_date;
          this.passInfo.status = "edit";
          this.passInfo.changing = "FREEZED " + this.pass_type.toUpperCase() + " PASS FROM " + this.passInfo.freeze_from + " TO " + this.passInfo.freeze_to;
          let temp = [];
          temp.push(this.passInfo);
          let send_data = {
            user_token: this.adminUserInfo.user_token,
            pass: temp,
            customer_id: this.customer_id
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
                    this._location.back();
                    break;
                }
              },
              err => {
                console.log("Error occured");
              }
            );
        }
        break;
      case "terminate":
        console.log("OKKKK");
        console.log("terminate time", new Date(this.terminate_date).getTime());
        console.log("pass from time", this.passInfo.from);

        console.log(new Date(this.terminate_date).getTime() > this.passInfo.from);
        
        if(this.terminate_date == "")
        {
          alert("Select date correctly.")
        }
        else if(new Date(this.terminate_date).getTime() <= this.passInfo.from)
        {
          alert("Select date after season pass creation time.")
        }
        else
        {
          this.passInfo.season_status = "terminate";
          this.passInfo.terminate = this.terminate_date;
          this.passInfo.freeze_from = "";
          this.passInfo.freeze_to = "";
          this.passInfo.status = "edit";
          this.passInfo.changing = "TERMINATED " + this.pass_type.toUpperCase() + " PASS FROM " + this.passInfo.terminate;

          let temp = [];
          temp.push(this.passInfo);
          let send_data = {
            user_token: this.adminUserInfo.user_token,
            pass: temp,
            customer_id: this.customer_id
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
        }
        break;
    }
  }

  change_freeze_to($event) {
    console.log($event);
    this.freeze_to_date = $event; 
  }

  change_freeze_from($event) {
    console.log($event);
    this.freeze_from_date = $event; 
  }

  change_terminate($event) {
    console.log($event);
    this.terminate_date = $event; 
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
            this.router.navigateByUrl('/pages/setting');
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
