import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormService } from 'src/app/service/form.service';
import { FormGroup, FormBuilder } from '@angular/forms';
import { AppService } from 'src/app/service/app.service';

@Component({
  selector: 'odp-column-mapping',
  templateUrl: './column-mapping.component.html',
  styleUrls: ['./column-mapping.component.scss']
})
export class ColumnMappingComponent implements OnInit {

  @Input() definition: any;
  @Input() mappingData: any;
  @Input() defnitionArray: Array<any>;
  @Output() emitData: EventEmitter<any>;
  @Output() emitDataToParent: EventEmitter<any>;
  @Input() form: FormGroup;
  @Input() parentDef: any;
  @Input() schemaName: string;
  @Input() tempAttrList: any;
  constructor(
    private formService: FormService,
    private fb: FormBuilder,
    private appService: AppService

  ) {
    const self = this;
    self.emitData = new EventEmitter();
    self.emitDataToParent = new EventEmitter();
  }

  ngOnInit() {
    const self = this;
    if (self.definition) {
      this.definition.definition = this.formService.patchType(this.definition.definition);
      self.defnitionArray = self.formService.parseDefinition(self.definition, null, null);
      if (self.tempAttrList.length) {
        self.defnitionArray = self.defnitionArray.filter(data => self.tempAttrList.includes(data.properties.dataPath));
      }
      if (!self.form) {
        self.form = self.fb.group(self.formService.createMappingForm(self.defnitionArray));
      }
      self.sendForm();
    }
  }
  clearAll() {
    const self = this;
    self.form.reset();
  }
  goToPreviousStep() {
    const self = this;
    self.appService.fileObjCount = self.appService.fileObjCount - 1;
    self.appService.objMappingData.emit(self.appService.fileObjCount);
    self.emitData.emit();
  }
  back() {
    const self = this;
    self.form.reset();

  }
  sendForm() {
    const self = this;
    self.emitDataToParent.emit(self.form);
  }
  get name() {
    const self = this;
    return self.defnitionArray[0].path.split('.')[0];
  }

}
