import {Component, OnInit, AfterViewChecked, ElementRef, ViewChild} from '@angular/core';

import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { environment } from '../../config/config';
import { Router, ActivatedRoute } from '@angular/router';
import { elementAt } from 'rxjs/operators/elementAt';
import { StateService } from '../../@core/data/state.service';
import { ModalService } from '../../@theme/services/index';
import $ from 'jquery'; 
import { window } from 'rxjs/operators/window';
import { Window } from 'selenium-webdriver';
import { Output } from '@angular/core/src/metadata/directives';
import { Observable } from 'rxjs/Observable';


@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements AfterViewChecked {

  _window: any;

  adminUserInfo: any;
  customerList = [];
  display_customerList = [];
  search_keyword = "";
  select_customer = {
    avatar_url: "",
    detail: [
    ],
    nric: "",
    user_name: ""
  };
  customerInfo_hide =  true;

  customerInfo_first = [];
  customerInfo_last = [];

  customerInfo_element_show = true;

  customer_password = "";

  orders = [
    {
      title: "Name",
      value: 0
    },
    {
      title: "Registration time",
      value: 4
    },
    {
      title: "Last Visit",
      value: 5
    }
  ]


  selcted_order = 5;

  flag_avartar = false;

  

  constructor(protected stateService: StateService, private http: Http, private router: Router, private modalService: ModalService) 
  {
  }

  public ngAfterViewChecked(): void {
    $('.user_avatar img').height($('.user_avatar img').width());
    $('.user_avatar1 img').height($('.user_avatar1 img').width());


  }     

  ngOnInit() {




    // Observable.fromEvent()
    this.customer_password = "";
    this.modalService.modals = [];
    this.adminUserInfo = JSON.parse(localStorage.getItem('admin_user'));
    if(this.adminUserInfo == null || this.adminUserInfo.user_token == undefined)
    {
      this.stateService.setlogout_show(true);
    }
    else
      this.stateService.setlogout_show(false);

    this.stateService.setselcted_setting(2);
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
    this.http.post(environment.api_url + 'admin_search_getuser', {})
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
              this.customerList = response.customers;
              this.display_customerList = response.customers;

             

              console.log("customer List: ", this.display_customerList);
              if(this.display_customerList.length > 0)
              {
                this.customerInfo_hide = false;

                var order = this.selcted_order;

                this.display_customerList.sort(function(a, b)
                {

                    if(order >= 4)
                    {
                      var data_A = a.detail[order].src;
                      var data_B = b.detail[order].src;
                      if(data_A > data_B)
                        return -1;
                      if(data_A < data_B)
                        return 1;
                      return 0;
                    }
                    else
                    {
                      var data_A = a.detail[order].value;
                      var data_B = b.detail[order].value;
                      if(data_A < data_B)
                        return -1;
                      if(data_A > data_B)
                        return 1;
                      return 0;
                    }
                  
                });
                
                this.select_customer = this.display_customerList[0];
              }
             
              
              console.log("customerList", this.customerList);
              break;
          }
        },
        err => {
          console.log("Error occured");
        }
      );
  }

  search_by_customer_name() {
    this.display_customerList= [];
    console.log("keyword:", this.search_keyword);
    console.log("customer", this.customerList);
    for(var i = 0;  i < this.customerList.length; i++)
    {
      if(this.customerList[i].user_name.toUpperCase().indexOf(this.search_keyword.toUpperCase()) >= 0 || this.customerList[i].user_name.toLowerCase().indexOf(this.search_keyword.toLowerCase()) >= 0)
      {
        this.display_customerList.push(this.customerList[i]);
      }
    }

    console.log("display_customerList", this.display_customerList);
    if(this.display_customerList.length > 0)
    {
      this.customerInfo_hide = false;
      this.select_customer = this.display_customerList[0];
      console.log("nric", this.select_customer.nric);
    }
    else
      this.customerInfo_hide = true;
  }

  select_pass(index, event) {
    let self = this;
    console.log("index", index);
    this.select_customer = this.display_customerList[index];

    this.customerInfo_first = [];
    for(var i = 0; i < 3; i++ )
    {
      this.customerInfo_first.push(this.select_customer.detail[i]);
    }
    this.customerInfo_last = [];
    for(var i = 3; i < 6; i++ )
    {
      this.customerInfo_last.push(this.select_customer.detail[i]);
    }

    (event.target).addEventListener('dblclick', function(event) {

      let phone_number = (<any>event.target).className;
      self.go_detail(phone_number);
      console.log("dbcllicked");
    });


    // Observable.fromEvent(avatar, 'click').debounceTime(1000).subscribe(value => alert("OK"));

  }

  go_export()
  {
    this._window = this.stateService.nativeWindow;
    

    this.http.post(environment.api_url + 'export_csv', {})
      .subscribe(
        res => {

          let response = res.json();

          if(response.result  == 1)
          {
            // this._window.open(response.url);
            var blob = new Blob([response.url], { type: 'text/csv'});
            var url= this._window.URL.createObjectURL(blob);
            this._window.open(url);

            // let parsedResponse = response.url;
            // let blob = new Blob([parsedResponse], { type: 'text/csv' });
            // let url = this._window.open.URL.createObjectURL(blob);
            // this._window.open(url);
        
            // if(navigator.msSaveOrOpenBlob) {
            //     navigator.msSaveBlob(blob, 'CustomerInfo.csv');
            // } else {
            //     let a = document.createElement('a');
            //     a.href = url;
            //     a.download = 'Book.csv';
            //     document.body.appendChild(a);
            //     a.click();        
            //     document.body.removeChild(a);
            // }
            // this._window.URL.revokeObjectURL(url);
          }
          
         
          
        },
        err => {

          alert("Error occured");
        }
      );
  }

  selectOrder()
  {

    if(this.display_customerList.length > 0)
    {
      var order = this.selcted_order;

      this.display_customerList.sort(function(a, b)
      {

          if(order >= 4)
          {
            var data_A = a.detail[order].src;
            var data_B = b.detail[order].src;
            if(data_A > data_B)
              return -1;
            if(data_A < data_B)
              return 1;
            return 0;
          }
          else
          {
            var data_A = a.detail[order].value;
            var data_B = b.detail[order].value;
            if(data_A < data_B)
              return -1;
            if(data_A > data_B)
              return 1;
            return 0;
          }
        
      });



      this.select_customer = this.display_customerList[0];
    }
    
  }

  image_click()
  {
    this._window = this.stateService.nativeWindow;
    this._window.open(this.select_customer.avatar_url);
  }

  go_detail(phone_number) {
    this.router.navigate(['pages/customerInfo',phone_number]);
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
