let yup = require("yup");
const { Rank } = require("../db");
const { Season, User } = require("../db");

const { Op, fn, col, literal } = require("sequelize");

// ========================================================================

// Schema - Create
let rankCreate = yup.object().shape({
  rank_name: yup.string().required("Tên hạng không được để trống"),
  target_day: yup
    .number()
    .typeError("Mục tiêu doanh thu 1 ngày phải là số")
    .required("Mục tiêu doanh thu không được để trống"),
    order: yup
    .number()
    .typeError("Mục tiêu doanh thu 1 ngày phải là số")
    .required("Mục tiêu doanh thu không được để trống"),
});

let rankUpdate = yup.object().shape({
  id: yup
    .number()
    .integer("ID phải là số nguyên")
    .required("ID không được để trống"),
  rank_name: yup.string().nullable().notRequired(),
  target_day: yup
    .number()
    .typeError("Mục tiêu doanh thu 1 ngày phải là số")
    .nullable()
    .notRequired(),
    order: yup
    .number()
    .typeError("Mục tiêu doanh thu 1 ngày phải là số")
    .nullable()
    .notRequired(),
});

// Validation - Create
module.exports.validationCreateRank = (req, res, next) => {
  rankCreate
    .validate(req.body, { abortEarly: false })
    .then(function () {
      next();
    })
    .catch(function (err) {
      return next({ ...err, statusCode: 400 });
    });
};

// Validation - Upadte
module.exports.validationUpdateRank = (req, res, next) => {
  rankUpdate
    .validate(req.body, { abortEarly: false })
    .then(function () {
      next();
    })
    .catch(function (err) {
      return next({ ...err, statusCode: 400 });
    });
};

// check validate id
module.exports.checkValidId = async (req, res, next) => {
  try {
    const rankItem = await Rank.findByPk(req.body.id);
    if (!rankItem) {
      return next({ statusCode: 400, message: "Không tồn tại rank" });
    }
    next();
  } catch (error) {
    next(error);
  }
};

// check validate minpoin , maxpoint
module.exports.checkPoint = async (req, res, next) => {
  try {
    let { id, min_point, max_point } = req.body;

    // case update

    if (id) {
      const currentRank = await Rank.findByPk(id);
      if (!min_point) {
        min_point = currentRank.min_point;
      }
      if (!max_point) {
        max_point = currentRank.max_point;
      }
    }
    if (id && !min_point && !max_point) next();
    else {
      if (min_point >= max_point) {
        return next({
          statusCode: 400,
          message: "min point phải bé hơn max point",
        });
      }
      const allRank = await Rank.findAll({
        raw: true,
        where: id
          ? {
              id: {
                [Op.ne]: id,
              },
            }
          : {},
      });
      const conflictRank = allRank.find((rankItem) => {
        return (
          rankItem.min_point == min_point ||
          rankItem.max_point == max_point ||
          (min_point > rankItem.min_point && max_point < rankItem.max_point) ||
          (min_point < rankItem.max_point && max_point > rankItem.max_point) ||
          (min_point < rankItem.min_point &&
            max_point > rankItem.min_point &&
            max_point < rankItem.max_point)
        );
      });
      if (conflictRank) {
        return next({
          statusCode: 400,
          message: `Conflic point với rank ${conflictRank.rank_name}`,
        });
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};
// check unique rankname
module.exports.checkUniqueRankName = async (req, res, next) => {
  try {
    const { rank_name } = req.body;
    if (rank_name) {
      const result = await Rank.findOne({
        where: {
          rank_name: {
            [Op.eq]: rank_name,
          },
        },
        raw: true,
      });
      // api create
      if (
        (result && !req.body.id) ||
        (result && req.body.id && req.body.id != result.id)
      ) {
        return next({ statusCode: 400, message: "Tên danh hiệu đã tồn tại" });
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};
