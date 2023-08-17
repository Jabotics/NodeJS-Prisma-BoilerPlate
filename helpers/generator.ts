import fs from "fs";
import { stringify } from 'csv-stringify/sync';
import { PrismaClient, User } from '@prisma/client';


const dbClient = new PrismaClient();

export default {
    name: "Generator",

    async csv(name: string, user: User, data: Array<object>):Promise<Array<any>> {
        try {
            const filePath = `./CSV/${user.id}_${name}.csv`;
            var writeStream = fs.createWriteStream(filePath);
            
            const stringifier = stringify(data);
            let columns = "";
            for(let key in data[0]) {
                if(columns.length > 0) {
                    columns = `${columns}, ${key}`;
                }
                else {
                    columns = `${key}`;
                }
            }
            columns = `${columns}\n`;
            writeStream.write(columns);
            writeStream.write(stringifier);
            writeStream.end();

            return [true, filePath];
        }
        catch(e: any) {
            return [false, e]
        }
    }
}