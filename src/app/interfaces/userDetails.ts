import { Metadata } from 'src/app/interfaces/metadata';
import { App } from 'src/app/interfaces/app';

export interface UserDetails {
    _id?: string;
    _metadata?: Metadata;
    basicDetails?: BasicDetails;
    enableSessionRefresh?: boolean;
    username?: string;
    sessionTime?: number;
    accessControl?: AccessControl;
    description?: string;
    apps?: App[];
    token?: string;
    rToken?: string;
    expiresIn?: number;
    serverTime?: number;
    auth?: Auth;
    isSuperAdmin?: boolean;
    rbacBotTokenDuration?: number;
    rbacHbInterval?: number;
    rbacUserCloseWindowToLogout?: boolean;
    rbacUserToSingleSession?: boolean;
    rbacUserTokenDuration?: number;
    rbacUserTokenRefresh?: boolean;
    googleApiKey?: string;
    uuid?: string;
    lastLogin?: any;
    bot?: boolean;
}

export interface Auth {
    isLdap?: boolean;
    dn?: string;
    authType?: string;
}
export interface AccessControl {
    apps?: null | App[];
    accessLevel?: string;
}

export interface BasicDetails {
    name?: string;
    email?: string;
    phone?: string;
}

export enum Type {
    Distribution = 'Distribution',
    Management = 'Management',
}
