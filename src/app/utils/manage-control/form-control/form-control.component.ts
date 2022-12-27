import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  EventEmitter,
  Output,
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';

@Component({
  selector: 'odp-form-control',
  templateUrl: './form-control.component.html',
  styleUrls: ['./form-control.component.scss']
})
export class FormControlComponent implements OnInit, OnDestroy {

  @Input() control: UntypedFormControl;
  @Input() definition: any;
  @Input() first: boolean;
  @Input() arrayDefinition: any;
  @Input() markEnable: boolean;
  @Output('keyupEvent') keyupEvent: EventEmitter<KeyboardEvent>;

  constructor() {
    const self = this;
    self.keyupEvent = new EventEmitter<KeyboardEvent>();
  }

  ngOnInit() {
    const self = this;
  }

  ngOnDestroy() {
    const self = this;
  }

  onKeyup(event: KeyboardEvent) {
    const self = this;
    self.keyupEvent.emit(event);
  }

  get controlType() {
    const self = this;
    if (!!self.definition) {
      if (self.definition.properties.relatedTo) {
        return 'relation';
      } else if (self.definition.properties.richText) {
        return 'richText';
      } else if (self.definition.properties.longText) {
        return 'longText';
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
    return '';
  }
}
