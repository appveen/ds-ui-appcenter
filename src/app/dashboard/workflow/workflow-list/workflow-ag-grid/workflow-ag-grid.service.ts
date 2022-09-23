import { Injectable, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';

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
  responded: Subject<any> = new Subject();
  constructor() {
    const self = this;
    self.selectAll = new EventEmitter();
    self.respond = new EventEmitter();
  }

  onRespond() {
    this.responded.next()
  }


}
