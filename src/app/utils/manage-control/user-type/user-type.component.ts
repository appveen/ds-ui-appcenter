import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { CommonService, GetOptions } from 'src/app/service/common.service';
import { AppService } from 'src/app/service/app.service';
import { FormService } from 'src/app/service/form.service';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'odp-user-type',
  templateUrl: './user-type.component.html',
  styleUrls: ['./user-type.component.scss']
})
export class UserTypeComponent implements OnInit {
  @Input() control: FormControl;
  @Input() definition: any;
  @Input() first: boolean;
  @Output('keyupEvent') keyupEvent: EventEmitter<KeyboardEvent>;
  @ViewChild('typeAhead', { static: false }) typeAhead: NgbTypeahead;
  @ViewChild('relationTypeInput', { static: false }) relationTypeInput: ElementRef;
  recordsCount: number;
  subscriptions: any;
  records: Array<any>;
  selectedValue: string;
  attrs: string;
  itemSelected: boolean;
  constructor(private commonService: CommonService,
    private appService: AppService,
  ) {
    const self = this;
    self.subscriptions = {};
    self.recordsCount = 0;
    self.selectedValue = '';
    self.keyupEvent = new EventEmitter();

  }

  ngOnInit() {
    const self = this;
    self.getUserData();
  }

  getUserData() {
    const self = this;
    self.attrs = (<any>self.definition.properties).relatedSearchField;
    self.getNoOfRecords().then(() => {
      if (self.control.value && self.control.value._id) {
        const options = {
          select: (<any>self.definition.properties).relatedSearchField,
        };
        self.commonService
          .get('user', `/usr/app/${self.commonService.app._id}/${self.control.value._id}`, options)
          .subscribe(_data => {
            if (self.typeAhead) {
              self.typeAhead.writeValue(_data);
            } else {
              self.selectedValue = _data._id;
            }
          }, err => {
            self.control.setValue(null);
            // self.commonService.errorToast(err, 'Unable to fetch reference data');
          });
      }
    })

  }

  getNoOfRecords(): Promise<any> {
    const self = this;
    return new Promise<any>((resolve, reject) => {
      self.commonService.get('user', `/usr/app/${self.commonService.app._id}/count`).toPromise().then(res => {
        self.recordsCount = res;
        resolve(res);
        return res;
      }).then(res => {
        if (self.recordsCount <= 10) {
          self.getUserRecords();
        }
      }).catch(err => {
        resolve(err);
      });
    });
  }


  getUserRecords() {
    const self = this;
    self.commonService.get('user', `/usr/app/${self.commonService.app._id}`, { count: -1, }).subscribe(_records => {
      self.records = _records;
    }, err => {
      self.commonService.errorToast(err, 'Unable to fetch reference data');
    });
  }


  search = (text$: Observable<string>) =>
    text$.pipe(
      tap(() => this.appService.searchingRecord = true),
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(_val => {
        const self = this;
        if (_val) {
          self.control.patchValue({ _id: _val });
        } else {
          self.control.setValue(null);

        }
        self.control.markAsDirty();
        self.control.markAsTouched();
        const filter = {};
        filter[(<any>self.definition.properties).relatedSearchField] = '/' + _val + '/';
        const options: GetOptions = {
          filter: filter,
          select: self.attrs,
        };
        let path = `/usr/app/${this.commonService.app._id}`;
        if (this.commonService.userDetails.isSuperAdmin) {
          path = `/usr`
        }
        return self.commonService.get('user', path, options).toPromise().then(res => {
          return res;
        }).catch(err => { self.commonService.errorToast(err, 'Unable to search'); });
      }),
      tap(() => this.appService.searchingRecord = false)
    )

  formatter = (obj: any) => {
    const self = this;
    return self.appService.getValue(self.definition.properties.relatedSearchField, obj);
  }

  selectItem(_val) {
    const self = this;
    self.control.patchValue({ _id: _val.item._id });
    self.control.markAsDirty();
    self.itemSelected = false;
  }

  onEnter(event: KeyboardEvent) {
    const self = this;
    if (self.itemSelected) {
      self.itemSelected = false;
      self.keyupEvent.emit(event);
    } else {
      self.itemSelected = true;
    }
  }
  onFocus(event) {

  }
  selectOption() {
    const self = this;
    if (self.selectedValue) {
      self.control.patchValue({ _id: self.selectedValue });
    } else {
      self.control.patchValue(null);
    }
    self.control.markAsDirty();
    self.itemSelected = false;
  }

  get requiredError() {
    const self = this;
    return self.control.hasError('required') && self.control.touched;
  }
}
