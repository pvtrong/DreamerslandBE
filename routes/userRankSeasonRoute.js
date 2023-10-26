const { Router } = require('express');
const router = Router();

// Import Controllers
const userRankSeasonController = require('../controllers/userRankSeasonController');

router.post('/user-rank-season', userRankSeasonController.CreateUserRankSeason);


module.exports = router;
