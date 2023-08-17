// Imported modules
import { Request, Response } from 'express';
import { PrismaClient, VerificationTypeEnum } from '@prisma/client';

// Custom modules for all APIs
import Utils from "../helpers/utils";
import Validator from '../helpers/validation';
import MailBackend from "../helpers/mailBackend";
import Authentication from '../helpers/authentication';
import exceptionHandler from '../helpers/exceptionHandler';

// Custom modules for User APIs
import settingAPISchema from '../APISchema/settingsAPISchema';
import { update_self } from '../helpers/types';

// Initialize Database Client
const dbClient = new PrismaClient();
const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]


export default {
    name: "SettingAPIs",

    async update_self(req: Request, res: Response) {
        try {
            let reqHeaders = {...req.headers}
            let reqData = {...req.body}

            let user = await Authentication.getUser(reqHeaders.authorization ? reqHeaders.authorization : "");
            if(user == null) {
                let response = exceptionHandler.handle({"key": "authorization", "message": "User doesn't exist"});
                res.status(response[0]).json(response[1]);
                return;
            }
            
            let validation = Validator.validateObjData(settingAPISchema.update_self_schema, reqData);
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
                let mobileNumberOwner = await (await dbClient.user.findMany({
                    where: {
                        mobile: reqData.mobile
                    },
                    select: {
                        id: true
                    }
                }))[0];

                if(mobileNumberOwner?.id != BigInt(user.id)) {
                    let response = Utils.response406("Validation Error", Utils.createObject("mobile", "Mobile number already exist"));
                    res.status(response[0]).json(response[1]);
                    return;
                }
            }

            let updateUserData: update_self = {
                firstName: reqData.firstName,
                middleName: reqData.middleName,
                lastName: reqData.lastName,
                mobile: reqData.mobile,
                userInfo: reqData.userInfo,
                bankInfo: reqData.bankInfo
            }

            let updateEntries = await dbClient.user.updateMany({
                where: {
                    id: user.id,
                    softDelete: false,
                    emailVerified: true,
                    status: true
                },
                data: updateUserData
            });

            let response = Utils.response200("User updated successfully", {});
            if(updateEntries.count == 0) {
                response = Utils.response406("Can't update user", {});
            }
            res.status(response[0]).json(response[1]);
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: userAPI.ts ~ update_employee", e);
            }

            let response = exceptionHandler.handle(e);
            res.status(response[0]).json(response[1]);
        }
    },

    async update_email(req: Request, res: Response) {
        try {
            let reqHeaders = {...req.headers}
            let reqData = {...req.body}

            let user = await Authentication.getUser(reqHeaders.authorization ? reqHeaders.authorization : "");
            if(user == null) {
                let response = exceptionHandler.handle({"key": "authorization", "message": "User doesn't exist"});
                res.status(response[0]).json(response[1]);
                return;
            }
            
            let validation = Validator.validateObjData(settingAPISchema.update_email, reqData);
            if(validation.error) {
                let response = Utils.response406("Validation Error", Utils.createObject(validation.error.details[0].context?.key, validation.error.details[0].message));
                res.status(response[0]).json(response[1]);
                return;
            }

            if(user.password != await Authentication.generateHash(reqData.password)) {
                let response = Utils.response403("Invalid Password", {});
                res.status(response[0]).json(response[1]);
                return;
            }

            await dbClient.user.updateMany({
                where: {
                    id: user.id,
                    status: true,
                    softDelete: false
                },
                data: {
                    email: reqData.email,
                    status: false,
                    emailVerified: false
                }
            });

            let emailToken = await Authentication.generateEmailToken();
            let verificationLink = await dbClient.verification.create({
                data: {
                    userId: user.id,
                    type: VerificationTypeEnum.EMAIL_VERIFICATION,
                    token: emailToken
                }
            });

            let expiration = new Date(await Authentication.getExpiration(reqHeaders.authorization ? reqHeaders.authorization : ""));
            await dbClient.blacklistToken.create({
                data: {
                    userId: user.id,
                    token: reqHeaders.authorization ? reqHeaders.authorization : "",
                    expiryDate: expiration
                }
            });

            MailBackend.send(reqData.email, "Reset password", "resetPassword", {
                firstName: user.firstName,
                link: Utils.generateFrontEndURL("verify-email", reqData.email, verificationLink.token)
            });

            let response = Utils.response200("Email updated successfully, please check your email", {});
            res.status(response[0]).json(response[1]);
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: userAPI.ts ~ update_employee", e);
            }

            let response = exceptionHandler.handle(e);
            res.status(response[0]).json(response[1]);
        }
    },

    async update_password(req: Request, res: Response) {
        try {
            let reqHeaders = {...req.headers}
            let reqData = {...req.body}

            let user = await Authentication.getUser(reqHeaders.authorization ? reqHeaders.authorization : "");
            if(user == null) {
                let response = exceptionHandler.handle({"key": "authorization", "message": "User doesn't exist"});
                res.status(response[0]).json(response[1]);
                return;
            }
            
            let validation = Validator.validateObjData(settingAPISchema.update_password, reqData);
            if(validation.error) {
                let response = Utils.response406("Validation Error", Utils.createObject(validation.error.details[0].context?.key, validation.error.details[0].message));
                res.status(response[0]).json(response[1]);
                return;
            }

            if(user.password != await Authentication.generateHash(reqData.oldPassword)) {
                let response = Utils.response403("Invalid Password", {});
                res.status(response[0]).json(response[1]);
                return;
            }

            let newPassword = await Authentication.generateHash(reqData.password);
            await dbClient.user.updateMany({
                where: {
                    id: user.id,
                    status: true,
                    softDelete: false
                },
                data: {
                    password: newPassword
                }
            });

            let response = Utils.response200("Password updated successfully", {});
            res.status(response[0]).json(response[1]);
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: userAPI.ts ~ update_employee", e);
            }

            let response = exceptionHandler.handle(e);
            res.status(response[0]).json(response[1]);
        }
    }
}