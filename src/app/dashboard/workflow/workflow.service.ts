import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  serviceColumns: any;
  showActionItems: boolean;
  showFilterIcon: boolean;
  refreshCall: Subject<boolean>;
  currentFilter: any;

  constructor() {
    const self = this;
    self.serviceColumns = [];
    self.showActionItems = true;
    self.showFilterIcon = true;
    self.refreshCall = new Subject<false>();
    self.currentFilter = {};
  }

}
