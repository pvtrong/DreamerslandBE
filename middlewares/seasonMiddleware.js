let yup = require("yup");
const { Season } = require("../db");

const { Op, fn, col, literal } = require("sequelize");

// ========================================================================

// Schema - Create
let seasonCreate = yup.object().shape({
  season_name: yup.string().required("Tên mùa giải không được để trống"),
  start_date: yup.date().required("Ngày bắt đầu không được để trống"),
  end_date: yup.date().required("Ngày kết thúc không được để trống"),
});

let seasonUpdate = yup.object().shape({
  id: yup
    .number()
    .integer("ID phải là số nguyên")
    .required("ID không được để trống"),
    season_name: yup.string().required("Tên mùa giải không được để trống"),
    start_date: yup.date().required("Ngày bắt đầu không được để trống"),
    end_date: yup.date().required("Ngày kết thúc không được để trống"),
});

// Validation - Create
module.exports.validationCreateSeason = (req, res, next) => {
  seasonCreate
    .validate(req.body, { abortEarly: false })
    .then(function () {
      next();
    })
    .catch(function (err) {
      return next({ ...err, statusCode: 400 });
    });
};

// Validation - Upadte
module.exports.validationUpdateSeason = (req, res, next) => {
  seasonUpdate
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
    const seasonItem = await Season.findByPk(req.body.id);
    if (!seasonItem) {
      return next({ statusCode: 400, message: "Không tồn tại mùa giải" });
    }
    next()
  } catch (error) {
    next(error);
  }
};

module.exports.checkSeason = async (req, res, next) => {
  try {
    let { id, start_date, end_date, season_name } = req.body;

    // case update

    if (id) {
      const currentSeason = await Season.findByPk(id);
      if (!currentSeason) {
        return next({ statusCode: 400, message: "Không tồn tại mùa giải" });
      }
    }
    else {
      if (start_date >= end_date) {
        return next({
          statusCode: 400,
          message: "Ngày bắt đầu phải nhỏ hơn ngày kết thúc",
        });
      }

      const allSeason = await Season.findAll({
        raw: true,
        where: id ? {
            id: {
              [Op.ne]: id, 
            },
          }:{},
      });

      const conflictSeason = allSeason.find((seasonItem) => {
        if(
          (start_date >= seasonItem.start_date &&
            start_date <= seasonItem.end_date) ||
          (end_date >= seasonItem.start_date && end_date <= seasonItem.end_date)
        ) return seasonItem
      });

      if (conflictSeason) {
        return next({
          statusCode: 400,
          message: `Conflic date với season ${conflictSeason.season_name}`,
        });
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports.checkUniqueSeasonName = async (req, res, next) => {
  try {
    const { season_name } = req.body;
    if (season_name) {
      const result = await Season.findOne({
        where: {
          season_name: {
            [Op.eq]: season_name,
          },
        },
        raw: true,
      });
      // api create
      if (
        (result && !req.body.id) ||
        (result && req.body.id && req.body.id != result.id)
      ) {
        return next({ statusCode: 400, message: "Tên mùa giải đã tồn tại" });
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};
