import { Injectable, EventEmitter } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WorkflowAgGridService {
  selectAll: EventEmitter<any>;
  respond: EventEmitter<any>;
  selectedSavedView: any;
  inlineFilterActive: any;
  requestedByList: Array<any>;
  respondedByList: Array<any>;
  approversList: Array<any>;
  constructor() {
    const self = this;
    self.selectAll = new EventEmitter();
    self.respond = new EventEmitter();
  }


}
