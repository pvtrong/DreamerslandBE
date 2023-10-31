const { Router } = require("express");
const saleController = require("../controllers/salesController");

const router = Router();
// Import Middlewares
const {
  validationCreateSale,
  checkSeason,
  existUserForDate,
  validationUpdateSale,
  checkListIdUpdate,
  notFoundUser,
} = require("../middlewares/saleMiddleware");
const { validationUpdate } = require("../middlewares/taskMiddleware");
const { authenticateToken, isAdmin } = require("../middlewares/userMiddleware");

// Import Controllers

router.post(
  "/sales",
  [authenticateToken, isAdmin],
  validationCreateSale,
  checkSeason,
  notFoundUser,
  existUserForDate,
  saleController.createManySale
);
router.put(
  "/sales",
  [authenticateToken, isAdmin],
  validationUpdateSale,
  // checkSeason,
  checkListIdUpdate,
  saleController.updateManySale
);
router.delete(
  "/sales/:id",
  [authenticateToken, isAdmin],
  saleController.deleteSale
);
router.get(
  "/sales/search",
  [authenticateToken, isAdmin],
  saleController.searchSales
);
router.get("/sales/:id",
[authenticateToken, isAdmin],
 saleController.getSaleById);
module.exports = router;
