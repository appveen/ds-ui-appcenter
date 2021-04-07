import { Injectable, EventEmitter } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as moment from 'moment-timezone';

import { Definition } from 'src/app/interfaces/definition';

@Injectable()
export class AppService {
    serviceId: string;
    serviceName: string;
    serviceAPI: string;
    properties: any;
    prevUrl: string;
    reSubmitData: any;
    draftData: any;
    serviceChange: EventEmitter<any>;
    colorChange: EventEmitter<any>;
    appChange: EventEmitter<any>;
    selectMicroflow: EventEmitter<any>;
    selectClicked: EventEmitter<boolean>;
    navigateToWorkflow: EventEmitter<any>;
    respondToWorkflow: EventEmitter<any>;
    showWorkflowDocument: BehaviorSubject<any>;
    editWorkflowDocument: EventEmitter<any>;
    manageTriggred: EventEmitter<any>;
    clearFilterEvent: EventEmitter<any>;
    clearInteractionFilterEvent: EventEmitter<any>;
    updateWFNotification: EventEmitter<any>;
    showFloatingFilter: EventEmitter<boolean>;
    setFocus: EventEmitter<any>;
    workflowStatus: EventEmitter<boolean>;
    filterOptions: boolean;
    existingFilter: any;
    filterName: string;
    workflowFilter: any;
    filterApplied: EventEmitter<any>;
    servicesMap: any;
    failedStep: boolean;
    dataKeyForSelectedCols: Array<string>;
    remoteTxnId: string;
    dataGridColumns: any;
    loadPage: EventEmitter<any>;
    partnerId: string;
    interactionFloatingFilter: any;
    selectResolveData: EventEmitter<any>;
    fqdn: string;
    draggedItem: any;
    // existingInlineFilter: any;
    // inlineFilterApplied: any;
    fetchedServiceList: Array<any>;
    objMappingData: EventEmitter<number>;
    fileObjCount;
    mappingData: any;
    fileData: any;
    resultObj: any;
    loadFileMapper: EventEmitter<any>;
    hasBulkInvalidRecords: EventEmitter<boolean>;
    selectAll: EventEmitter<any>;
    bulkEditIds: Array<string>;
    cloneRecordId: string;
    workflowId;
    workflowTab: number;
    workflowTabChange: EventEmitter<number>;
    fileMapperComponnets: any;

    constructor() {
        const self = this;
        self.serviceChange = new EventEmitter();
        self.colorChange = new EventEmitter();
        self.appChange = new EventEmitter();
        self.selectMicroflow = new EventEmitter();
        self.selectClicked = new EventEmitter<boolean>();
        self.navigateToWorkflow = new EventEmitter();
        self.respondToWorkflow = new EventEmitter();
        self.showWorkflowDocument = new BehaviorSubject({});
        self.editWorkflowDocument = new EventEmitter();
        self.manageTriggred = new EventEmitter();
        self.clearFilterEvent = new EventEmitter();
        self.clearInteractionFilterEvent = new EventEmitter();
        self.updateWFNotification = new EventEmitter();
        self.showFloatingFilter = new EventEmitter<boolean>();
        self.setFocus = new EventEmitter<boolean>();
        self.workflowStatus = new EventEmitter<boolean>();
        self.hasBulkInvalidRecords = new EventEmitter<boolean>();
        self.filterApplied = new EventEmitter();
        self.loadFileMapper = new EventEmitter();
        self.filterOptions = false;
        self.servicesMap = {};
        self.failedStep = false;
        self.dataKeyForSelectedCols = [];
        self.loadPage = new EventEmitter<string>();
        self.selectResolveData = new EventEmitter();
        self.interactionFloatingFilter = null;
        self.objMappingData = new EventEmitter<number>();
        self.fileObjCount = 0;
        self.selectAll = new EventEmitter();
        self.fileMapperComponnets = {};
        self.workflowTabChange = new EventEmitter();
        this.fetchedServiceList = [];
    }

