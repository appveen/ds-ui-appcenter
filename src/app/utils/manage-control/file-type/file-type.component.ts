import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { CommonService } from 'src/app/service/common.service';
import { AppService } from 'src/app/service/app.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'odp-file-type',
  templateUrl: './file-type.component.html',
  styleUrls: ['./file-type.component.scss']
})
export class FileTypeComponent implements OnInit, OnDestroy {

  @Input() control: FormControl;
  @Input() definition: any;
  @Input() first: boolean;
  @Input() arrayDefinition: any;
  showLazyLoader: boolean;
  selectedFileName: string;
  progress: number;
  subscriptions: any;
  constructor(private commonService: CommonService,
    private appService: AppService,
  ) {
    const self = this;
    self.subscriptions = {};
    self.showLazyLoader = false;
  }

  ngOnInit() {
    const self = this;
    if (self.control.value) {
      self.selectedFileName = self.control.value.metadata.filename;
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

  uploadFile(event) {
    event.preventDefault();
    const self = this;
    self.selectedFileName = event.target.files[0].name;
    self.progress = 0;
    const data: FormData = new FormData();
    data.append('file', event.target.files[0]);
    self.subscriptions['uploadFile'] = self.commonService.upload('api', self.appService.serviceAPI, data, false).subscribe(httpEvent => {
      self.showLazyLoader = true;
      if (httpEvent.type === HttpEventType.UploadProgress) {
        self.progress = Math.floor(httpEvent.loaded / httpEvent.total * 100);
      }
      if (httpEvent.type === HttpEventType.Response) {
        self.showLazyLoader = false;
        self.control.patchValue(httpEvent.body);
        self.control.markAsTouched();
        self.control.markAsDirty();
      }
    }, err => {
      self.selectedFileName = null;
      self.control.patchValue(null);
      self.commonService.errorToast(err, 'Unable to upload file');
      self.showLazyLoader = false;
    });
  }

  removeFile() {
    const self = this;
    self.selectedFileName = null;
    self.control.markAsDirty();
    self.control.patchValue(null);
  }

  get requiredError() {
    const self = this;
    return self.control.hasError('required') && self.control.touched;
  }

  get fileId(): string {
    const self = this;
    if (self.control.value && self.control.value.filename) {
      return self.control.value.filename;
    } else {
      return null;
    }
  }
  downloadFile(ev: Event) {
    const self = this;
    if (ev) {
      ev.preventDefault();
    }
    if (self.control.value) {
      window.open(environment.url.api + self.appService.serviceAPI + '/file/download/' + self.fileId);
    }
  }
}
