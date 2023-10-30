const { Router } = require("express");
const rankController = require('../controllers/rankController');

const router = Router();
// Import Middlewares
const { validationUpdate } = require("../middlewares/taskMiddleware");
const { isAdmin } = require("../middlewares/userMiddleware");

const configUpload = require("../services/upload");
const { checkUniqueRankName, validationCreateRank, validationUpdateRank, checkValidId, checkPoint } = require("../middlewares/rankMiddleware");

// Import Controllers

router.post(
  "/rank",
  isAdmin,
  configUpload.uploadCloud.single("image"),
  // validationCreateRank,
  // checkUniqueRankName,
 rankController.createRank
  
);
router.put(
    "/rank",
    isAdmin,
    configUpload.uploadCloud.single("image"),
    checkValidId,
    validationUpdateRank,
    checkUniqueRankName,
   rankController.editRank
  );
  router.delete(
    "/rank/:id",
    isAdmin,
   rankController.deleteRank
  );
  
  router.get(
    "/rank/search",
   isAdmin,
   rankController.searchRank
  );
  router.get(
    "/rank/:id",
    isAdmin,
   rankController.getDetailRank
  );
module.exports = router;
