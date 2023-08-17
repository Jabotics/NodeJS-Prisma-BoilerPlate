import Joi from "joi"


export default {
	name: "PermissionComponentAPISchema",

    add_permission_component: Joi.object({
		"componentName": Joi.string()
			.regex(new RegExp('^[A-Z][A-Z\\s]*$'))
			.required()
	}),

	remove_permission_component: Joi.object({
		"id": Joi.number()
			.integer()
			.positive()
			.allow(0)
			.required()
	}),

	update_permission_component: Joi.object({
		"id": Joi.number()
			.integer()
			.positive()
			.allow(0)
			.required(),
		"componentName": Joi.string()
			.uppercase()
			.required()
	})
}