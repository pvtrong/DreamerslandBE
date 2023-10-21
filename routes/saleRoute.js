const { Router } = require("express");
const saleController = require('../controllers/salesController');

const router = Router();
// Import Middlewares
const {
  validationCreateSale,
  checkSeason,
  existUserForDate,
  validationUpdateSale,
  checkListIdUpdate
} = require("../middlewares/saleMiddleware");
const { validationUpdate } = require("../middlewares/taskMiddleware");

// Import Controllers

router.post(
  "/sales",
  validationCreateSale,
  checkSeason,
  existUserForDate,
  saleController.createManySale,
  
);
router.put(
    "/sales",
    validationUpdateSale,
    checkSeason,
    checkListIdUpdate,
    saleController.updateManySale,
  );
  router.delete(
    "/sales/:id",
    saleController.deleteSale
  );
  router.get(
    "/sales/search",
    saleController.searchSales
  );
  router.get(
    "/sales/:id",
    saleController.getSaleById
  );
module.exports = router;
