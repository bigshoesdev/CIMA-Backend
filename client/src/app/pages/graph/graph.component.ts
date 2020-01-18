import { Component, OnInit } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { environment } from '../../config/config';
import { Router, ActivatedRoute } from '@angular/router';
import { ModalService } from '../../@theme/services/index';
import { StateService } from '../../@core/data/state.service';
import { EchartsBarComponent } from './echart/echarts-bar.component';
import { LocalDataSource } from 'ng2-smart-table';
import { IMyDrpOptions} from 'mydaterangepicker';

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})
export class GraphComponent implements OnInit {

  myDateRangePickerOptions: IMyDrpOptions = {
      // other options...
      dateFormat: 'yyyy/mm/dd',
  };

  daterange_history: any;

  str_daterange_history = "";


  detail: any;
  current_type = "month";

  source: LocalDataSource = new LocalDataSource();
  adminUserInfo: any;

  table_settings = {
    actions: false,
    columns: {
      id: {
        title: 'ID',
        type: 'number',
      },
      user_name: {
        title: 'Customer Name',
        type: 'string',
      },
      phone_number: {
        title: 'PHONE NUMBER',
        type: 'string',
      },
      pass_type: {
        title: 'PASS TYPE',
        type: 'string',
      },
      timestamp: {
        title: 'Check in time',
        type: 'string',
      },
      duration: {
        title: 'Duration',
        type: 'string',
      }
    }
  };
  customer_password = "";

  constructor(protected stateService: StateService, private http: Http, private router: Router, private modalService: ModalService) 
  {
  
  }

  ngOnInit() {
    this.modalService.modals = [];
    this.customer_password = "";
    this.adminUserInfo = JSON.parse(localStorage.getItem('admin_user'));
    if(this.adminUserInfo == null || this.adminUserInfo.user_token == undefined)
    {
      this.stateService.setlogout_show(true);
    }
    else
      this.stateService.setlogout_show(false);

    var before_oneweek =  new Date(new Date().setDate(new Date().getDate() - 7));

    this.daterange_history = {beginDate: {year: before_oneweek.getFullYear(), month: before_oneweek.getMonth() + 1, day: before_oneweek.getDate()},
      endDate: {year: new Date().getFullYear(), month: new Date().getMonth() + 1, day: new Date().getDate()}};

    this.str_daterange_history = this.set_daterange();

    console.log("date range history", this.str_daterange_history);

    this.stateService.setselcted_setting(1);
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
    this.str_daterange_history = this.set_daterange();
    let send_data = {
      time: this.str_daterange_history
    }

    console.log("send Data", send_data);
    this.http.post(environment.api_url + 'getStatistics2', send_data)
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
            this.detail = response.detail;
            console.log("source", this.detail.detail);
            this.source.load(this.detail.detail);
            break;
        }
      },
      err => {
        console.log("Error occured");
      }
    );
  }

  set_daterange() {
    var result = ""
    var year, month, day;
    var before_oneweek = new Date(new Date().setDate(new Date().getDate() - 7));

    year = before_oneweek.getFullYear();
    month = ((before_oneweek.getMonth() + 1) < 10) ? ('0' + (before_oneweek.getMonth() + 1)) :(before_oneweek.getMonth());
    day = ((before_oneweek.getDate()) < 10) ? ('0' + (before_oneweek.getDate())) :(before_oneweek.getDate());

    result = year + '/' + month + '/' + day + ' - ';

    year = new Date().getFullYear();
    month = ((new Date().getMonth() + 1) < 10) ? ('0' + (new Date().getMonth() + 1)) :(new Date().getMonth() + 1);
    day = ((new Date().getDate()) < 10) ? ('0' + (new Date().getDate())) :(new Date().getDate());
    result += (year + '/' + month + '/' + day);
    return result;
  }

  onDateRangeChanged_History(event)
  {
    // this.modalService.open("login_modal");
    this.str_daterange_history = event.formatted;

    let send_data = {
      time: this.str_daterange_history
    }

    console.log("send Data", send_data);
    this.http.post(environment.api_url + 'getStatistics2', send_data)
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
            this.detail = response.detail;
            console.log("source", this.detail.detail);
            this.source.load(this.detail.detail);
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
