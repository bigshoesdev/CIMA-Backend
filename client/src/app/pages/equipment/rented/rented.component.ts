import { Component, OnInit } from '@angular/core';

import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Router, ActivatedRoute } from '@angular/router';
import { NumberPickerComponent } from '../../numberpicker/number-picker.component';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../config/config';
import {Location} from '@angular/common';
import { ModalService } from '../../../@theme/services/index';
import { StateService } from '../../../@core/data/state.service';

@Component({
  selector: 'app-rented',
  templateUrl: './rented.component.html',
  styleUrls: ['./rented.component.scss']
})
export class RentedComponent implements OnInit {

  details = [];
  shoe_rented_count = [];
  sock_rented_count = 0;
  chalkbag_rented_count = 0;
  adminUserInfo: any;

  customer_password = "";

  temp : any;

  shoe_sizes = ["2.0","2.5","3.0","3.5","4.0","4.5","5.0","5.5","6.0","6.5","7.0","7.5","8.0","8.5","9.0","9.5", "10.0","10.5","11.0","11.5","12.0","12.5","13.0","13.5","14.0"];

  constructor(protected stateService: StateService,private http: Http, private router: Router,private _location: Location, private modalService: ModalService) 
  {
  
  }


  ngOnInit() {
    this.modalService.modals = [];
    this.customer_password = "";
    this.http.post(environment.api_url + 'getRented', {})
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
              this.shoe_rented_count = response.shoe_rented_count;
              this.sock_rented_count = response.sock_rented_count;
              this.chalkbag_rented_count = response.chalkbag_rented_count;
              console.log("OKKKKLK");
              console.log("details", this.details);
              break;
          }
        },
        err => {
          console.log("Error occured");
        }
      );
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

  go_confirm(element) {
 
      console.log("element", element);
      let send_data = {
        element: element
      }
      this.http.post(environment.api_url + 'rented_edit', send_data)
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
                console.log("details", this.details);
                for(var i = 0;  i < this.details.length; i++)
                {
                  if(this.details[i].user_id == element.user_id)
                  {
                    this.details[i] == element;
                    break;
                  }
                    
                }

                let temp_shoes = [];
                for(var i = 2.0 ; i <= 14.0; i += 0.5 )
                {
                    var temp = 
                    {
                        size: i.toFixed(1),
                        count: 0
                    }
                    temp_shoes.push(temp);
                }

                for(var i = 0;  i < this.details.length; i++)
                {
                  for(var j = 0;  j < this.details[i].items.length; j++)
                  {
                    for(var k = 0; k < temp_shoes.length; k++)
                    {
                      if(temp_shoes[k].size == this.details[i].items[j].size )
                        temp_shoes[k].count += this.details[i].items[j].quantity;
                    }
                  }
                }

                this.shoe_rented_count = temp_shoes;
                break;
            }
          },
          err => {
            console.log("Error occured");
          }
        );

  }

  go_return(element) {
    console.log("element", element);
    let send_data = {
      element: element
    }
    this.http.post(environment.api_url + 'rented_returned', send_data)
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
              for(var i = 0;  i < this.details.length; i++)
              {
                if(this.details[i].user_id == element.user_id)
                {
                  this.details.splice(i, 1)
                  break;
                }
              }

              let temp_shoes = [];
              for(var i = 2.0 ; i <= 14.0; i += 0.5 )
              {
                  var temp = 
                  {
                      size: i.toFixed(1),
                      count: 0
                  }
                  temp_shoes.push(temp);
              }

              for(var i = 0;  i < this.details.length; i++)
              {
                for(var j = 0;  j < this.details[i].items.length; j++)
                {
                  for(var k = 0; k < temp_shoes.length; k++)
                  {
                    if(temp_shoes[k].size == this.details[i].items[j].size )
                      temp_shoes[k].count += this.details[i].items[j].quantity;
                  }
                }
              }
              localStorage.setItem('admin_user', JSON.stringify({}));
              this.shoe_rented_count = temp_shoes;
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
