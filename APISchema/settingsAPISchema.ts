import Joi from "joi"


export default {
    name: "SettingAPISchema",

	update_self_schema: Joi.object({
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
		"mobile": Joi.string()
			.pattern(new RegExp('^[0-9]{7,15}$'))
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
			.required(),
		"bankInfo": Joi.object({
			"employeeID": Joi.string()
				.allow(String())
				.alphanum(),
			"bankName": Joi.string()
				.allow(String()),
			"acNumber": Joi.number()
				.integer()
				.positive()
				.allow(String()),
			"ifscCode": Joi.string()
				.allow(String())
				.alphanum(),
			"pfNo": Joi.string()
				.allow(String())
				.alphanum(),
			"pfUAN": Joi.string()
				.allow(String())
				.alphanum(),
			})
    }),

	update_email: Joi.object({
		"email": Joi.string()
			.email()
			.required(),
		"password": Joi.string()
			.required()
    }),

	update_password: Joi.object({
		"oldPassword": Joi.string()
			.required(),
		"password": Joi.string()
			.pattern(new RegExp('^(?=(?:[^a-z]*[a-z]){1})(?=(?:[^0-9]*[0-9]){1})(?=.*[!-\/:-@\[-`{-~]).{8,}$'))
			.required(),
		"confirmPassword": Joi.any()
			.valid(Joi.ref('password'))
			.required()
    })
}