import { Component, OnDestroy, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { HttpEventType } from '@angular/common/http';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import Fuse from 'fuse.js';

import { CommonService } from '../service/common.service';
import { AppService } from '../service/app.service';
import { FormService } from '../service/form.service';

@Component({
  selector: 'odp-filemapper',
  templateUrl: './filemapper.component.html',
  styleUrls: ['./filemapper.component.scss']
})
export class FilemapperComponent implements OnInit, OnDestroy {
  @ViewChild('validationInProgress', { static: true })
  validationInProgress: TemplateRef<HTMLElement>;
  @ViewChild('importInProgress', { static: true })
  importInProgress: TemplateRef<HTMLElement>;
  activeStep: number;
  title: string;
  attributeList: any;
  version: string;
  api: string;
  subscriptions: any;
  uploadObj: any;
  ripple: boolean;
  fileData: any = {};
  showLazyLoader: boolean;
  parseObj;
  fileSettings: any = {
    headers: true
  };
  schema: any;
  mappingData: any;
  form: FormGroup;
  createObj: any;
  uploading: number;
  prgressInVal: any;
  resultObj: any;
  summary: any;
  showImportLoader: boolean;
  tempAttrList;
  isChildDom: boolean;
  validationInProgressRef: NgbModalRef;
  importInProgressRef: NgbModalRef;
  dsKeys: Array<any>;
  hasBulkInvalidRecords: boolean;
  sentForValidation: boolean;
  breadcrumb: Array<any>
  constructor(
    private route: ActivatedRoute,
    private commonService: CommonService,
    private ts: ToastrService,
    private modalService: NgbModal,
    private router: Router,
    private appService: AppService,
    private formService: FormService,
    private fb: FormBuilder
  ) {
    const self = this;
    self.activeStep = 0;
    self.subscriptions = {};
    self.uploadObj = {
      showUploadSpinner: false,
      uploadError: false,
      showUploadTag: false,
      errorMsg: '',
      uploadProgress: 0
    };
    self.parseObj = {
      showParseSpinner: false,
      parseError: false,
      showParseTag: false
    };
    self.mappingData = {};
    self.createObj = {
      fileId: null,
      fileName: null,
      create: [],
      update: []
    };
    self.tempAttrList = [];
    self.dsKeys = [];
  }
  ngOnInit() {
    const self = this;
    this.route.data.subscribe(data => {
      if (data.breadcrumb) {
        this.breadcrumb = data.breadcrumb
      }
    })
    self.title = self.appService.serviceName;
    self.ripple = false;
    if (
      self.appService.resultObj &&
      self.appService.resultObj.conflicts === 0 &&
      self.appService.resultObj.duplicate === 0 &&
      self.appService.resultObj.valid === 0
    ) {
      self.hasBulkInvalidRecords = true;
    }
    self.showLazyLoader = true;
    self.getSchema(self.appService.serviceId);

    self.appService.objMappingData.subscribe(data => {
      self.isChildDom = !!data;
    });

    self.appService.hasBulkInvalidRecords.subscribe(data => {
      self.hasBulkInvalidRecords = data;
    });
    self.appService.loadFileMapper.subscribe(data => {
      self.getSchema(self.appService.serviceId);
    });
  }

  getSchema(serviceId) {
    const self = this;
    const options = {
      filter: { app: self.commonService.app._id }
    };
    self.showLazyLoader = true;
    self.subscriptions['serviceDefinition'] = self.commonService.get('sm', `/${this.commonService.app._id}/service/` + serviceId, options).subscribe(
      res => {
        self.showLazyLoader = false;
        const parsedDef = res.definition;
        self.updateSchema(parsedDef);
        res.definition = JSON.parse(JSON.stringify(parsedDef));
        self.schema = res;
        if (this.breadcrumb) {
          this.breadcrumb.push(res.name)
          this.breadcrumb.push('Upload');
          this.commonService.breadcrumbPush(this.breadcrumb)
        }
        if (!this.commonService.hasPermission(self.appService.serviceId, self.schema.role.roles, 'PUT') && !this.commonService.hasPermission(self.appService.serviceId, self.schema.role.roles, 'POST')) {
          return self.router.navigate(['../list'], { relativeTo: self.route });
        }
        self.title = res.name;
        self.version = res.version;
        self.api = '/' + self.commonService.app._id + res.api;
        if (res.wizard.length) {
          res.wizard.forEach(element => {
            self.tempAttrList = self.tempAttrList.concat(element.fields);
          });
        }
        if (self.appService.mappingData) {
          self.activeStep = 3;
          self.fileData = self.appService.fileData;
          self.mappingData = self.appService.mappingData;
          self.resultObj = self.appService.resultObj;
          self.resultObj.totalRecords =
            self.resultObj.valid + self.resultObj.errorCount + (self.resultObj.duplicateCount - self.resultObj.conflictCount);
          self.appService.mappingData = null;
          self.appService.fileData = null;
          self.appService.resultObj = null;
        }
        if (self.appService.fileData) {
          self.activeStep = 1;
          self.fileData = self.appService.fileData;
          self.appService.mappingData = null;
          self.appService.fileData = null;
        }
      },
      err => {
        self.commonService.errorToast(err, 'Unable to get the record please, try again later');
        self.showLazyLoader = false;
      }
    );
  }
  enableFileSettings(event) {
    const self = this;
    self.activeStep = 1;
  }

  selectAndUpload(event) {
    const self = this;
    const file = event.target.files[0];
    const formData: FormData = new FormData();
    formData.append('file', file);
    self.uploadFile(formData);
  }

  dragAndUpload(file) {
    const self = this;
    const formData: FormData = new FormData();
    formData.append('file', file[0]);
    self.uploadFile(formData);
  }

  uploadFile(formData) {
    const self = this;
    self.ripple = false;
    self.showLazyLoader = true;
    self.subscriptions['uploadFile_'] = self.commonService.upload('api', self.api, formData, true).subscribe(
      event => {
        if (event.type === HttpEventType.Response) {
          self.activeStep = 1;
          self.fileData = event.body;
          self.showLazyLoader = false;
          self.clearForms();

          const flattedArray = self.formService.parseDefinitionFM(self.schema.definition);
          flattedArray.forEach(element => {
            self.dsKeys.push(element.key);
          });
        }
      },
      err => {
        self.showLazyLoader = false;
        self.commonService.errorToast(err, 'Unable to upload the file, please try again later.');
      }
    );
  }

  dragOver() {
    const self = this;
    self.ripple = true;
  }
  dragOut() {
    const self = this;
    self.ripple = false;
  }
  clearForms() {
    const self = this;
    self.parseObj.showParseTag = false;
    self.uploadObj.showUploadTag = false;
    self.uploadObj.uploadProgress = 0;
    self.fileSettings = {
      headers: true
    };
  }

  parseFile() {
    const self = this;
    self.form = null;
    self.parseObj.showParseSpinner = true;
    self.parseObj.showParseTag = true;
    self.parseObj.parseError = false;
    if (!self.fileData.sheets) {
      self.fileSettings.sheet = 'Sheet1';
    }
    if (!self.fileSettings.sheet) {
      self.ts.error('Please select the sheet');
      self.parseObj.showParseSpinner = false;
      self.parseObj.showParseTag = false;

      return;
    }
    self.fileSettings.type = self.fileData.type;
    self.fileSettings.fileName = self.fileData.fileName;
    self.fileSettings.fileId = self.fileData.fileId;
    self.fileSettings.dsKeys = self.dsKeys;
    self.showLazyLoader = true;

    self.subscriptions['selectSheet'] = self.commonService
      .put('api', self.api + '/utils/fileMapper/' + self.fileData.fileId, self.fileSettings)
      .subscribe(
        res => {
          self.activeStep++;
          self.mappingData = res;
          self.mappingData.fileId = res.fileId;
          self.mappingData.fileName = res.fileName;
          self.showLazyLoader = false;
          let defnitionArray = self.formService.parseDefinition(self.schema, null, null);
          if (self.tempAttrList.length) {
            defnitionArray = defnitionArray.filter(data => self.tempAttrList.includes(data.properties.dataPath));
          }
          self.form = self.fb.group(self.formService.createMappingForm(defnitionArray));
          const fuse = new Fuse(self.mappingData.headers.fileKeys, {
            isCaseSensitive: false,
            keys: ['name']
          });
          let mapObj = {};
          defnitionArray.forEach(element => {
            const temp = fuse.search(element.properties.name);
            if (temp && temp.length > 0) {
              mapObj[element.properties.dataKey] = temp[0].item['name'];
            }
          });
          self.form.patchValue(mapObj);
        },
        err => {
          self.commonService.errorToast(err, 'unable to fetch file details, please try again later');
          self.showLazyLoader = false;
        }
      );
  }

  sendMapping() {
    const self = this;
    self.mappingData.headerMapping = self.form.value;
    this.appService.fixMappingPayload(self.mappingData.headerMapping);
    self.showLazyLoader = true;
    const url = self.api + '/utils/fileMapper/' + self.mappingData.fileId + '/mapping?timezone=' + new Date().getTimezoneOffset();
    self.subscriptions['fileMapperMapping'] = self.commonService.put('api', url, self.mappingData).subscribe(
      res => {
        self.sentForValidation = true;
        self.showLazyLoader = false;
        self.activeStep = 4;
      },
      err => {
        self.commonService.errorToast(err, 'Unable to map the columns, please try again later.');
        self.showLazyLoader = false;
      }
    );
  }
  getForm(event) {
    const self = this;
    self.form = event;
  }

  createRecords() {
    const self = this;
    self.showImportLoader = true;
    self.uploading = 100;
    self.progress();
    self.createObj.fileId = self.mappingData.fileId;
    self.createObj.fileName = self.mappingData.fileName;
    self.subscriptions['createRecords'] = self.commonService
      .post('api', self.api + '/utils/fileMapper/' + self.mappingData.fileId + '/create', self.createObj)
      .subscribe(
        res => {
          self.showImportLoader = false;
          self.activeStep = 5;
          if (res._workflow && res._workflow.failed) {
            self.ts.warning('File upload failed for ' + res._workflow.failed + ' records');
          }
        },
        err => {
          self.commonService.errorToast(err, 'unable to create records pleasetry again later');
          self.showImportLoader = false;
          clearInterval(self.prgressInVal);
          self.router.navigate(['/', this.commonService.app._id, 'services', self.schema._id, 'list']);
        }
      );
  }

  progress() {
    const self = this;
    self.prgressInVal = setInterval(() => {
      if (self.uploading < 2) {
        clearInterval(self.prgressInVal);
      } else if (self.uploading < 10) {
        self.uploading -= 0.5;
      } else if (self.uploading < 25) {
        self.uploading -= 1;
      } else {
        self.uploading -= 2;
      }
    }, 500);
  }

  nextStep() {
    const self = this;
    if (self.activeStep === 1) {
      self.parseFile();
    } else if (self.activeStep === 2) {
      self.sendMapping();
    }
    else if (self.activeStep === 3) {
      self.createRecords();
    }
  }

  previousStep() {
    const self = this;
    self.activeStep--;
    self.appService.hasBulkInvalidRecords.emit(false);
    if (this.activeStep == 2) {
      const defnitionArray = self.formService.parseDefinition(self.schema, self.mappingData.headerMapping, null);

      if (!self.form) {
        self.form = self.fb.group(self.formService.createMappingForm(defnitionArray));
        self.form.patchValue(self.mappingData.headerMapping);
      }
    }
  }

  updateChange(event) {
    const self = this;
    self.createObj.update = event;
  }

  createChange(event) {
    const self = this;
    self.createObj.create = event;
  }

  getCreateData(event) {
    const self = this;
    self.createObj = event;
    self.createObj.fileId = self.mappingData.fileId;
  }
  ngOnDestroy() {
    const self = this;
    self.appService.hasBulkInvalidRecords.emit(true);
  }

  cancel() {
    const self = this;
    self.router.navigate(['/', this.commonService.app._id, 'services', self.appService.serviceId, 'list']);
  }
  dragEvent(event, data) {
    const self = this;
    self.appService.draggedItem = data;
  }
  updateSchema(parsedDef) {
    parsedDef.forEach(def => {
      if (def.properties && def.properties.relatedTo) {
        def.type = 'Relation';
        def.properties._typeChanged = 'Relation';
        delete def.definition;
      } else if (def.properties && def.properties.geoType) {
        def.type = 'Geojson';
        def.properties._typeChanged = 'Geojson';
        delete def.definition;
      } else if (def.type === 'Array') {
        this.updateSchema(def.definition);
      } else if (def.type === 'Object') {
        this.updateSchema(def.definition);
      }
    });
  }
  get progressWidth() {
    const self = this;
    return {
      minWidth: 500 * (self.uploading / 100) + 'px'
    };
  }

  get resolveOpen() {
    const self = this;
    if (Object.values(self.appService.fileMapperComponnets).length > 0) {
      return true;
    }
    return false;
  }

  get app() {
    return this.commonService.app._id;
  }
}