    aggregatePermission(_obj, min?) {
        try {
            const self = this;
            _obj = Object.assign.apply(
                null,
                Object.keys(_obj)
                    .filter(e => e.indexOf('_') === -1 || e === '_id')
                    .map(e => Object.defineProperty({}, e, { value: _obj[e], enumerable: true }))
            );
            let type = 'max';
            if (min) {
                type = 'min';
            }
            let temp = Object.values(_obj).map((e: any) => (e._p ? Object.values(e._p) : self.aggregatePermission(e, type)));
            temp = Array.prototype.concat.apply([], temp);
            const values = temp.map(e => e.charCodeAt(0));
            return String.fromCharCode(Math[type].apply(null, values));
        } catch (e) {
            throw e;
        }
    }

    configureByPermission(definitions, permissions) {
        try {
            const self = this;
            const deleteArray = [];
            definitions
                .filter(def => (def.key.indexOf('_') !== 0 || def.key === '_id'))
                .forEach(def => {
                    if (def.key === '_id') {
                        def.type = 'String';
                        def.properties = {
                            name: 'ID'
                        };
                    }
                    const inDirectTag = permissions.reduce((pv, cv) => (pv || !cv.fields[def.key]._p), false);
                    if (inDirectTag) {
                        if (def.type === 'Relation') {
                            const tag = permissions.reduce((pv, cv) => {
                                const previousTag: string = typeof pv === 'string' ? pv : pv.fields[def.key]._id._p[pv.id];
                                const currentTag: string = cv.fields[def.key]._id._p[cv.id];
                                return String.fromCharCode(Math.max(previousTag.charCodeAt(0), currentTag.charCodeAt(0)))
                            });
                            if (tag === 'N') {
                                deleteArray.push(def.key);
                            }
                        } else if (def.properties && def.properties.password) {
                            const tag = permissions.reduce((pv, cv) => {
                                const previousTag: string = typeof pv === 'string' ? pv : pv.fields[def.key].value._p[pv.id];
                                const currentTag: string = cv.fields[def.key].value._p[cv.id];
                                return String.fromCharCode(Math.max(previousTag.charCodeAt(0), currentTag.charCodeAt(0)))
                            });
                            if (tag === 'N') {
                                deleteArray.push(def.key);
                            }
                        } else {
                            const allTagsCharCode = permissions.map(p => this.aggregatePermission(p.fields[def.key]).charCodeAt(0));
                            const finalTag = String.fromCharCode(Math.max(...allTagsCharCode));
                            if (finalTag !== 'N') {
                                def.definition = self.configureByPermission(def.definition, [{ id: permissions[0].id, fields: permissions[0].fields[def.key] }]);
                            } else {
                                deleteArray.push(def.key);
                            }
                        }
                    } else {
                        const tag = permissions.reduce((pv, cv) => {
                            const previousTag: string = typeof pv === 'string' ? pv : pv.fields[def.key]._p[pv.id];
                            const currentTag: string = cv.fields[def.key]._p[cv.id];
                            return String.fromCharCode(Math.max(previousTag.charCodeAt(0), currentTag.charCodeAt(0)))
                        });
                        if (tag === 'N') {
                            deleteArray.push(def.key);
                        }
                        if (tag === 'R') {
                            if (def.type === 'Array') {
                                def.definition[0].properties.readonly = true;
                            }
                            def.properties.readonly = true;
                        }
                    }
                });
            return definitions.filter(d => !deleteArray.includes(d.key));
        } catch (e) {
            throw e;
        }
    }

