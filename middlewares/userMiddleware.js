let yup = require('yup');
const jwt = require('jsonwebtoken');
const { User } = require('../db');
const { Role } = require('../db');
const { Op } = require('sequelize');
const { ROLE } = require('../models/Role');

// ========================================================================

// Schema - Signup
let schemaSignup = yup.object().shape({
	email: yup
		.string()
		.required('Please enter Email')
		.email('Please enter valid Email'),
	password: yup
		.string()
		.required('Please enter New Password')
		.min(6, 'Please enter minimum 6 characters'),
	phone_number: yup
		.string()
		.required('Please enter Phone Number')
		.min(10, 'Please enter minimum 10 characters'),
});

// Validation - Signup
module.exports.validationSignup = (req, res, next) => {
	// validations here
	console.log('🐞 validationSignup');

	schemaSignup
		.validate(
			{
				email: req.body.email,
				password: req.body.password,
				phone_number: req.body.phone_number
			},
			{ abortEarly: false }
		)
		.then(function () {
			next();
		})
		.catch(function (err) {
			return next(err);
		});
};

// Check if record exists - Signup
module.exports.isUserExistsSignup = async (req, res, next) => {
	console.log('🐞 isUserExistsSignup');

	try {
		const user = await User.findOne({
			where: {
				phone_number: req.body.phone_number,
			},
		});

		if (user) {
			let err = new Error('User already registered');
			err.field = 'task';
			return next(err);
		}

		next();
	} catch (err) {
		return next(err);
	}
};

// ========================================================================

// Schema - Login
let schemaLogin = yup.object().shape({
	phone_number: yup
		.string()
		.required('Please enter Phone Number')
		.min(10, 'Please enter minimum 10 characters'),
	password: yup
		.string()
		.required('Please enter New Password')
		.min(6, 'Please enter minimum 6 characters'),
});

// Validation - Login
module.exports.validateLogin = (req, res, next) => {
	console.log('🐞 validateLogin');

	schemaLogin
		.validate(
			{
				phone_number: req.body.phone_number,
				password: req.body.password,
			},
			{ abortEarly: false }
		)
		.then(function () {
			next();
		})
		.catch(function (err) {
			return next(err);
		});
};

// ========================================================================
// Authenticate User Logged in
module.exports.authenticateToken = (req, res, next) => {
	var token = req.headers.authorization;
	if (token) {
		// verifies secret and checks if the token is expired
		jwt.verify(
			token.replace(/^Bearer\s/, ''),
			process.env.AUTH_SECRET,
			(err, decoded) => {
				if (err) {
					let err = new Error('Bạn đang không đăng nhập');
					err.field = 'login';
					return next(err);
				} else {
					req.user = decoded;
					return next();
				}
			}
		);
	} else {
		let err = new Error('Bạn đang không đăng nhập');
		err.field = 'login';
		return next(err);
	}
};

module.exports.isAdmin = async (req, res, next) => {

	const role = await Role.findOne({
		where: {
			user_id: req.user.id || ''
		},
	});
	if (role && role.role_id === ROLE.ADMIN) {
		return next()
	} else {
		let err = new Error('Account is not a Admin');
		err.field = 'login';
		return next(err);
	}
};

// ========================================================================

// Schema - UpdateProfile
let schemaUpdateProfile = yup.object().shape({
	first_name: yup.string().required('Please enter first name'),
	last_name: yup.string().required('Please enter last name'),
	bio: yup.string(),
	email: yup
		.string()
		.required()
		.required('Please enter Email')
		.email('Please enter valid Email'),
	phone_number: yup
		.string()
		.required()
		.required('Please enter Phone Number')
		.min(10, 'Please enter minimum 10 characters'),
});

// Validation - UpdateProfile
module.exports.validationUpdateProfile = (req, res, next) => {
	// validations here
	console.log('🐞 validationUpdateProfile');

	schemaUpdateProfile
		.validate(
			{
				first_name: req.body.first_name,
				last_name: req.body.last_name,
				bio: req.body.bio,
				email: req.body.email,
				phone_number: req.body.phone_number,
			},
			{ abortEarly: false }
		)
		.then(function () {
			next();
		})
		.catch(function (err) {
			return next(err);
		});
};

