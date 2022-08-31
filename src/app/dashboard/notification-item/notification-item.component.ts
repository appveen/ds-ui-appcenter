import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import * as moment from 'moment';

@Component({
  selector: 'odp-notification-item',
  templateUrl: './notification-item.component.html',
  styleUrls: ['./notification-item.component.scss'],
})
export class NotificationItemComponent implements OnInit {
  @Input() item: any;
  @Input() isLast: boolean;
  @Output() clear = new EventEmitter();
  @Output() download = new EventEmitter();
  @Output() navigateToSheetSelect = new EventEmitter();
  @Output() navigateToFileMapper = new EventEmitter();
  @Output() markAsRead = new EventEmitter();
  canClearNotification: boolean;
  isHover: boolean;
  isClearHover: boolean;
  iconBg: any;
  iconGlyph: any;
  iconHoverGlyph: any;
  staticMsg: string;
  hoverMsg: string;

  constructor() {}

  ngOnInit(): void {
    this.canClearNotification =
      !this.item._delete &&
      ['Completed', 'Created', 'Validated', 'Error'].includes(this.item.status);
    this.iconBg = {
      'bg-success': this.isSuccess(),
      'bg-primary': this.isIntermediate(),
      'bg-warning': this.isPartialSuccess(),
      'bg-danger': this.isError(),
    };
    this.iconGlyph = {
      'dsi-check': this.isSuccess() || this.isPartialSuccess(),
      'dsi-close': this.isError(),
      'dsi-cloud': this.isIntermediate() && !this.isError(),
      'dsi-clock': this.isPending(),
    };
    this.iconHoverGlyph = {
      'dsi-download': this.isDownloadable(),
      'dsi-search': this.isReviewable(),
      'dsi-view': !this.isDownloadable() && !this.isReviewable(),
    };

    if (this.item.type === 'import') {
      if (['Completed', 'Created'].includes(this.item.status)) {
        this.staticMsg = `${this.item.fileName} was imported successfully.`;
        this.hoverMsg = 'Click to mark as read.';
      } else if (this.item.status === 'Validating') {
        this.staticMsg = `${this.item.fileName} is currently being validated.`;
        this.hoverMsg = 'Click to mark as read.';
      } else if (this.item.status === 'Importing') {
        this.staticMsg = `${this.item.fileName} is currently being imported.`;
        this.hoverMsg = 'Click to mark as read.';
      } else if (this.isIntermediate() && !this.isError()) {
        this.staticMsg = `${this.item.fileName} is validated and is now ready to be reviewed for import.`;
        this.hoverMsg = 'Click on Review to continue Import process.';
      } else if (this.item.status === 'Uploaded') {
        this.staticMsg = 'Uploaded!';
        this.hoverMsg = 'Click on Review to continue Import process.';
      } else if (this.item.status === 'Error') {
        this.staticMsg = `${this.item.fileName} cannot be processed as all the records are invalid.`;
        this.hoverMsg = 'Click on Review to review Import process.';
      } else {
        this.staticMsg = '';
        this.hoverMsg = 'Click to mark as read.';
      }
    } else if (this.item.type === 'export') {
      if (this.item.status === 'Completed') {
        this.staticMsg = `Exported ${this.item.validCount} records.`;
        this.hoverMsg = 'Click to download file.';
      } else if (this.isPending) {
        this.staticMsg = `Exporting ${this.item.validCount} records.`;
        this.hoverMsg = 'Click to mark as read.';
      } else {
        this.staticMsg = '';
        this.hoverMsg = 'Click to mark as read.';
      }
    } else {
      this.staticMsg = '';
      this.hoverMsg = 'Click to mark as read.';
    }
  }

  isDownloadable() {
    return (
      !this.item._delete &&
      this.item.type === 'export' &&
      this.item.status === 'Completed'
    );
  }

  isReviewable() {
    return (
      !this.item._delete &&
      this.item.type === 'import' &&
      ['Validated', 'Error', 'Uploaded'].includes(this.item.status)
    );
  }

  isSuccess() {
    return (
      (this.item.status === 'Completed' || this.item.status === 'Created') &&
      !this.isPartialSuccess() &&
      !this.isError()
    );
  }

  isPartialSuccess() {
    return (
      (this.item.status === 'Completed' || this.item.status === 'Created') &&
      this.item.errorCount > 0 &&
      this.item.createdCount > 0
    );
  }

  isError() {
    return (
      this.item.status === 'Error' ||
      (this.item.conflicts === 0 &&
        this.item.duplicate === 0 &&
        this.item.valid === 0)
    );
  }

  isIntermediate() {
    return this.item.status === 'Validated' || this.item.status === 'Uploaded';
  }

  isPending() {
    return (
      this.item.status === 'Pending' ||
      this.item.status === 'Importing' ||
      this.item.status === 'Validating'
    );
  }

  getTimeInEnglish(timestamp) {
    return moment(timestamp).fromNow();
  }

  clearItem(event: Event) {
    event.stopPropagation();
    this.clear.emit(this.item);
  }

  takeAction(event: Event) {
    if (!this.item.isRead) {
      this.markAsRead.emit(this.item);
    }
    if (this.isDownloadable()) {
      this.download.emit(this.item);
    } else if (this.isReviewable()) {
      if (this.item.status === 'Uploaded') {
        this.navigateToSheetSelect.emit(this.item);
      } else {
        this.navigateToFileMapper.emit(this.item);
      }
    }
  }
}
