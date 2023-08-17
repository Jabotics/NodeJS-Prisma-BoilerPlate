// Imported modules
import { Request, Response } from 'express';
import { Prisma, PrismaClient, User, VerificationTypeEnum } from '@prisma/client';

// Custom modules for all APIs
import Utils from "../helpers/utils";
import Validator from '../helpers/validation'
import MailBackend from "../helpers/mailBackend"
import Authentication from '../helpers/authentication';
import exceptionHandler from '../helpers/exceptionHandler';

// Custom modules for User APIs
import employeeAPISchema from '../APISchema/employeeAPISchema';
import { add_employees, update_employees, view_employee_where_clause } from '../helpers/types';
import Generator from '../helpers/generator';
// import leaveManager from '../helpers/leaveManager';

// Initialize Database Client
const dbClient = new PrismaClient();


export default {
    name: "EmployeeAPIs",

    async add_employees(req: Request, res: Response) {
        try {
            let reqHeaders = {...req.headers}
            let reqData = {...req.body}
            
            let user = await Authentication.getUser(reqHeaders.authorization ? reqHeaders.authorization : "");
            if(user == null) {
                let response = exceptionHandler.handle({"key": "authorization", "message": "User doesn't exist"});
                res.status(response[0]).json(response[1]);
                return;
            }

            if(reqData.length == 0) {
                let response = Utils.response406("Can't accept empty list", {});
                res.status(response[0]).json(response[1]);
                return;
            }
            
            let error: Array<object> = [];
            let validData: Array<add_employees> = [];
            
            let allRoleIDs = (await dbClient.role.findMany({
                select: {
                    id: true
                }
            })).map(obj => obj.id);

            for(let i in reqData) {
                let iValidation = Validator.validateObjData(employeeAPISchema.add_employee_schema, reqData[i]);
                if(iValidation.error && iValidation.error.details[0].context?.key) {
                    let tempError = {"email": reqData[i].email, error: {}};
                    tempError.error = Utils.createObject(iValidation.error.details[0].context?.key, iValidation.error.details[0].message);
                    error.push({...tempError});
                    continue;
                }

                if(!allRoleIDs.includes(reqData[i].roleId)) {
                    delete reqData[i].roleId;
                }
                
                validData.push({...reqData[i]});
            }

            let existing_emails = await (await dbClient.user.findMany({
                select: {
                    email: true
                }
            })).map(obj => obj.email);

            validData.forEach(obj => {
                obj["isStaff"] = true
            });

            let newEntries = await dbClient.user.createMany({
                data: validData,
                skipDuplicates: true
            });

            let validEmails = validData.map(obj => obj.email);
            let newUsers = await dbClient.user.findMany({
                where: {
                    email: {
                        in: validEmails
                    },
                    isStaff: true,
                    status: false,
                    emailVerified: false
                }
            });

            for(let emp of newUsers) {
                // await leaveManager.add_all_leaves_to_user(emp);

                let emailToken = await Authentication.generateEmailToken();
                let verificationLink = await dbClient.verification.create({
                    data: {
                        userId: emp.id,
                        type: VerificationTypeEnum.USER_REGISTRATION,
                        token: emailToken
                    }
                });
                MailBackend.send(emp.email, "Welcome to HRM", "userRegistration", {
                    link: Utils.generateFrontEndURL("user-registration", emp.email, verificationLink.token)
                });
            }
            let errorEmails = existing_emails.filter(function(obj) {return validEmails.includes(obj)});
            for(let email in errorEmails) {
                let tempError = {"email": errorEmails[email], "error": {}};
                tempError.error = Utils.createObject("email", "User already exist");
                error.push({...tempError});
            }
            
            let response = Utils.response200(`${newEntries.count} Users added successfully`, {error: error});
            res.status(response[0]).json(response[1]);
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: employeeAPI.ts ~ add_employee", e);
            }

            let response = exceptionHandler.handle(e);
            res.status(response[0]).json(response[1]);
        }
    },
    
    async remove_employees(req: Request, res: Response) {
        try {
            let reqHeaders = {...req.headers}
            let reqData = {...req.body}

            let user = await Authentication.getUser(reqHeaders.authorization ? reqHeaders.authorization : "");
            if(user == null) {
                let response = exceptionHandler.handle({"key": "authorization", "message": "User doesn't exist"});
                res.status(response[0]).json(response[1]);
                return;
            }

            let validation = Validator.validateArrayData(employeeAPISchema.remove_employee_schema, reqData.EmployeeID);
            if(validation.error) {
                let response = Utils.response406("Validation Error", Utils.createObject(validation.error.details[0].context?.key, validation.error.details[0].message));
                res.status(response[0]).json(response[1]);
                return;
            }

            let error: Array<object> = [];

            let allAdminIds = await (await dbClient.user.findMany({
                where: {
                    AND: {
                        OR: [
                            {
                                isAdmin: true
                            },
                            {
                                isSubAdmin: true
                            },
                            {
                                isSuperAdmin: true
                            }
                        ]
                    }
                }
            })).map(obj => Number(obj.id));

            for(let i in reqData.EmployeeID) {
                if(allAdminIds.includes(reqData.EmployeeID[i])) {
                    let targetUser = await dbClient.user.findUnique({
                        where: {
                            id: reqData.EmployeeID[i]
                        }
                    });
                    error.push({
                        id: reqData.EmployeeID[i],
                        firstName: targetUser?.firstName,
                        middleName: targetUser?.middleName,
                        lastName: targetUser?.lastName,
                        message: "Can't delete user with admin privileges"
                    });
                }
            }

            let updateEntries = await dbClient.user.updateMany({
                where: {
                    id: {
                        in: reqData.EmployeeID,
                        not: user.id
                    },
                    AND: [
                        {isSuperAdmin: false},
                        {isAdmin: false},
                        {isStaff: true},
                        {softDelete: false}
                    ]
                },
                data: {
                    status: false,
                    softDelete: true
                }
            });
            
            if(reqData.EmployeeID.includes(Number(user.id))) {
                error.push({id: Number(user.id), name: `${user.firstName}`, message: "User can't delete himself!"});
            }

            let response = Utils.response200(`Users removed successfully`, {error: error});
            if(updateEntries.count == 0) {
                response = Utils.response200(`Can't remove selected users`, {error: error});
            }
            else if(updateEntries.count == 1) {
                response = Utils.response200(`User removed successfully`, {error: error});
            }
            res.status(response[0]).json(response[1]);
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: employeeAPI.ts ~ remove_employee", e);
            }

            let response = exceptionHandler.handle(e);
            res.status(response[0]).json(response[1]);
        }
    },

    async view_employees(req: Request, res: Response) {
        try {
            let reqHeaders = {...req.headers}
            let reqQuery = {...req.query}
            
            let user = await Authentication.getUser(reqHeaders.authorization ? reqHeaders.authorization : "");
            if(user == null) {
                let response = exceptionHandler.handle({"key": "authorization", "message": "User doesn't exist"});
                res.status(response[0]).json(response[1]);
                return;
            }
            
            let limit: number = 10000;
            let offset: number = 0;
            let search: string = String();
            let orderBy: Prisma.UserOrderByWithRelationInput = {
                email: "asc",
                firstName: "asc",
                lastName: "asc",
                role: {
                    role: "asc"
                }
            };
            
            if(reqQuery.limit) {
                let validation = Validator.validateNumberString(employeeAPISchema.view_employee_schema_limit, reqQuery.limit.toString());
                if(!validation.error) {
                    limit = parseInt(reqQuery.limit.toString())
                }
            }

            if(reqQuery.offset) {
                let validation = Validator.validateNumberString(employeeAPISchema.view_employee_schema_limit, reqQuery.offset.toString());
                if(!validation.error) {
                    offset = parseInt(reqQuery.offset.toString())
                }
            }

            if(reqQuery.search) {
                let validation = Validator.validateStringData(reqQuery.search.toString());
                if(!validation.error) {
                    search = reqQuery.search.toString();
                }
            }

            let where: view_employee_where_clause = {
                isStaff: true,
                isAdmin: false,
                isSubAdmin: false,
                status: false,
                email: "",
                emailVerified: false,
                softDelete: false,
                AND: [{
                    OR: [
                        {
                            firstName:{
                                contains: search,
                                mode: "insensitive"
                            }
                        },
                        {
                            middleName: {
                                contains: search,
                                mode: "insensitive"
                            }
                        },
                        {
                            lastName: {
                                contains: search,
                                mode: "insensitive"
                            }
                        },
                        {
                            email: {
                                contains: search,
                                mode: "insensitive"
                            }
                        }
                    ]
                }]
            }

            if(reqQuery.isAdmin === "true") {
                where.isAdmin = true;
            }
            else if(reqQuery.isAdmin === "false") {
                where.isAdmin = false;
            }
            else {
                delete where.isAdmin;
            }

            if(reqQuery.isSubAdmin === "true") {
                where.isSubAdmin = true;
            }
            else if(reqQuery.isSubAdmin === "false") {
                where.isSubAdmin = false;
            }
            else {
                delete where.isSubAdmin;
            }

            if(reqQuery.status === "true") {
                where.status = true;
            }
            else if(reqQuery.status === "false") {
                where.status = false;
            }
            else {
                delete where.status;
            }

            if(reqQuery.emailVerified === "true") {
                where.emailVerified = true;
            }
            else if(reqQuery.emailVerified === "false") {
                where.emailVerified = false;
            }
            else {
                delete where.emailVerified;
            }

            if(reqQuery.email) {
                where.email = String(reqQuery.email);
            }
            else {
                delete where.email;
            }

            for(let i in orderBy) {
                if(i != reqQuery.orderBy) {
                    if(i == "email") {
                        delete orderBy.email;
                    }
                    else if(i == "firstName") {
                        delete orderBy.firstName;
                    }
                    else if(i == "lastName") {
                        delete orderBy.lastName;
                    }
                    else if(i == "role") {
                        delete orderBy.role;
                    }
                }
            }

            if(reqQuery.sort == "asc" || reqQuery.sort == "desc") {
                for(let i in orderBy) {
                    if(i == "email") {
                        orderBy.email = reqQuery.sort;
                    }
                    else if(i == "firstName") {
                        orderBy.firstName = reqQuery.sort;
                    }
                    else if(i == "lastName") {
                        orderBy.lastName = reqQuery.sort;
                    }
                    else if(i == "role") {
                        orderBy.role = {role: reqQuery.sort};
                    }
                }
            }

            let employees = await (await dbClient.user.findMany({
                where: where,
                include: {
                    role: true
                },
                skip: offset,
                take: limit,
                orderBy: orderBy
            })).map(function(obj) {
                return {
                    "id": Number(obj.id),
                    "role": {
                        "roleId": Number(obj.roleId),
                        "role": obj.role?.role
                    },
                    "email": obj.email,
                    "firstName": obj.emailVerified? obj.firstName : "Not yet registered",
                    "middleName": obj.emailVerified? obj.middleName : "Not yet registered",
                    "lastName": obj.emailVerified? obj.lastName : "Not yet registered",
                    "status": obj.status,
                    "isAdmin": obj.isAdmin,
                    "isSubAdmin": obj.isSubAdmin,
                    "emailVerified": obj.emailVerified,
                    "mobile": obj.mobile,
                    "userInfo": obj.userInfo ? obj.userInfo : Object()
                }
            });

            if(reqQuery.export == "true") {
                let csv = await Generator.csv("employee_list", user, employees);
                if(csv[0]) {
                    MailBackend.send_attachments(user.email, "Exported Data", "exportFunctionality", {
                        table: "Employees"
                    }, [{filename: "employee_list.csv", path: csv[1]}]);
                    
                    let response = Utils.response200("Successfully send exported data, please check your email", {});
                    res.status(response[0]).json(response[1]);
                }
                else {
                    let response = Utils.response400(csv[1])
                    res.status(response[0]).json(response[1]);
                }

                return;
            }

            let totalEmployees = await dbClient.user.count({
                where: where
            });

            let response = Utils.response200("Successfully fetched employee list", {count: totalEmployees, employees: employees});
            res.status(response[0]).json(response[1]);
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: employeeAPI.ts ~ view_employees", e);
            }

            let response = exceptionHandler.handle(e);
            res.status(response[0]).json(response[1]);
        }
    },

    async update_employee(req: Request, res: Response) {
        try {
            let reqHeaders = {...req.headers}
            let reqData = {...req.body}

            let user = await Authentication.getUser(reqHeaders.authorization ? reqHeaders.authorization : "");
            if(user == null) {
                let response = exceptionHandler.handle({"key": "authorization", "message": "User doesn't exist"});
                res.status(response[0]).json(response[1]);
                return;
            }
            
            let validation = Validator.validateObjData(employeeAPISchema.update_employee_schema, reqData);
            if(validation.error) {
                let response = Utils.response406("Validation Error", Utils.createObject(validation.error.details[0].context?.key, validation.error.details[0].message));
                res.status(response[0]).json(response[1]);
                return;
            }

            let allRoleIDs = (await dbClient.role.findMany({
                where: {
                },
                select: {
                    id: true
                }
            })).map(obj => obj.id);

            let allMobileNumbers = await (await dbClient.user.findMany({
                where: {
                    softDelete: false
                },
                select: {
                    mobile: true
                }
            })).map(obj => String(obj.mobile));

            if(allMobileNumbers.includes(reqData.mobile)) {
                let mobileNumberOwner = await (await dbClient.user.findMany({
                    where: {
                        mobile: reqData.mobile
                    },
                    select: {
                        id: true
                    }
                }))[0];

                if(mobileNumberOwner?.id != BigInt(reqData.id)) {
                    let response = Utils.response406("Validation Error", Utils.createObject("mobile", "Mobile number already exist"));
                    res.status(response[0]).json(response[1]);
                    return;
                }
            }

            let updateUserData: update_employees = {
                firstName: reqData.firstName,
                middleName: reqData.middleName,
                lastName: reqData.lastName,
                isSubAdmin: reqData.isSubAdmin,
                status: reqData.status,
                mobile: reqData.mobile && reqData.mobile.length > 0 ? reqData.mobile : null,
                userInfo: reqData.userInfo,
                roleId: BigInt(reqData.role)
            }

            if(reqData.type && allRoleIDs.includes(BigInt(reqData.role))) {
                updateUserData.roleId = reqData.role;
            }
            else if (reqData.role == 0) {
                updateUserData.roleId = null;
            }

            let updateEntries = {count: 0} 
            let candidate = await dbClient.user.findMany({
                where: {
                    id: BigInt(reqData.id)
                }
            });

            if(candidate[0].isAdmin || candidate[0].isSuperAdmin) {
                let response = Utils.response406("Validation Error", Utils.createObject("User", "Can't change user with admin / super admin privileges"));
                res.status(response[0]).json(response[1]);
                return;
            }

            if(candidate[0].isSubAdmin != reqData.isSubAdmin && !user.isAdmin && !user.isSuperAdmin) {
                let response = Utils.response406("Validation Error", Utils.createObject("User", "Only admin can change SubAdmin status"));
                res.status(response[0]).json(response[1]);
                return;
            }

            updateEntries = await dbClient.user.updateMany({
                where: {
                    id: BigInt(reqData.id),
                    softDelete: false,
                    isSuperAdmin: false,
                    emailVerified: true
                },
                data: updateUserData
            });

            let response = Utils.response200("Users updated successfully", {});
            if(updateEntries.count == 0) {
                response = Utils.response406("Can't update user", {});
            }
            res.status(response[0]).json(response[1]);
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: employeeAPI.ts ~ update_employee", e);
            }

            let response = exceptionHandler.handle(e);
            res.status(response[0]).json(response[1]);
        }
    }
}