    cleanPayload(payload, definition: Array<any>, isEdit: boolean) {
        try {
            const self = this;
            if (definition) {
                definition.forEach(def => {
                    if (def.type === 'Object' && payload[def.key]) {
                        self.cleanPayload(payload[def.key], def.definition, isEdit);
                    } else if (payload[def.key] && Array.isArray(payload[def.key])) {
                        if (def.definition[0].type !== 'Object') {
                            if (payload[def.key] && payload[def.key].length > 0) {
                                payload[def.key].forEach(d => {
                                    self.cleanPayload(d, def.definition[0].definition, isEdit);
                                });
                            } else {
                                payload[def.key] = null;
                            }
                        } else if (def.definition[0].type !== 'Boolean') {
                            payload[def.key] = payload[def.key].filter(e => e);
                        }
                        if (payload[def.key]) {
                            payload[def.key] = payload[def.key].filter(e => e !== null && e !== '' && e !== undefined);
                        }
                        if (payload[def.key] && def.definition[0].type === 'Object') {
                            payload[def.key].forEach(obj => self.cleanPayload(obj, def.definition[0].definition, isEdit));
                            payload[def.key] = payload[def.key].filter(e =>
                                Object.keys(e).reduce((pv, cv) => pv || (e[cv] !== null && e[cv] !== ''), false)
                            );
                        }
                        if (payload[def.key] && payload[def.key].length === 0) {
                            payload[def.key] = null;
                        }
                    } else {
                        if (
                            payload.hasOwnProperty(def.key) &&
                            typeof payload[def.key] !== 'boolean' &&
                            typeof payload[def.key] !== 'number' &&
                            !payload[def.key]
                        ) {
                            payload[def.key] = null;
                        }
                        if ((def.type === 'Boolean' || typeof payload[def.key] === 'boolean') && !payload[def.key]) {
                            payload[def.key] = false;
                        }
                        if (def.properties && def.properties.createOnly && isEdit) {
                            delete payload[def.key];
                        }
                    }
                });
            }
        } catch (e) {
            throw e;
        }
    }

    getDirtyValues(form: any) {
        const dirtyValues = {};
        Object.keys(form.controls).forEach(key => {
            const currentControl = form.controls[key];
            if (currentControl.dirty) {
                if (currentControl.controls) {
                    dirtyValues[key] = this.getDirtyValues(currentControl);
                } else {
                    if (currentControl.value) {
                        dirtyValues[key] = currentControl.value;
                    }
                }
            }
        });
        return dirtyValues;
    }

    fixArrayInPayload(payload, definition: Array<any>, isEdit: boolean) {
        const self = this;
        if (definition && payload) {
            definition.forEach(def => {
                if (def.type === 'Object' && payload[def.key]) {
                    self.fixArrayInPayload(payload[def.key], def.definition, isEdit);
                } else if (def.type === 'Array' && !payload[def.key]) {
                    payload[def.key] = [];
                }
            });
        }
    }
    //
    getValue(key, obj) {
        try {
            return key.split('.').reduce(
                function (prev, curr) {
                    const keys = !!prev ? Object.keys(prev) : [];
                    const foundKey = keys.find(key => key.toLowerCase() === curr.toLowerCase());
                    return !!foundKey ? prev[foundKey] : undefined;
                }, obj);
        } catch (e) {
            throw e;
        }
    }


    getValueNew(key, defArray, preValue?) {
        let retValue = preValue;
        defArray.forEach(element => {
            if (element.type === "Object") {
                retValue = this.getValueNew(key, element.definition, retValue)
            }
            else if (element.properties.dataPath === key) {
                retValue = element;
            }
        });
        return retValue;

    }
    getValueForCollection(key, obj, objKey?) {
        try {
            return key.split('.').reduce(function (prev, curr) {
                if (obj && objKey) {
                    return prev ? prev[objKey][curr] : undefined;
                } else {
                    return prev ? prev[curr] : undefined;
                }
            }, obj);
        } catch (e) {
            throw e;
        }
    }

    flattenObject(record, parent?) {
        try {
            const self = this;
            let temp = {};
            for (const _key in record) {
                if (!Array.isArray(record[_key]) && typeof record[_key] === 'object') {
                    temp = Object.assign({}, temp, self.flattenObject(record[_key], _key));
                } else {
                    let _newKey = _key;
                    if (parent) {
                        _newKey = parent + '.' + _key;
                    }
                    temp[_newKey] = record[_key];
                }
            }
            return temp;
        } catch (e) {
            throw e;
        }
    }

