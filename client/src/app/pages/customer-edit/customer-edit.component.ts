import {Component, OnInit, AfterViewChecked, ElementRef} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { LocalDataSource } from 'ng2-smart-table';
import { environment } from '../../config/config';
import { ModalService } from '../../@theme/services/index';
import { StateService } from '../../@core/data/state.service';
import $ from 'jquery'; 

@Component({
  selector: 'app-customer-edit',
  templateUrl: './customer-edit.component.html',
  styleUrls: ['./customer-edit.component.scss']
})

export class CustomerEditComponent implements AfterViewChecked {


  phone_number = "";
  adminUserInfo: any;
  personal = [{type: "NAME", value: ""}];
  emergency: any;
  customer_password = "";
  flag_not = false;

  response: any;
  
  qualification = [
    {type: "", message: "", checked: false},
    {type: "", message: "", checked: false},
    {type: "", message: "", checked: false},
    {type: "", message: "", checked: false},
    {type: "", message: "", checked: false},
    {type: "", message: "", checked: false},
    {type: "", message: "", checked: false},
  ];
  relationship = [
    "Parent", "Sibling", "Partner", "Friend"
  ]

  gender = [
    "Female", "Male"
  ]

  available_pass = [];
  special_note = "";
  customer_id = "";
  pass_buttons = [
    {
      type: "promo",
      available: false,
      title: "PROMO"
    },
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
      title: "COMPLEMENTARY"
    },
  ];

  checkout_pass_buttons = [
    {
      type: "promo",
      available: false,
      title: "PROMO"
    },
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
      title: "COMPLEMENTARY"
    },
  ];

  avatar_url: string;
  last_visit = "";
  visit_month = "";

  flag_check_btn = false;
  customerInfo: any;

  checkin_status = "";

  checkin_passtype = ""

  source: LocalDataSource = new LocalDataSource();

  pass_type = "";

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
    this.flag_not = false;
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
                


                this.response = response;
                this.personal = response.personal;
                this.emergency = response.emergency;
                this.qualification = response.qualification;
                console.log("qualification", this.qualification);
                this.available_pass = response.available_pass;
                this.special_note = response.special_note;
                this.customer_id = response.customer_id;
              
                for(var i = 0;  i < this.pass_buttons.length; i++)
                {
                  for(var j = 0; j < this.available_pass.length; j++)
                  {
                    if(this.pass_buttons[i].type == this.available_pass[j].type)
                    {
                      this.pass_buttons[i].available = true;
                      this.pass_buttons[i].title = ((this.available_pass[j].type == 'promo') ? "complementary" : this.available_pass[j].type).toUpperCase();
                    }
                  }
                }
                console.log("pass", this.available_pass);
                this.avatar_url = response.avatar_url;
                this.transaction_history = response.history.transaction_history;

                this.transaction_history.sort(function (a, b) {
                  var data_A = a.date_time;
                  var data_B = b.date_time;
                  if (data_A > data_B)
                    return -1;
                  if (data_A < data_B)
                    return 1;
                  return 0;
                });
                console.log("Transaction history", this.transaction_history);
                this.source.load(this.transaction_history);
                this.last_visit = response.history.last_visit;
                this.visit_month = response.history.visit_month;
                this.checkin_status = response.status;
                if(response.available_pass.length > 0)
                  this.pass_type = response.available_pass[0].type;
                console.log("pass type", this.pass_type);
                this.checkin_passtype = response.checkin_passtype;
  
                for(var i = 0; i < this.checkout_pass_buttons.length; i++)
                {
                  if(this.checkout_pass_buttons[i].type == this.checkin_passtype)
                    this.checkout_pass_buttons[i].available = true;
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

  click_not()
  {
    this.flag_not =! this.flag_not;
    if(this.flag_not == true)
    {
      for(var i = 0; i < this.qualification.length; i++)
      {
        this.qualification[i].checked = false;
      }
    }
  
    console.log(this.flag_not);
  }

  onDeleteConfirm(event): void {
    if (window.confirm('Are you sure you want to delete?')) {
      event.confirm.resolve();
    } else {
      event.confirm.reject();
    }
  }

  change_image(event)
  {
    console.log(event);
    if ($('#select_image')[0].files && $('#select_image')[0].files[0]) {

      var imageReader = new FileReader();
      imageReader.readAsDataURL($('#select_image')[0].files[0]);

      var self = this;

      var fileName = self.avatar_url.replace(environment.server_url, "").split("/")[2];

      console.log(fileName);


      imageReader.onload = function (e) {
        var evt: any;
        evt = e;
        var send_data = {
          content: evt.target.result,
          file_name: fileName
        }

        console.log("send data", send_data);

        self.http.post(environment.api_url + 'upload_image', send_data)
          .subscribe(
            res => {
              console.log("***Response", res.json())
              let response = res.json();
              switch(response.result)
              {
                case -1:
                  break;
                case 0:
                  break;
                case 1:
                  console.log("content:", send_data.content);
                  console.log($("#avatar_img")[0]);
                  self.avatar_url = response.url;
                  // $("#avatar_img")[0].src = send_data.content;
                  break;
              }
            },
            err => {
              console.log("Error occured");
            }
          );
      }

      imageReader.onerror = function (evt: any) {
          console.log(evt.message);
      }
      console.log($('#select_image')[0].files[0]);
    }
  }

  
  image_upload()
  {
    $('#select_image').click();
 
  }

  beforLeave()
  {
    var temp = {
      personal: this.personal,
      emergency: this.emergency,
      qualification: this.qualification,
      available_pass: this.available_pass,
      special_note: this.special_note,
      avatar_url: this.avatar_url,
      transaction_history: this.transaction_history,
      last_visit: this.last_visit,
      visit_month: this.visit_month,
      checkin_status: this.checkin_status,
      checkin_passtype: this.checkin_passtype,
      customer_id: this.customer_id
    }
    localStorage.setItem('customerInfo', JSON.stringify(temp));
  }


  go_save() {
    // this.beforLeave();
    
    if(this.personal[0].value.indexOf(" ") <= 0)
    {
      alert("Plese input name correctly. first name and last name is not splited.");
      return;
    }

    this.adminUserInfo = JSON.parse(localStorage.getItem('admin_user'));

    console.log("adminUserInfo", this.adminUserInfo);

    if(this.adminUserInfo == null || this.adminUserInfo.user_token == undefined)
    {
      console.log("111111");
      this.response.personal = this.personal;
      this.response.emergency = this.emergency;
      this.response.qualification = this.qualification;
      this.response.available_pass = this.available_pass;
      this.response.special_note = this.special_note;
      this.response.customer_id = this.customer_id;

      this.response.avatar_url = this.avatar_url;
      this.response.history.transaction_history = this.transaction_history;
      this.response.history.last_visit = this.last_visit;
      this.response.history.visit_month = this.visit_month;
      this.response.status = this.checkin_status;

      this.response.checkin_passtype = this.checkin_passtype;


      var customerInfo = {
        state: true,
        response: this.response
      }
      localStorage.setItem('customerInfo', JSON.stringify(customerInfo));

      // console.log("customerInfo1", JSON.parse(localStorage.getItem('customerInfo')));

      // this.openModal("login_modal");
      // return;
    }


      
    console.log("customerInfo2", JSON.parse(localStorage.getItem('customerInfo')));
    let send_data = {
      user_token: this.adminUserInfo.user_token,
      customerInfo: JSON.parse(localStorage.getItem('customerInfo')).response
    }

    localStorage.setItem('customerInfo', JSON.stringify({}));

    console.log("send Data*******", send_data);
  
    this.http.post(environment.api_url + 'admin_customer_update', send_data)
      .subscribe(
        res => {
          console.log("***Response", res.json())
          let response = res.json();
          switch(response.result)
          {
            case -1:
              this.openModal("login_modal");
              // this.router.navigate(['auth/login']);
              break;
            case 0:
              break;
            case 1:
              localStorage.setItem('admin_user', JSON.stringify({}));
              this.router.navigate(['pages/customerInfo/' +  this.phone_number]);
              
              console.log("OKKKKOKKOKI");
              break;
          }
        },
        err => {
          console.log("Error occured");
        }
      );
    // this.router.navigate(['pages/addPass']);
  }

  go_add(phone_number)
  {
    localStorage.setItem('admin_user', JSON.stringify({}));
    this.router.navigate(['/pages/addPass/' + phone_number]);
  }

  go_edit(pass_type)
  {
    localStorage.setItem('admin_user', JSON.stringify({}));
    if(pass_type != "season" && pass_type != "promo")
    {
      this.router.navigate(['/pages/editotherpass/' + pass_type + '/' + this.phone_number]);
    }
    else if(pass_type == "season")
      this.router.navigate(['/pages/editseasonpass/' + pass_type + '/' + this.phone_number]);
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
            this.go_save();
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


