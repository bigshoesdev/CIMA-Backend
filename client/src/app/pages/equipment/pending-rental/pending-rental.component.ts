import {Component, OnInit, AfterViewChecked, ElementRef} from '@angular/core';

import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Router, ActivatedRoute } from '@angular/router';
import { NumberPickerComponent } from '../../numberpicker/number-picker.component';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../config/config';
import {Location} from '@angular/common';
import { StateService } from '../../../@core/data/state.service';
import { ModalService } from '../../../@theme/services/index';
import $ from 'jquery';


@Component({
  selector: 'app-pending-rental',
  templateUrl: './pending-rental.component.html',
  styleUrls: ['./pending-rental.component.scss']
})
export class PendingRentalComponent implements AfterViewChecked {

  details = [];
  customer_password = "";

  temp : any;
  adminUserInfo: any;

  shoe_sizes = ["2.0","2.5","3.0","3.5","4.0","4.5","5.0","5.5","6.0","6.5","7.0","7.5","8.0","8.5","9.0","9.5", "10.0","10.5","11.0","11.5","12.0","12.5","13.0","13.5","14.0"];

  constructor(protected stateService: StateService,private http: Http, private router: Router,private _location: Location, private modalService: ModalService) 
  {
  
  }

  public ngAfterViewChecked(): void {
    // $('.user_avatar img').height($('.user_avatar img').width());
  }       

  ngOnInit() {
    this.modalService.modals = [];
    this.customer_password = "";

    this.stateService.setselcted_setting(0);
    console.log("******abcdefg");
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
            this.details= response.info;
            this.stateService.setpurchased_customercount(this.details.length);
            break;
        }
      },
      err => {
        console.log("Error occured");
      }
    );
  }

  remove_item(item)
  {

      let send_data = {
        item: item
      }
  
      this.temp = item;
      console.log("item", send_data);
      this.http.post(environment.api_url + 'remove_item', send_data)
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
                console.log("id", this.temp.id);
                for(var i = 0; i < this.details.length; i++)
                {
                  for(var j = 0; j < this.details[i].items.length; j++)
                  {
                    if(this.details[i].items[j].id == this.temp.id)
                    {
                      this.details[i].items.splice(j, 1);
                      break;
                    }
                  }
                }
  
    
                let length = 0;
                for(var i = 0; i < this.details.length; i++)
                {
                  if(this.details[i].items.length != 0)
                  {
                    length++;
                  }
                }
  
                this.stateService.emit_socket(length);
                // this.stateService.setpurchased_customercount(length);
  
                if(length == 0)
                {
                  localStorage.setItem('admin_user', JSON.stringify({}));
                }
                  
  
                console.log("OKKKKLK");
                break;
            }
          },
          err => {
            console.log("Error occured");
          }
        );
    
  }

  go_fullfill(item) {

      let send_data = {
        item: item
      }
  
      this.temp = item;
      console.log("item", send_data);
      this.http.post(environment.api_url + 'fullfill_item', send_data)
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
                console.log("id", this.temp.id);
                for(var i = 0; i < this.details.length; i++)
                {
                  for(var j = 0; j < this.details[i].items.length; j++)
                  {
                    if(this.details[i].items[j].id == this.temp.id)
                    {
                      this.details[i].items.splice(j, 1);
                      break;
                    }
                  }
                }
  
    
                let length = 0;
                for(var i = 0; i < this.details.length; i++)
                {
                  if(this.details[i].items.length != 0)
                  {
                    length++;
                  }
                }
  
                this.stateService.emit_socket(length);
                // this.stateService.setpurchased_customercount(length);
  
                if(length == 0)
                {
                  localStorage.setItem('admin_user', JSON.stringify({}));
                  this.router.navigate(['pages/equipment/rented']);
                }
                  
  
                console.log("OKKKKLK");
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
