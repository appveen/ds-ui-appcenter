export interface App {
    _id?: string;
    type?: string;
    description?: string;
    appCenterStyle?: AppCenterStyle;
    logo?: Logo;
    users?: Array<string>;
    groups?: Array<string>;
    firstLetter?: string;
    bg?: string;
}

export interface AppCenterStyle {
    theme?: string;
    bannerColor?: string;
    primaryColor?: string;
    textColor?: string;
}

export interface Logo {
    full?: string;
    thumbnail?: string;
}
