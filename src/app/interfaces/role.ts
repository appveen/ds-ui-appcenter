export interface Role {
    id?: string;
    entity?: string;
    app?: string;
    operations?: Array<RoleOperations>;
    fields?: any;
}

export interface RoleOperations {
    method?: string;
}
