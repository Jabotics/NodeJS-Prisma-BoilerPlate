import Utils from "./utils"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";


export default {
    name: "ExceptionHandler",
    
    handle(e: any): Array<any> {
        let response = Utils.response400({});
        if (e instanceof PrismaClientKnownRequestError) {
            response = Utils.response400({"DBError": e.meta?.cause});
        }
        return response;
    }
}