    unFlattenObject(_fields) {
        try {
            const temp = {};
            Object.keys(_fields).forEach(key => {
                const keys = key.split('.');
                if (keys.length > 1) {
                    const obj = {};
                    if (!temp[keys[0]]) {
                        temp[keys[0]] = {};
                    }
                    keys.reverse().forEach((element, index) => {
                        if (index === 0) {
                            obj[element] = _fields[key];
                        } else {
                            obj[element] = JSON.parse(JSON.stringify(obj));
                            delete obj[keys[index - 1]];
                        }
                    });
                    keys.reverse();
                    temp[keys[0]] = Object.assign(temp[keys[0]], obj[keys[0]]);
                } else {
                    temp[key] = _fields[key];
                }
            });
            return temp;
        } catch (e) {
            throw e;
        }
    }

    truncateString(str: string, len: number) {
        return str.substr(0, len) + '...';
    }

    getDepth(definition: Definition) {
        try {
            const self = this;
            let depth = 0;
            if (definition.definition && definition.definition.length > 0) {
                depth = definition.definition.length;
                const innerDepth: Array<number> = [];
                definition.definition.forEach(def => {
                    innerDepth.push(self.getDepth(def));
                });
                depth += Math.max.apply(null, innerDepth);
            }
            return depth;
        } catch (e) {
            throw e;
        }
    }

    hasPermission(roles: Array<string>, method?: string): boolean {
        try {
            if (!roles || roles.length === 0) {
                return false;
            }
            if (!method) {
                return Boolean(roles.length);
            }
            return roles.indexOf(method) > -1;
        } catch (e) {
            throw e;
        }
    }

    getWhenCreated(dateStr) {
        try {
            const date = new Date(dateStr);
            const today = new Date();
            if (date.getDate() === today.getDate() && date.getMonth() === today.getMonth()) {
                return 'Today';
            }
            today.setDate(today.getDate() - 1);
            if (date.getDate() === today.getDate() && date.getMonth() === today.getMonth()) {
                return 'Yesterday';
            }
            return new Date(new Date().getTime() - new Date(dateStr).getTime()).getDate() + ' Days ago';
        } catch (e) {
            throw e;
        }
    }

    getUniqueItems(arr: Array<any>) {
        return arr.filter((v, i, a) => {
            if (typeof v === 'string') {
                return a.indexOf(v) === i;
            } else {
                return a.map(e => JSON.stringify(e)).indexOf(JSON.stringify(v)) === i;
            }
        });
    }

    cloneObject(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    isEquivalent(a, b) {
        // Create arrays of property names
        const aProps = Object.getOwnPropertyNames(a);
        const bProps = Object.getOwnPropertyNames(b);

        // If number of properties is different,
        // objects are not equivalent
        if (aProps.length !== bProps.length) {
            return false;
        }

        for (let i = 0; i < aProps.length; i++) {
            const propName = aProps[i];

            // If values of same property are not equal,
            // objects are not equivalent
            if (a[propName] !== b[propName]) {
                return false;
            }
        }

        // If we made it this far, objects
        // are considered equivalent
        return true;
    }

    countFields(obj) {
        try {
            const self = this;
            let count = 0;
            if (!obj) {
                return count;
            }
            const rootKeys = Object.keys(obj).filter(e => e !== '_version' && e !== '__v' && e !== '_metadata' && e !== '_id');
            count += rootKeys.length;
            rootKeys.forEach(key => {
                if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                    count += self.countFields(obj[key]);
                }
            });
            return count;
        } catch (e) {
            throw e;
        }
    }

