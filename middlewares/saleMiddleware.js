let yup = require("yup");
const { Sale } = require("../db");
const { Season,User } = require("../db");

const { Op, fn, col, literal } = require("sequelize");

// ========================================================================

// Schema - Create
let schemaCreateSale = yup.object().shape({
  // mảng số nguyên
  users: yup.array().of(yup.number().integer()).required(),
  amount: yup.number().positive().required(),
  point: yup.number().required(),
  date_time: yup.date().nullable(),
  season_id: yup.number().positive().required(),
});

let schemaUpdate = yup.object().shape({
  // mảng số nguyên
  ids: yup.array().of(yup.number().integer()).required(),

  amount: yup.number().positive().required(),
  point: yup.number().required(),
  date_time: yup.date().nullable(),
  season_id: yup.number().positive().required(),
});

// Validation - Create
module.exports.validationCreateSale = (req, res, next) => {
  schemaCreateSale
    .validate(req.body, { abortEarly: false })
    .then(function () {
      next();
    })
    .catch(function (err) {
      return next({ ...err, statusCode: 400 });
    });
};
// Validation - Upadte
module.exports.validationUpdateSale = (req, res, next) => {
  schemaUpdate
    .validate(req.body, { abortEarly: false })
    .then(function () {
      next();
    })
    .catch(function (err) {
      return next({ ...err, statusCode: 400 });
    });
};
// check list id update
module.exports.checkListIdUpdate = async (req, res, next) => {
  if((new Set(req.body.ids).size !==req.body.ids.length )){
    req.body.ids =  Array.from(new Set( req.body.ids));
   }
  const listId = req.body.ids || [];
  for (let i = 0; i < listId.length; i++) {
    const saleItem =await Sale.findOne({
      where: {
        id: listId[i],
      },
      raw:true
    });
    if(!saleItem){
        return next({statusCode:400,message:"Tồn tại doanh thu muốn cập nhật không có trong hệ thống"})
    }
  }
  next();
};
// check Season

module.exports.checkSeason = async (req, res, next) => {
  try {
    const allSeason = await Season.findAll({
      attributes: ["id"],
      raw: true,
    });
    if (allSeason.map((i) => i.id).includes(req.body.season_id)) {
      next();
    } else {
      return next({ statusCode: 400, message: "Season không hợp lệ" });
    }
  } catch (err) {
    return next(err);
  }
};

// Chekc list user gui len co ton tai ko va co bi dublicate ko
module.exports.notFoundUser = async (req, res, next) => {
  
  if((new Set(req.body.users).size !==req.body.users.length )){
   req.body.users =  Array.from(new Set( req.body.users));
  }
  const listId = req.body.users || [];
  for (let i = 0; i < listId.length; i++) {
    const userItem =await User.findOne({
      where: {
        id: listId[i],
      },
      raw:true
    });
    console.log(userItem)
    if(!userItem){
        return next({statusCode:400,message:"Tồn tại user muốn thêm doanh só không có trong hệ thống"})
    }
  }
  next();
}
// Tồn tại user đã thêm từ trước
module.exports.existUserForDate = async (req, res, next) => {
  try {
    const { users } = req.body;
    // Check list có user đã được thêm trong ngày gửi lên
    const requestedDate =
      req.body["date_time"] || moment().format("YYYY-MM-DD");
    const lisUserForday = await Sale.findAll({
      attributes: ["user_id"],
      where: literal(
        `DATE_FORMAT(date_time, '%Y-%m-%d') = DATE_FORMAT('${requestedDate}', '%Y-%m-%d')`
      ),
      raw: true,
    });
    if (
      new Set([...lisUserForday.map((i) => i.user_id), ...users]).size !==
      users.length + lisUserForday.length
    ) {
      next({ statusCode: 400, message: "Tồn tại user đã được thêm từ trước" });
    } else {
      next();
    }
  } catch (error) {
    next(error);
  }
};
