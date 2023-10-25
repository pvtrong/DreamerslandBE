require('dotenv').config();
// Load model
const { User } = require('../db');
const { Role } = require('../db');
const { Op } = require('sequelize');

const utils = require('../utils');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { ROLE } = require('../models/Role');
const { getPageSize } = require('../services/utils');

// SignUp
module.exports.signUp = async (req, res, next) => {
	try {
		const email = req.body.email;
		const first_name = req.body.first_name;
		const last_name = req.body.last_name;
		const phone_number = req.body.phone_number;

		// encrypt password
		var salt = bcrypt.genSaltSync(10);
		var hash = bcrypt.hashSync(req.body.password, salt);
		const password = hash;

		const token = crypto.randomBytes(16).toString('hex');

		const record = await User.create({
			first_name: first_name,
			last_name: last_name,
			email: email,
			phone_number: phone_number,
			password: password,
			token: token,
		});
		const resUserVerify = await this.signUpVerifyImmediate(token);
		const resSignUp = {
			first_name: first_name,
			last_name: last_name,
			email: email,
			phone_number: phone_number,
		}
		return res.json({
			status: 'success',
			result: {
				record: resUserVerify ? resSignUp : resUserVerify
			},
		});
	} catch (err) {
		return next(err);
	}
};

module.exports.signUpVerifyImmediate = async (token) => {
	try {
		const user = await User.findOne({
			where: {
				token: token,
				is_verified: 0,
			},
		});

		if (user) {
			const record = await User.update(
				{
					token: '',
					is_verified: 1,
				},
				{
					where: {
						id: {
							[Op.eq]: user.id,
						},
					},
				}
			);

			return user;
		} else {
			let err = new Error('Invalid token provided or user already verified');
			err.field = 'token';
			return err;
		}
	} catch (err) {
		return err;
	}
};
// Verify Signup Link
module.exports.signUpVerify = async (req, res, next) => {
	try {
		const token = req.params.token;
		const user = await User.findOne({
			where: {
				token: token,
				is_verified: 0,
			},
		});

		if (user) {
			const record = await User.update(
				{
					token: '',
					is_verified: 1,
				},
				{
					where: {
						id: {
							[Op.eq]: user.id,
						},
					},
				}
			);

			return res.json({
				status: 'success',
				result: user,
			});
		} else {
			let err = new Error('Invalid token provided or user already verified');
			err.field = 'token';
			return next(err);
		}
	} catch (err) {
		return next(err);
	}
};

// Login
module.exports.loginUser = async (req, res, next) => {
	try {
		const phone_number = req.body.phone_number;
		const password = req.body.password;

		const user = await User.findOne({
			where: {
				phone_number: phone_number,
				is_verified: 1,
			},
		});

		if (user) {
			const roleUser = await Role.findOne({
				where: {
					user_id: user.id
				},
			});
			if (roleUser && roleUser.role_id === ROLE.NORMAL_USER) {
				const isMatched = await bcrypt.compare(password, user.password);

				if (isMatched === true) {
					var userData = {
						id: user.id,
						email: user.email,
						first_name: user.first_name,
						last_name: user.last_name,
						bio: user.bio,
						phone_number: user.phone_number
					};
					return res.json({
						user: userData,
						token: jwt.sign(userData, process.env.AUTH_SECRET, {
							expiresIn: '2h',
						}), // Expires in 2 Hour
					});
				} else {
					let err = new Error('Invalid Phone number or password entered');
					err.field = 'login';
					return next(err);
				}
			}
			else {
				let err = new Error('Account is not a normal user');
				err.field = 'login';
				return next(err);
			}
		} else {
			let err = new Error('Invalid Phone number or password entered');
			err.field = 'login';
			return next(err);
		}
	} catch (err) {
		return next(err);
	}
};
module.exports.loginAdmin = async (req, res, next) => {
	try {
		const phone_number = req.body.phone_number;
		const password = req.body.password;

		const user = await User.findOne({
			where: {
				phone_number: phone_number,
				is_verified: 1,
			},
		});

		if (user) {
			const roleAdmin = await Role.findOne({
				where: {
					user_id: user.id
				},
			});
			if (roleAdmin && roleAdmin.role_id === ROLE.ADMIN) {
				const isMatched = await bcrypt.compare(password, user.password);

				if (isMatched === true) {
					var userData = {
						id: user.id,
						email: user.email,
						first_name: user.first_name,
						last_name: user.last_name,
						bio: user.bio,
						phone_number: user.phone_number
					};
					return res.json({
						user: userData,
						token: jwt.sign(userData, process.env.AUTH_SECRET, {
							expiresIn: '2h',
						}), // Expires in 2 Hour
					});
				} else {
					let err = new Error('Invalid Phone number or password entered');
					err.field = 'login';
					return next(err);
				}
			}
			else {
				let err = new Error('Account is not a Admin');
				err.field = 'login';
				return next(err);
			}
		} else {
			let err = new Error('Invalid Phone number or password entered');
			err.field = 'login';
			return next(err);
		}
	} catch (err) {
		return next(err);
	}
};
module.exports.getListUsers = async (req, res, next) => {
	const { page, size } = getPageSize(req.query.page, req.query.size)
	try {

		const roleUser = await Role.findAll({
			include: [{ model: User, as: "user" }],
			where: {
				role_id: ROLE.NORMAL_USER
			},
		});
		const usersAll = roleUser.map(item => item.user)
		const usersRes = usersAll.filter((item, index) => {
			return index >= size * (page - 1) && index <= size * page - 1
		})

		return res.json({
			data: usersRes,
			page,
			size,
		});
	} catch (err) {
		return next(err);
	}
};
module.exports.getDetailUser = async (req, res, next) => {
	const user_id = req.params.id || ''
	try {

		const user = await User.findOne({
			where: {
				id: user_id
			},
		});

		return res.json(user);
	} catch (err) {
		return next(err);
	}
};

