const { Router } = require("express");
const rankController = require('../controllers/rankController');

const router = Router();
// Import Middlewares
const { validationUpdate } = require("../middlewares/taskMiddleware");
const configUpload = require("../services/upload");
const { checkUniqueRankName, validationCreateRank, validationUpdateRank, checkValidId, checkPoint } = require("../middlewares/rankMiddleware");

// Import Controllers

router.post(
  "/rank",
  configUpload.uploadCloud.single("image"),
  checkPoint,
  validationCreateRank,
  checkUniqueRankName,
 rankController.createRank
  
);
router.put(
    "/rank",
    configUpload.uploadCloud.single("image"),
    checkValidId,
    checkPoint,
    validationUpdateRank,
    checkUniqueRankName,
   rankController.editRank
  );
  router.delete(
    "/rank/:id",
   rankController.deleteRank
  );
  
  router.get(
    "/rank/search",
   rankController.searchRank
  );
  router.get(
    "/rank/:id",
   rankController.getDetailRank
  );
module.exports = router;
