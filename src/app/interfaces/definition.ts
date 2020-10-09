import { DataGridColumn } from '../utils/directives/data-grid/data-grid.directive';

export interface Definition extends DataGridColumn {
    path?: string;
    name?: string;
    key?: string;
    type?: string;
    properties?: Properties;
    definition?: Definition[];
    show?: boolean;
    dataType?: string;
}

export interface Properties {
    name?: string;
    type?: string;

    required?: boolean;
    enum?: Array<any>;
    minlength?: number;
    maxlength?: number;
    pattern?: string;
    email?: boolean;
    password?: boolean;
    fieldLength?: number;
    longText?: boolean;
    richText?: boolean;
    hasTokens?: Array<any>;

    min?: number;
    max?: number;
    currency?: Currency;
    natural?: boolean;

    dateType?: DateType;
    relatedTo?: string;
    relatedSearchField?: string;
    relatedViewFields?: Array<any>;
    schema?: string;
    attributeList?: Array<any>;
    geoType?: GeoType;
    createOnly?: boolean;
    unique?: boolean;
    precision?: number;
    _description?: string;
    _typeChanged?: string;
}

export enum Currency {
    INR = 'INR',
    USD = 'USD',
    GBP = 'GBP',
    EUR = 'EUR'
}

export enum DateType {
    date = 'date',
    datetime = 'datetime-local'
}

export enum GeoType {
    point = 'point',
    area = 'area'
}
