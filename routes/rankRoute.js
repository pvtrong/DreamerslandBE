const { Router } = require("express");
const rankController = require("../controllers/rankController");

const router = Router();
// Import Middlewares
const { validationUpdate } = require("../middlewares/taskMiddleware");

const configUpload = require("../services/upload");
const {
  checkUniqueRankName,
  validationCreateRank,
  validationUpdateRank,
  checkValidId,
  checkPoint,
} = require("../middlewares/rankMiddleware");
const { authenticateToken, isAdmin } = require("../middlewares/userMiddleware");

// Import Controllers

router.post(
  "/rank",
  [authenticateToken, isAdmin],
  configUpload.uploadCloud.single("image"),
  // validationCreateRank,
  // checkUniqueRankName,
  rankController.createRank
);
router.put(
  "/rank",
  [authenticateToken, isAdmin],
  configUpload.uploadCloud.single("image"),
  checkValidId,
  validationUpdateRank,
  checkUniqueRankName,
  rankController.editRank
);
router.delete(
  "/rank/:id",
  [authenticateToken, isAdmin],

  rankController.deleteRank
);

router.get(
  "/rank/search",
  [authenticateToken, isAdmin],

  rankController.searchRank
);
router.get(
  "/rank/:id",
  [authenticateToken, isAdmin],
  rankController.getDetailRank
);
module.exports = router;
