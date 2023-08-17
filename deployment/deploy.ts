import { PrismaClient } from '@prisma/client';
import Authentication from "../helpers/authentication";

const dbClient = new PrismaClient();


interface add_users {
    email: string
    status: boolean
    password: string
    lastName: string
    firstName: string
    isAdmin?: boolean
    isStaff?: boolean
    middleName?: string
    emailVerified: boolean
    isSuperAdmin?: boolean
}


class Marnix {
    async add_admin() {
        try {
            let employeeData: Array<add_users> = [
                {email: "amit.singh@jabotics.in", password: "Jab@2023", firstName: "Amit", lastName: "Singh", emailVerified: true, status: true, isAdmin: true, isSuperAdmin: false, isStaff: true},
                {email: "admin@jabotics.in", password: "Jabotics", firstName: "Jabotics", lastName: "Jabotics", emailVerified: true, status: true, isAdmin: true, isSuperAdmin: false, isStaff: true},
                {email: "ashish.singh@jabotics.in", password: "Jab@2023", firstName: "Ayush", lastName: "Anand", emailVerified: true, status: true, isAdmin: true, isSuperAdmin: false, isStaff: true},
                {email: "rahul.saxena@jabotics.in", password: "1234abc!", firstName: "Rahul", lastName: "Saxena", emailVerified: true, status: true, isAdmin: true, isSuperAdmin: false, isStaff: true},
                {email: "nishant.mishra@jabotics.in", password: "Jab@2023", firstName: "Nishant", lastName: "Mishra", emailVerified: true, status: true, isAdmin: false, isSuperAdmin: false, isStaff: true},
                {email: "subrata.mukherjee@jabotics.in", password: "switzer4", firstName: "Subrata", lastName: "Mukherjee", emailVerified: true, status: true, isAdmin: false, isSuperAdmin: false, isStaff: true},
                {email: "debshubra.chakraborty@jabotics.in", password: "@1b2C3d4", firstName: "Debshubra", lastName: "Chakraborty", emailVerified: true, status: true, isAdmin: false, isSuperAdmin: true, isStaff: true},
            ]

            for(let index in employeeData) {
                employeeData[index].password = await Authentication.generateHash(employeeData[index].password);
            }

            await dbClient.user.createMany({
                data: employeeData,
                skipDuplicates: true
            });
            console.log("[+] Employees added to DB");
            for(let item of employeeData) {
                console.log(`[*] email: ${item.email}, password: ${item.password}, firstName: ${item.firstName}, lastName: ${item.lastName}, isAdmin: ${item.isAdmin}, isSuperAdmin: ${item.isSuperAdmin}`);
            }
            console.log("\n");
        }
        catch(e) {
            console.log("[-] Error occurred", e);
        }
    }
}

async function main() {
    const handler = new Marnix();
    await handler.add_admin();
}

main();