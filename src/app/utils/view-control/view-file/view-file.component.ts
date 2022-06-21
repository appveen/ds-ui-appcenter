import { Component, OnInit, Input, ViewChild, TemplateRef, OnDestroy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from 'src/environments/environment';
import { AppService } from 'src/app/service/app.service';
import { CommonService } from 'src/app/service/common.service';

@Component({
  selector: 'odp-view-file',
  templateUrl: './view-file.component.html',
  styleUrls: ['./view-file.component.scss']
})
export class ViewFileComponent implements OnInit, OnDestroy {

  @ViewChild('previewModal', { static: true }) previewModal: TemplateRef<HTMLElement>;
  @Input() definition: any;
  @Input() value: any;
  @Input() oldValue: any;
  @Input() newValue: any;
  @Input() workflowDoc: any;
  previewModalRef: NgbModalRef;
  imgPreviewUrl: any;
  pdfPreviewUrl: any;
  data: any;
  showDownloadWindow: boolean;
  encryptionKey: string;

  constructor(private appService: AppService,
    private commonService: CommonService,
    private sanitizer: DomSanitizer,
    private modalService: NgbModal) { }

  ngOnInit() {
    const self = this;
  }

  ngOnDestroy() {
    const self = this;
    if (self.previewModalRef) {
      self.previewModalRef.close(false);
    }
  }

  downloadFile(ev: Event) {
    const self = this;
    if (ev) {
      ev.preventDefault();
    }
    if (self.value) {
      let downloadUrl = environment.url.api + self.appService.serviceAPI + '/utils/file/download/' + self.fileId;
      if (this.encryptionKey) {
        downloadUrl += '?encryptionKey=' + this.encryptionKey;
      }
      window.open(downloadUrl);
      // self.commonService.downloadFile(downloadUrl, this.encryptionKey).subscribe((data: any) => {
      //   const blob = new Blob([data]);
      //   const url = window.URL.createObjectURL(blob);
      //   window.open(url);
      // }, err => {
      //   this.commonService.errorToast(err, 'Unable to download the file')
      // });
    }
  }

  previewFile(ev: Event) {
    const self = this;
    if (ev) {
      ev.preventDefault();
    }
    if (self.value) {
      const tempUrl = environment.url.api + self.appService.serviceAPI + '/utils/file/' + self.fileId + '/view';
      self.pdfPreviewUrl = self.sanitizer.bypassSecurityTrustResourceUrl(tempUrl);
      self.imgPreviewUrl = environment.url.api + self.appService.serviceAPI + '/utils/file/download/' + self.fileId;
      self.commonService.isFilePreviewModalOpen = true;
      self.previewModalRef = self.modalService.open(self.previewModal, {
        centered: true,
        windowClass: 'preview-window'
      });
      self.previewModalRef.result.then(
        close => {
          self.commonService.isFilePreviewModalOpen = false;
        },
        dismiss => {
          self.commonService.isFilePreviewModalOpen = false;
        }
      );
    }
  }

  get isCreated() {
    const self = this;
    let retValue = false;
    if (self.newVal && !self.oldVal) {
      retValue = true;
    }
    return retValue;
  }

  get isUpdated() {
    const self = this;
    let retValue = false;
    if (self.newVal && self.oldVal && self.newVal !== self.oldVal) {
      retValue = true;
    } else if (!self.newVal && self.oldVal) {
      retValue = true;
    }
    return retValue;
  }
  get oldVal() {
    const self = this;
    return self.appService.getValue(self.definition.path, self.oldValue);
  }
  get newVal() {
    const self = this;
    return self.appService.getValue(self.definition.path, self.newValue);
  }

  get contentType(): string {
    const self = this;
    if (self.definition && self.definition.value) {
      return self.definition.value.contentType;
    } else if (self.value && self.value.contentType) {
      return self.value.contentType;
    } else {
      return null;
    }
  }

  get filename(): string {
    const self = this;
    if (self.definition && self.definition.value) {
      return self.definition.value.metadata.filename;
    } else if (self.value && self.value.metadata) {
      return self.value.metadata.filename;
    } else {
      return null;
    }
  }

  get fileId(): string {
    const self = this;
    if (self.definition && self.definition.value) {
      return self.definition.value.filename;
    } else if (self.value && self.value.filename) {
      return self.value.filename;
    } else {
      return null;
    }
  }

  get isIMG(): boolean {
    const self = this;
    if (self.contentType && self.contentType.startsWith('image')) {
      return true;
    }
    return false;
  }

  get isPDF(): boolean {
    const self = this;
    if (self.contentType && self.contentType === 'application/pdf') {
      return true;
    }
    return false;
  }

  closeWindow() {
    this.showDownloadWindow = false;
    this.encryptionKey = null;
  }
}
