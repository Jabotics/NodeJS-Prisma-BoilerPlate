interface user_registration {
    firstName: string
    middleName: string
    lastName: string
    status: boolean
    emailVerified: boolean
    password: string
    mobile: string
    userInfo?: object
    isStaff?: boolean
}

interface add_employees {
    email: string
    roleId?: bigint
    userPositionId?: bigint
    departmentId?: bigint
    manager?: bigint
    clientId?: bigint
    isStaff?: boolean
}

interface update_employees {
    firstName: string
    middleName: string
    lastName: string
    isSubAdmin: boolean
    status: boolean
    mobile: string
    userInfo: object
    roleId?: bigint | null
}

interface update_self {
    firstName: string
    middleName: string
    lastName: string
    mobile: string
    userInfo: object
    bankInfo: object
}

interface set_permissions {
    roleID: bigint
    componentName: string
    add: boolean
    update: boolean
    delete: boolean
    view: boolean
}

interface add_roles {
    role: string
    code: string
}

interface update_roles {
    role: string
    code?: string
    status: boolean
}

interface view_employee_where_clause {
    isStaff?: boolean
    isAdmin?: boolean
    isSubAdmin?: boolean
    status?: boolean
    email?: string
    emailVerified?: boolean
    softDelete: boolean
    AND?: Array<object>
}

interface bank_info {
    employeeID: string
    bankName: string
    acNumber: string
    ifscCode: string
    panNumber: string
    pfNo: string
    pfAUN: string
}

interface role_permission {
    roleId: bigint
    permissionId: bigint
    add: boolean
    update: boolean
    delete: boolean
    view: boolean
}

interface view_roles {
    softDelete: boolean
    status?: boolean
    AND?: Array<object>
}

interface view_brand_where_clause {
    softDelete: boolean
    status?: boolean
    prioritize?: boolean
    AND?: Array<object>
}

interface update_customers {
    firstName: string
    middleName: string
    lastName: string
    isSubAdmin: boolean
    status: boolean
    mobile: string
    userInfo: object
    roleId?: bigint | null
}

export {
    add_roles,
    bank_info,
    view_roles,
    update_self,
    update_roles,
    add_employees,
    set_permissions,
    role_permission,
    update_customers,
    update_employees,
    user_registration,
    view_brand_where_clause,
    view_employee_where_clause
};