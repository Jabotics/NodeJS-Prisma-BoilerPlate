import { PrismaClient } from '@prisma/client';

const dbClient = new PrismaClient();


class ReviveOldUsers {
    async revive() {
        await dbClient.user.updateMany({
            where: {
                softDelete: true
            },
            data: {
                softDelete: false
            }
        })
    }
}

const handler = new ReviveOldUsers;
handler.revive();