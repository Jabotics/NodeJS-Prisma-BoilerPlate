import { PrismaClient } from '@prisma/client';
import fs from "node:fs/promises";
import path from "node:path";

const dbClient = new PrismaClient();


export default {
    name: "Scheduler",
    
    async remove_blacklist_token() {
        try {
            let thisMoment = new Date();
            await dbClient.blacklistToken.deleteMany({
                where: {
                    expiryDate: {
                        lte: thisMoment
                    }
                }
            });
            console.log("[+] Scheduler Executed: remove_blacklist_token");
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: Scheduler.ts ~ remove_blacklist_token", e);
            }
        }
    },

    async remove_verification_token() {
        try {
            await dbClient.verification.deleteMany({
                where: {
                    softDelete: true
                }
            });
            console.log("[+] Scheduler Executed: remove_verification_token");
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: Scheduler.ts ~ remove_verification_token", e);
            }
        }
    },

    async remove_blacklist_ip_addresses() {
        try {
            let thisMoment = new Date();
            let removalIPAddress: Array<bigint> = [];
            let allBlacklistIPAddress = await dbClient.iPBlockListDB.findMany({});

            for(let blacklistIP of allBlacklistIPAddress) {
                let tineDifference = thisMoment.getTime() - blacklistIP.createdDate.getTime()
                if((tineDifference / (1000 * 60 * 60 * 24)) >= 1) {
                    removalIPAddress.push(blacklistIP.id);
                }
            }

            await dbClient.iPBlockListDB.deleteMany({
                where: {
                    id: {
                        in: removalIPAddress
                    }
                }
            });
            console.log("[+] Scheduler Executed: remove_blacklist_ip_addresses");
        }
        catch(e) {
            if(process.env.DEBUG == "TRUE") {
                console.log("🚀 ~ file: Scheduler.ts ~ remove_blacklist_ip_addresses", e);
            }
        }
    }
}