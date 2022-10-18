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
  selectedFile: any;
  selectedFileName: string;
  selectedFileSize: number;
  progress: number;
  subscriptions: any;
  showUploadWindow: boolean;
  showDownloadWindow: boolean = false;
  encryptionKey: string;
  constructor(private commonService: CommonService,
    private appService: AppService,
  ) {
    this.subscriptions = {};
    this.showLazyLoader = false;
  }

  ngOnInit() {
    if (this.control.value) {
      this.selectedFileName = this.control.value.metadata.filename;
    }
  }

  ngOnDestroy() {
    Object.keys(this.subscriptions).forEach(key => {
      if (this.subscriptions[key]) {
        this.subscriptions[key].unsubscribe();
      }
    });
  }

  uploadFile(event) {
    event.preventDefault();
    const data: FormData = new FormData();
    data.append('file', this.selectedFile);
    this.subscriptions['uploadFile'] = this.commonService.upload('api', this.appService.serviceAPI, data, false, this.encryptionKey).subscribe(httpEvent => {
      this.showLazyLoader = true;
      if (httpEvent.type === HttpEventType.UploadProgress) {
        this.progress = Math.floor(httpEvent.loaded / httpEvent.total * 100);
      }
      if (httpEvent.type === HttpEventType.Response) {
        this.showLazyLoader = false;
        this.control.patchValue(httpEvent.body);
        this.control.markAsTouched();
        this.control.markAsDirty();
        this.closeWindow();
      }
    }, err => {
      this.selectedFileName = null;
      this.control.patchValue(null);
      this.commonService.errorToast(err, 'Unable to upload file');
      this.showLazyLoader = false;
    });
  }

  selectFile(event) {
    event.preventDefault();
    const file = (event.target.files[0] as File)
    this.progress = 0;
    this.selectedFileName = file.name;
    this.selectedFile = file;
    this.selectedFileSize = file.size;
    event.target.value = ''
  }

  removeFile() {
    this.selectedFileName = null;
    this.control.markAsDirty();
    this.control.patchValue(null);
  }

  get requiredError() {
    return this.control.hasError('required') && this.control.touched;
  }

  get fileId(): string {
    if (this.control.value && this.control.value.filename) {
      return this.control.value.filename;
    } else {
      return null;
    }
  }

  get isInvalid() {
    if (!this.selectedFile || (this.definition.properties.password && !this.encryptionKey)) {
      return true;
    }
    return false;
  }

  downloadFile(ev: Event) {
    if (ev) {
      ev.preventDefault();
    }
    if (this.control.value) {
      let downloadUrl = environment.url.api + this.appService.serviceAPI + '/utils/file/download/' + this.fileId;
      if (this.encryptionKey) {
        downloadUrl += '?encryptionKey=' + this.encryptionKey;
      }
      window.open(downloadUrl);
      // if (this.definition.properties.password) {
      //   this.showDownloadWindow = true;
      // } else {
      //   window.open(environment.url.api + this.appService.serviceAPI + '/utils/file/download/' + this.fileId);
      // }
    }
  }


  closeWindow() {
    this.showUploadWindow = false;
    this.encryptionKey = null;
    this.showDownloadWindow = false;
  }
}
