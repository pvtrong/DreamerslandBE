const { Router } = require('express');
const router = Router();

// Import Middlewares
const {
	validationSignup,
	isUserExistsSignup,
	validateLogin,
	authenticateToken,
	validationUpdateProfile,
	isUserExistsUpdate,
	validationChangePassword,
	validationForgotPassword,
	isEmailRegistered,
	validationResetPassword,
	validationDeleteUser,
	isResetTokenValid,
	isAdmin
} = require('../middlewares/userMiddleware');

// Import Controllers
const usersController = require('../controllers/usersController');

router.post(
	'/user/signup',
	[validationSignup, isUserExistsSignup],
	usersController.signUp
); // sends verification link to user
router.get('/user/signup/verify/:token', usersController.signUpVerify); // verify user link when clicked
router.post('/user/login', [validateLogin], usersController.loginUser);
router.post('/admin/login', [validateLogin], usersController.loginAdmin);
router.get('/admin/list_user', [authenticateToken, isAdmin], usersController.getListUsers);
router.get('/admin/user/:id', [authenticateToken, isAdmin], usersController.getDetailUser);
router.get('/user', [authenticateToken], usersController.getLoggedInUser); // get logged in user
router.post(
	'/user/update_profile',
	[authenticateToken, validationUpdateProfile, isUserExistsUpdate],
	usersController.updateProfile
);
router.post(
	'/user/change_password',
	[authenticateToken, validationChangePassword],
	usersController.changePassword
);
router.post(
	'/user/forgot_password',
	[validationForgotPassword, isEmailRegistered],
	usersController.forgotPassword
); // sends reset link to user

router.get(
	'/user/forgot_password/verify/:token',
	usersController.forgotPasswordVerify
); // verify reset link when clicked
router.post(
	'/user/reset_password',
	[validationResetPassword, isResetTokenValid],
	usersController.resetPassword
); // reset to new password
router.delete(
	'/user/:phone_number',
	[validationDeleteUser],
	usersController.deleteUser
); // reset to new password

module.exports = router;
