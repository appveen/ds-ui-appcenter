import { Component, OnInit, AfterContentInit, AfterContentChecked, Input, ViewChild, ElementRef } from '@angular/core';


@Component({
  selector: 'odp-progress',
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.scss']
})
export class ProgressComponent  implements OnInit, AfterContentInit, AfterContentChecked {

  @ViewChild('canvas', { static: false }) canvas: ElementRef;
  @Input('size') size;
  @Input('color') color;
  @Input('progress') progress;
  progressCircle: any;

  constructor() {
  }

  ngOnInit() {
    const self = this;
    if (!self.size) {
      self.size = 30;
    }
    if (!self.color) {
      self.color = '#333';
    }
    if (!self.progress) {
      self.progress = 0;
    }
  }

  ngAfterContentInit() {
    const self = this;
    self.canvas.nativeElement.width = self.size;
    self.canvas.nativeElement.height = self.size;
    self.progressCircle = self.canvas.nativeElement.getContext('2d');
    self.showProgress();
  }

  ngAfterContentChecked() {
    const self = this;
    self.showProgress();
  }

  showProgress() {
    const self = this;
    if (!self.progress) {
      self.progress = 1;
    }
    const endAngle = self.progress * 3.6 * (Math.PI / 180);
    self.progressCircle.clearRect(0, 0, self.size, self.size);
    self.progressCircle.beginPath();
    self.progressCircle.font = '8px arial';
    self.progressCircle.textAlign = 'center';
    self.progressCircle.fillStyle = self.color;
    // self.progressCircle.fillText(self.progress+'%',self.size/2,self.size/2+3);
    self.progressCircle.arc(self.size / 2, self.size / 2, self.size / 2 - 4, 0, endAngle, false);
    self.progressCircle.lineWidth = 3;
    self.progressCircle.strokeStyle = self.color;
    self.progressCircle.stroke();
  }
}