    countChangedFields(oldObj, newObj) {
        try {
            const self = this;
            let count = 0;
            if (oldObj && newObj) {
                const rootKeys = Object.keys(oldObj).filter(e => e !== '_version' && e !== '__v' && e !== '_metadata' && e !== '_id');
                rootKeys.forEach(key => {
                    if (typeof oldObj[key] === 'object' || typeof newObj[key] === 'object') {
                        if (Array.isArray(oldObj[key]) || Array.isArray(newObj[key])) {
                            if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
                                count += 1;
                            }
                        } else {
                            count += self.countChangedFields(oldObj[key], newObj[key]);
                        }
                    } else {
                        if (oldObj[key] !== newObj[key]) {
                            count++;
                        }
                    }
                });
            } else {
                count += oldObj ? self.countFields(oldObj) : self.countFields(newObj);
            }
            return count;
        } catch (e) {
            throw e;
        }
    }

    getChangedFields(oldObj, newObj, parent?) {
        try {
            const self = this;
            let fields = [];
            if (oldObj && newObj) {
                let rootKeys;
                if (!parent) {
                    rootKeys = Object.keys(oldObj).filter(
                        e => e !== '_version' && e !== '__v' && e !== '_metadata' && e !== '_id' && e !== '_href'
                    );
                } else {
                    rootKeys = Object.keys(oldObj).filter(e => e !== '_version' && e !== '__v' && e !== '_metadata' && e !== '_href');
                }
                rootKeys.forEach(key => {
                    if (typeof oldObj[key] === 'object' || typeof newObj[key] === 'object') {
                        if (Array.isArray(oldObj[key]) || Array.isArray(newObj[key])) {
                            if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
                                fields.push(parent ? parent + '.' + key : key);
                            }
                        } else {
                            const field = self.getChangedFields(oldObj[key], newObj[key], parent ? key + '.' + parent : key);
                            fields = fields.concat(field);
                        }
                    } else {
                        if (oldObj[key] !== newObj[key]) {
                            fields.push(parent ? parent + '.' + key : key);
                        }
                    }
                });
            } else {
                if (oldObj) {
                    fields = fields.concat(Object.keys(oldObj));
                }
                if (newObj) {
                    fields = fields.concat(Object.keys(newObj));
                }
            }
            return fields;
        } catch (e) {
            throw e;
        }
    }

    getFilterObject(filterModel: any) {
        try {
            const temp = {};
            temp['$and'] = [];
            Object.keys(filterModel).forEach(key => {
                if (typeof filterModel[key].filter === 'object') {
                    const keyVal = filterModel[key].filter;
                    let val;
                    if (filterModel[key].type === 'equals') {
                        // temp[key + '.' + keyVal.key] = keyVal.value;
                        val = keyVal.value;
                    } else if (filterModel[key].type === 'notEqual') {
                        // temp[key + '.' + keyVal.key] = {};
                        // temp[key + '.' + keyVal.key]['$ne'] = keyVal.value;
                        val = {};
                        val['$ne'] = keyVal.value;
                    } else if (filterModel[key].type === 'startsWith') {
                        // temp[key + '.' + keyVal.key] = '/^' + keyVal.value + '/';
                        val = '/^' + keyVal.value + '/';
                    } else if (filterModel[key].type === 'endsWith') {
                        // temp[key + '.' + keyVal.key] = '/' + keyVal.value + '$/';
                        val = '/' + keyVal.value + '$/';
                    } else if (filterModel[key].type === 'notContains') {
                        // temp[key + '.' + keyVal.key] = {};
                        // temp[key + '.' + keyVal.key]['$not'] = keyVal.value;
                        val = {};
                        val['$not'] = keyVal.value;
                    } else {
                        // temp[key + '.' + keyVal.key] = '/' + keyVal.value + '/';
                        val = '/' + keyVal.value + '/';
                    }
                    if (keyVal.value) {
                        if (temp['$or']) {
                            temp['$and'].push({ $or: temp['$or'] });
                            temp['$or'] = keyVal.keys.map(e =>
                                Object.defineProperty({}, key + '.' + e, {
                                    value: val,
                                    enumerable: true
                                })
                            );
                            temp['$and'].push({ $or: temp['$or'] });
                            delete temp['$or'];
                        } else {
                            temp['$or'] = keyVal.keys.map(e =>
                                Object.defineProperty({}, key + '.' + e, {
                                    value: val,
                                    enumerable: true
                                })
                            );
                        }
                    }
                } else {
                    if (filterModel[key].filterType === 'number') {
                        if (filterModel[key].type === 'inRange') {
                            temp[key] = {};
                            temp[key]['$gte'] = filterModel[key].filter;
                            temp[key]['$lte'] = filterModel[key].filterTo;
                        } else if (filterModel[key].type === 'notEqual') {
                            temp[key] = {};
                            temp[key]['$ne'] = filterModel[key].filter;
                        } else if (filterModel[key].type === 'lessThan') {
                            temp[key] = {};
                            temp[key]['$lt'] = filterModel[key].filter;
                        } else if (filterModel[key].type === 'greaterThan') {
                            temp[key] = {};
                            temp[key]['$gt'] = filterModel[key].filter;
                        } else if (filterModel[key].type === 'lessThanOrEqual') {
                            temp[key] = {};
                            temp[key]['$lte'] = filterModel[key].filter;
                        } else if (filterModel[key].type === 'greaterThanOrEqual') {
                            temp[key] = {};
                            temp[key]['$gte'] = filterModel[key].filter;
                        } else {
                            temp[key] = filterModel[key].filter;
                        }
                    } else if (filterModel[key].filterType === 'date') {
                        if (filterModel[key].type === 'inRange') {
                            temp[key] = {};
                            temp[key]['$gte'] = new Date(filterModel[key].dateFrom).toISOString();
                            temp[key]['$lte'] = new Date(filterModel[key].dateTo).toISOString();
                        } else if (filterModel[key].type === 'greaterThan') {
                            temp[key] = {};
                            temp[key]['$gte'] = new Date(filterModel[key].dateFrom).toISOString();
                        } else if (filterModel[key].type === 'lessThan') {
                            temp[key] = {};
                            temp[key]['$lte'] = new Date(filterModel[key].dateFrom).toISOString();
                        } else if (filterModel[key].type === 'notEqual') {
                            temp[key] = {};
                            temp[key]['$ne'] = new Date(filterModel[key].dateFrom).toISOString();
                        } else {
                            if (key === '_metadata.createdAt' || key === '_metadata.lastUpdated') {
                                const from = new Date(filterModel[key].dateFrom);
                                from.setUTCMilliseconds(0);
                                from.setUTCSeconds(0);
                                from.setUTCMinutes(0);
                                from.setUTCHours(0);
                                const to = new Date(filterModel[key].dateFrom);
                                to.setUTCSeconds(59);
                                to.setUTCMinutes(59);
                                to.setUTCHours(23);
                                temp[key] = {};
                                temp[key]['$gte'] = from.toISOString();
                                temp[key]['$lte'] = to.toISOString();
                            } else {
                                temp[key] = new Date(filterModel[key].dateFrom).toISOString();
                            }
                        }
                    } else {
                        if (filterModel[key].type === 'equals') {
                            temp[key] = filterModel[key].filter;
                        } else if (filterModel[key].type === 'notEqual') {
                            temp[key] = {};
                            temp[key]['$ne'] = filterModel[key].filter;
                        } else if (filterModel[key].type === 'startsWith') {
                            temp[key] = {
                                $regex: '.*' + filterModel[key].filter,
                                $options: 'i'
                            };
                        } else if (filterModel[key].type === 'endsWith') {
                            temp[key] = {
                                $regex: filterModel[key].filter + '.*',
                                $options: 'i'
                            };
                        } else if (filterModel[key].type === 'notContains') {
                            temp[key] = {};
                            temp[key]['$not'] = '/' + filterModel[key].filter + '/';
                        } else {
                            temp[key] = '/' + filterModel[key].filter + '/';
                        }
                    }
                }
            });
            if (temp['$and'].length === 0) {
                delete temp['$and'];
            }
            return temp;
        } catch (e) {
            throw e;
        }
    }

    cleanFilter(obj) {
        try {
            if (obj) {
                Object.keys(obj).forEach(key => {
                    delete obj[key];
                });
            }
        } catch (e) {
            throw e;
        }
    }

    compilePath(path, indexList) {
        try {
            if (!indexList) {
                indexList = [];
            }
            return path.split('#').reduce(function (p, c, ci) {
                return p + (indexList[ci - 1] ? indexList[ci - 1] : 0) + c;
            });
        } catch (e) {
            throw e;
        }
    }

    listenForChildClosed(childWindow: Window): Promise<{ status?: number; body?: any }> {
        return new Promise((resolve, reject) => {
            let timer;
            const checkChild = () => {
                if (!childWindow) {
                    clearInterval(timer);
                    reject(false);
                    return;
                }
                if (childWindow.closed) {
                    clearInterval(timer);
                    let status: any = localStorage.getItem('azure-status');
                    if (status) {
                        status = parseInt(status, 10);
                    }
                    let body: any = localStorage.getItem('azure-body');
                    try {
                        body = unescape(body);
                        body = JSON.parse(body);
                    } catch (e) { }
                    localStorage.removeItem('azure-status');
                    localStorage.removeItem('azure-body');
                    resolve({ status: status, body: body });
                }
            };
            timer = setInterval(checkChild, 500);
        });
    }

    copyToClipboard(text: string) {
        // Create new element
        const el: HTMLTextAreaElement = document.createElement('textarea');
        // Set value (string to be copied)
        el.value = text;
        // Set non-editable to avoid focus and move outside of view
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        // Select text inside element
        el.select();
        // Copy text to clipboard
        document.execCommand('copy');
        // Remove temporary element
        document.body.removeChild(el);
    }

    remove_idFromArray(data: any, parent?: boolean) {
        const self = this;
        if (data) {
            Object.keys(data).forEach(key => {
                if (key === '_id' && parent) {
                    delete data._id;
                } else if (typeof data[key] === 'object') {
                    if (Array.isArray(data[key])) {
                        data[key].forEach(item => {
                            if (typeof item === 'object') {
                                self.remove_idFromArray(item, true);
                            }
                        });
                    } else {
                        self.remove_idFromArray(data[key]);
                    }
                }
            });
        }
        return null;
    }

    cleanArray(payload, definition: Array<any>) {
        try {
            const self = this;
            if (definition) {
                definition.forEach(def => {
                    if (def.type === 'Object' && payload[def.key]) {
                        self.cleanArray(payload[def.key], def.definition);
                    } else {
                        delete payload._id;
                        if (def && def.properties && def.properties.password && payload[def.key]) {
                            delete payload[def.key].value;
                        }
                    }
                });
            }
        } catch (e) {
            throw e;
        }
    }

    getMoment(dateStr?: any) {
        return moment(dateStr);
    }

    getMomentInTimezone(date: Date, timezone: string, adjustment?: 'time:start' | 'time:end' | 'ms:start' | 'ms:end' | 'exact'): moment.Moment {
        const momentDate = moment(new Date()).tz(timezone);
        momentDate.year(date.getFullYear());
        momentDate.month(date.getMonth());
        momentDate.date(date.getDate());
        switch(adjustment) {
            case 'time:start':
                momentDate.hours(0);
                momentDate.minutes(0);
                momentDate.seconds(0);
                momentDate.milliseconds(0);
            break;
            case 'time:end':
                momentDate.hours(23);
                momentDate.minutes(59);
                momentDate.seconds(59);
                momentDate.milliseconds(999);
            break;
            case 'ms:start':
                momentDate.hours(date.getHours())
                momentDate.minutes(date.getMinutes());
                momentDate.seconds(date.getSeconds());
                momentDate.milliseconds(0);
            break;
            case 'ms:end':
                momentDate.hours(date.getHours())
                momentDate.minutes(date.getMinutes());
                momentDate.seconds(date.getSeconds());
                momentDate.milliseconds(999);
            break;
            case 'exact':
            default:
                momentDate.hours(date.getHours())
                momentDate.minutes(date.getMinutes());
                momentDate.seconds(date.getSeconds());
                momentDate.milliseconds(date.getMilliseconds());
            break;
        }
        return momentDate;
    }

    getTimezoneString(dateStr, tzInfo) {
        const foreignTime = moment(dateStr)
        return foreignTime.tz(tzInfo, true).format();
    }

    getLocalTimezone() {
        return moment.tz.guess(true);
    }

    getUTCString(dateStr, tzInfo) {
        try {
            return moment.tz(dateStr, tzInfo).tz(moment.tz.guess(), true).utc().format();
        } catch (e) {
            return '';
        }
    }

    fixMappingPayload(mapping) {
        Object.keys(mapping).forEach(key => {
            if (mapping[key]) {
                if (Array.isArray(mapping[key])) {
                    const len = mapping[key].filter(e => e).length;
                    if (len === 0) {
                        mapping[key] = null;
                    }
                } else if (typeof mapping[key] === 'object') {
                    this.fixMappingPayload(mapping[key]);
                }
            }
        });
    }
}
