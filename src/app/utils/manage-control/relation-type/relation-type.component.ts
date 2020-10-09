import { Component, OnInit, Input, ViewChild, OnDestroy, AfterViewInit, ElementRef, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { CommonService, GetOptions } from 'src/app/service/common.service';
import { AppService } from 'src/app/service/app.service';
import { FormService } from 'src/app/service/form.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'odp-relation-type',
  templateUrl: './relation-type.component.html',
  styleUrls: ['./relation-type.component.scss']
})
export class RelationTypeComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input() control: FormControl;
  @Input() definition: any;
  @Input() first: boolean;
  @Output() keyupEvent: EventEmitter<KeyboardEvent>;
  @ViewChild('typeAhead', { static: false }) typeAhead: NgbTypeahead;
  @ViewChild('relationTypeInput', { static: false }) relationTypeInput: ElementRef;

  url: string;
  relatedField: string;
  subscriptions: any;
  itemSelected: boolean;
  recordsCount: number;
  records: Array<any>;
  selectedValue: string;
  isSerachFieldSecureTxt: boolean;
  relatedServiceDef: any;
  constructor(private commonService: CommonService,
    private appService: AppService,
    private formService: FormService) {
    const self = this;
    self.subscriptions = {};
    self.selectedValue = '';
    self.keyupEvent = new EventEmitter();
    self.recordsCount = 0;
  }

  ngOnInit() {
    const self = this;
    self.itemSelected = false;
    if (self.definition.properties.relatedTo) {
      self.relatedField = (self.definition.properties as any).relatedSearchField;
      self.commonService.getService(self.definition.properties.relatedTo).then((res: any) => {
        if (res && res.attributeList) {
          self.relatedServiceDef = res.attributeList.find(e => e.key === self.definition.properties.relatedSearchField);
        }
        if (self.relatedServiceDef && self.relatedServiceDef.properties && self.relatedServiceDef.properties.password) {
          self.isSerachFieldSecureTxt = true;
        }
        self.url = '/' + self.commonService.app._id + res.api;
        self.getNoOfRecords().then(() => {
          if (self.control.value) {
            if (self.relatedField !== '_id') {
              const options = {
                select: self.relatedField,
                srvcID: self.definition.properties.relatedTo
              };
              self.subscriptions['getRelationData'] = self.commonService
                .get('api', self.url + '/' + self.control.value._id, options)
                .subscribe(data => {
                  if (self.typeAhead) {
                    setTimeout(() => {
                      self.typeAhead.writeValue(data);
                    }, 50);
                  } else {
                    self.selectedValue = data._id;
                  }
                }, err => {
                  self.control.setValue(null);
                  self.commonService.errorToast(err, 'Unable to fetch reference data');
                });
            } else {
              setTimeout(() => {
                if (self.typeAhead) {
                  setTimeout(() => {
                  
                    self.typeAhead.writeValue(self.control.value);
                  }, 50);
                  self.selectedValue = self.control.value._id;
                } else {
                  self.selectedValue = self.control.value._id;
                }
              }, 100);
            }

          }
        }).catch(err => {
          if (!environment.production) {
            console.log('error', err);
          }
          // self.commonService.errorToast(err, 'Unable to fetch reference');
        });
      }).catch(err => {
        self.commonService.errorToast(err, 'Unable to fetch reference');
      });
    }
  }

  ngAfterViewInit() {
    const self = this;
    if (self.relationTypeInput && (self.first || self.formService.shouldFocus)) {
      if (!self.relationTypeInput.nativeElement.value) {
        self.formService.shouldFocus = false;
        self.relationTypeInput.nativeElement.focus();
      }
    }
  }

  ngOnDestroy() {
    const self = this;
    Object.keys(self.subscriptions).forEach(key => {
      if (self.subscriptions[key]) {
        self.subscriptions[key].unsubscribe();
      }
    });
  }

  selectItem(val) {
    const self = this;
    self.control.patchValue({ _id: val.item._id });
    self.control.markAsDirty();
    self.itemSelected = false;
  }

  onFocus($event) {

  }
  onBlur() {
    const self = this;
    self.control.markAllAsTouched();
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

  onEnter(event: KeyboardEvent) {
    const self = this;
    if (self.itemSelected) {
      self.itemSelected = false;
      self.keyupEvent.emit(event);
    } else {
      self.itemSelected = true;
    }
  }

  search = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(val => {
        const self = this;
        if (val) {
          self.control.patchValue({ _id: val });
        } else {
          self.control.setValue(null);
        }
        self.control.markAsDirty();
        self.control.markAsTouched();
        let filter = {};
        if (self.relatedServiceDef && self.relatedServiceDef.properties && self.relatedServiceDef.properties.password) {
          filter = {
            [self.definition.properties.relatedSearchField + '.value']: val
          }
        }
        else if (self.relatedServiceDef && self.relatedServiceDef.properties && self.relatedServiceDef.properties._type === 'Number') {
          filter = {
            [self.definition.properties.relatedSearchField]: val
          }
        } else {
          filter = { [self.definition.properties.relatedSearchField]: '/' + val + '/' }
        }

        const options: GetOptions = {
          filter,
          select: self.relatedField,
          count: 20,
          srvcID: self.definition.properties.relatedTo
        };
        return self.commonService.get('api', self.url, options).toPromise().then(res => {
          return res;
        }).catch(err => { self.commonService.errorToast(err, 'Unable to search'); });
      })
    )

  formatter = (obj: any) => {
    const self = this;
    let retValue = self.appService.getValue(self.definition.properties.relatedSearchField, obj);
    if (retValue && typeof retValue === 'object') {
      if (self.relatedServiceDef && self.relatedServiceDef.properties && self.relatedServiceDef.properties.password)
        retValue = retValue.value
    }
    else if (self.relatedServiceDef && self.relatedServiceDef.type === 'File') {
      retValue = retValue.metadata.file
    }
    else if (self.relatedServiceDef && self.relatedServiceDef.type === 'Geojson') {
      retValue = retValue.userInput ? retValue.userInput : retValue.formattedAddress
    }
    return retValue;
  }

  getNoOfRecords(): Promise<any> {
    const self = this;
    return new Promise<any>((resolve, reject) => {
      self.commonService.getDocumentCount(self.url).then(count => {
        self.recordsCount = count;
        resolve(count);
        if (self.recordsCount <= 10) {
          self.commonService.getFewDocument(self.url).then(records => {
            self.records = records;
          }).catch(err => {
            self.commonService.errorToast(err, 'Unable to fetch related Documents');
          });
        }
      }).catch(err => {
        reject(err);
      });
    });
  }

  get requiredError() {
    const self = this;
    return self.control.hasError('required') && self.control.touched;
  }
}
