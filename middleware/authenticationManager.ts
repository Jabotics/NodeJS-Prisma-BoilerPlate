import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

import Utils from '../helpers/utils';

const jwt = require('jsonwebtoken');
const dbClient = new PrismaClient();
const JWTPrefix= "Bearer";


export default {
    name: "Authentication",

    async verifyJWT(req: Request, res: Response, next: NextFunction) {
        let payload = req.headers.authorization;
        if(!payload) {
            let response = Utils.response406("Authorization token not present in the header", {});
            res.status(response[0]).json(response[1]);
            return;
        }

        let authData = payload.split(' ');
        if(authData.length != 2) {
            let response = Utils.response406("Authorization token not present in the header", {});
            res.status(response[0]).json(response[1]);
            return;
        }
        if(authData[0] != JWTPrefix) {
            let response = Utils.response406("Invalid prefix of authorization key", {});
            res.status(response[0]).json(response[1]);
            return;
        }

        let BlacklistToken = await dbClient.blacklistToken.findUnique({
            where: {
                token: payload
            }
        });

        if(BlacklistToken) {
            let response = Utils.response403("Token Expired", {});
            res.status(response[0]).json(response[1]);
            return;
        }

        try {
            let data = jwt.verify(authData[1], process.env.JWT_AUTH_KEY);
            let expiration = new Date(data.expiration);
            let thisMoment = new Date();
            if(thisMoment >= expiration) {
                let response = Utils.response403("Token Expired", {});
                res.status(response[0]).json(response[1]);
                return;
            }

            let user = await dbClient.user.findUnique({
                where: {
                    id: data.userID
                }
            });

            if(!user || user.softDelete) {
                let response = Utils.response403("User doesn't exist", {});
                res.status(response[0]).json(response[1]);
                return;
            }

            if(!user.status) {
                let response = Utils.response403("User deactivated, please contact admin", {});
                res.status(response[0]).json(response[1]);
                return;
            }

            next();
        }
        catch {
            let response = Utils.response403("Invalid authorization token", {});
            res.status(response[0]).json(response[1]);
            return;
        }
    }
}