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
const { isAdmin } = require("../middlewares/userMiddleware");

// Import Controllers

router.post(
  "/sales",
  isAdmin,
  validationCreateSale,
  checkSeason,
  notFoundUser,
  existUserForDate,
  saleController.createManySale
);
router.put(
  "/sales",
  isAdmin,
  validationUpdateSale,
  // checkSeason,
  checkListIdUpdate,
  saleController.updateManySale
);
router.delete("/sales/:id", isAdmin, saleController.deleteSale);
router.get("/sales/search", isAdmin, saleController.searchSales);
router.get("/sales/:id", isAdmin, saleController.getSaleById);
module.exports = router;
