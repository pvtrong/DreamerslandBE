require("dotenv").config();
// Load model
const { Sale } = require("../db");
const { Season, User } = require("../db");
const { Op, fn, col } = require("sequelize");

const utils = require("../utils");
const nodemailer = require("nodemailer");
var formidable = require("formidable");
var fs = require("fs");
const moment = require("moment");
const { number } = require("yup");
module.exports.createManySale;
const TYPE_ORDER = {
  DAY: 1,
  MONTH: 2,
  YEAR: 3,
};
const FIELD_SORT = {
  AMOUNT: 1,
  POINT: 2,
};
module.exports.getTopuser = async (req, res, next) => {
  try {
    let { type, season_id, field } = req.query;
    type = Number(type);
    field = Number(field);
    if (!Object.values(TYPE_ORDER).includes(type)) {
      type = TYPE_ORDER.DAY;
    }
    if (!Object.values(TYPE_ORDER).includes(field)) {
      req.query.field = FIELD_SORT.POINT;
    }

    // Nếu ko gửi lên season thì mặc định lấy season hiện tại
    if (!season_id) {
      const seasonCurrent = await Season.findOne({
        where: {
          is_current: true,
        },
        raw: true,
      });
      if (seasonCurrent) {
        season_id = seasonCurrent.id;
      }
    }
    //  nếu có gửi lên season thì check xem season có hợp lệ ko
    else {
      const seasonCurrent = await Season.findByPk(season_id, {
        raw: true,
      });
      if (!seasonCurrent) {
        next({ statusCode: 400, message: "Season không hợp lệ" });
      }
    }
    let listSale = await Sale.findAll({
      where: { season_id },
      attributes: { exclude: ["user_id", "season_id"] },
      include: [
        { model: Season, as: "season" }, // Bổ sung thông tin từ mối quan hệ "season"
        {
          model: User,
          as: "user",
          attributes: { exclude: ["token", "password", "is_verified"] },
        }, // Bổ sung thông tin từ mối quan hệ "user"
      ],
    });
    listSale = listSale
      .map((sale) => sale.toJSON())
      .sort((a, b) => new Date(a.date_time) - new Date(b.date_time))
      .map((salesItem) => ({
        ...salesItem,
        date_time: moment(salesItem.date_time).format("DD/MM/YYYY"),
      }));
    req.listSale = listSale;
    switch (type) {
      case TYPE_ORDER.DAY: {
        getTopByDay(req, res, next);
        break;
      }
      case TYPE_ORDER.MONTH: {
        getTopByMonth(req, res, next);
        break;
      }
      case TYPE_ORDER.YEAR: {
        getTopByYear(req, res, next);
        break;
      }
      default: {
        getTopByDay(req, res, next);
      }
    }
  } catch (error) {
    next(error);
  }
};

// Top theo ngày
const getTopByDay = async (req, res, next) => {
  const { listSale } = req;
  let { field } = req.query;
  let result = {};
  
  // group
  result = groupBy(listSale,"date_time")
  
  // sort
  result = sortResult(result,field);
  res.status(200).json(result);
};

// Top theo tháng
const getTopByMonth = async (req, res, next) => {
  let { field } = req.query;
  let result = {};
  let { listSale } = req;
  // chuyển về dd-yyyy
  listSale = listSale.map((item) => {
    const index = item.date_time.indexOf("/");
    if (index >= 0) {
      item.date_time = item.date_time.substring(index + 1);
    }
    return item;
  });

  result = groupBy(listSale,"date_time")
  result = handleAdd(result);
  result = sortResult(result,field);
  res.status(200).json(result);
};
const getTopByYear = async (req, res, next) => {
  let { field } = req.query;
  let result = {};
  let { listSale } = req;
  // chuyển về dd-yyyy
  listSale = listSale.map((item) => {
    const index = item.date_time.lastIndexOf("/");
    if (index >= 0) {
      item.date_time = item.date_time.substring(index + 1);
    }
    return item;
  });

  result = groupBy(listSale,"date_time")
  result = handleAdd(result);
  result = sortResult(result,field);
  res.status(200).json(result);
};

// SORT
const sortResult = (result,field) => {
  for (key in result) {
    // sort theo tiền
    if (field == FIELD_SORT.AMOUNT) {
      result[key] = result[key].sort((a, b) => b.amount - a.amount);
    }
    // sort theo điểm
    else {
      result[key] = result[key].sort((a, b) => b.point - a.point);
    }
  }
  return result;
};

// grouby
const groupBy = (listSale, keyword) => {
  let result = {};
  listSale.forEach((obj) => {
    const key = obj[keyword];
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(obj);
  });
  return result;
};


// cộng amount và điểm cho rankking theo tháng ,năm
const handleAdd = (data) => {
  let result = {}
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const items = data[key];
      // Sử dụng Map để gom theo user_id
      const userMap = new Map();
      for (const item of items) {
        const user_id = item.user.id
        if (!userMap.has(user_id)) {
          userMap.set(user_id, {
            ...item,
            amount: 0,
            point: 0,
          });
        }
  
        const userItem = userMap.get(user_id);
        userItem.amount += item.amount;
        userItem.point += item.point;
      }
  
      // Chuyển Map thành mảng
      const resultArray = [...userMap.values()];
  
      result[key] = resultArray;
    }
  }
  return result;
}