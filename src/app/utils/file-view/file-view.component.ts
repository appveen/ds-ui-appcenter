import { Component, OnInit, OnDestroy, ViewChild, Input, TemplateRef } from '@angular/core';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from 'src/environments/environment';
import { CommonService } from 'src/app/service/common.service';
import { DomSanitizer } from '@angular/platform-browser';
import { AppService } from 'src/app/service/app.service';
import { SecureFileService } from '../../dashboard/services/list/secure-file.service'

@Component({
  selector: 'odp-file-view',
  templateUrl: './file-view.component.html',
  styleUrls: ['./file-view.component.scss']
})
export class FileViewComponent implements OnInit, OnDestroy {

  @ViewChild('previewModal', { static: true }) previewModal: TemplateRef<HTMLElement>;
  @Input() file: any;
  @Input() definition: any;
  @Input() value: any;
  previewModalRef: NgbModalRef;
  imgPreviewUrl: any;
  pdfPreviewUrl: any;
  data: any;
  contentType: string;
  filename: string;
  fileId: string;
  isIMG: boolean;
  isPDF: boolean;
  isSecure: boolean;
  constructor(private commonService: CommonService,
    private sanitizer: DomSanitizer,
    private modalService: NgbModal,
    private secureFileService: SecureFileService,
    private appService: AppService) { }

  ngOnInit() {
    const self = this;
    if (self.definition && self.definition.value) {
      self.contentType = self.definition.value.contentType;
    } else if (self.value && self.value.contentType) {
      self.contentType = self.value.contentType;
    } else {
      self.contentType = null;
    }
    if (self.value && self.value.metadata) {
      self.filename = self.value.metadata.filename;
    } else if (self.definition && self.definition.value) {
      self.filename = self.definition.value.metadata.filename;
    } else {
      self.filename = null;
    }
    if (self.definition && self.definition.value) {
      self.fileId = self.definition.value.filename;
    } else if (self.value && self.value.filename) {
      self.fileId = self.value.filename;
    } else {
      self.fileId = null;
    }
    if (self.contentType && self.contentType.startsWith('image')) {
      self.isIMG = true;
    }
    if (self.contentType && self.contentType === 'application/pdf') {
      self.isPDF = true;
    }

    if (self.definition && self.definition.properties.password) {
      self.isSecure = true;
    }
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
      window.open(environment.url.api + self.appService.serviceAPI + '/utils/file/download/' + self.fileId);
    }
  }

  downloadSecureFile(ev: Event) {
    const self = this;
    self.previewModalRef.close(false);
    self.secureFileService.changeFileId(self.fileId);
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
      self.previewModalRef = self.modalService.open(self.previewModal, {
        centered: true,
        windowClass: 'preview-window'
      });
      self.previewModalRef.result.then(close => {
      }, dismiss => { });
    }
  }

}
