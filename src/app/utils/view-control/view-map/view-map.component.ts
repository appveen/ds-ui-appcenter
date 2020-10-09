import { Component, OnInit, Input, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { AppService } from 'src/app/service/app.service';

declare let google;

@Component({
  selector: 'odp-view-map',
  templateUrl: './view-map.component.html',
  styleUrls: ['./view-map.component.scss']
})
export class ViewMapComponent implements OnInit, AfterViewInit {

  @Input() definition: any;
  @Input() value: any;
  @Input() oldValue: any;
  @Input() newValue: any;
  @Input() workflowDoc:any;

  @ViewChild('mapEle', { static: false }) mapEle: ElementRef;
  map: any;
  noAPIKey: boolean;
  constructor(private appService: AppService) { }

  ngOnInit() {
  }

  ngAfterViewInit() {
    const self = this;
    if (!('google' in window)) {
      self.noAPIKey = true;
      return;
    }
    if (self.definition.value) {
      const conf = {
        zoom: 13,
        center: { lat: self.latitude, lng: self.longitude },
        streetViewControl: false,
        disableDefaultUI: true,
      };
      self.map = new google.maps.Map(self.mapEle.nativeElement, conf);
      const marker = new google.maps.Marker({
        draggable: false,
        animation: google.maps.Animation.DROP,
        position: self.map.getCenter(),
        map: self.map
      });
    }
  }

  get userInput() {
    const self = this;
    if (self.definition.value && self.definition.value.userInput) {
      return self.definition.value.userInput;
    }
    return null;
  }

  get formattedAddress() {
    const self = this;
    if (self.definition.value && self.definition.value.formattedAddress) {
      return self.definition.value.formattedAddress;
    }
    return null;
  }

  get town() {
    const self = this;
    if (self.definition.value && self.definition.value.town) {
      return self.definition.value.town;
    }
    return null;
  }

  get district() {
    const self = this;
    if (self.definition.value && self.definition.value.district) {
      return self.definition.value.district;
    }
    return null;
  }

  get state() {
    const self = this;
    if (self.definition.value && self.definition.value.state) {
      return self.definition.value.state;
    }
    return null;
  }

  get country() {
    const self = this;
    if (self.definition.value && self.definition.value.country) {
      return self.definition.value.country;
    }
    return null;
  }

  get pincode() {
    const self = this;
    if (self.definition.value && self.definition.value.pincode) {
      return self.definition.value.pincode;
    }
    return null;
  }

  get latitude() {
    const self = this;
    if (self.definition.value && self.definition.value.geometry && self.definition.value.geometry.coordinates) {
      return self.definition.value.geometry.coordinates[1];
    }
    return null;
  }

  get longitude() {
    const self = this;
    if (self.definition.value && self.definition.value.geometry && self.definition.value.geometry.coordinates) {
      return self.definition.value.geometry.coordinates[0];
    }
    return null;
  }

  getOldVal(key) {
    const self = this;
    return self.appService.getValue(self.definition.path + '.' + key, self.oldValue);
  }
  getNewVal(key) {
    const self = this;
    return self.appService.getValue(self.definition.path + '.' + key, self.newValue);
  }
}
