// Imported modules
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

// Custom modules for all APIs
import Utils from "../helpers/utils";
import Generator from "../helpers/generator";
import Validator from '../helpers/validation';
import MailBackend from "../helpers/mailBackend";
import Authentication from '../helpers/authentication';
import exceptionHandler from '../helpers/exceptionHandler';
import { add_roles, set_permissions, update_roles, view_roles } from '../helpers/types';

// Custom modules for role APIs
import roleAPISchema from '../APISchema/roleAPISchema';

// Initialize Database Client
const dbClient = new PrismaClient();


export default {
    name: "roleAPIs",

    async add_role(req: Request, res: Response) {
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
            let validRoleData: add_roles;
            let validPermissionData: Array<set_permissions> = [];

            let allRoles: Array<string> = await (await dbClient.role.findMany({
                where: {
                    softDelete: false
                }
            })).map(obj => obj.role);

            let allRoleCode: Array<any> = await (await dbClient.role.findMany({
                where: {
                    softDelete: false
                }
            })).map(obj => obj.code);

            let allPermissionComponents = await (await dbClient.permission.findMany({
                select: {
                    componentName: true
                }
            })).map(obj => obj.componentName);

            let allPermissions = await (await dbClient.permission.findMany({
                select: {
                    id: true,
                    componentName: true
                }
            })).map(obj => obj);

            let validation = Validator.validateObjData(roleAPISchema.add_role, reqData);
            if(validation.error) {
                let response = Utils.response406("validation Error", Utils.createObject(validation.error.details[0].context?.key, validation.error.details[0].message));
                res.status(response[0]).json(response[1]);
                return;
            }
            else if(allRoles.includes(reqData.role)) {
                let response = Utils.response406("validation Error", Utils.createObject("role", "Role already exist"));
                res.status(response[0]).json(response[1]);
                return;
            }
            else if (allRoleCode.includes(reqData.code)) {
                let response = Utils.response406("validation Error", Utils.createObject("code", "Code already exist"));
                res.status(response[0]).json(response[1]);
                return;
            }

            validRoleData = {
                role: reqData.role,
                code: reqData.code
            };

            let newRole = await dbClient.role.create({
                data: validRoleData
            });

            for(let i in reqData.permissions) {
                if(!allPermissionComponents.includes(reqData.permissions[i].componentName.toUpperCase())) {
                    let tempError = {"roleID": Number(newRole.id), "error": {}}
                    tempError.error = Utils.createObject("ComponentName", "Invalid permission component name");
                    error.push({...tempError});
                    continue;
                }

                validPermissionData.push({...reqData.permissions[i]});
            }

            for(let i in validPermissionData) {
                let perm = allPermissions.find(obj => obj.componentName == validPermissionData[i].componentName.toUpperCase());
                if(perm){
                    try {
                        await dbClient.rolePermission.create({
                            data: {
                                roleId: newRole.id,
                                permissionId: perm?.id,
                                add: validPermissionData[i].add,
                                view: validPermissionData[i].view,
                                update: validPermissionData[i].update,
                                delete: validPermissionData[i].delete
                            }
                        });
                    }
                    catch(e) {
                        continue;
                    }
                }
                else {
                    let tempError = {"roleID": reqData.roleID, "error": {}}
                    tempError.error = Utils.createObject("ComponentName", "Invalid permission component name");
                    error.push({...tempError});
                    continue;
                }
            }
            
            let response = Utils.response200("Role added successfully", {error: error, id: Number(newRole.id)});
            res.status(response[0]).json(response[1]);
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: roleAPI.ts ~ add_role", e);
            }

            let response = exceptionHandler.handle(e);
            res.status(response[0]).json(response[1]);
        }
    },

    async remove_roles(req: Request, res: Response) {
        try {
            let reqHeaders = {...req.headers}
            let reqData = {...req.body}

            let user = await Authentication.getUser(reqHeaders.authorization ? reqHeaders.authorization : "");
            if(user == null) {
                let response = exceptionHandler.handle({"key": "authorization", "message": "User doesn't exist"});
                res.status(response[0]).json(response[1]);
                return;
            }

            let validation = Validator.validateObjData(roleAPISchema.remove_role, reqData);
            if(validation.error) {
                let response = Utils.response406("validation Error", Utils.createObject(validation.error.details[0].context?.key, validation.error.details[0].message));
                res.status(response[0]).json(response[1]);
                return;
            }

            let error: Array<object> = [];
            await dbClient.role.updateMany({
                where: {
                    id: {
                        in: reqData.roleID,
                    },
                    softDelete: false
                },
                data: {
                    status: false,
                    softDelete: true
                }
            });

            await dbClient.rolePermission.deleteMany({
                where: {
                    roleId: {
                        in: reqData.roleID
                    }
                }
            });

            let updateEntries = await dbClient.user.updateMany({
                where: {
                    roleId: {
                        in: reqData.roleID
                    },
                },
                data: {
                    roleId: null
                }
            });

            let response = Utils.response200(`Roles removed successfully`, {error: error});
            if(updateEntries.count == 0) {
                response = Utils.response200(`Can't update selected roles`, {error: error});
            }
            else if(updateEntries.count == 1) {
                response = Utils.response200(`Role removed successfully`, {error: error});
            }
            res.status(response[0]).json(response[1]);
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: roleAPI.ts ~ remove_roles", e);
            }

            let response = exceptionHandler.handle(e);
            res.status(response[0]).json(response[1]);
        }
    },

    async view_roles(req: Request, res: Response) {
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

            if(reqQuery.limit) {
                let validation = Validator.validateNumberString(roleAPISchema.view_role_limit, reqQuery.limit.toString());
                if(!validation.error) {
                    limit = parseInt(reqQuery.limit.toString())
                }
            }

            if(reqQuery.offset) {
                let validation = Validator.validateNumberString(roleAPISchema.view_role_offset, reqQuery.offset.toString());
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

            let where: view_roles = {
                status: false,
                softDelete: false,
                // AND: [{
                //     OR: [
                //         {
                //             role:{
                //                 contains: search,
                //                 mode: "insensitive"
                //             }
                //         },
                //         {
                //             code: {
                //                 contains: search,
                //                 mode: "insensitive"
                //             }
                //         }
                //     ]
                // }]
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

            let roles = await Promise.all(await (await dbClient.role.findMany({
                where: where,
                skip: offset,
                take: limit,
                orderBy: {
                    createdDate: "desc"
                }
            })).map(async function(obj) {
                let rolePermission = await (await dbClient.rolePermission.findMany({
                    where: {
                        roleId: obj.id
                    },
                    include: {
                        perm: true
                    }
                })).map(function(obj) {
                    return {
                        "componentName": obj.perm.componentName,
                        "add": obj.add,
                        "view": obj.view,
                        "update": obj.update,
                        "delete": obj.delete
                    }
                });

                return {
                    "id": Number(obj.id),
                    "role": obj.role,
                    "code": obj.code,
                    "status": obj.status,
                    "permission": rolePermission
                }
            }));

            if(reqQuery.export == "true") {
                let csv = await Generator.csv("roles", user, roles);
                if(csv[0]) {
                    MailBackend.send_attachments(user.email, "Exported Data", "exportFunctionality", {
                        table: "roles"
                    }, [{filename: "roles.csv", path: csv[1]}]);
                    
                    let response = Utils.response200("Successfully send exported data, please check your email", {});
                    res.status(response[0]).json(response[1]);
                }
                else {
                    let response = Utils.response400(csv[1])
                    res.status(response[0]).json(response[1]);
                }

                return;
            }

            let totalRoles = await dbClient.role.count({
                where: {
                    softDelete: false,
                    AND: [{
                        OR: [
                            {
                                role:{
                                    contains: search,
                                    mode: "insensitive"
                                }
                            },
                            {
                                code: {
                                    contains: search,
                                    mode: "insensitive"
                                }
                            }
                        ]
                    }]
                }
            });

            let response = Utils.response200("Successfully fetched role list", {count: totalRoles, roles: roles});
            res.status(response[0]).json(response[1]);
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: roleAPI.ts ~ view_roles", e);
            }

            let response = exceptionHandler.handle(e);
            res.status(response[0]).json(response[1]);
        }
    },

    async update_role(req: Request, res: Response) {
        try {
            let reqHeaders = {...req.headers}
            let reqData = {...req.body}

            let error: Array<object> = [];
            let validPermissionData: Array<set_permissions> = [];

            let allPermissionComponents = await (await dbClient.permission.findMany({
                select: {
                    componentName: true
                }
            })).map(obj => obj.componentName);

            let allPermissions = await (await dbClient.permission.findMany({
                select: {
                    id: true,
                    componentName: true
                }
            })).map(obj => obj);

            let user = await Authentication.getUser(reqHeaders.authorization ? reqHeaders.authorization : "");
            if(user == null) {
                let response = exceptionHandler.handle({"key": "authorization", "message": "User doesn't exist"});
                res.status(response[0]).json(response[1]);
                return;
            }

            let updateRoleData: update_roles = {
                role: reqData.role,
                code: reqData.code,
                status: reqData.status
            }

            let allRoles: Array<string> = await (await dbClient.role.findMany({
                where: {
                    AND: [
                        {
                            id: {
                                not: BigInt(reqData.id)
                            }
                        },
                        {
                            softDelete: false
                        },
                    ]
                }
            })).map(obj => obj.role);

            let allRoleCode: Array<any> = await (await dbClient.role.findMany({
                where: {
                    softDelete: false,
                    AND: {
                        id: {
                            not: BigInt(reqData.id)
                        }
                    }
                }
            })).map(obj => obj.code);

            if(allRoles.includes(reqData.role)) {
                let response = Utils.response406("validation Error", Utils.createObject("role", "role already exist"));
                res.status(response[0]).json(response[1]);
                return;
            }

            if(allRoleCode.includes(reqData.code)) {
                let response = Utils.response406("validation Error", Utils.createObject("code", "Code already exist"));
                res.status(response[0]).json(response[1]);
                return;
            }

            let updateEntries = await dbClient.role.updateMany({
                where: {
                    id: BigInt(reqData.id),
                },
                data: updateRoleData
            });

            if(updateEntries.count > 0) {
                for(let i in reqData.permissions) {
                    if(!allPermissionComponents.includes(reqData.permissions[i].componentName.toUpperCase())) {
                        let tempError = {"roleID": reqData.roleID, "error": {}}
                        tempError.error = Utils.createObject("ComponentName", "Invalid permission component name");
                        error.push({...tempError});
                        continue;
                    }

                    validPermissionData.push({...reqData.permissions[i]});
                }

                let allRemainingPermissionIDs = validPermissionData.map(function(remainingPerm) {
                    let obj = allPermissions.find(perm => perm.componentName == remainingPerm.componentName);
                    return obj ? obj.id : BigInt(0)
                });

                await dbClient.rolePermission.deleteMany({
                    where: {
                        id: {
                            notIn: allRemainingPermissionIDs
                        },
                        roleId: BigInt(reqData.id)
                    }
                });
    
                for(let i in validPermissionData) {
                    let previousPermission = await dbClient.rolePermission.findMany({
                        where: {
                            roleId: BigInt(reqData.id),
                            perm: {
                                componentName: validPermissionData[i].componentName
                            }
                        }
                    });
        
                    if(previousPermission.length > 0) {
                        await dbClient.rolePermission.update({
                            where: {
                                id: previousPermission[0].id
                            },
                            data: {
                                add: validPermissionData[i].add,
                                update: validPermissionData[i].update,
                                delete: validPermissionData[i].delete,
                                view: validPermissionData[i].view
                            }
                        });
                        continue;
                    }
                    let perm = allPermissions.find(obj => obj.componentName == validPermissionData[i].componentName.toUpperCase());
                    if(perm){
                        try {
                            await dbClient.rolePermission.create({
                                data: {
                                    roleId: BigInt(reqData.id),
                                    permissionId: perm?.id,
                                    add: validPermissionData[i].add,
                                    update: validPermissionData[i].update,
                                    delete: validPermissionData[i].delete,
                                    view: validPermissionData[i].view
                                }
                            });
                        }
                        catch(e) {
                            continue;
                        }
                    }
                    else {
                        let tempError = {"roleID": reqData.roleID, "error": {}}
                        tempError.error = Utils.createObject("ComponentName", "Invalid permission component name");
                        error.push({...tempError});
                        continue;
                    }
                }
            }

            let response = Utils.response200("Successfully updated user role", {});
            if(updateEntries.count == 0) {
                response = Utils.response406("Can't update role", {});
            }
            res.status(response[0]).json(response[1]);
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: roleAPI.ts ~ update_role", e);
            }

            let response = exceptionHandler.handle(e);
            res.status(response[0]).json(response[1]);
        }
    }
}