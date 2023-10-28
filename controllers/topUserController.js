require("dotenv").config();
// Load model
const { Sale, User_Season_Rank, Rank } = require("../db");
const { Season, User } = require("../db");
const { Op, fn, col } = require("sequelize");

const utils = require("../utils");
const nodemailer = require("nodemailer");
var formidable = require("formidable");
var fs = require("fs");
const moment = require("moment");
const { number } = require("yup");
module.exports.createManySale;

const SORT_BY = {
  AMOUNT: "amount",
  POINT: "point",
};
module.exports.getTopuser = async (req, res, next) => {
  try {
    let { from, to, season_id, page, limit, sort_by } = req.query;

    // Nếu ko truyền sort_by thì mặc định là sắp xếp theo point
    if (Object.values(SORT_BY).includes(sort_by)) {
      sort_by = SORT_BY.POINT;
    }
    const offset = (Number(page) - 1) * Number(limit);
    const whereClause = {};

    if (season_id) {
      whereClause.season_id = season_id;
    }
    if (from) {
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);
      whereClause.date_time = {
        [Op.gte]: fromDate,
      };
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);

      whereClause.date_time = {
        ...whereClause.date_time,
        [Op.lte]: toDate,
      };
    }
    if (from && to && new Date(from) > new Date(to)) {
      return next({
        statusCode: 400,
        message: "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc",
      });
    }

    // Check Season
    if (season_id) {
      const seasonCurrent = await Season.findByPk(season_id, {
        raw: true,
      });
      if (!seasonCurrent) {
        next({ statusCode: 400, message: "Season không hợp lệ" });
      }
    }

    let include = [
      // Bổ sung thông tin từ mối quan hệ "season"
      {
        model: User,
        as: "user",
        attributes: { exclude: ["token", "password", "is_verified"] },
        include: [
          {
            model: User_Season_Rank,
            as: "userSeasonRanks",
            include: [
              {
                model: Rank,
                as: "rank",
              },
            ],
            where: {
              season_id,
            },
          },
        ],
      },
    ];
    if (season_id) {
      include.push({ model: Season, as: "season" });
    }
    let listSale = await Sale.findAll({
      where: whereClause,
      attributes: { exclude: ["user_id", "season_id"] },
      include,
    });

    // format data

    listSale = listSale
      .map((sale) => sale.toJSON())
      .map((item) => {
        const user = item.user;
        const userSeasonRanks = user.userSeasonRanks;
        const rank =
          userSeasonRanks.length > 0 ? userSeasonRanks[0].rank : null;
        if (rank) {
          rank.rank_name = userSeasonRanks[0].rank.rank_name;
          rank.img_url = userSeasonRanks[0].rank.img_url;
          rank.bonus =
            userSeasonRanks[0].point > 100 ? 100 :  userSeasonRanks[0].point;
        }

        // Loại bỏ key "userSeasonRanks" và thêm key "rank" với giá trị là rank
        delete user.userSeasonRanks;
        user.rank = rank;

        return item;
      })
      .sort((a, b) => new Date(a.date_time) - new Date(b.date_time))
      .map((salesItem) => ({
        ...salesItem,
        date_time: moment(salesItem.date_time).format("DD/MM/YYYY"),
      }));
    // Add Amount, Point  của từng user thành 1 item
    listSale = handleAdd(listSale);

    // sort
    listSale = sortResult(listSale, sort_by);
    res.status(200).json(listSale);
  } catch (error) {
    next(error);
  }
};

// SORT
const sortResult = (result, field) => {
  if (field == SORT_BY.AMOUNT) {
    result = result.sort((a, b) => b.amount - a.amount);
  }
  // sort theo điểm
  else {
    result = result.sort((a, b) => b.point - a.point);
  }

  return result;
};

// cộng amount và point
const handleAdd = (data) => {
  let result = {};
  data.forEach((item) => {
    const userId = item.user.id;
    if (!result[userId]) {
      result[userId] = item;
    } else {
      result[userId] = {
        ...result[userId],
        amount: result[userId].amount + item.amount,
        point: result[userId].point + item.point,
      };
    }
  });
  return Object.values(result);
};
