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
module.exports.createManySale;
// create many
module.exports.createManySale = async (req, res, next) => {
  const { amount, point, users, season_id, date_time } = req.body;
  // return res.status(200).json({})
  try {
    let listNewSale = [];
    users.forEach((item, index) => {
      const newSale = {
        season_id,
        point,
        amount,
        user_id: item,
        date_time,
      };
      listNewSale.push(newSale);
    });

    const newSale = await Sale.bulkCreate(listNewSale);
    return res.status(201).json(newSale);
  } catch (error) {
    next(error);
  }
};

// Update Sale
module.exports.updateManySale = async (req, res, next) => {
  const listId = req.body.ids;
  delete req.body.ids;
  console.log(listId);
  try {
    const updateData = await Sale.update(req.body, {
      where: {
        id: listId,
      },
    });
    return res.status(200).json("success");
  } catch (error) {
    next(error);
  }
};

// Delete Sale
module.exports.deleteSale = async (req, res, next) => {
  const id = req.params.id;
  try {
    const deleted = await Sale.destroy({
      where: {
        id: {
          [Op.eq]: id,
        },
      },
    });

    if (!deleted) {
      return next({ statusCode: 404, message: "Không tồn tại" });
    }
    res.json({
      status: "success",
      result: {
        deletedSale: deleted,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Search Sale
module.exports.searchSales = async (req, res, next) => {
  try {
    let { session_id, user_id, date_time, page, limit } = req.query;
    if (isNaN(page) || !page || !Number.isInteger(Number(page))) {
      page = 1;
    }
    if (isNaN(limit) || !limit||!Number.isInteger(Number(limit))) {
      limit = 30;
    }
    console.log(limit ,page)
    const offset = (Number(page) - 1) * Number(limit);
  console.log(offset)
    const whereClause = {};

    if (session_id) {
      whereClause.session_id = session_id;
    }

    if (user_id) {
      whereClause.user_id = user_id;
    }

    if (date_time) {
      // Chuyển đối số date_time thành khoảng thời gian trong ngày
      const searchDate = new Date(date_time);
      searchDate.setHours(0, 0, 0, 0);

      whereClause.date_time = {
        [Op.gte]: searchDate, // Lớn hơn hoặc bằng ngày bắt đầu
        [Op.lte]: new Date(searchDate.getTime() + 86400000), // Nhỏ hơn hoặc bằng ngày kết thúc (cộng 86400000 milliseconds cho một ngày)
      };
    }

    const totalSales = await Sale.count({ where: whereClause });
    const sales = await Sale.findAll({
      where: whereClause,
      limit: Number(limit),
      offset: offset,
      attributes: { exclude: ["user_id", "season_id"] },
      include: [
        { model: Season, as: "season" }, // Bổ sung thông tin từ mối quan hệ "season"
        {
          model: User,
          as: "user",
          attributes:{ exclude:  ["token", "password"], }
          
        }, // Bổ sung thông tin từ mối quan hệ "user"
      ],
    });

    const totalPages = Math.ceil(totalSales / limit);

    res.status(200).json({
      data: sales,
      total: totalSales,
      page: parseInt(page),
      totalPages,
    });
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

// Get sale by id

module.exports.getSaleById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const sale = await Sale.findByPk(id, {
      attributes: { exclude: ["user_id", "season_id"] },
      include: [
        { model: Season, as: "season" }, // Bổ sung thông tin từ mối quan hệ "season"
        {
          model: User,
          as: "user",
          attributes: ["id", "first_name", "last_name", "bio", "email"],
        }, // Bổ sung thông tin từ mối quan hệ "user"
      ],
    });

    if (sale) {
      res.status(200).json(sale);
    } else {
      return next({ statusCode: 404, message: "Không tồn tại" });
    }
  } catch (error) {
    // Xử lý lỗi nếu có lỗi trong quá trình truy vấn
    next(error);
  }
};
