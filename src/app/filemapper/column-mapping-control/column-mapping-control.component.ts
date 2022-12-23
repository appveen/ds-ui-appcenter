import { Component, OnInit, Input, ElementRef, Output, EventEmitter } from '@angular/core';
import { UntypedFormArray, UntypedFormControl, UntypedFormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { AppService } from 'src/app/service/app.service';
import { FormService } from 'src/app/service/form.service';

@Component({
  selector: 'odp-column-mapping-control',
  templateUrl: './column-mapping-control.component.html',
  styleUrls: ['./column-mapping-control.component.scss']
})
export class ColumnMappingControlComponent implements OnInit {

  @Input() definition: any;
  @Input() mappingData: any;
  @Output() emitData: EventEmitter<any>;
  @Input() form: any;
  @Input() schemaName: string;
  showObjectMapping: boolean;
  showInput: boolean;
  model;
  tempArray: Array<any>;
  tempIndex: number;
  indexValue;
  constructor(private elem: ElementRef,
    private appservice: AppService,
    private formService: FormService,
    private fb: UntypedFormBuilder,) {
    const self = this;
    self.showInput = false;
    self.emitData = new EventEmitter();
    self.tempArray = [];
  }

  ngOnInit() {
    const self = this;
    if (self.definition.type === 'Array') {
      self.form.value.forEach((element, index) => {
        self.tempArray[index] = this.mappingData.headers.fileKeys.find(e => e.name === element);
      });
    }
    else if (self.definition.type === 'Relation' || self.definition.type === 'User') {
      self.model = this.mappingData.headers.fileKeys.find(e => e.name === self.form.value);
      if (!self.model && self.form.value && self.form.value._id) {
        self.model = this.mappingData.headers.fileKeys.find(e => e.name === self.form.value._id);
      }
      self.setRelValue(self.model);
    }
    else if (self.definition && this.definition.properties && self.definition.properties.password) {
      self.model = this.mappingData.headers.fileKeys.find(e => e.name === self.form.value);
      if (!self.model && self.form.value && self.form.value.value) {
        self.model = this.mappingData.headers.fileKeys.find(e => e.name === self.form.value.value);
      }
      self.selSecureTextValue(self.model);
    }
    else {
      self.model = this.mappingData.headers.fileKeys.find(e => e.name === self.form.value);
    }
    self.onChanges();
  }
  loadColumnMapping() {
    const self = this;
    self.appservice.fileObjCount = self.appservice.fileObjCount + 1;
    self.appservice.objMappingData.emit(self.appservice.fileObjCount);
    self.showObjectMapping = true;
  }
  closeColumnMapping() {
    const self = this;
    self.showObjectMapping = false;
  }
  loadColumnMappingArray(index) {
    const self = this;
    self.tempIndex = index;
    self.showObjectMapping = false;

  }
  show() {
    const self = this;
    self.showInput = true;

  }
  search = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length < 1 ? []
        : this.mappingData.headers.fileKeys.filter(e => e.name)
          .filter(v => v.name.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
    )

  resultFrmatter = (result) => result.name;
  inputFormatter = (result) => result.name;

  selectData(event) {
    const self = this;
    self.form.patchValue(event.item.name);
    self.form.markAsDirty();
    self.indexValue = event.item.position;
  }
  clearMapping() {
    const self = this;
    self.model = null;
    if (self.definition.properties.relatedTo || self.definition.type === 'User') {
      self.form.patchValue({ _id: null });
    }
    else if (self.definition.type === 'Object') {
      self.form.patchValue({ value: null });
    }
    else {
      self.form.patchValue(null);
    }
  }

  clearMappingArray(index) {
    const self = this;
    self.tempArray[index] = null;
    if (self.definition.definition['0'].properties.relatedTo || self.definition.definition['0'].type !== 'User') {
      (self.form as UntypedFormArray).controls[index].patchValue({ _id: null });
    } else if (self.definition.definition['0'].type === 'Object') {
      (self.form as UntypedFormArray).controls[index].patchValue({ value: null });
    } else {
      (self.form as UntypedFormArray).controls[index].patchValue(null);
    }
  }


  setRelValue(data) {
    const self = this;
    if (data && data.name) {
      self.form.patchValue({ _id: data.name });
    }
  }
  selSecureTextValue(data) {
    const self = this;
    if (data && data.name) {
      if(self.definition.properties?.richText || self.definition.properties?.longText){
        self.form.patchValue(data.name);
      } else {
        self.form.patchValue({ value: data.name });
      } 
    }

  }
  selectDataRel(event) {
    const self = this;
    self.form.patchValue({ _id: event.item.name });
  }

  selectSecureTextData(event) {
    const self = this;
    self.form.patchValue({ value: event.item.name });
  }

  selectGeojsonData(event) {
    const self = this;
    self.form.patchValue({ userInput: event.item.name });
  }

  selectArrayData(event, index) {
    const self = this;
    (self.form as UntypedFormArray).controls[index].patchValue(event.item.name);
  }
  selectArrayDataRel(event, index) {
    const self = this;
    (self.form as UntypedFormArray).controls[index].patchValue({ _id: event.item.name });
  }
  selectArraySTData(event, index) {
    const self = this;
    (self.form as UntypedFormArray).controls[index].patchValue({ value: event.item.name });
  }

  addControl() {
    const self = this;
    if (self.definition.definition[0].type === 'Object') {
      const form = self.fb.group(self.formService.createMappingForm(self.definition.definition[0].definition));
      (self.form as UntypedFormArray).push(form);
    } else {
      (self.form as UntypedFormArray).push(new UntypedFormControl());

    }
    self.tempArray.push();
  }
  removeControl(index) {
    const self = this;
    (self.form as UntypedFormArray).removeAt(index);
    self.tempArray.splice(index, 1);
  }
  onChanges(): void {
    const self = this;
    self.form.valueChanges.subscribe(val => {
      if (val && typeof (val) === 'object' && val._id === null) {
        self.model = null;
      }
      if (val && typeof (val) === 'object' && val.value === null) {
        self.model = null;
      }

      if (Array.isArray(val) && val.every(e => e === null)) {
        self.tempArray = self.tempArray.map(e => e = null);
      }
      if (Array.isArray(val) && val.every(e => (e && e.value === null))) {
        self.tempArray = self.tempArray.map(e => e = null);
      }
      if (Array.isArray(val) && val.every(e => (e && e._id === null))) {
        self.tempArray = self.tempArray.map(e => e = null);
      }
      if (val === null) {
        self.model = null;
      }
      self.emitData.emit();
    });
  }
  dragEnterEvent(event) {
    event.target.classList.add('over');

  }

  dropEvent(event, index?) {
    const self = this;
    if (self.appservice.draggedItem && self.appservice.draggedItem.name) {
      if (index === undefined) {
        self.indexValue = self.appservice.draggedItem.position;
        self.model = this.mappingData.headers.fileKeys.find(e => e.name === self.appservice.draggedItem.name);
        if (self.definition.properties.relatedTo || self.definition.type === 'User') {
          self.form.patchValue({ _id: self.appservice.draggedItem.name });
        } else if (self.definition.properties.password && !(self.definition.properties?.richText || self.definition.properties?.longText)) {
          self.form.patchValue({ value: self.appservice.draggedItem.name });
        } else if (self.definition.type === 'Geojson') {
          self.form.patchValue({ userInput: self.appservice.draggedItem.name });
        } else {
          self.form.patchValue(self.appservice.draggedItem.name);
        }
        self.form.markAsDirty();
      } else {
        self.tempArray[index] = this.mappingData.headers.fileKeys.find(e => e.name === self.appservice.draggedItem.name);
        if (self.definition.definition['0'].properties.relatedTo || self.definition.definition['0'].type === 'User') {
          (self.form as UntypedFormArray).controls[index].patchValue({ _id: self.appservice.draggedItem.name });
        } else if (self.definition.definition['0'].properties.password && !(self.definition.definition['0'].properties?.richText || self.definition.definition['0'].properties?.longText)) {
          (self.form as UntypedFormArray).controls[index].patchValue({ value: self.appservice.draggedItem.name });
        } else {
          (self.form as UntypedFormArray).controls[index].patchValue(self.appservice.draggedItem.name);
        }

      }
    }
    event.target.classList.remove('over');

  }
  dragOverEvent(event) {
    event.preventDefault();
  }
  dragLeaveEvent(event) {
    event.target.classList.remove('over');
  }
}
