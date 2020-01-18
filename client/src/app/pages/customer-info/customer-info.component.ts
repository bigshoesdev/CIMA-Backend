import { Component, OnInit, AfterViewChecked, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { LocalDataSource } from 'ng2-smart-table';
import { environment } from '../../config/config';
import { ModalService } from '../../@theme/services/index';
import { StateService } from '../../@core/data/state.service';
import * as io from 'socket.io-client'
import $ from 'jquery';

@Component({
  selector: 'app-customer-info',
  templateUrl: './customer-info.component.html',
  styleUrls: ['./customer-info.component.scss']
})
export class CustomerInfoComponent implements AfterViewChecked {

  protected socket = null;
  customer_password = "";
  phone_number = "";
  adminUserInfo: any;
  personal = [{ type: "NAME", value: "" }];
  emergency: any;
  qualification = [];
  available_pass = [];
  _window: any;
  special_note = "";
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

  avatar_url: string;
  last_visit = "";
  visit_month = "";

  flag_check_btn = false;

  checkin_status = "";

  used_promo = false;

  checkin_passtype = "";

  customer_id = "";

  source: LocalDataSource = new LocalDataSource();

  pass_type = "";

  pdf_url = "";

  flag_daypas: any;

  checkin_flag: any;

  transaction_history = [];

  table_settings = {
    actions: false,
    columns: {
      id: {
        title: 'Transaction ID',
        type: 'number',
      },
      type: {
        title: 'Transaction Type',
        type: 'string',
      },
      date_time: {
        title: 'Date/Time',
        type: 'string',
      },
      action: {
        title: 'Action By',
        type: 'string',
      },
      notes: {
        title: 'Notes',
        type: 'string',
      }
    }
  };


  constructor(protected stateService: StateService, private http: Http, private router: Router, private route: ActivatedRoute, private modalService: ModalService) { }


  public ngAfterViewChecked(): void {
    $('.avatar img').height($('.avatar img').width());
    $('.modal-main-avatar img').height($('.modal-main-avatar img').width());
  }

  ngOnInit() {
    this.checkin_flag = false;
    this.flag_daypas = false;
    this.modalService.modals = [];
    this.customer_password = "";
    this.route.paramMap.subscribe(params => {
      this.phone_number = params.get('phone_number');
    });

    this.adminUserInfo = JSON.parse(localStorage.getItem('admin_user'));
    console.log("admin_userInfo", this.adminUserInfo);

    this.socket = io(environment.websocket_url);
    this.socket.on('status_checkout', function (data: any) {
      console.log("websocket:::::", data);
      this.refresh();
    }.bind(this));

    if (this.adminUserInfo == null || this.adminUserInfo.user_token == undefined) {
      this.stateService.setlogout_show(true);
    }
    else
      this.stateService.setlogout_show(false);
    console.log("phone_number", this.phone_number);


    let send_data = {
      customer_phone_number: this.phone_number
    }

    console.log("send Data", send_data);

    this.http.post(environment.api_url + 'admin_getCustomerInfo', send_data)
      .subscribe(
        res => {
          let response = res.json();
          switch (response.result) {
            case -1:
              // this.router.navigate(['auth/login']);
              break;
            case 0:
              break;
            case 1:
              console.log("response", response);
              this.personal = response.personal;
              this.emergency = response.emergency;
              this.qualification = response.qualification;
              console.log("qualification", this.qualification);
              this.available_pass = response.available_pass;
              this.special_note = response.special_note;
              this.customer_id = response.customer_id;
              this.pdf_url = response.pdf_url;

              for (var i = 0; i < this.pass_buttons.length; i++) {
                for (var j = 0; j < this.available_pass.length; j++) {

                  if (response.available_pass[j].type == "day") {
                    this.flag_daypas = true;
                  }
                  if (this.pass_buttons[i].type == this.available_pass[j].type) {
                    this.pass_buttons[i].available = true;
                    this.pass_buttons[i].title = ((this.available_pass[j].type == 'promo') ? "complementary" : this.available_pass[j].type).toUpperCase();
                  }
                }
              }
              console.log("pass", this.available_pass);

              this.avatar_url = response.avatar_url;


              console.log("avatar_url *****", this.avatar_url);

              this.transaction_history = response.history.transaction_history;
              console.log("Transaction history", this.transaction_history);
              this.source.load(this.transaction_history);
              this.last_visit = response.history.last_visit;
              this.visit_month = response.history.visit_month;
              this.checkin_status = response.status;
              if (response.available_pass.length > 0)
                this.pass_type = response.available_pass[0].type;
              console.log("pass type", this.pass_type);
              this.checkin_passtype = response.checkin_passtype;

              console.log("checkin_passtype", this.checkin_passtype);

              this.used_promo = response.used_promo;

              for (var i = 0; i < this.checkout_pass_buttons.length; i++) {
                if (this.checkout_pass_buttons[i].type == this.checkin_passtype)
                  this.checkout_pass_buttons[i].available = true;
                else
                  this.checkout_pass_buttons[i].available = false;
              }

              console.log("buttons", this.checkout_pass_buttons);
              break;
          }
        },
        err => {
          console.log("Error occured");
        }
      );
  }

  refresh() {
    this.checkin_flag = false;
    this.flag_daypas = false;
    this.customer_password = "";
    this.route.paramMap.subscribe(params => {
      this.phone_number = params.get('phone_number');
    });

    this.adminUserInfo = JSON.parse(localStorage.getItem('admin_user'));
    console.log("admin_userInfo", this.adminUserInfo);

    if (this.adminUserInfo == null || this.adminUserInfo.user_token == undefined) {
      this.stateService.setlogout_show(true);
    }
    else
      this.stateService.setlogout_show(false);
    console.log("phone_number", this.phone_number);


    let send_data = {
      customer_phone_number: this.phone_number
    }

    console.log("send Data", send_data);

    this.http.post(environment.api_url + 'admin_getCustomerInfo', send_data)
      .subscribe(
        res => {
          let response = res.json();
          switch (response.result) {
            case -1:
              // this.router.navigate(['auth/login']);
              break;
            case 0:
              break;
            case 1:
              console.log("response", response);
              this.personal = response.personal;
              this.emergency = response.emergency;
              this.qualification = response.qualification;
              console.log("qualification", this.qualification);
              this.available_pass = response.available_pass;
              this.special_note = response.special_note;
              this.customer_id = response.customer_id;
              this.pdf_url = response.pdf_url;

              for (var i = 0; i < this.pass_buttons.length; i++) {
                for (var j = 0; j < this.available_pass.length; j++) {
                  if (response.available_pass[j].type == "day") {
                    this.flag_daypas = true;
                  }
                  if (this.pass_buttons[i].type == this.available_pass[j].type) {

                    this.pass_buttons[i].available = true;
                    this.pass_buttons[i].title = ((this.available_pass[j].type == 'promo') ? "complementary" : this.available_pass[j].type).toUpperCase();
                  }
                }
              }
              console.log("pass", this.available_pass);

              this.avatar_url = response.avatar_url;


              console.log("avatar_url *****", this.avatar_url);

              this.transaction_history = response.history.transaction_history;
              console.log("Transaction history", this.transaction_history);
              this.source.load(this.transaction_history);
              this.last_visit = response.history.last_visit;
              this.visit_month = response.history.visit_month;
              this.checkin_status = response.status;
              if (response.available_pass.length > 0)
                this.pass_type = response.available_pass[0].type;
              console.log("pass type", this.pass_type);
              this.checkin_passtype = response.checkin_passtype;

              console.log("checkin_passtype", this.checkin_passtype);

              this.used_promo = response.used_promo;

              for (var i = 0; i < this.checkout_pass_buttons.length; i++) {
                if (this.checkout_pass_buttons[i].type == this.checkin_passtype)
                  this.checkout_pass_buttons[i].available = true;
                else
                  this.checkout_pass_buttons[i].available = false;
              }

              console.log("buttons", this.checkout_pass_buttons);
              break;
          }
        },
        err => {
          console.log("Error occured");
        }
      );
  }

  check_out() {
    this.flag_check_btn = true;
    this.adminUserInfo = JSON.parse(localStorage.getItem('admin_user'));
    let send_data = {
      user_token: this.adminUserInfo.user_token,
      user_name: this.adminUserInfo.user_name,
      customer_phone_number: this.phone_number,
      pass_type: this.checkin_passtype,
      status: "out"
    }

    this.http.post(environment.api_url + 'admin_gymin_inout', send_data)
      .subscribe(
        res => {
          let response = res.json();
          switch (response.result) {
            case -1:
              // this.router.navigate(['auth/login']);
              break;
            case 0:
              break;
            case 1:
              this.checkin_status = "out";
              this.flag_check_btn = false;

              var temp = {
                id: this.transaction_history.length + 1,
                type: "Manual Check-out (" + this.pass_type.charAt(0).toUpperCase() + this.pass_type.substr(1).toLowerCase() + " Pass)",
                date_time: this.dateFormat(new Date().getTime()),
                action: this.adminUserInfo.user_name,
                notes: ""
              }
              this.transaction_history.push(temp);
              this.transaction_history.sort(function (a, b) {
                var data_A = a.date_time;
                var data_B = b.date_time;
                if (data_A > data_B)
                  return -1;
                if (data_A < data_B)
                  return 1;
                return 0;
              });

              this.source.load(this.transaction_history);
              // this.router.navigate(['pages']);
              break;
          }
        },
        err => {
          console.log("Error occured");
        }
      );
  }

  dateFormat(timestamp) {
    var result = ""
    var year, month, day, hour, minute, second;
    year = new Date(timestamp).getFullYear();
    month = ((new Date(timestamp).getMonth() + 1) < 10) ? ('0' + (new Date(timestamp).getMonth() + 1)) : (new Date(timestamp).getMonth() + 1);
    day = ((new Date(timestamp).getDate()) < 10) ? ('0' + (new Date(timestamp).getDate())) : (new Date(timestamp).getDate());
    hour = ((new Date(timestamp).getHours()) < 10) ? ('0' + (new Date(timestamp).getHours())) : (new Date(timestamp).getHours());
    minute = ((new Date(timestamp).getMinutes()) < 10) ? ('0' + (new Date(timestamp).getMinutes())) : (new Date(timestamp).getMinutes());
    second = ((new Date(timestamp).getSeconds()) < 10) ? ('0' + (new Date(timestamp).getSeconds())) : (new Date(timestamp).getSeconds());
    result = year + '/' + month + '/' + day + ' ' + hour + ":" + minute + ":" + second;
    return result;
  }

  go_daypass() {

    this.checkin_flag = true;
    this.adminUserInfo = JSON.parse(localStorage.getItem('admin_user'));
    console.log("userInfo ****", this.adminUserInfo);
    let send_data = {
      user_token: this.adminUserInfo.user_token,
      user_name: this.adminUserInfo.user_name,
      customer_phone_number: this.phone_number,
      pass_type: "day",
      status: "in"
    }

    this.http.post(environment.api_url + 'admin_adddaypas_in', send_data)
      .subscribe(
        res => {
          let response = res.json();

          switch (response.result) {
            case -1:
              this.closeModal("manual_checkin");
              this.openModal("login_modal")
              break;
            case 0:
              break;
            case 1:
              this.checkin_flag = false;
              this.closeModal("manual_checkin");
              localStorage.setItem("admin_user", JSON.stringify({}));
              this.refresh();
              break;
          }

        },
        err => {
          this.checkin_flag = false;
          console.log("Error occured");
        }
      );
  }

  check_in() {
    this.openModal("manual_checkin");
  }

  view_indem() {
    this._window = this.stateService.nativeWindow;
    this._window.open(this.pdf_url, '_blank', 'location=yes');
  }

  real_manual_check = function (modal_id, checkin_mode, pass_type) {
    console.log("checkin_mode:", checkin_mode);
    console.log("pass type:", pass_type);

    this.closeModal(modal_id);
    this.adminUserInfo = JSON.parse(localStorage.getItem('admin_user'));
    console.log("admin_userInfo", this.adminUserInfo);

    if (this.adminUserInfo == null || this.adminUserInfo.user_token == undefined) {
      this.stateService.setlogout_show(true);
    }
    else
      this.stateService.setlogout_show(false);

    if (checkin_mode == "in") {
      this.flag_check_btn = true;
      this.pass_type = pass_type;

      let send_data = {
        user_token: this.adminUserInfo.user_token,
        user_name: this.adminUserInfo.user_name,
        customer_phone_number: this.phone_number,
        pass_type: this.pass_type,
        status: "in"
      }

      this.http.post(environment.api_url + 'admin_gymin_inout', send_data)
        .subscribe(
          res => {
            let response = res.json();
            switch (response.result) {
              case -1:
                // this.router.navigate(['auth/login']);
                break;
              case 0:
                break;
              case 1:
                this.checkin_status = "in";
                this.flag_check_btn = false;
                var temp = {
                  id: this.transaction_history.length + 1,
                  type: "Manual Check-in (" + this.pass_type.charAt(0).toUpperCase() + this.pass_type.substr(1).toLowerCase() + " Pass)",
                  date_time: this.dateFormat(new Date().getTime()),
                  action: this.adminUserInfo.user_name,
                  notes: ""
                }
                this.checkin_passtype = this.pass_type;

                for (var i = 0; i < this.checkout_pass_buttons.length; i++) {
                  if (this.checkout_pass_buttons[i].type == this.checkin_passtype)
                    this.checkout_pass_buttons[i].available = true;
                  else
                    this.checkout_pass_buttons[i].available = false;
                }

                this.transaction_history.push(temp);

                this.transaction_history.sort(function (a, b) {
                  var data_A = a.date_time;
                  var data_B = b.date_time;
                  if (data_A > data_B)
                    return -1;
                  if (data_A < data_B)
                    return 1;
                  return 0;
                });

                this.source.load(this.transaction_history);

                for (var i = 0; i < this.available_pass.length; i++) {
                  if (this.available_pass[i].type == this.pass_type) {
                    switch (this.available_pass[i].type) {
                      case "season":
                        break;
                      case "multi":
                        if (this.available_pass[i].quantity <= 0) {
                          this.available_pass.splice(i, 1);
                          this.pass_buttons[1].available = false;
                        }
                        break;
                      case "day":
                        if (this.available_pass[i].quantity <= 0) {
                          this.available_pass.splice(i, 1);
                          this.pass_buttons[2].available = false;
                        }
                        break;
                      case "promo":

                        this.available_pass.splice(i, 1);
                        this.pass_buttons[3].available = false;
                        break;
                    }

                  }
                }
                break;
            }
          },
          err => {
            console.log("Error occured");
          }
        );
    }

    else {

    }

  }


  delete() {
    this.adminUserInfo = JSON.parse(localStorage.getItem('admin_user'));

    console.log("admin_userInfo", this.adminUserInfo);
    if (this.adminUserInfo == null || this.adminUserInfo.user_token == undefined) {
      // this.router.navigate(['auth/login']);
      return;
    }

    let send_data = {
      customer_phone_number: this.phone_number,
    }
    console.log("send Data*******", send_data);

    this.http.post(environment.api_url + 'customer_delete', send_data)
      .subscribe(
        res => {
          let response = res.json();
          switch (response.result) {
            case -1:
              // this.router.navigate(['auth/login']);
              break;
            case 0:
              alert("An error occured.");
              break;
            case 1:
              this.router.navigate(['pages']);
              console.log("OKKKKOKKOKI");
              break;
          }
        },
        err => {
          console.log("Error occured");
        }
      );
  }

  go_customerEdit() {
    localStorage.setItem('admin_user', JSON.stringify({}));
    this.router.navigate(['pages/customerEdit', this.phone_number]);
  }

  openModal(id: string) {
    this.modalService.open(id);
  }

  closeModal(id: string) {
    this.modalService.close(id);
  }

  login() {
    console.log("---start validation");

    var send_data = {
      password: this.customer_password
    }

    this.http.post(environment.api_url + 'admin_signin', send_data)
      .subscribe(
        res => {
          this.closeModal("login_modal");
          let response = res.json();
          if (response.result == 1) {
            console.log("flag:", this.checkin_flag);
            this.customer_password = "";
            console.log("response 1");
            localStorage.setItem('admin_user', JSON.stringify(response.user));
            if (this.checkin_flag) {
              this.go_daypass();
            }
            else {
              this.router.navigateByUrl('/pages/setting');
            }

          }
          else {
            localStorage.setItem('admin_user', JSON.stringify({}));
            alert("User_Login: failed, email or password is inccorrect.");
            if (this.router.routerState.toString().indexOf("path:'home'") >= 0) {
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
