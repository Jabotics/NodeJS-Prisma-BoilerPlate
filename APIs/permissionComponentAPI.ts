// Imported modules
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

// Custom modules for all APIs
import Utils from "../helpers/utils";
import Validator from '../helpers/validation'
import Authentication from '../helpers/authentication';
import exceptionHandler from '../helpers/exceptionHandler';

// Custom modules for PermissionComponent APIs
import permissionComponentAPISchema from '../APISchema/permissionComponentAPISchema';
import { role_permission } from '../helpers/types';

// Initialize Database Client
const dbClient = new PrismaClient();


export default {
    name: "PermissionComponentAPIs",

    async add_permission_component(req: Request, res: Response) {
        try {
            let reqHeaders = {...req.headers}
            let reqData = {...req.body}
            
            let user = await Authentication.getUser(reqHeaders.authorization ? reqHeaders.authorization : "");
            if(user == null) {
                let response = exceptionHandler.handle({"key": "authorization", "message": "User doesn't exist"});
                res.status(response[0]).json(response[1]);
                return;
            }

            let validation = Validator.validateObjData(permissionComponentAPISchema.add_permission_component, reqData);
            if(validation.error) {
                let response = Utils.response406("Validation Error", Utils.createObject(validation.error.details[0].context?.key, validation.error.details[0].message));
                res.status(response[0]).json(response[1]);
                return;
            }

            let newPermissionComponent = await dbClient.permission.create({
                data: {
                    componentName: reqData.componentName
                }
            });

            let allRoles = await (await dbClient.role.findMany()).map(obj => obj.id);

            let data: Array<role_permission> = []
            for(let roleId in allRoles) {
                if(allRoles[roleId]) {
                    data.push({
                        roleId: allRoles[roleId],
                        permissionId: newPermissionComponent.id,
                        add: false,
                        delete: false,
                        update: false,
                        view: false
                    });
                }
            }

            await dbClient.rolePermission.createMany({
                data: data
            });

            let response = Utils.response200("Successfully added permission component", {id: Number(newPermissionComponent.id)}); 
            res.status(response[0]).json(response[1]);
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: permissionComponentAPI.ts ~ add_permission_component", e);
            }

            let response = exceptionHandler.handle(e);
            res.status(response[0]).json(response[1]);
        }
    },

    async view_permission_components(req: Request, res: Response) {
        try {
            let reqHeaders = {...req.headers}
            
            let user = await Authentication.getUser(reqHeaders.authorization ? reqHeaders.authorization : "");
            if(user == null) {
                let response = exceptionHandler.handle({"key": "authorization", "message": "User doesn't exist"});
                res.status(response[0]).json(response[1]);
                return;
            }

            let allPermissionComponents = await (await dbClient.permission.findMany(
                {
                    select: {
                        id: true, 
                        componentName: true
                    },
                    orderBy: {
                        createdDate: "desc"
                    }
                })).map(function(obj) {
                    return {
                        "id": Number(obj.id),
                        "componentName": obj.componentName
                    }
                });
            let response = Utils.response200("Successfully fetched permission components", {allPermissionComponents: allPermissionComponents});
            res.status(response[0]).json(response[1]);
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: permissionComponentAPI.ts ~ view_permission_components", e);
            }

            let response = exceptionHandler.handle(e);
            res.status(response[0]).json(response[1]);
        }
    },

    async remove_permission_component(req: Request, res: Response) {
        try {
            let reqHeaders = {...req.headers}
            let reqData = {...req.body}
            
            let user = await Authentication.getUser(reqHeaders.authorization ? reqHeaders.authorization : "");
            if(user == null) {
                let response = exceptionHandler.handle({"key": "authorization", "message": "User doesn't exist"});
                res.status(response[0]).json(response[1]);
                return;
            }

            let validation = Validator.validateObjData(permissionComponentAPISchema.remove_permission_component, reqData);
            if(validation.error) {
                let response = Utils.response406("Validation Error", Utils.createObject(validation.error.details[0].context?.key, validation.error.details[0].message));
                res.status(response[0]).json(response[1]);
                return;
            }

            await dbClient.permission.delete({
                where: {
                    id: BigInt(reqData.id)
                }
            });

            let response = Utils.response200("Successfully removed permission component", {}); 
            res.status(response[0]).json(response[1]);
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: permissionComponentAPI.ts ~ remove_permission_component", e);
            }

            let response = exceptionHandler.handle(e);
            res.status(response[0]).json(response[1]);
        }
    },

    async update_permission_component(req: Request, res: Response) {
        try {
            let reqHeaders = {...req.headers}
            let reqData = {...req.body}
            
            let user = await Authentication.getUser(reqHeaders.authorization ? reqHeaders.authorization : "");
            if(user == null) {
                let response = exceptionHandler.handle({"key": "authorization", "message": "User doesn't exist"});
                res.status(response[0]).json(response[1]);
                return;
            }

            let validation = Validator.validateObjData(permissionComponentAPISchema.update_permission_component, reqData);
            if(validation.error) {
                let response = Utils.response406("Validation Error", Utils.createObject(validation.error.details[0].context?.key, validation.error.details[0].message));
                res.status(response[0]).json(response[1]);
                return;
            }

            await dbClient.permission.update({
                where: {
                    id: BigInt(reqData.id)
                },
                data: {
                    componentName: reqData.componentName
                }
            });

            let response = Utils.response200("Successfully updated permission component", {}); 
            res.status(response[0]).json(response[1]);
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: permissionComponentAPI.ts ~ update_permission_components", e);
            }

            let response = exceptionHandler.handle(e);
            res.status(response[0]).json(response[1]);
        }
    }
}