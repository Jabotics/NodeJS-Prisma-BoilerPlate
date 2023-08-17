import Joi from "joi"


export default {
    name: "EmployeeAPISchema",

	add_employee_schema: Joi.object({
		"email": Joi.string()
			.email()
			.required(),
        "roleId": Joi.number()
			.integer()
			.positive()
			.allow(0)
    }),

	remove_employee_schema: Joi.array()
		.items(
			Joi.number()
			.integer()
			.positive()
			.allow(0)
			.required()
		),
		
	view_employee_schema_limit: Joi.number() .integer()
			.positive()
			.allow(0),

	view_employee_schema_offset: Joi.number() .integer()
			.positive()
			.allow(0),

	update_employee_schema: Joi.object({
		"id": Joi.number()
			.integer()
			.positive()
			.allow(0)
			.required(),
        "role": Joi.number()
			.integer()
			.positive()
			.allow(0),
		"firstName": Joi.string()
			.min(2)
			.max(20)
			.alphanum()
			.required(),
		"middleName": Joi.string()
			.allow(String())
			.alphanum()
			.required(),
		"lastName": Joi.string()
			.min(2)
			.max(20)
			.required(),
		"isSubAdmin": Joi.boolean()
			.required(),
		"status": Joi.boolean()
			.required(),
		"mobile": Joi.string()
			.allow(String())
			.pattern(new RegExp('^[0-9]{7,15}$')),
		"userInfo": Joi.object({
			"country": Joi.string()
				.allow(String())
				.required(),
			"timeZone": Joi.string()
				.allow(String())
				.required(),
			"state": Joi.string()
				.allow(String())
				.required(),
			"gender": Joi.string()
				.valid(String(), "Male", "Female")
				.required(),
			"city": Joi.string()
				.allow(String())
				.required(),
			"permanentAddress": Joi.string()
				.allow(String())
				.required(),
			"phoneCode": Joi.string()
				.allow(String())
				.regex(new RegExp('[0-9]+'))
				.required(),
			})
			.required()
    })
}