// Check if record exists - Update
module.exports.isUserExistsUpdate = async (req, res, next) => {
	console.log('🐞 isUserExistsUpdate');

	try {
		const user = await User.findOne({
			where: {
				phone_number: req.body.phone_number,
				id: {
					[Op.ne]: req.user.id,
				},
			},
		});

		if (user) {
			let err = new Error('Phone Number already registered.');
			err.field = 'phone_number';
			return next(err);
		}

		next();
	} catch (err) {
		return next(err);
	}
};
module.exports.isUserExistsUpdateForAdmin = async (req, res, next) => {
	console.log('🐞 isUserExistsUpdateForAdmin');

	try {
		const idUser = req.params.id || '';
		const user = await User.findOne({
			where: {
				phone_number: idUser
			},
		});

		if (user) {
			let err = new Error('User does not exist');
			err.field = 'id';
			return next(err);
		}

		next();
	} catch (err) {
		return next(err);
	}
};

// ========================================================================

// Schema - ChangePassword
let schemaChangePassword = yup.object().shape({
	new_password: yup
		.string()
		.required('Please enter New Password')
		.min(6, 'Please enter minimum 6 characters'),
	repeat_new_password: yup
		.string()
		.required('Please repeat new Password')
		.min(6, 'Please enter minimum 6 characters')
		.oneOf(
			[yup.ref('new_password'), null],
			'New password and repeat password mismatch'
		),
});

// Validation - ChangePassword
module.exports.validationChangePassword = (req, res, next) => {
	// validations here
	console.log('🐞 validationChangePassword');

	schemaChangePassword
		.validate(
			{
				new_password: req.body.new_password,
				repeat_new_password: req.body.repeat_new_password,
			},
			{ abortEarly: false }
		)
		.then(function () {
			next();
		})
		.catch(function (err) {
			return next(err);
		});
};

// ========================================================================

// Schema - ForgotPassword
let schemaForgotPassword = yup.object().shape({
	email: yup
		.string()
		.required('Please enter Your registered email')
		.email('Please enter valid Email'),
});

// Validation - ForgotPassword
module.exports.validationForgotPassword = (req, res, next) => {
	// validations here
	console.log('🐞 validationForgotPassword');

	schemaForgotPassword
		.validate(
			{
				email: req.body.email,
			},
			{ abortEarly: false }
		)
		.then(function () {
			next();
		})
		.catch(function (err) {
			return next(err);
		});
};

// Validation - Check if email registered
module.exports.isEmailRegistered = async (req, res, next) => {
	// validations here
	console.log('🐞 isEmailRegistered');

	try {
		const user = await User.findOne({
			where: {
				email: req.body.email,
			},
		});

		if (user) {
			next();
		} else {
			let err = new Error('No user registered with this email');
			err.field = 'email';
			return next(err);
		}
	} catch (err) {
		return next(err);
	}
};

// ========================================================================

// Schema - ResetPassword
let schemaResetPassword = yup.object().shape({
	new_password: yup
		.string()
		.required('Please enter New Password')
		.min(6, 'Please enter minimum 6 characters'),
	repeat_new_password: yup
		.string()
		.required('Please repeat new Password')
		.min(6, 'Please enter minimum 6 characters')
		.oneOf(
			[yup.ref('new_password'), null],
			'New password and repeat password mismatch'
		),
	token: yup.string().required('Reset password token not found'),
});

let schemaDeleteUser = yup.object().shape({
	phone_number: yup
		.string()
		.required('Please enter Phone Number')
		.min(10, 'Please enter minimum 10 characters'),
});



// Validation - ResetPassword
module.exports.validationResetPassword = (req, res, next) => {
	// validations here
	console.log('🐞 validationResetPassword');

	schemaResetPassword
		.validate(
			{
				new_password: req.body.new_password,
				repeat_new_password: req.body.repeat_new_password,
				token: req.body.token,
			},
			{ abortEarly: false }
		)
		.then(function () {
			next();
		})
		.catch(function (err) {
			return next(err);
		});
};

module.exports.validationDeleteUser = (req, res, next) => {
	// validations here
	console.log('🐞 validationDeleteUser');

	const phone = req.params.phone_number || ''

	schemaDeleteUser
		.validate(
			{
				phone_number: phone,
			},
			{ abortEarly: false }
		)
		.then(function () {
			next();
		})
		.catch(function (err) {
			return next(err);
		});
};

// Validation - Check if reset password token is valid
module.exports.isResetTokenValid = async (req, res, next) => {
	// validations here
	console.log('🐞 isResetTokenValid');

	try {
		const user = await User.findOne({
			where: {
				token: req.body.token,
			},
		});

		if (user) {
			next();
		} else {
			let err = new Error('Invalid reset link or token');
			err.field = 'email';
			return next(err);
		}
	} catch (err) {
		return next(err);
	}
};
