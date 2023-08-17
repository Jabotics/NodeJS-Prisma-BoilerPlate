import { PrismaClient, User } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

import Authentication from '../helpers/authentication';
import exceptionHandler from '../helpers/exceptionHandler';
import Utils from '../helpers/utils';

const dbClient = new PrismaClient();


export default {
    name: "PermissionManager",
    types: {
        roles: "ROLES",
        brands: "BRANDS",
        vehicles: "VEHICLES",
        employees: "EMPLOYEES",
        customers: "CUSTOMERS",
        inquiries: "INQUIRIES",
        marketing: "SOCIAL LINKS",
        owned_vehicles: "CAR DETAILS"
    },

    add(componentName: string) {
        return async function(req: Request, res: Response, next: NextFunction) {
            let user = await Authentication.getUser(req.headers.authorization ? req.headers.authorization : "");
            if(user == null) {
                let response = exceptionHandler.handle({"key": "authorization", "message": "User doesn't exist"});
                res.status(response[0]).json(response[1]);
                return;
            }
            
            let permission = await dbClient.rolePermission.findMany({
                where: {
                    roleId: user.roleId ? user.roleId : BigInt(0),
                    perm: {
                        componentName: componentName
                    }
                }
            });
            let response = Utils.response403("Permission denied", {});
            
            if(user.isAdmin || user.isSubAdmin || user.isSuperAdmin) {
                next();
                return;
            }
            else if(permission.length == 0) {
                res.status(response[0]).json(response[1]);
                return;
            }
            else if(!permission[0].add) {
                res.status(response[0]).json(response[1]);
                return;
            }
            
            next();
        }
    },
    
    update(componentName: string) {
        return async function(req: Request, res: Response, next: NextFunction) {
            let user = await Authentication.getUser(req.headers.authorization ? req.headers.authorization : "");
            if(user == null) {
                let response = exceptionHandler.handle({"key": "authorization", "message": "User doesn't exist"});
                res.status(response[0]).json(response[1]);
                return;
            }
            
            let permission = await dbClient.rolePermission.findMany({
                where: {
                    roleId: user.roleId ? user.roleId : BigInt(0),
                    perm: {
                        componentName: componentName
                    }
                }
            });
            let response = Utils.response403("Permission denied", {});
            
            if(user.isAdmin || user.isSubAdmin || user.isSuperAdmin) {
                next();
                return;
            }
            else if(permission.length == 0) {
                res.status(response[0]).json(response[1]);
                return;
            }
            else if(!permission[0].update) {
                res.status(response[0]).json(response[1]);
                return;
            }
            
            next();
        }
    },

    remove(componentName: string) {
        return async function (req: Request, res: Response, next: NextFunction) {
            let user = await Authentication.getUser(req.headers.authorization ? req.headers.authorization : "");
            if(user == null) {
                let response = exceptionHandler.handle({"key": "authorization", "message": "User doesn't exist"});
                res.status(response[0]).json(response[1]);
                return;
            }
            
            let permission = await dbClient.rolePermission.findMany({
                where: {
                    roleId: user.roleId ? user.roleId : BigInt(0),
                    perm: {
                        componentName: componentName
                    }
                }
            });
            let response = Utils.response403("Permission denied", {});
            
            if(user.isAdmin || user.isSubAdmin || user.isSuperAdmin) {
                next();
                return;
            }
            else if(permission.length == 0) {
                res.status(response[0]).json(response[1]);
                return;
            }
            else if(!permission[0].delete) {
                res.status(response[0]).json(response[1]);
                return;
            }
            
            next();
        }
    },

    view(componentName: string) {
        return async function (req: Request, res: Response, next: NextFunction) {
            let user = await Authentication.getUser(req.headers.authorization ? req.headers.authorization : "");
            if(user == null) {
                let response = exceptionHandler.handle({"key": "authorization", "message": "User doesn't exist"});
                res.status(response[0]).json(response[1]);
                return;
            }
            
            let permission = await dbClient.rolePermission.findMany({
                where: {
                    roleId: user.roleId ? user.roleId : BigInt(0),
                    perm: {
                        componentName: componentName
                    }
                }
            });
            let response = Utils.response403("Permission denied", {});
            
            if(user.isAdmin || user.isSubAdmin || user.isSuperAdmin) {
                next();
                return;
            }
            else if(permission.length == 0) {
                res.status(response[0]).json(response[1]);
                return;
            }
            else if(!permission[0].view) {
                res.status(response[0]).json(response[1]);
                return;
            }
            
            next();
        }
    },

    async admin(req: Request, res: Response, next: NextFunction) {
        let user = await Authentication.getUser(req.headers.authorization ? req.headers.authorization : "");
        if(user == null) {
            let response = exceptionHandler.handle({"key": "authorization", "message": "User doesn't exist"});
            res.status(response[0]).json(response[1]);
            return;
        }
        
        if(!user.isAdmin && !user.isSubAdmin && !user.isSuperAdmin) {
            let response = Utils.response403("Permission denied", {});
            res.status(response[0]).json(response[1]);
            return;
        }
        
        next();
    },

    async superAdmin(req: Request, res: Response, next: NextFunction) {
        let user = await Authentication.getUser(req.headers.authorization ? req.headers.authorization : "");
        if(user == null) {
            let response = exceptionHandler.handle({"key": "authorization", "message": "User doesn't exist"});
            res.status(response[0]).json(response[1]);
            return;
        }
        
        if(!user.isSuperAdmin) {
            let response = Utils.response403("Permission denied", {});        
            res.status(response[0]).json(response[1]);    
            return;
        }
        
        next();
    },

    async staff(req: Request, res: Response, next: NextFunction) {
        let user = await Authentication.getUser(req.headers.authorization ? req.headers.authorization : "");
        if(user == null) {
            let response = exceptionHandler.handle({"key": "authorization", "message": "User doesn't exist"});
            res.status(response[0]).json(response[1]);
            return;
        }
        
        if(!user.isStaff && !user.isAdmin && !user.isSubAdmin && !user.isSuperAdmin) {
            let response = Utils.response403("Permission denied", {});        
            res.status(response[0]).json(response[1]);    
            return;
        }
        
        next();
    }
}