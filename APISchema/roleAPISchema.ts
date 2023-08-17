import Joi from "joi"


export default {
    name: "RoleAPISchema",

	add_role: Joi.object({
		"role": Joi.string()
            .min(2)
            .max(20)
			.required(),
        "code": Joi.string()
            .min(2)
            .max(20)
            .required(),
        "permissions": Joi.array()
			.items(Joi.object({
				"componentName": Joi.string()
					.uppercase()
					.required(),
				"add": Joi.boolean()
					.required(),
				"update": Joi.boolean()
					.required(),
				"delete": Joi.boolean()
					.required(),
				"view": Joi.boolean()
					.required()
			}))
			.required()
    }),

	remove_role: Joi.object({
		"roleID": Joi.array()
					.items(
						Joi.number() 
						.integer()
						.positive()
						.allow(0)
					)
	}),
		
	view_role_limit: Joi.number() .integer()
			.positive()
            .allow(0),

	view_role_offset: Joi.number() .integer()
			.positive()
            .allow(0),

	update_role: Joi.object({
		"id": Joi.number()
			.integer()
			.positive()
            .allow(0)
			.required(),
        "role": Joi.string()
            .min(2)
            .max(20)
            .required(),
        "code": Joi.string()
            .min(2)
            .max(20),
        "status": Joi.boolean()
            .required(),
        "permissions": Joi.array()
			.items(Joi.object({
				"componentName": Joi.string()
					.uppercase()
					.required(),
				"add": Joi.boolean()
					.required(),
				"update": Joi.boolean()
					.required(),
				"delete": Joi.boolean()
					.required(),
				"view": Joi.boolean()
					.required()
			}))
			.required()
    })
}