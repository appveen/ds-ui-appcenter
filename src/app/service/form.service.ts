import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { ValidatorFn, Validators, AbstractControl, FormControl, FormBuilder, FormArray, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';

import { Definition } from 'src/app/interfaces/definition';

@Injectable()
export class FormService {
  shouldFocus: boolean;
  overFlowSubject: Subject<boolean> = new Subject();

  convert(key, definition, level, parent, value, options) {
    const self = this;
    const temp = [];
    if (key === '_self') {
      key = '#';
    }
    if (key === '_id') {
      definition.type = 'String';
    }
    if (value && key === '_id' && options && options.isEdit) {
      definition.properties.readonly = true;
    }
    if (options && options.isEdit && definition.properties.createOnly) {
      definition.properties.readonly = true;
    }
    const path = parent ? parent + '.' + key : key;
    const camelCase = path.split('.').join(' ').split('#').join(' ').camelCase();
    if (definition.type === 'Object') {
      const objDef = definition.definition;
      if (options && options.flatten) {
        objDef.forEach(def => {
          temp.push(self.convert(def.key, def, level + 1, path, value && typeof value === 'object' ? value[def.key] : null, options));
        });
      } else {
        const tempDef = objDef.map(def => {
          return self.convert(def.key, def, level + 1, path, value && typeof value === 'object' ? value[def.key] ?? value[0]?.[def.key] : null, options);
        })
        temp.push({
          path: path,
          key: key,
          camelCase: camelCase,
          type: definition.type,
          properties: definition.properties,
          level: level,
          value: value,
          definition: Array.prototype.concat.apply(
            [],
            tempDef
          )
        });
      }
    } else if (definition.type === 'Array') {
      const arrDef = definition.definition;

      const selfObj = arrDef[0];
      const def: any = {
        path: path,
        key: key,
        camelCase: camelCase,
        type: definition.type,
        properties: definition.properties,
        level: level,
        value: value
      };
      if (options && options.flatten) {
        def.definition = [
          {
            path: path + '.#',
            key: '#',
            camelCase: camelCase,
            type: selfObj.type,
            properties: selfObj.properties,
            level: level + 1,
            value: value,
            definition:
              selfObj.type === 'Object' || selfObj.type === 'Array' ? self.convert('_self', selfObj, level + 2, path, null, options) : []
          }
        ];
      } else {
        def.definition = self.convert('_self', selfObj, level + 1, path, value, options);
      }
      temp.push(def);
    } else {
      temp.push({
        path: path,
        key: key,
        camelCase: camelCase,
        type: definition.type,
        properties: definition.properties,
        level: level,
        value: value
      });
    }
    return Array.prototype.concat.apply([], temp);
  }

  parseDefinition(schema, value, options) {
    const self = this;
    const temp = [];
    let definition = schema.definition;
    definition.forEach(def => {
      temp.push(self.convert(def.key, def, 0, null, value ? value[def.key] : null, options));
    });
    return Array.prototype.concat.apply([], temp);
  }
  parseDefinitionFM(def, parentKey?: string, parentName?: string): Definition[] {
    const self = this;
    let tempArr: Definition[] = [];
    def.forEach(defObj => {
      const temp: Definition = {};
      temp.show = true;
      if (defObj.key === '_id' && !parentKey) {
        temp.key = defObj.key;
        temp.dataKey = defObj.key;
        temp.type = 'Identifier';
        temp.properties = { name: defObj.properties.name };
        temp.properties.type = defObj.type;
        temp.definition = [];
        tempArr.unshift(temp);
      } else {
        if (defObj.type === 'Object') {
          const tempName = parentName ? parentName + '.' + defObj.properties.name : defObj.properties.name;
          const tempKey = parentKey ? parentKey + '.' + defObj.key : defObj.key;
          tempArr = tempArr.concat(self.parseDefinitionFM(defObj.definition, tempKey, tempName));
        } else {
          temp.key = parentKey ? parentKey + '.' + defObj.key : defObj.key;
          temp.dataKey = parentKey ? parentKey + '.' + defObj.key : defObj.key;
          temp.type = defObj.type;
          temp.properties = defObj.properties;
          temp.properties.type = defObj.type;
          temp.definition = defObj.definition ? self.parseDefinitionFM(defObj.definition, temp.key, defObj.properties.name) : [];
          tempArr.push(temp);
        }
      }
    });
    return tempArr;
  }

  getType(_obj): string {
    if (_.toLower(_obj.type) === 'string') {
      if (_obj.properties && _obj.properties.password) {
        return 'password';
      } else {
        return 'text';
      }
    }
    if (_.toLower(_obj.type) === 'boolean') {
      return 'checkbox';
    }
    if (_.toLower(_obj.type) === 'date') {
      if (_obj.properties.dateType) {
        return _obj.properties.dateType;
      } else {
        return 'date';
      }
    }
    if (_.toLower(_obj.type) === 'array') {
      if (_obj.properties.geoType) {
        return 'map';
      }
    }
    if (_.toLower(_obj.type) === 'geojson') {
      return 'map';
    }
    return _.toLower(_obj.type);
  }

  convertSchema(_object, _value?, isEdit?) {
    const self = this;
    const _temp: any = [];
    _object.forEach(def => {
      if (def.key === '_id') {
        _temp.unshift(self.convertDefinition(def.key, def, _value, isEdit));
      } else {
        _temp.push(self.convertDefinition(def.key, def, _value, isEdit));
      }
    });
    return _temp;
  }

  convertDefinition(_name, _object, _value?, isEdit?) {
    const self = this;
    const _temp: any = {
      name: _name,
      key: _name,
      type: _object.type
    };
    if (_name === '_id') {
      _object.type = 'String';
    }
    if (!_value) {
      _value = {};
    }
    if (_object.properties) {
      _temp.properties = _object.properties;
      _temp.label = _object.properties.name;
    }
    if (_value[_name] && _name === '_id') {
      _temp.properties.readonly = true;
    }
    if (isEdit && _object.properties.createOnly) {
      _temp.properties.readonly = true;
    }
    if (_.toLower(_object.type) === 'array') {
      _temp.controlType = 'array';
      _temp.value = _value[_name];
      _temp.definitions = self.convertSchema(_object.definition)[0];
    } else if (_.toLower(_object.type) === 'object') {
      _temp.controlType = 'object';
      _temp.definitions = self.convertSchema(_object.definition, _value[_name]);
    } else {
      if (_value) {
        _temp.value = _value[_name];
      }
      if (_object.properties) {
        if (_object.properties.enum) {
          _temp.controlType = 'select';
        } else if (_object.properties.longText || _object.properties.richText) {
          _temp.controlType = 'textarea';
        } else if (_object.properties.geoType) {
          _temp.controlType = 'map';
        } else {
          _temp.controlType = 'input';
        }
      } else {
        _temp.controlType = 'input';
      }
      _temp.type = self.getType(_object);
    }
    return _temp;
  }

  createValidatorList(_definition) {
    const _tempValidators: ValidatorFn[] = [];
    if (_definition.properties) {
      if (_definition.properties.required) {
        _tempValidators.push(Validators.required);
      }
      if (_definition.properties.maxlength) {
        _tempValidators.push(Validators.maxLength(_definition.properties.maxlength));
      }
      if (_definition.properties.minlength) {
        _tempValidators.push(Validators.minLength(_definition.properties.minlength));
      }
      if (_definition.properties.pattern) {
        const regex = new RegExp(_definition.properties.pattern);
        _tempValidators.push(Validators.pattern(regex));
      }
      if (_definition.properties.max === 0 || _definition.properties.max) {
        _tempValidators.push(Validators.max(_definition.properties.max));
      }
      if (_definition.properties.min === 0 || _definition.properties.min) {
        _tempValidators.push(Validators.min(_definition.properties.min));
      }
      if (_definition.properties.email) {
        _tempValidators.push(email);
      }
      if (_definition.type === 'number') {
        _tempValidators.push(decimal);
      }
    }
    return _tempValidators;
  }

  createFileMapValidatorList(_definition) {
    const _tempValidators: ValidatorFn[] = [];
    if (_definition.properties) {
      if (_definition.properties.required) {
        _tempValidators.push(Validators.required);
      }
    }
    return _tempValidators;
  }
  createForm(_fields): object {
    const self = this;
    const _dynamicGroup: object = {};
    let _control: AbstractControl;
    _fields.forEach(_def => {
      if (_def.type === 'Object') {
        _control = new FormBuilder().group(self.createForm(_def.definition));
      } else {
        if (_def.type === 'Array') {
          _control = new FormArray([]);
          if (_def.value && _def.value.length) {
            _def.value.forEach(element => {
              if (_def.definition[0].type === 'array') {
                // has to be implemented
              } else if (_def.definition[0].type === 'Object') {
                const control = new FormBuilder().group(self.createForm(_def.definition[0].definition));
                (<FormGroup>control).patchValue(element);
                if (_def.properties.readonly) {
                  control.disable();
                }
                (<FormArray>_control).push(control);
              } else {
                (<FormArray>_control).push(
                  new FormControl({
                    value: element !== null ? element : null,
                    disabled: _def.properties.readonly
                  })
                );
              }
            });
          }
          if (_def.properties.readonly) {
            _def.definition.forEach(element => {
              element.properties.readonly = true;
            });
          }
        } else {
          if (_def.properties.readonly) {
            _control = new FormControl({
              value:
                _def.value !== null && _def.value !== undefined
                  ? _def.value
                  : _def.properties.default !== undefined
                    ? _def.properties.default
                    : null,
              disabled: true
            });
          } else {
            if (_def.type === 'Number' || _def.type === 'Boolean') {
              _control = new FormControl(_def.value !== null && _def.value !== undefined ? _def.value : _def.properties.default);
            } else {
              if (_def.properties.default) {
                if (_def.properties.relatedTo) {
                  _control = new FormControl({
                    _id: _def.value ? _def.value._id : _def.properties.default
                  });
                } else if (_def.type === 'User') {
                  _control = new FormControl({
                    _id: _def.value ? _def.value._id : _def.properties.default
                  });
                } else {
                  _control = new FormControl(_def.value ? _def.value : _def.properties.default);
                }
              } else {
                _control = new FormControl(_def.value || null);
              }
            }
          }
        }
      }
      _control.setValidators(self.createValidatorList(_def));
      _dynamicGroup[_def.key] = _control;
    });
    // Object.keys(_fields).forEach(key => {

    // });
    return _dynamicGroup;
  }

  createMappingForm(_fields): object {
    const self = this;
    const _dynamicGroup: object = {};
    let _control: AbstractControl;
    _fields.forEach(_def => {
      if (_def.type === 'Object' && !(_def.properties && _def.properties.password)) {
        _control = new FormBuilder().group(self.createMappingForm(_def.definition));
      } else {
        if (_def.type === 'Array') {
          _control = new FormArray([]);
          if (_def.value && _def.value.length) {
            _def.value.forEach(element => {
              if (_def.definition[0].type === 'array') {
                // has to be implemented
              } else if (_def.definition[0].type === 'Object') {
                const control = new FormBuilder().group(self.createMappingForm(_def.definition[0].definition));
                // (<FormGroup>control).patchValue();
                (<FormArray>_control).push(control);
              } else if (_def.definition[0].type === 'User') {
                const control = new FormBuilder().group({ _id: null });
                (<FormArray>_control).push(control);
              } else {
                (<FormArray>_control).push(new FormControl(null));
              }
            });
          } else {
            if (_def.definition[0].type === 'array') {
              // has to be implemented
            } else if (_def.definition[0].type === 'Object') {
              const control = new FormBuilder().group(self.createMappingForm(_def.definition[0].definition));
              // (<FormGroup>control).patchValue();
              (<FormArray>_control).push(control);
            } else if (_def.definition[0].type === 'User') {
              const control = new FormBuilder().group({ _id: null });
              (<FormArray>_control).push(control);
            } else {
              (<FormArray>_control).push(new FormControl(null));
            }
          }
        } else {
          if (_def.properties.readonly) {
            _control = new FormControl({
              value: _def.value || null,
              disabled: true
            });
          } else {
            if (_def.type === 'Number' || _def.type === 'Boolean') {
              _control = new FormControl(null);
            } else {
              if (_def.properties.default) {
                if (_def.properties.relatedTo) {
                  _control = new FormControl({ _id: _def.properties.default });
                } else if (_def.type === 'User') {
                  _control = new FormControl({ _id: _def.properties.default });
                } else {
                  _control = new FormControl(_def.value ? _def.value : _def.properties.default);
                }
              } else {
                _control = new FormControl(_def.value || null);
              }
            }
          }
        }
      }
      _control.setValidators(self.createFileMapValidatorList(_def));
      _dynamicGroup[_def.key] = _control;
    });
    return _dynamicGroup;
  }

  patchType(definition: any) {
    if (definition) {
      definition.forEach(def => {
        if (def.key !== '_id') {
          if (def.type === 'Object') {
            if (def.properties.relatedTo) {
              def.type = 'Relation';
              delete def.definition;
            } else if (def.properties.fileType) {
              def.type = 'File';
              delete def.definition;
            } else if (def.properties.password) {
              def.type = 'String';
              delete def.definition;
            } else if (def.properties.geoType) {
              def.type = 'Geojson';
              delete def.definition;
            } else if (def.properties.dateType) {
              def.type = 'Date';
              delete def.definition;
            } else {
              this.patchType(def.definition);
            }
          } else if (def.type === 'User') {
            delete def.definition;
          } else if (def.type === 'Array') {
            this.patchType(def.definition);
          }
        }
      });
    }
    return definition;
  }

  fixReadonly(definition: any, readonly?: boolean) {
    definition.forEach(def => {
      if (typeof readonly === 'boolean' && def.properties) {
        def.properties.readonly = readonly;
      }
      if (def.key !== '_id' && def.type === 'Object') {
        this.fixReadonly(def.definition, def.properties.readonly);
      }
    });
  }
}

export function email(control: FormControl) {
  if (!control.value || !control.value.trim() || (control.value && control.value.match(/[\w]+@[a-zA-Z0-9-]{2,}(\.[a-z]{2,})+$/))) {
    return null;
  }
  return { email: true };
}

export function natural(control: FormControl) {
  if (control.value && !control.value.toString().match(/^[0-9]+$/)) {
    const val = control.value.toString().replace(/[^0-9]+/g, '');
    control.patchValue(val ? parseInt(val, 10) : null);
  }
  return null;
}

export function decimal(control: FormControl) {
  if (control.value && !control.value.toString().match(/^(-|)[0-9]*\.?[0-9]*$/)) {
    let val = control.value.toString();
    const indexOfDot = val.indexOf('.');
    const isNegative = val.charAt(0) === '-';
    if (indexOfDot > -1) {
      val = val.replace(/\./g, '').split('');
      val.splice(indexOfDot, 0, '.');
      val = val.join('');
    }
    val = val.replace(/[^0-9\.]+/g, '');
    if (isNegative) {
      val = '-' + val;
    }
    control.patchValue(val ? parseFloat(val) : null);
  }
  return null;
}
