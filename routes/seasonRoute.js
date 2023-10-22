const { Router } = require("express");
const seasonController = require('../controllers/seasonController');

const router = Router();
// Import Middlewares
const {
  validationCreateSale,
  checkSeason,
  existUserForDate,
  validationUpdateSale,
  checkListIdUpdate,
  notFoundUser
} = require("../middlewares/saleMiddleware");
const { validationUpdate } = require("../middlewares/taskMiddleware");

// Import Controllers
router.get(
    "/season/:id",
    seasonController.getDeitailSeason
  );
  router.get(
    "/season",
    seasonController.getAllSeason
  );
module.exports = router;
