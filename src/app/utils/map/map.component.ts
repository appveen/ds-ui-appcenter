import { Component, AfterContentInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';


declare let google;

@Component({
  selector: 'odp-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterContentInit {

  @Input() control: UntypedFormControl;
  @Input() definition: any;
  @Input() first: boolean;
  @Input() edit: boolean;
  @Output() keyupEvent: EventEmitter<KeyboardEvent>;
  @ViewChild('map', { static: true }) mapEle: ElementRef;
  @ViewChild('placeMarkerBtn', { static: true }) placeMarkerBtn: ElementRef;
  @ViewChild('removeMarkerBtn', { static: true }) removeMarkerBtn: ElementRef;
  @ViewChild('searchInput', { static: true }) searchInput: ElementRef;
  currentLat: number;
  currentLong: number;
  map: any;
  markerPlaced: boolean;
  markers: Array<any>;
  noAPIKey: boolean;
  constructor() {
    const self = this;
    self.currentLat = 40.7150843;
    self.currentLong = -74.00215330000003;
    self.markerPlaced = false;
    self.markers = [];
    self.keyupEvent = new EventEmitter();
  }

  clearMarkers() {
    const self = this;
    self.markers.forEach(function (marker) {
      marker.setMap(null);
    });
    self.markers = [];
  }

  placeMarker(latLng?) {
    const self = this;
    const geocode = new google.maps.Geocoder();

    geocode.geocode({
      location: latLng ? latLng : self.map.getCenter()
    }, (results, status) => {
      if (results && results[0]) {
        const placeService = new google.maps.places.PlacesService(self.map);
        placeService.getDetails({
          placeId: results[0].place_id
        }, (place, status2) => {
          self.setPlaces({
            userInput: self.searchInput.nativeElement.value
              || self.control && self.control.value ? self.control.value.userInput : null, places: [place]
          });
          // self.locations.emit();
        });
      }
    });
    if (self.control && self.control.value) {
      self.searchInput.nativeElement.value = self.control.value.userInput;
    }
    self.markerPlaced = true;
    const marker = new google.maps.Marker({
      draggable: true,
      animation: google.maps.Animation.DROP,
      position: latLng ? latLng : self.map.getCenter(),
      map: self.map
    });
    marker.addListener('dragend', (e) => {
      self.map.panTo(e.latLng);
      self.placeMarker(e.latLng);
    });
    self.clearMarkers();
    self.markers.push(marker);
  }
  removeMarker() {
    const self = this;
    self.markerPlaced = false;
    self.searchInput.nativeElement.value = '';
    self.control.patchValue(null);
    self.clearMarkers();
  }

  ngAfterContentInit() {
    const self = this;
    if (!('google' in window) && google) {
      self.noAPIKey = true;
      return;
    }
    if (!self.control && !self.control.value && self.edit) {
      self.getCurrentLocation().then(center => {
        self.map.setCenter(center);
      });
    }
    const conf = {
      zoom: 11,
      center: { lat: 40.7150843, lng: -74.00215330000003 },
      streetViewControl: false,
      disableDefaultUI: true
    };

    if (self.control && self.control.value && self.control.value.geometry) {
      conf.center.lng = self.control.value.geometry.coordinates[0];
      conf.center.lat = self.control.value.geometry.coordinates[1];
      conf.zoom = 13;
    }
    self.map = new google.maps.Map(self.mapEle.nativeElement, conf);
    if (self.control.value && self.control.value.geometry) {
      self.placeMarker();
    }

    // Create the search box and link it to the UI element.
    if (self.edit && self.searchInput) {
      const searchBox = new google.maps.places.SearchBox(self.searchInput.nativeElement);
      self.map.controls[google.maps.ControlPosition.TOP_LEFT].push(self.searchInput.nativeElement);
      self.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(self.placeMarkerBtn.nativeElement);
      self.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(self.removeMarkerBtn.nativeElement);

      // Bias the SearchBox results towards current map's viewport.
      self.map.addListener('bounds_changed', () => {
        searchBox.setBounds(self.map.getBounds());
      });

      self.map.addListener('click', (event) => {
        searchBox.setBounds(self.map.getBounds());
        if (self.markerPlaced) {
          self.placeMarker(event.latLng);
        } else {
          self.clearMarkers();
        }
        self.map.panTo(event.latLng);
      });

      // Listen for the event fired when the user selects a prediction and retrieve
      // more details for that place.

      searchBox.addListener('places_changed', (e) => {
        const places = searchBox.getPlaces();
        self.setPlaces({ userInput: self.searchInput.nativeElement.value, places: places });
        if (places.length === 0) {
          return;
        }

        // Clear out the old markers.
        self.clearMarkers();

        // For each place, get the icon, name and location.
        const bounds = new google.maps.LatLngBounds();
        places.forEach((place) => {
          if (!place.geometry) {
            console.log('Returned place contains no geometry');
            return;
          }
          // Create a marker for each place.
          self.markers.push(new google.maps.Marker({
            map: self.map,
            icon: {
              url: 'https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2.png'
            },
            title: place.name,
            position: place.geometry.location
          }));

          if (place.geometry.viewport) {
            // Only geocodes have viewport.
            bounds.union(place.geometry.viewport);
          } else {
            bounds.extend(place.geometry.location);
          }
        });
        self.map.fitBounds(bounds);
      });
    }
  }

  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const center = { lat: 40.7150843, lng: -74.00215330000003 };
          center.lat = position.coords.latitude;
          center.lng = position.coords.longitude;
          resolve(center);
        }, reject);
      }
    });
  }

  setCurrentPosition(position) {
    const self = this;
    self.currentLat = position.coords.latitude;
    self.currentLong = position.coords.longitude;
  }

  setPlaces(_val) {
    const self = this;
    const temp: any = {
      userInput: _val.userInput,
    };
    const place = _val.places[0];
    if (!place || !place.address_components) {
      return;
    }
    const address = place.address_components;
    temp.formattedAddress = place.formatted_address;
    if (place.geometry && place.geometry.location) {
      temp.geometry = {
        type: 'Point',
        coordinates: [place.geometry.location.lng(), place.geometry.location.lat()]
      };
    }
    if (address && address.length >= 5) {
      let tempData = address.filter(e => e.types.indexOf('locality') > -1 || e.types.indexOf('sublocality') > -1);
      if (tempData && tempData.length > 0) {
        temp.town = (tempData[0]).long_name;
      }
      tempData = address.filter(e => e.types.indexOf('administrative_area_level_2') > -1);
      if (tempData && tempData.length > 0) {
        temp.district = (tempData[0]).long_name;
      }
      tempData = address.filter(e => e.types.indexOf('administrative_area_level_1') > -1);
      if (tempData && tempData.length > 0) {
        temp.state = (tempData[0]).long_name;
      }
      tempData = address.filter(e => e.types.indexOf('postal_code') > -1);
      if (tempData && tempData.length > 0) {
        temp.pincode = (tempData[0]).long_name;
      }
      tempData = address.filter(e => e.types.indexOf('country') > -1);
      if (tempData && tempData.length > 0) {
        temp.country = (tempData[0]).long_name;
      }
    }
    self.control.patchValue(temp);
    self.control.markAsDirty();
  }

  onKeyup(event: KeyboardEvent) {
    const self = this;
    self.keyupEvent.emit(event);
  }

  get requiredError() {
    const self = this;
    return self.control.hasError('required') && self.control.touched;
  }

}
