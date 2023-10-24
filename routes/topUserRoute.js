const { Router } = require("express");
const topUserController = require('../controllers/topUserController');

const router = Router();
// Import Middlewares
const { validationUpdate } = require("../middlewares/taskMiddleware");
const configUpload = require("../services/upload");
const { checkUniqueRankName, validationCreateRank, validationUpdateRank, checkValidId, checkPoint } = require("../middlewares/rankMiddleware");

// Import Controllers

router.get(
  "/top-user",
  
 topUserController.getTopuser
  
);

module.exports = router;
