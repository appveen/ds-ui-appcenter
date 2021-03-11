import { Injectable, EventEmitter } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  selectedService: EventEmitter<any>;
  appChanged: EventEmitter<any>;
  constructor() {
    this.selectedService = new EventEmitter();
    this.appChanged = new EventEmitter();
  }
}
