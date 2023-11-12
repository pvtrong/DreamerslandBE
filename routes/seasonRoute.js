const { Router } = require("express");
const seasonController = require('../controllers/seasonController');

const router = Router();
// Import Middlewares

const { validationCreateSeason, validationUpdateSeason, checkSeason, checkValidId, checkUniqueSeasonName } = require("../middlewares/seasonMiddleware");
const { isAdmin, authenticateToken } = require("../middlewares/userMiddleware");

// Import Controllers
router.get(
  "/season/:id",
  seasonController.getDeitailSeason
);
router.get(
  "/season",
  
  seasonController.getAllSeason
);
router.post(
  "/season",
  [authenticateToken, isAdmin],
  checkSeason,
  validationCreateSeason,
  checkUniqueSeasonName,
  seasonController.createSeason
);
router.put(
  "/season",
  [authenticateToken, isAdmin],
  checkValidId,
  checkSeason,
  validationUpdateSeason,
  checkUniqueSeasonName,
  seasonController.editSeason
);
router.delete(
  "/season/:id",
  [authenticateToken, isAdmin],
  seasonController.deleteSeason
);

module.exports = router;