// Get Logged in user
module.exports.getLoggedInUser = (req, res, next) => {
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
					return res.json({ status: 'success', user: decoded });
				}
			}
		);
	} else {
		let err = new Error('Bạn đang không đăng nhập');
		err.field = 'login';
		return next(err);
	}
};

// Update Profile
module.exports.updateProfile = async (req, res, next) => {
	try {
		var id = req.user.id;
		var first_name = req.body.first_name;
		var last_name = req.body.last_name;
		var bio = req.body.bio;
		var email = req.body.email;
		var phone_number = req.body.phone_number;

		const result = User.update(
			{
				first_name: first_name,
				last_name: last_name,
				bio: bio,
				email: email,
				phone_number: phone_number,
			},
			{
				where: {
					id: {
						[Op.eq]: id,
					},
				},
			}
		);

		return res.json({
			status: 'success',
			result: req.body,
		});
	} catch (err) {
		return next(err);
	}
};

// Change Password
module.exports.changePassword = (req, res, next) => {
	try {
		var id = req.user.id;

		// encrypt password
		var salt = bcrypt.genSaltSync(10);
		var hash = bcrypt.hashSync(req.body.new_password, salt);
		const new_password = hash;

		const result = User.update(
			{
				password: new_password,
			},
			{
				where: {
					id: {
						[Op.eq]: id,
					},
				},
			}
		);

		return res.json({
			status: 'success',
			result: req.user,
		});
	} catch (err) {
		return next(err);
	}
};

// Forgot Password
module.exports.forgotPassword = async (req, res, next) => {
	try {
		var email = req.body.email;
		var token = crypto.randomBytes(16).toString('hex');

		const result = await User.update(
			{
				token: token,
			},
			{
				where: {
					email: {
						[Op.eq]: email,
					},
				},
			}
		);

		// Send the email
		var transporter = nodemailer.createTransport({
			host: process.env.MAIL_HOST,
			port: process.env.MAIL_POST,
			auth: {
				user: process.env.MAIL_AUTH_USER,
				pass: process.env.MAIL_AUTH_PASS,
			},
		});

		var verificationLink = `${process.env.CLIENT_URL}/forgot-password-verify/?token=${token}`;

		var mailOptions = {
			from: process.env.MAIL_FROM,
			to: email,
			subject: 'Reset password',
			html: `Hi there! <br/><br/>
			Please click on the link below to reset your password:<br/>
			<a href="${verificationLink}" target="_blank">${verificationLink}</a><br/><br/>
			Thank You.`,
		};

		await transporter.sendMail(mailOptions);

		return res.json({
			status: 'success',
			result: result,
		});
	} catch (err) {
		return next(err);
	}
};

// Forgot Password Verify Link
module.exports.forgotPasswordVerify = async (req, res, next) => {
	try {
		var token = req.params.token;

		const user = await User.findOne({
			where: {
				token: token,
			},
		});

		if (user) {
			return res.json({
				message: 'Validation link passed',
				type: 'success',
			});
		} else {
			let err = new Error('Invalid token provided');
			err.field = 'token';
			return next(err);
		}
	} catch (err) {
		return next(err);
	}
};

// Reset Password
module.exports.resetPassword = async (req, res, next) => {
	try {
		var token = req.body.token;
		// encrypt password
		var salt = bcrypt.genSaltSync(10);
		var hash = bcrypt.hashSync(req.body.new_password, salt);
		const new_password = hash;

		const result = await User.update(
			{
				password: new_password,
				token: '',
			},
			{
				where: {
					token: {
						[Op.eq]: token,
					},
				},
			}
		);

		return res.json({
			status: 'success',
			result: result,
		});
	} catch (err) {
		return next(err);
	}
};
module.exports.deleteUser = async (req, res, next) => {
	try {
		var phone_number = req.params.phone_number || '';

		const result = await User.destroy({
			where: {
				phone_number: phone_number
			}
		})


		return res.json({
			status: 'success',
			result: result,
		});
	} catch (err) {
		return next(err);
	}
};
