import { Injectable } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/observable/of';
import * as io from 'socket.io-client'
import { environment } from '../../config/config';
import { retry } from 'rxjs/operator/retry';

function getWinodw(): any {
  return window;
}

@Injectable()

export class StateService {
  protected sidebars: any = [
    {
      name: 'Equipment',
      img: 'shoes.png',
      url: 'pages/equipment',
      selected: false,
      count: 0,
      hide: false,
    },
    {
      name: 'Graph',
      img: 'graph.png',
      url: 'pages/graph',
      selected: false,
      hide: false,
    },
    {
      name: 'Search',
      img: 'search.png',
      url: 'pages/search',
      selected: false,
      hide: false,
    },
    {
      name: 'Setting',
      img: 'setting.png',
      url: 'pages/setting',
      selected: false,
      hide: false,
    },
    // {
    //   name: 'Log out',
    //   img: 'logout.png',
    //   url: 'auth/login',
    //   selected: false,
    //   hide: true,
    // },
  ];

  get nativeWindow(): any {
    return getWinodw();
  }

  protected socket = null;

  
  emit_socket(length){
    console.log("pending_length ********", length);
    console.log("current socket info", this.socket);
    if(this.socket != null)
      this.socket.emit("retrieve_length", length);
  }

  format_socket(){
    this.socket = io(environment.websocket_url);
    this.socket.on('pending_length', function(data:any){
      console.log("websocket:::::", data);
      this.setpurchased_customercount(data);
    }.bind(this)); 
  }

  protected sidebarState$ = new BehaviorSubject(this.sidebars[0]);

  setSidebarState(state: any): any {
    this.sidebarState$.next(state);
  }

  getSidebarStates(): Observable<any[]> {
    return Observable.of(this.sidebars);
  }

  onSidebarState(): Observable<any> {
    return this.sidebarState$.asObservable();
  }

  deselectall() {
    for(var i = 0; i < this.sidebars.length; i++)
    {
      this.sidebars[i].selected = false;
    }
    localStorage.setItem('setting', JSON.stringify({url: ""}));
  }

  setpurchased_customercount(count)
  {
    this.sidebars[0].count = count;
  }

  setselcted_setting(id)
  {
    this.deselectall();
    this.sidebars[id].selected  = true;
  }

  setlogout_show(value)
  {
    // this.sidebars[4].hide  = value;
  }
}
