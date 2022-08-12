import { Component, Input, ViewChild, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, AbstractControl } from '@angular/forms';

import { AppService } from 'src/app/service/app.service';
import { Definition } from 'src/app/interfaces/definition';
import { FormService } from 'src/app/service/form.service';
import { EditCollectionOfObjectsGridComponent } from '../../collection-of-objects/edit-collection-of-objects-grid/edit-collection-of-objects-grid.component';

@Component({
	selector: 'odp-array-control',
	templateUrl: './array-control.component.html',
	styleUrls: ['./array-control.component.scss']
})
export class ArrayControlComponent implements OnInit {
	@Input() form: FormArray;
	@Input() definition: any;
	@Input() arrayDefinition: any;
	@Input() markEnable: boolean;
	isEditable: boolean = false;
	@ViewChild('gridComponent', { static: false }) gridComponentRef: EditCollectionOfObjectsGridComponent;
	first: boolean;

	ngOnInit() {
		if (this.specificType === 'object') {
			this.isAllAttributesReadOnly(this.arrayDefinition.definition[0].definition);
		}
	}
	get specificType(): string {
		const self = this;
		if (self.definition.type === 'Object') {
			return 'object';
		} else if (self.definition.type === 'Relation') {
			return 'relation';
		} else if (self.definition.type === 'Geojson') {
			return 'map';
		} else {
			return 'text';
		}
	}

	get arrayControls() {
		const self = this;
		return self.form?.controls;
	}

	constructor(private fb: FormBuilder,
		private formService: FormService,
		private appService: AppService) {
	}

	getDefinitionWithValue(def: any, index: number) {
		const self = this;
		const temp = self.appService.cloneObject(def);
		temp.path = self.appService.compilePath(temp.path, [index]);
		temp.id = temp.path + index;
		return temp;
	}

	public addNew(index?: number, value?: any) {
		const self = this;
		self.formService.shouldFocus = true;
		let tempControl: AbstractControl;
		if (index === undefined) {
			index = self.form?.length;
		}

		tempControl = new FormControl(
			self.definition.properties.default !== null ? self.definition.properties.default : null,
			self.formService.createValidatorList(self.definition)
		);
		self.form?.insert(index, tempControl);
		self.first = true;
		self.form?.markAsDirty();

	}

	removeItem(index: number) {
		const self = this;
		self.form?.removeAt(index);
		self.form?.markAsDirty();
	}

	keyupEvent(event: KeyboardEvent, index: number) {
		const self = this;
		if (event.shiftKey && event.key === 'Enter') {
			self.addNew(index + 1);
		}
	}

	checkDescription(_def) {
		const self = this;
		if (_def.properties.hasOwnProperty('_description') && _def.properties._description !== null) {
			return true;
		}
	}

	getLabelWidth(def: Definition) {
		let width = '365px';
		let maxWidth = '380px'

		if (def.type === 'Geojson') {
			width = '656px';
			maxWidth = '656px'
		} else if (def.type === 'String' && (def.properties.longText || def.properties.richText)) {
			width = '656px';
			maxWidth = '656px'
		} else if (def.type === 'Boolean') {
			width = '40px';
			maxWidth = 'fit-content';
		} else if (def.type === 'Date') {
			width = '175px';
			maxWidth = 'fit-content';
		}

		return {
			minWidth: width,
			maxWidth: maxWidth
		};
	}



	isAllAttributesReadOnly(definition) {
		definition.forEach(element => {
			if (element.type != 'Object') {
				if (!element.properties.readonly) {
					this.isEditable = true;
				}
			} else {
				this.isAllAttributesReadOnly(element.definition)
			}
		});
	}

	modifyForm(event) {
		this.form.clear()
		if (event.length > 0) {
			// this.form.setValue(event)
			this.form.patchValue(event)
		}
		console.log(event);
	}
}
