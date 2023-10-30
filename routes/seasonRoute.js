const { Router } = require("express");
const seasonController = require('../controllers/seasonController');

const router = Router();
// Import Middlewares

const { validationCreateSeason, validationUpdateSeason, checkSeason, checkValidId, checkUniqueSeasonName  } = require("../middlewares/seasonMiddleware");
const { isAdmin } = require("../middlewares/userMiddleware");

// Import Controllers
router.get(
    "/season/:id",
    isAdmin,
    seasonController.getDeitailSeason
  );
router.get(
  "/season",
  isAdmin,
  seasonController.getAllSeason
);
router.post(
  "/season",
  isAdmin,
  checkSeason,
  validationCreateSeason,
  checkUniqueSeasonName,
  seasonController.createSeason
);
router.put(
  "/season",
  isAdmin,
  checkValidId,
  checkSeason,
  validationUpdateSeason,
  checkUniqueSeasonName,
  seasonController.editSeason
);
router.delete(
  "/season/:id",
  isAdmin,
  seasonController.deleteSeason
);

module.exports = router;
