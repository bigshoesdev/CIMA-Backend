import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { NbThemeService } from '@nebular/theme';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { environment } from '../../../config/config';

@Component({
  selector: 'ngx-echarts-bar',
  template: `
    <my-date-range-picker name="mydaterange" (dateRangeChanged)="onDateRangeChanged_Graph($event)" [options]="myDateRangePickerOptions"
  [(ngModel)]="daterange_graph"  required></my-date-range-picker>
    <div echarts [options]="options" class="echart"></div>
  `,
})
export class EchartsBarComponent implements AfterViewInit, OnDestroy {
  options: any = {};
  themeSubscription: any;
  current_type = "month";
  index = 0;

  daterange_graph = {beginDate: {year: new Date().getFullYear(), month: new Date().getMonth() + 1, day: new Date().getDate()},
  endDate: {year: new Date().getFullYear(), month: new Date().getMonth() + 1, day: new Date().getDate()}};;

  str_daterange_graph = "";

  detail: any;


  constructor(private http: Http, private theme: NbThemeService) {
  }

  ngAfterViewInit() {

    var before_oneweek =  new Date(new Date().setDate(new Date().getDate() - 7));

    this.daterange_graph = {beginDate: {year: before_oneweek.getFullYear(), month: before_oneweek.getMonth() + 1, day: before_oneweek.getDate()},
      endDate: {year: new Date().getFullYear(), month: new Date().getMonth() + 1, day: new Date().getDate()}};

    this.str_daterange_graph = this.set_daterange();

    console.log("date range graph", this.str_daterange_graph);

    let send_data = {
      time: this.str_daterange_graph
    }

    console.log("send Data", send_data);

    this.http.post(environment.api_url + 'getStatistics1', send_data)
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
            console.log("graph date", this.detail);
            this.themeSubscription = this.theme.getJsTheme().subscribe(config => {

                const colors: any = config.variables;
                const echarts: any = config.variables.echarts;
          
                this.options = {
                  backgroundColor: echarts.bg,
                  color: [colors.primaryLight],
                  tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                      type: 'shadow',
                    },
                  },
                  grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true,
                  },
                  xAxis: [
                    {
                      type: 'category',
                      data: ['SEASON', 'COMPLEMENTARY', 'DAY', 'MULTI'],
                      axisTick: {
                        alignWithLabel: true,
                      },
                      axisLine: {
                        lineStyle: {
                          color: echarts.axisLineColor,
                        },
                      },
                      axisLabel: {
                        textStyle: {
                          color: echarts.textColor,
                        },
                      },
                    },
                  ],
                  yAxis: [
                    {
                      type: 'value',
                      axisLine: {
                        lineStyle: {
                          color: echarts.axisLineColor,
                        },
                      },
                      splitLine: {
                        lineStyle: {
                          color: echarts.splitLineColor,
                        },
                      },
                      axisLabel: {
                        textStyle: {
                          color: echarts.textColor,
                        },
                      },
                    },
                  ],
                  series: [
                    {
                      name: 'Score',
                      type: 'bar',
                      barWidth: '60%',
                      data: [this.detail.pass[0].count, this.detail.pass[1].count, this.detail.pass[2].count, this.detail.pass[3].count],
                    },
                  ],
                };
              });
            break;
        }
      },
      err => {
        console.log("Error occured");
      }
    );
   
  }

  ngOnDestroy(): void {
    // this.themeSubscription.unsubscribe();
  }

  onDateRangeChanged_Graph(event)
  {
    this.str_daterange_graph = event.formatted;
    let send_data = {
      time: this.str_daterange_graph
    }

    console.log("send Data", send_data);
    this.http.post(environment.api_url + 'getStatistics1', send_data)
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
            console.log("graph date", this.detail);
            this.themeSubscription = this.theme.getJsTheme().subscribe(config => {

                const colors: any = config.variables;
                const echarts: any = config.variables.echarts;
          
                this.options = {
                  backgroundColor: echarts.bg,
                  color: [colors.primaryLight],
                  tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                      type: 'shadow',
                    },
                  },
                  grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true,
                  },
                  xAxis: [
                    {
                      type: 'category',
                      data: ['SEASON', 'COMPLEMENTARY', 'DAY', 'MULTI'],
                      axisTick: {
                        alignWithLabel: true,
                      },
                      axisLine: {
                        lineStyle: {
                          color: echarts.axisLineColor,
                        },
                      },
                      axisLabel: {
                        textStyle: {
                          color: echarts.textColor,
                        },
                      },
                    },
                  ],
                  yAxis: [
                    {
                      type: 'value',
                      axisLine: {
                        lineStyle: {
                          color: echarts.axisLineColor,
                        },
                      },
                      splitLine: {
                        lineStyle: {
                          color: echarts.splitLineColor,
                        },
                      },
                      axisLabel: {
                        textStyle: {
                          color: echarts.textColor,
                        },
                      },
                    },
                  ],
                  series: [
                    {
                      name: 'Score',
                      type: 'bar',
                      barWidth: '60%',
                      data: [this.detail.pass[0].count, this.detail.pass[1].count, this.detail.pass[2].count, this.detail.pass[3].count],
                    },
                  ],
                };
              });
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

  
}
