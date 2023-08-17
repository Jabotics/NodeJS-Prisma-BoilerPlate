import Joi from "joi"


export default {
	name: "AuthenticationAPISchema",

	register_user_schema: Joi.object({
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
			.alphanum()
			.required(),
		"email": Joi.string()
			.email()
			.required()
	}),

	login_schema: Joi.object({
		"username": Joi.string()
			.email()
			.required(),
		"password": Joi.string()
			.required()
	}),

	generate_password_schema: Joi.object({
		"email": Joi.string()
			.email()
			.required(),
		"token": Joi.string()
			.required(),
		"password": Joi.string()
			.pattern(new RegExp('^(?=(?:[^a-z]*[a-z]){1})(?=(?:[^0-9]*[0-9]){1})(?=.*[!-\/:-@\[-`{-~]).{8,}$'))
			.required(),
		"confirmPassword": Joi.any()
			.valid(Joi.ref('password'))
			.required()
	}),

	forget_password_schema: Joi.object({
		"email": Joi.string()
			.email()
			.required()
	}),

	reset_email_schema: Joi.object({
		"email": Joi.string()
			.email()
			.required(),
		"token": Joi.string()
			.required()
	}),

	reset_password_schema: Joi.object({
		"email": Joi.string()
			.email()
			.required(),
		"token": Joi.string()
			.required(),
		"password": Joi.string()
			.pattern(new RegExp('^(?=(?:[^a-z]*[a-z]){1})(?=(?:[^0-9]*[0-9]){1})(?=.*[!-\/:-@\[-`{-~]).{8,}$'))
			.required(),
		"confirmPassword": Joi.any()
			.valid(Joi.ref('password'))
			.required()
	}),

	register_employee_schema: Joi.object({
		"email": Joi.string()
			.email()
			.required(),
		"token": Joi.string()
			.required(),
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
			.alphanum()
			.required(),
		"password": Joi.string()
			.pattern(new RegExp('^(?=(?:[^a-z]*[a-z]){1})(?=(?:[^0-9]*[0-9]){1})(?=.*[!-\/:-@\[-`{-~]).{8,}$'))
			.required(),
		"confirmPassword": Joi.any()
			.valid(Joi.ref('password'))
			.required(),
		"mobile": Joi.string()
			.pattern(new RegExp('[0-9]{7,15}'))
			.required(),
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
				.alphanum()
				.required(),
			"city": Joi.string()
				.allow(String())
				.required(),
			"permanentAddress": Joi.string()
				.allow(String())
				.required(),
			"phoneCode": Joi.string()
				.allow(String())
				.required(),
			})
			.required()
	}),
}