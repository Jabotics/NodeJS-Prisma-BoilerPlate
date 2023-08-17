import Joi from "joi";

export default {
    name: "Validator",
    
    validateObjData(schema: Joi.ObjectSchema, data: object): Joi.ValidationResult {
        return schema.validate(data);
    },

    validateJsonString(jsonString: string): boolean {
        try {
            let jsonParse = JSON.parse(jsonString);
            return true;
        }
        catch {
            return false;
        }
    },

    validateNumberString(schema: Joi.NumberSchema, data: string): Joi.ValidationResult {
        return schema.validate(data);
    },

    validateStringData(data: string): Joi.ValidationResult {
        let schema = Joi.string().pattern(new RegExp('^[a-zA-Z0-9]+$'));
        return schema.validate(data);
    },

    validateArrayData(schema:Joi.ArraySchema, data: Array<any>): Joi.ValidationResult {
        return schema.validate(data);
    },

    validateDateString(schema: Joi.DateSchema, data: string): Joi.ValidationResult {
        return schema.validate(data);
    }
}