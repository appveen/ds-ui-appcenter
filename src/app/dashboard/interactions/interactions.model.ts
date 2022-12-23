import { UntypedFormGroup } from '@angular/forms';

export interface FlowData {
    name?: string;
    description?: string;
    app?: string;
    direction?: string;
    structures?: Array<any>;
    blocks?: Array<NodeData>;
    successBlocks?: Array<NodeData>;
    errorBlocks?: Array<NodeData>;
    timer?: {
        timebounds?: Timebound[];
        enabled?: boolean;
        cronRegEx?: string;
        restrictedZoneAction?: string;
    };
    changedDependencies?: Array<{
        id?: string;
        entity?: string; // nanoService, dataService, dataFormat
    }>;
    dataFormat?: Array<string>;
    dataService?: Array<string>;
    nanoService?: Array<string>;
    deploymentName?: string;
    edgeGatewayFQDN?: string;
    gatewayFQDN?: string;
    flowStatus?: string;
    inputType?: string;
    outputType?: string;
    partner?: string;
    port?: string;
    status?: string;
    version?: number;
}


export interface Timebound {
    from?: string;
    to?: string;
}


export interface EditConfig {
    status: boolean;
    loading?: boolean;
    id?: string;
}

export interface ActivateProperties {
    nodeList?: Array<NodeData>;
    index?: number;
    partner?: UntypedFormGroup;
    flowData?: any;
    type: string;
}

export interface NodeData {
    name?: string;
    description?: string;
    uuid?: string;
    id?: string;
    meta?: MetaData;
    source?: string;
    target?: string;
    sourceFormat?: Format;
    targetFormat?: Format;
    mapping?: Array<any>;
    formatId?: string;
    sequenceNo?: number;
    active?: boolean;
    formatChanged?: boolean;
    hasLogs?: boolean;
    hasError?: boolean;
    hasErrorInPrev?: boolean;
}

export interface MetaData {
    wsdlType?: string;
    wsdlValue?: string;
    wsdlContent?: string;
    blockType?: string;
    flowType?: string;
    contentType?: string;
    targetType?: string;
    sourceType?: string;
    dataType?: string;
    processType?: string;
    formatType?: string;
    formatId?: string;
    formatName?: string;
    fileDetails?: {
        excelType?: string;
        password?: string;
        lineSeparator?: string;
    };
    fileExtensions?: Array<{
        extension: string;
        custom: boolean;
    }>;
    fileMaxSize?: number;
    fileNameRegexs?: Array<string>;
    character?: string;
    connectionDetails?: ConnectionDetails;
    xslt?: any;
    source?: string;
    target?: string;
    operation?: string;
    skipStartRows?: number;
    skipEndRows?: number;
    generateHeaders?: boolean;
    outputDirectory?: string;
    inputDirectory?: Array<string> | string;
    outputDirectories?: Array<{
        path: string;
    }>;
    inputDirectories?: Array<{
        path: string;
        watchSubDirectories: boolean;
    }>;
    mirrorInputDirectories?: boolean;
    inputName?: string;
    inputType?: string;
    customHeaders?: any;
    customHeadersList?: any;
    secretIds?: Array<string>;
    uniqueRemoteTransaction?: boolean;
    uniqueRemoteTransactionOptions?: {
        fileName?: boolean;
        checksum?: boolean;
    };
    ipWhitelistEnabled?: boolean;
    ipList?: Array<string>;
}

export interface Format {
    _id?: string;
    id?: string;
    name?: string;
    attributeCount?: number;
    type?: string;
    definition?: any;
    formatType?: string;
    excelType?: string;
    character?: string;
    length?: number;
    lineSeparator?: string;
}

export interface ConnectionDetails {
    url?: string;
    connectionType?: string;
    sslType?: string;
    serverCertificate?: string;
    trustAllCerts?: boolean;
    validateServerIdentity?: boolean;
    validateClientIdentity?: boolean;
    twoWaySSL?: boolean;
    multipartAttribute?: string;
    requestTimeout?: number;
}
