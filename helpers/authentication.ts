import { randomUUID } from 'crypto';
import { PrismaClient, User } from '@prisma/client';

const jwt = require('jsonwebtoken');
const sha256 = require("sha256");
const dbClient = new PrismaClient();


export default {
    name: "Authentication",
    JWTPrefix: "Bearer",
    
    async generateJWT(userID: bigint): Promise<string> {
        let dt = new Date();
        let expiration = new Date();
        expiration.setDate(dt.getDate() + parseInt(process.env.JWT_EXPIRATION_DAYS? process.env.JWT_EXPIRATION_DAYS: String()));
        
        let user = await dbClient.user.findUnique({
            where: {
                id: userID
            }
        });

        let data = {
            "userID": Number(user?.id),
            "isSuperAdmin": user?.isSuperAdmin,
            "isAdmin": user?.isAdmin,
            "isSubAdmin": user?.isSubAdmin,
            "expiration": expiration.getTime()
        }

        let payload = `${this.JWTPrefix} ${jwt.sign(data, process.env.JWT_AUTH_KEY)}`;
        return payload;
    },

    async getUser(payload: string): Promise<User | null> {
        let authorization = payload.split (" ")[1];
        let data = jwt.verify(authorization, process.env.JWT_AUTH_KEY);
        let user = await dbClient.user.findUnique({
            where: {
                id: data.userID
            }
        });
        return user;
    },

    async getExpiration(payload: string): Promise<string> {
        let authorization = payload.split (" ")[1];
        let data = jwt.verify(authorization, process.env.JWT_AUTH_KEY);
        return data.expiration;
    },

    async generateHash(payload: string): Promise<string> {
        return sha256(payload);
    },

    async generateEmailToken(): Promise<string> {
        let current_time = new Date();
        return `${randomUUID()}-${sha256(current_time.getUTCMilliseconds().toString())}-${randomUUID()}`;
    }
}