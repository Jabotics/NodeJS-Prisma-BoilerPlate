// Imported modules
import { Request, Response } from 'express';
import { PrismaClient, VerificationTypeEnum } from '@prisma/client';

// Custom modules for all APIs
import Utils from "../helpers/utils";
import Validator from '../helpers/validation'
import MailBackend from "../helpers/mailBackend"
import Authentication from '../helpers/authentication';
import exceptionHandler from '../helpers/exceptionHandler';

// Custom modules for Authentication APIs
import { user_registration } from '../helpers/types';
import authenticationAPISchema from '../APISchema/authenticationAPISchema';

// Initialize Database Client
const dbClient = new PrismaClient();


export default {
    name: "AuthenticationAPIs",

    async user_registration(req: Request, res: Response) {
        try {
            let reqData = {...req.body};
            let validation = Validator.validateObjData(authenticationAPISchema.register_user_schema, reqData);
            
            if(validation.error) {
                let response = Utils.response406("Validation Error", Utils.createObject(validation.error.details[0].context?.key, validation.error.details[0].message));
                res.status(response[0]).json(response[1]);
                return;
            }

            let emailExist = await dbClient.user.findUnique({
                where: {
                    email: reqData.email
                }
            });

            if(emailExist) {
                let response = Utils.response406("Validation Error", Utils.createObject("email", "Email already exist"));
                res.status(response[0]).json(response[1]);
                return;
            }

            let user = await dbClient.user.create({
                data: {
                    firstName: reqData.firstName,
                    middleName: reqData.middleName,
                    lastName: reqData.lastName,
                    email: reqData.email
                }
            });
            
            let emailToken = await Authentication.generateEmailToken();

            let verificationLink = await dbClient.verification.create({
                data: {
                    userId: user.id,
                    type: VerificationTypeEnum.GENERATE_PASSWORD,
                    token: emailToken
                }
            })

            let response = Utils.response200("User created successfully, please verify your email", {});

            MailBackend.send(user.email, "Generate password", "generatePassword", {
                firstName: user.firstName,
                link: Utils.generateFrontEndURL("generate-password", user.email, verificationLink.token)
            });

            res.status(response[0]).json(response[1]);
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: authenticationAPI.ts ~ user_registration", e);
            }

            let response = exceptionHandler.handle(e);
            res.status(response[0]).json(response[1]);
        }
    },
    
    async login(req: Request, res: Response) {
        try {
            let reqData = {...req.body}
            let validation = Validator.validateObjData(authenticationAPISchema.login_schema, reqData);
            
            if(validation.error) {
                let response = Utils.response406("Validation Error", Utils.createObject(validation.error.details[0].context?.key, validation.error.details[0].message));
                res.status(response[0]).json(response[1]);
                return;
            }
            
            let user = await dbClient.user.findUnique({
                where: {
                    email: reqData.username
                }
            })
            
            if(!user || user.softDelete) {
                let response = Utils.response403("User doesn't exist", {});
                res.status(response[0]).json(response[1]);
                return;
            }

            
            let clientIPAddress = req.headers["x-forwarded-for"] ? String(req.headers["x-forwarded-for"]) : String(req.socket.remoteAddress);
            let blacklistedIP = await (await dbClient.iPBlockListDB.findMany({
                where: {
                    userId: user.id,
                    IPAddress: clientIPAddress
                }
            }))[0];

            if(blacklistedIP && blacklistedIP.attempt >= 3) {
                let response = Utils.response403("Your IP is blacklisted for 24 hours", {});
                res.status(response[0]).json(response[1]);
                return;
            }
            
            if(!user.status && (!user.isAdmin || !user.isSuperAdmin)) {
                let response = Utils.response403("Access revoked, please contact admin", {});
                res.status(response[0]).json(response[1]);
                return;
            }
            else if(!user.emailVerified) {
                let response = Utils.response403("Please verify your email", {});
                res.status(response[0]).json(response[1]);
                return;
            }
            else if(user.password != await Authentication.generateHash(reqData.password)) {
                let response = Utils.response403("Username and password doesn't match", {});
                if(blacklistedIP) {
					await dbClient.iPBlockListDB.updateMany({
						where: {
							id: blacklistedIP.id,
                            userId: user.id,
                            IPAddress: clientIPAddress
                        },
                        data: {
							attempt: blacklistedIP.attempt + 1
                        }
                    });
					response = Utils.response403(`Username and password doesn't match, ${3 - blacklistedIP.attempt} attempts left`, {});
                }
                else {
                    await dbClient.iPBlockListDB.create({
                        data: {
                            userId: user.id,
                            IPAddress: clientIPAddress
                        }
                    });
                }
                res.status(response[0]).json(response[1]);
                return;
            }

            let payload = {
                "id": Number(user.id),
                "email": user?.email,
                "firstName": user?.firstName,
                "middleName": user?.middleName,
                "lastName": user?.lastName,
                "mobile": user?.mobile,
                "isSuperAdmin": user?.isSuperAdmin,
                "isAdmin": user?.isAdmin,
                "isSubAdmin": user?.isSubAdmin,
                "isStaff": user?.isStaff,
                "userInfo": user?.userInfo,
                "bankInfo": user?.bankInfo,
                "menu": Array()
            };

            if(user.isAdmin || user.isSubAdmin || user.isSuperAdmin) {
                payload.menu = await (await dbClient.permission.findMany(
                    {
                        select: {
                            componentName: true
                        }
                    }
                )).map(function(obj) {
                    return {
                        componentName: obj.componentName,
                        add: true,
                        delete: true,
                        update: true, 
                        view: true
                    }
                });
            }
            else if(user.roleId) {
                payload.menu = await (await dbClient.rolePermission.findMany({
                    where: {
                        roleId: user.roleId 
                    },
                    include: {
                        perm: true
                    }
                })).map(function (obj) {
                    return {
                        componentName: obj.perm.componentName,
                        add: obj.add,
                        delete: obj.delete,
                        update: obj.update, 
                        view: obj.view
                    }
                });
            }
            else {
                payload.menu = [];
            }

            if(user?.isSuperAdmin) {
                payload.menu.push({
                    componentName: "SUPER_ADMIN_DASHBOARD",
                    add: true,
                    delete: true,
                    update: true, 
                    view: true
                });
            }
            
            let jwt = user?.id ? await Authentication.generateJWT(user.id): String();
            let response = Utils.response200("Login successful", payload);
            
            // Set header
            // -    authorization: JWT authorization key
            // -    Access-Control-Expose-Headers: Which headers can be accept by the frontend
            res.setHeader("authorization", jwt)
            res.setHeader("Access-Control-Expose-Headers", "*");
            res.status(response[0]).json(response[1]);
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: authenticationAPI.ts ~ login", e);
            }

            let response = exceptionHandler.handle(e);
            res.status(response[0]).json(response[1]);
        }
    },

    async generate_password(req: Request, res: Response) {
        try {
            let reqData = {...req.body}
            let validation = Validator.validateObjData(authenticationAPISchema.generate_password_schema, reqData); 

            if(validation.error) {
                let response = Utils.response406("Validation Error", Utils.createObject(validation.error.details[0].context?.key, validation.error.details[0].message));
                res.status(response[0]).json(response[1]);
                return;
            }
            let user = await dbClient.user.findUnique({
                where: {
                    email: reqData.email,
                }
            });
            
            let verificationLink = await dbClient.verification.findUnique({
                where: {
                    token: reqData.token
                },
                include: {
                    user: true
                }
            });
            if(!user || user.softDelete) {
                let response = Utils.response403("User doesn't exist", {});
                res.status(response[0]).json(response[1]);
                return;
            }
            else if(user?.emailVerified) {
                let response = Utils.response406("Email already verified", {});
                res.status(response[0]).json(response[1]);
                return;
            }
            else if(verificationLink?.user.id != user.id || verificationLink?.type != VerificationTypeEnum.GENERATE_PASSWORD) {
                let response = Utils.response406("Email ID and Token mismatched", {});
                res.status(response[0]).json(response[1]);
                return;
            }

            await dbClient.verification.updateMany({
                where: {
                    id: verificationLink.id,
                    softDelete: false
                },
                data: {
                    softDelete: true
                }
            });

            let new_password = await Authentication.generateHash(reqData.password);
            await dbClient.user.update({
                where: {
                    id: user.id
                },
                data: {
                    status: true,
                    emailVerified: true,
                    password: new_password
                }
            });
            
            let response = Utils.response200("Password generated successfully", {});
            res.status(response[0]).json(response[1]);
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: authenticationAPI.ts ~ generate_password", e);
            }
            
            let response = exceptionHandler.handle(e);
            res.status(response[0]).json(response[1]);
        }
    },

    async forget_password(req: Request, res: Response) {
        try {
            let reqData = {...req.body}
            let validation = Validator.validateObjData(authenticationAPISchema.forget_password_schema, reqData);

            if(validation.error) {
                let response = Utils.response406("Validation Error", Utils.createObject(validation.error.details[0].context?.key, validation.error.details[0].message));
                res.status(response[0]).json(response[1]);
                return;
            }

            let user = await dbClient.user.findUnique(
                {
                    where: {
                        email: reqData.email
                    }
                }
            );
            if(!user || user.softDelete) {
                let response = Utils.response403("User doesn't exist", {});
                res.status(response[0]).json(response[1]);
                return;
            }

            let oldVerificationLink = await dbClient.verification.findMany({
                where: {
                    userId: user.id,
                    softDelete: false
                }
            });
            if(oldVerificationLink) {
                await dbClient.verification.updateMany({
                    where: {
                        userId: user.id,
                        softDelete: false
                    },
                    data: {
                        softDelete: true
                    }
                })
            }
            
            let emailToken = await Authentication.generateEmailToken();
            let verificationLink = await dbClient.verification.create({
                data: {
                    userId: user?.id,
                    type: VerificationTypeEnum.FORGET_PASSWORD,
                    token: emailToken
                }
            });

            await dbClient.user.update({
                where: {
                    id: user.id
                },
                data: {
                    status: false
                }
            })

            MailBackend.send(user.email, "Reset password", "resetPassword", {
                firstName: user.firstName,
                link: Utils.generateFrontEndURL("reset-password", user.email, verificationLink.token)
            });
            
            let response = Utils.response200("Forget password link send to email", {});
            res.status(response[0]).json(response[1]);
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: authenticationAPI.ts ~ forgot_password", e);
            }

            let response = exceptionHandler.handle(e);
            res.status(response[0]).json(response[1]);
        }
    },
    
    async reset_password(req: Request, res: Response) {
        try {
            let reqData = {...req.body}
            let validation = Validator.validateObjData(authenticationAPISchema.reset_password_schema, reqData); 
            
            if(validation.error) {
                let response = Utils.response406("Validation Error", Utils.createObject(validation.error.details[0].context?.key, validation.error.details[0].message));
                res.status(response[0]).json(response[1]);
                return;
            }
            let user = await dbClient.user.findUnique({
                where: {
                    email: reqData.email,
                }
            });
            
            let verificationLink = await dbClient.verification.findUnique({
                where: {
                    token: reqData.token
                },
                include: {
                    user: true
                }
            })


            if(!user || !user.emailVerified || !verificationLink || verificationLink.softDelete) {
                let response = Utils.response403("Permission Denied!", {});
                res.status(response[0]).json(response[1]);
                return;
            }
            else if(verificationLink.user.id != user.id || verificationLink.type != VerificationTypeEnum.FORGET_PASSWORD) {
                let response = Utils.response406("Email ID and Token mismatched", {});
                res.status(response[0]).json(response[1]);
                return;
            }

            await dbClient.verification.update({
                where: {
                    id: verificationLink.id
                },
                data: {
                    softDelete: true
                }
            });

            let new_password = await Authentication.generateHash(reqData.password);
            await dbClient.user.update({
                where: {
                    id: user.id
                },
                data: {
                    password: new_password,
                    status: true
                }
            });
            
            let response = Utils.response200("Password updated successfully", {});
            res.status(response[0]).json(response[1]);
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: authenticationAPI.ts ~ reset_password", e);
            }

            let response = exceptionHandler.handle(e);
            res.status(response[0]).json(response[1]);
        }
    },

    async reset_email(req: Request, res: Response) {
        try {
            let reqData = {...req.body}
            let validation = Validator.validateObjData(authenticationAPISchema.reset_email_schema, reqData); 
            
            if(validation.error) {
                let response = Utils.response406("Validation Error", Utils.createObject(validation.error.details[0].context?.key, validation.error.details[0].message));
                res.status(response[0]).json(response[1]);
                return;
            }
            let user = await dbClient.user.findUnique({
                where: {
                    email: reqData.email,
                }
            });
            
            let verificationLink = await dbClient.verification.findUnique({
                where: {
                    token: reqData.token
                },
                include: {
                    user: true
                }
            })


            if(!user || !verificationLink || verificationLink.softDelete) {
                let response = Utils.response403("Permission Denied!", {});
                res.status(response[0]).json(response[1]);
                return;
            }
            else if(verificationLink.user.id != user.id || verificationLink.type != VerificationTypeEnum.EMAIL_VERIFICATION) {
                let response = Utils.response406("Email ID and Token mismatched", {});
                res.status(response[0]).json(response[1]);
                return;
            }

            await dbClient.verification.update({
                where: {
                    id: verificationLink.id
                },
                data: {
                    softDelete: true
                }
            });

            await dbClient.user.updateMany({
                where: {
                    id: user.id,
                    status: false,
                    emailVerified: false
                },
                data: {
                    status: true,
                    emailVerified: true
                }
            });
            
            let response = Utils.response200("Email verified successfully", {});
            res.status(response[0]).json(response[1]);
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: authenticationAPI.ts ~ reset_password", e);
            }

            let response = exceptionHandler.handle(e);
            res.status(response[0]).json(response[1]);
        }
    },
    
    async employee_registration(req: Request, res: Response) {
        try {
            let reqData = {...req.body}
            let validation = Validator.validateObjData(authenticationAPISchema.register_employee_schema, reqData);

            if(validation.error) {
                let response = Utils.response406("Validation Error", Utils.createObject(validation.error.details[0].context?.key, validation.error.details[0].message));
                res.status(response[0]).json(response[1]);
                return;
            }

            let allMobileNumbers = await (await dbClient.user.findMany({
                where: {
                    softDelete: false
                },
                select: {
                    mobile: true
                }
            })).map(obj => String(obj.mobile));
            if(allMobileNumbers.includes(reqData.mobile)) {
                let response = Utils.response406("Validation Error", Utils.createObject("mobile", "Mobile number already exist"));
                res.status(response[0]).json(response[1]);
                return;
            }

            let user = await dbClient.user.findUnique({
                where: {
                    email: reqData.email,
                }
            });
            
            let verificationLink = await dbClient.verification.findUnique({
                where: {
                    token: reqData.token
                },
                include: {
                    user: true
                }
            })
            
            if(!user || !verificationLink || verificationLink.softDelete) {
                let response = Utils.response403("Permission Denied!", {});
                res.status(response[0]).json(response[1]);
                return;
            }
            else if(verificationLink.user.id != user.id || verificationLink.type != VerificationTypeEnum.USER_REGISTRATION) {
                let response = Utils.response406("Email ID and Token mismatched", {});
                res.status(response[0]).json(response[1]);
                return;
            }

            await dbClient.verification.update({
                where: {
                    id: verificationLink.id
                },
                data: {
                    softDelete: true
                }
            });

            let new_password = await Authentication.generateHash(reqData.password);
            let new_registration: user_registration = {
                firstName: reqData.firstName,
                middleName: reqData.middleName,
                lastName: reqData.lastName,
                password: new_password,
                status: true,
                emailVerified: true,
                mobile: reqData.mobile,
                userInfo: reqData.userInfo,
                isStaff: true
            }
            
            await dbClient.user.update({
                where: {
                    id: user.id
                },
                data: new_registration
            });
            
            let response = Utils.response200("User registered successfully", {});
            res.status(response[0]).json(response[1]);
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: authenticationAPI.ts ~ user_registration", e);
            }
            
            let response = exceptionHandler.handle(e);
            res.status(response[0]).json(response[1]);
        }
    },

    async verify_session(req: Request, res: Response) {
        try {
            let reqHeaders = {...req.headers}
            let userData = await Authentication.getUser(reqHeaders.authorization ? reqHeaders.authorization : "");
            
            let user = await dbClient.user.findUnique({
                where: {
                    id: userData?.id
                }
            })

            let payload = {
                "id": Number(user?.id),
                "email": user?.email,
                "firstName": user?.firstName,
                "middleName": user?.middleName,
                "lastName": user?.lastName,
                "mobile": user?.mobile,
                "isSuperAdmin": user?.isSuperAdmin,
                "isAdmin": user?.isAdmin,
                "isSubAdmin": user?.isSubAdmin,
                "isStaff": user?.isStaff,
                "userInfo": user?.userInfo,
                "bankInfo": user?.bankInfo,
                "menu": Array()
            };

            if(user && (user.isAdmin || user.isSubAdmin || user.isSuperAdmin)) {
                payload.menu = await (await dbClient.permission.findMany(
                    {
                        select: {
                            componentName: true
                        }
                    }
                )).map(function(obj) {
                    return {
                        componentName: obj.componentName,
                        add: true,
                        delete: true,
                        update: true, 
                        view: true
                    }
                });
            }
            else if(user && user.roleId) {
                payload.menu = await (await dbClient.rolePermission.findMany({
                    where: {
                        roleId: user.roleId
                    },
                    include: {
                        perm: true
                    }
                })).map(function (obj) {
                    return {
                        componentName: obj.perm.componentName,
                        add: obj.add,
                        delete: obj.delete,
                        update: obj.update, 
                        view: obj.view
                    }
                })
            }
            else {
                payload.menu = [];
            }

            if(user?.isSuperAdmin) {
                payload.menu.push({
                    componentName: "SUPER_ADMIN_DASHBOARD",
                    add: true,
                    delete: true,
                    update: true, 
                    view: true
                });
            }
            
            let response = Utils.response200("Session verified", payload);
            res.status(response[0]).json(response[1]);
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: authenticationAPI.ts ~ verify_session", e);
            }

            let response = exceptionHandler.handle(e);
            res.status(response[0]).json(response[1]);
        }
    },

    async logout(req: Request, res: Response) {
        try {
            let reqHeaders = {...req.headers}
            let user = await Authentication.getUser(reqHeaders.authorization ? reqHeaders.authorization : "");
            if(user) {
                let expiration = new Date(await Authentication.getExpiration(reqHeaders.authorization ? reqHeaders.authorization : ""));
                await dbClient.blacklistToken.create({
                    data: {
                        userId: user?.id,
                        token: reqHeaders.authorization ? reqHeaders.authorization : "",
                        expiryDate: expiration
                    }
                });
            }

            let response = Utils.response200("Successfully logged out", {});
            res.status(response[0]).json(response[1]);
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: authenticationAPI.ts ~ logout", e);
            }

            let response = exceptionHandler.handle(e);
            res.status(response[0]).json(response[1]);
        }
    },

    async find_my_ip(req: Request, res: Response) {
        try {
            let clientIPAddress = req.headers["x-forwarded-for"] ? String(req.headers["x-forwarded-for"]) : String(req.socket.remoteAddress);

            let response = Utils.response200("Successfully fetched client ip address", {"your_ip": clientIPAddress.substring(7, clientIPAddress.length)});
            res.status(response[0]).json(response[1]);
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: authenticationAPI.ts ~ find_my_ip", e);
            }

            let response = exceptionHandler.handle(e);
            res.status(response[0]).json(response[1]);
        }
    }
}