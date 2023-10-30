const { Router } = require("express");
const seasonController = require('../controllers/seasonController');

const router = Router();
// Import Middlewares

const { validationCreateSeason, validationUpdateSeason, checkSeason, checkValidId, checkUniqueSeasonName } = require("../middlewares/seasonMiddleware");

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
  checkSeason,
  validationCreateSeason,
  checkUniqueSeasonName,
  seasonController.createSeason
);
router.put(
  "/season",
  checkValidId,
  checkSeason,
  validationUpdateSeason,
  checkUniqueSeasonName,
  seasonController.editSeason
);
router.delete(
  "/season/:id",
  seasonController.deleteSeason
);

module.exports = router;
