import { Component, OnInit } from '@angular/core';

import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Router, ActivatedRoute } from '@angular/router';
import { NumberPickerComponent } from '../../numberpicker/number-picker.component';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../config/config';
import { ModalService } from '../../../@theme/services/index';
import { Location} from '@angular/common';
import { StateService } from '../../../@core/data/state.service';

@Component({
  selector: 'app-manual-entry',
  templateUrl: './manual-entry.component.html',
  styleUrls: ['./manual-entry.component.scss']
})
export class ManualEntryComponent implements OnInit {

  phone_number = "";
  adminUserInfo: any;
  customer_password = "";
  quantity = 1;
  shoe_sizes = ["2.0","2.5","3.0","3.5","4.0","4.5","5.0","5.5","6.0","6.5","7.0","7.5","8.0","8.5","9.0","9.5", "10.0","10.5","11.0","11.5","12.0","12.5","13.0","13.5","14.0"];
  items = [
    {
      type: "shoe",
      title: "Shoe Rental",
      status: "fullfilled"
    },
    {
      type: "chalkbag",
      title: "Chalkbag   Rental",
      status: "fullfilled"
    },
    {
      type: "sock",
      title: "Socks",
      status: "fullfilled"
    },
  ]

  flag_additem : any;

  current_item = "shoe";
  current_size = "7.0";

  picked_items = [];

  constructor(protected stateService: StateService,private http: Http, private router: Router,private _location: Location, private modalService: ModalService) 
  {
  
  }

  ngOnInit() {
    this.flag_additem = false;
    this.modalService.modals = [];
    this.customer_password = "";
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

  selectItem(item) {
    this.current_item = item;
  }

  selectSize(value) {
    this.current_size = value;
  }

  change_quantity($event) {
    this.quantity = $event;
  }

  item_plus() {
    switch(this.current_item)
    {
      case "shoe":
        var flag = false;
        for(var i = 0;  i < this.picked_items.length; i++)
        {
          if(this.picked_items[i].type == "shoe" && this.picked_items[i].size == this.current_size)
          {
            flag = true;
            this.picked_items[i].quantity += this.quantity;
            this.picked_items[i].size = this.current_size;
            this.picked_items[i].title = ((this.picked_items[i].quantity > 1) ? (this.picked_items[i].quantity + " * ") : "") + "Shoe Rental" + "     " + this.picked_items[i].size;
          }
        }
        if(flag == false)
        {
          var temp = {
            type: 'shoe',
            quantity: this.quantity,
            size: this.current_size,
            title: ((this.quantity > 1) ? (this.quantity + " * ") : "") + "Shoe Rental" + "     " + this.current_size,
            status: "fullfilled"
          }
          this.picked_items.push(temp);
        }
      
        break;
      case "chalkbag":
        var flag = false;
        for(var i = 0;  i < this.picked_items.length; i++)
        {
          if(this.picked_items[i].type == "chalkbag")
          {
            flag = true;
            this.picked_items[i].quantity += this.quantity;
            this.picked_items[i].size = "FREE";
            this.picked_items[i].title = ((this.picked_items[i].quantity > 1) ? (this.picked_items[i].quantity + " * ") : "") + "Chalkbag Rental" + "     " + "FREE";
          }
        }
        if(flag == false)
        {
          var temp = {
            type: 'chalkbag',
            quantity: this.quantity,
            size: "FREE",
            title: ((this.quantity > 1) ? (this.quantity + " * ") : "") + "Chalkbag Rental" + "     " + "FREE",
            status: "fullfilled"
          }
          this.picked_items.push(temp);
        }
        break;
      case "sock":
        var flag = false;
        for(var i = 0;  i < this.picked_items.length; i++)
        {
          if(this.picked_items[i].type == "sock")
          {
            flag = true;
            this.picked_items[i].quantity += this.quantity;
            this.picked_items[i].size = "FREE";
            this.picked_items[i].title = ((this.picked_items[i].quantity > 1) ? (this.picked_items[i].quantity + " * ") : "") + "Socks" + "     " + "FREE";
          }
        }
        if(flag == false)
        {
          var temp = {
            type: 'sock',
            quantity: this.quantity,
            size: "FREE",
            title: ((this.quantity > 1) ? (this.quantity + " * ") : "") + "Socks" + "     " + "FREE",
            status: "fullfilled"
          }
          this.picked_items.push(temp);
        }
        break;
    }
  }

  add_item() {

    if(this.phone_number == "")
    {
      alert("Please input phone number");
    }
    else if(this.picked_items.length == 0)
    {
      alert("Please pick items!");
    }
    else
    {
      // this.flag_additem = true;
      // let temp = JSON.parse(localStorage.getItem('admin_user'));
      // if(temp == null || temp.user_token == undefined)
      // {
      //   this.openModal("login_modal")
      //   return;
      // }
      let send_data = {
        phone_number: this.phone_number,
        items: this.picked_items,
        // staff_name: temp.user_name,
        staff_name: "Manual",
      }

      console.log("send Data", send_data);
    
      this.http.post(environment.api_url + 'admin_manual_entry', send_data)
        .subscribe(
          res => {
            let response = res.json();
            this.flag_additem = false;
            switch(response.result)
            {
              case -1:
                alert("Please input phone number correctly.")
                break;
              case 0:
                break;
              case 1:
                this.picked_items = [];
                console.log("OKKKKLK");
                localStorage.setItem('admin_user', JSON.stringify({}));
                this.router.navigate(['pages/equipment/pending_rental']);
                break;
            }
          },
          err => {
            this.flag_additem = false;
            console.log("Error occured");
          }
        );
    }
    
  }

  item_delete() {
    this.picked_items = [];
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
            if(this.flag_additem)
            {
              this.add_item();
              return;
            }
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
