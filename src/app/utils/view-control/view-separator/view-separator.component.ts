import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'odp-view-separator',
  templateUrl: './view-separator.component.html',
  styleUrls: ['./view-separator.component.scss']
})
export class ViewSeparatorComponent implements OnInit {

  @Input() definition: any;
  @Input() value: any;
  @Input() oldValue: any;
  @Input() newValue: any;
  @Input() workflowDoc: any;

  constructor() { }

  ngOnInit() {
  }

  get controlType() {
    const self = this;
    if (self.definition.properties.relatedTo) {
      return 'relation';
    } else if (self.definition.properties.richText) {
      return 'richText';
    } else if (self.definition.properties.longText) {
      return 'longText';
    } else if (self.definition.properties.password && self.definition.type !== 'File') {
      return 'secureText';
    } else if (self.definition.type === 'Date') {
      return 'date';
    } else if (self.definition.type === 'File') {
      return 'file';
    } else if (self.definition.type === 'Boolean') {
      return 'boolean';
    } else if (self.definition.type === 'Number') {
      return 'number';
    } else if (self.definition.type === 'Geojson') {
      return 'map';
    } else if (self.definition.type === 'User') {
      return 'user';
    } else {
      return 'text';
    }
  }
}
