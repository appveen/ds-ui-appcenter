import { Component, OnInit, Input, ViewChild, OnDestroy, AfterViewInit, ElementRef, Output, EventEmitter } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl } from '@angular/forms';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { Observable, of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { CommonService, GetOptions } from 'src/app/service/common.service';
import { AppService } from 'src/app/service/app.service';
import { FormService } from 'src/app/service/form.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'odp-relation-type',
  templateUrl: './relation-type.component.html',
  styleUrls: ['./relation-type.component.scss'],
  providers: [DatePipe]
})
export class RelationTypeComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input() control: FormControl;
  @Input() definition: any;
  @Input() first: boolean;
  @Output() keyupEvent: EventEmitter<KeyboardEvent>;
  @ViewChild('typeAhead', { static: false }) typeAhead: NgbTypeahead;
  @ViewChild('relationTypeInput', { static: false }) relationTypeInput: ElementRef;
  @ViewChild('searchBox', { static: false }) searchBox: ElementRef;


  url: string;
  relatedField: string;
  subscriptions: any;
  itemSelected: boolean;
  recordsCount: number;
  records: Array<any>;
  selectedValue: string;
  isSerachFieldSecureTxt: boolean;
  relatedServiceDef: any;
  searchFieldType: string;
  relatedData: any;
  relationLink: string;
  dropdownItems: Array<any>;
  searchText: string;
  searchTextSubject: Subject<string>;
  currentItem: any;

  get currentAppId() {
    return this.commonService?.getCurrentAppId();
  }

  constructor(private commonService: CommonService,
    private appService: AppService,
    private formService: FormService,
    private datePipe: DatePipe) {
    const self = this;
    self.subscriptions = {};
    self.selectedValue = '';
    self.keyupEvent = new EventEmitter();
    self.recordsCount = 0;
    this.searchFieldType = 'text';
    this.dropdownItems = [];
    this.searchText = '';
    this.searchTextSubject = new Subject();
  }

  ngOnInit() {
    const self = this;
    self.itemSelected = false;
    if (self.definition.properties.relatedTo) {
      self.relationLink = `/${self.currentAppId}/services/${self.definition.properties.relatedTo}/view/`;
      self.relatedField = (self.definition.properties as any).relatedSearchField;
      self.commonService.getService(self.definition.properties.relatedTo).then((res: any) => {
        if (res && res.definition) {
          self.relatedServiceDef = res.definition.find(e => e.key === self.definition.properties.relatedSearchField);
        }
        if (self.relatedServiceDef && self.relatedServiceDef.properties && self.relatedServiceDef.properties.password) {
          self.isSerachFieldSecureTxt = true;
        }
        if (this.relatedServiceDef && this.relatedServiceDef.properties && this.relatedServiceDef.properties.password) {
          this.searchFieldType = 'secureText'
        }

        else if (this.relatedServiceDef && this.relatedServiceDef.properties && this.relatedServiceDef.properties.dateType === 'date') {
          this.searchFieldType = 'date'

        }
        else if (this.relatedServiceDef && this.relatedServiceDef.properties && this.relatedServiceDef.properties.dateType === 'datetime-local') {
          this.searchFieldType = 'datetime'

        }
        else if (this.relatedServiceDef && this.relatedServiceDef.type === 'Boolean') {
          this.searchFieldType = 'boolean'

        }
        else if (self.relatedServiceDef && self.relatedServiceDef.type === 'Number') {
          this.searchFieldType = 'number'
        }
        else if (self.relatedServiceDef && self.relatedServiceDef.type === 'File') {
          this.searchFieldType = 'file'
        }
        else if (self.relatedServiceDef && self.relatedServiceDef.type === 'Geojson') {
          this.searchFieldType = 'geojson'
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
                  this.relatedData = data;
                  this.currentItem = data;
                  this.searchText = this.formatter(data);
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

    this.subscriptions['search'] = this.searchTextSubject.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(val => {
        const self = this;
        self.control.markAsDirty();
        self.control.markAsTouched();
        if (val) {
          self.control.patchValue({ _id: val });
          let filter = {};
          if (this.searchFieldType === 'secureText') {
            filter = {
              [self.definition.properties.relatedSearchField + '.value']: val
            };
          } else if (this.searchFieldType === 'number') {
            filter = {
              [self.definition.properties.relatedSearchField]: +val
            };
          } else if (this.searchFieldType === 'boolean' && ['true', 'false'].includes(val.toLowerCase())) {
            filter = {
              [self.definition.properties.relatedSearchField]: JSON.parse(val.toLowerCase())
            };
          } else if (this.searchFieldType === 'file') {
            filter = {
              [self.definition.properties.relatedSearchField + '.metadata.filename']: '/' + val + '/'
            };
          } else if (this.searchFieldType === 'geojson') {
            filter = {
              [self.definition.properties.relatedSearchField + '.formattedAddress']: '/' + val + '/'
            };
          } else {
            filter = { [self.definition.properties.relatedSearchField]: '/' + val + '/' };
          }

          const options: GetOptions = {
            filter,
            select: self.relatedField,
            count: 20,
            srvcID: self.definition.properties.relatedTo
          };
          return self.commonService.get('api', self.url, options);
        } else {
          self.control.setValue(null);
          return of([]);
        }
      })
    ).subscribe(
      res => {
        this.dropdownItems = res;
      },
      err => {
        this.dropdownItems = [];
        this.commonService.errorToast(err, 'Unable to search');
      }
    )
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
    self.control.patchValue({ _id: val._id });
    self.control.markAsDirty();
    self.itemSelected = false;
    self.currentItem = val;
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

  formatter = (obj: any) => {
    const self = this;
    let retValue = self.appService.getValue(self.definition.properties.relatedSearchField, obj);

    if (self.relatedServiceDef && self.relatedServiceDef.properties && self.relatedServiceDef.properties.password && retValue) {
      retValue = retValue.value;
    } else if (self.relatedServiceDef?.type === 'User' && !!retValue) {
      retValue = retValue?._id;
    } else if (self.relatedServiceDef?.properties?.richText && !!retValue) {
      retValue = self.getHtmlContent(retValue);
    } else if (
      self.relatedServiceDef &&
      self.relatedServiceDef.properties &&
      self.relatedServiceDef.properties._type === 'File' &&
      retValue
    ) {
      retValue = retValue.metadata.filename;
    } else if (self.relatedServiceDef && self.relatedServiceDef.type === 'Geojson' && retValue) {
      retValue = retValue.userInput ? retValue.userInput : retValue.formattedAddress;
    } else if (
      self.relatedServiceDef &&
      self.relatedServiceDef.properties &&
      self.relatedServiceDef.properties.dateType === 'date' &&
      retValue
    ) {
      retValue = this.datePipe.transform(retValue, 'dd-MM-yyyy');
    }

    return retValue;
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
        if (this.searchFieldType === 'secureText') {
          filter = {
            [self.definition.properties.relatedSearchField + '.value']: val
          };
        } else if (this.searchFieldType === 'number') {
          filter = {
            [self.definition.properties.relatedSearchField]: +val
          };
        } else if (this.searchFieldType === 'boolean' && ['true', 'false'].includes(val.toLowerCase())) {
          filter = {
            [self.definition.properties.relatedSearchField]: JSON.parse(val.toLowerCase())
          };
        } else if (this.searchFieldType === 'file') {
          filter = {
            [self.definition.properties.relatedSearchField + '.metadata.filename']: '/' + val + '/'
          };
        } else if (this.searchFieldType === 'geojson') {
          filter = {
            [self.definition.properties.relatedSearchField + '.formattedAddress']: '/' + val + '/'
          };
        } else {
          filter = { [self.definition.properties.relatedSearchField]: '/' + val + '/' };
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

  getHighlightedSearchItem(item: any) {
    const fullText: string = '' + this.formatter(item);
    const lowerCaseItem = fullText.toLowerCase();
    const lowerCaseSearchText = ('' + this.searchText).toLowerCase();
    const index = lowerCaseItem.indexOf(lowerCaseSearchText);
    const part1 = fullText.slice(0, index);
    const matchedPart = fullText.slice(index, index + lowerCaseSearchText.length);
    const part2 = fullText.slice(index + lowerCaseSearchText.length);
    return (
      part1 + '<strong>' + matchedPart + '</strong>' + part2
    );
  }

  getHtmlContent(val: string) {
    return val.replace(/<\/.*>/g, '').replace(/<.*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
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

  onSearch() {
    this.searchTextSubject.next(this.searchText);
  }

  focusSearch() {
    setTimeout(() => {
      if (!!this.searchBox) {
        this.searchBox.nativeElement.focus();
      }
      if (!!this.searchText) {
        this.searchTextSubject.next(this.searchText);
      }
    });
  }

  onDropdownOpenChange(event: any) {
    this.formService.overFlowSubject.next(event);
  }

  get requiredError() {
    const self = this;
    return self.control.hasError('required') && self.control.touched;
  }


}
