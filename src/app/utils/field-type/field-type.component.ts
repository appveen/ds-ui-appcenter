import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'odp-field-type',
  templateUrl: './field-type.component.html',
  styleUrls: ['./field-type.component.scss']
})
export class FieldTypeComponent implements OnInit {

  @Input() definition;
  iconTypeMap: any;
  iconClass: string;
  unique: boolean;
  createOnly: boolean;
  constructor() {
    const self = this;
    self.definition = {};
    self.iconTypeMap = {
      Identifier: 'dsi-id',
      String: 'dsi-text',
      Number: 'dsi-number',
      Boolean: 'dsi-boolean',
      Date: 'dsi-date',
      Object: 'dsi-object',
      Array: 'dsi-array',
      Geojson: 'dsi-location',
      File: 'dsi-file-text',
      Relation: 'dsi-relation',
      User: 'dsi-user',
    };
  }

  ngOnInit(): void {
    const self = this;
    let type = self.definition.type;
    if (!self.definition.type) {
      self.definition.type = 'String';
    }
    if (self.definition.properties && self.definition.properties.unique) {
      self.unique = true;
    }
    if (self.definition.properties && self.definition.properties.createOnly) {
      self.createOnly = true;
    }
    if (self.definition.properties.password && self.definition.type != 'File') {
      type = 'String';
    }
    if (self.definition.properties.relatedTo) {
      type = 'String';
    }
    if (self.definition.properties.schema) {
      type = 'String';
    }
    self.iconClass = self.iconTypeMap[type];
  }

}
