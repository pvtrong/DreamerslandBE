require("dotenv").config();
// Load model
const { Sale, Rank } = require("../db");
const { Season, User, User_Season_Rank } = require("../db");
const { Op, fn, col, where } = require("sequelize");

const utils = require("../utils");
const nodemailer = require("nodemailer");
var formidable = require("formidable");
var fs = require("fs");
const moment = require("moment");
const { ppid } = require("process");
module.exports.createManySale;
// create many
module.exports.createManySale = async (req, res, next) => {
  const { amount, users, season_id, date_time } = req.body;
  try {
    let listNewSale = [];
    const listRank = await Rank.findAll({
      order: [["order", "DESC"]],
      raw: true,
    });
    const minRank = listRank[listRank.length - 1];
    for (let i = 0; i < users.length; i++) {
      const id = users[i];
      await handleAddRecordUserSeasonRank(season_id, id,minRank);
      const point = await getPoint(season_id, id, amount, next);
      const newSale = {
        season_id,
        point,
        amount,
        user_id: id,
        date_time,
      };
      // Check xem nếu ứng với season_id, user_id mà chưa có trong bảng Season_user_rank. Thì thêm 1 record mới.
      // await updateRankUser(season_id, id, newSale, listRank);
      listNewSale.push(newSale);
    }

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
  try {
    for (let i = 0; i < listId.length; i++) {
      let detail = await Sale.findByPk(listId[i]);
      if (!detail) return next("Error");
      detail = detail.toJSON();
      const { season_id, user_id } = detail;
      const point = await getPoint(season_id, user_id, req.body.amount, next);
      await Sale.update(
        {
          ...req.body,
          point,
        },
        {
          where: {
            id: listId[i],
          },
        }
      );
    }
    // const updateData = await Sale.update(req.body, {
    //   where: {
    //     id: listId,
    //   },
    // });
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
    if (isNaN(limit) || !limit || !Number.isInteger(Number(limit))) {
      limit = 30;
    }
    const offset = (Number(page) - 1) * Number(limit);
    const whereClause = {};

    if (session_id) {
      whereClause.session_id = session_id;
    }

    if (user_id) {
      whereClause.user_id = user_id;
    }

    // search theo họ tên nhân, vên số điện thoại

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
          attributes: { exclude: ["token", "password"] },
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

// Get Point
const getPoint = async (season_id, user_id, amount, next) => {
  try {
    // get rank user
    let currentRank = await User_Season_Rank.findOne({
      where: {
        season_id,
        user_id,
      },
      include: [
        {
          model: Rank,
          as: "rank",
        },

      ],
    });
    if (!currentRank) {
      next({
        statusCode: 400,
        message: "Không tìm thấy rank ứng với user và season hiện tại",
      });
    }
    currentRank = currentRank.toJSON();
    const target_day = currentRank.rank.target_day;

    // Tính điểm
    //cộng X2 doanh số vượt
    if (amount > target_day) {
      return Math.round((amount + 2 * (amount - target_day)) / 1000000);
    }
    // Thấp hơn bị trừ
    if (amount < target_day) {
      const moneyFinal = amount - (target_day - amount);
      return Math.round(moneyFinal / 1000000);
    }

    // Bằng
    return Math.round(amount / 1000000);
  } catch (error) {
    next(error);
  }
};

// Update rank user

const updateRankUser = async (season_id, user_id, newSale, listRank) => {
  let rank = 1;
  let point = 0;
  let listSale = await Sale.findAll({
    where: {
      season_id,
      user_id,
    },
    raw: true,
  });
  listSale.push(newSale);
  listSale.sort((a, b) => a.date_time - b.date_time);
  for (let i = 0; i < listSale.length; i++) {
    point += listSale[i].point;

    if (point >= 100) {
      // check 3 ngày chuỗi
      // chưa đủ 3 ngày để check thì rank vẫn giữ nguyên
      if (!listSale[i + 1]) {
        break;
      } else {
        if (!checkCompletedTarget(listSale[i + 1].amount, listRank, rank)) {
          point = 75;
          i += 1;
          continue;
        }
      }

      if (!listSale[i + 2]) {
        break;
      } else {
        if (!checkCompletedTarget(listSale[i + 2].amount, listRank, rank)) {
          point = 75;
          i += 2;
          continue;
        }
      }
      if (!listSale[i + 3]) {
        break;
      } else {
        if (!checkCompletedTarget(listSale[i + 3].amount, listRank, rank)) {
          point = 75;
          i += 3;
          continue;
        } else {
          // cập nhật lại rank
          rank += 1;
          point = 0;
          continue;
        }
      }
    }

    // Xuống rank
    if (point <= 0) {
      if (rank > 1) {
        rank--;
        point = 75;
      }
    }
  }

  // kêt thúc vòng for sẽ có rank hiện tại bằng giá trị biến rank, đối chiếu với order

  const maxOrder = listRank[0].order;
  const minRank = listRank[listRank.length - 1];
  //cập nhật lại rank
  if (rank != maxOrder) {
    const newIdRank = listRank.find((i) => i.order == rank);
    if(newIdRank){
      User_Season_Rank.update(
        {
          rank_id: newIdRank.id,
        },
        {
          where: {
            season_id,
            user_id,
          },
        }
      );
    }
    
  }
};
// checkCompleted target
const checkCompletedTarget = (amount, listRank, order) => {
  const rank = listRank.find((i) => i.order == order);
  if (rank) {
    return amount >= rank.target_day;
  }
  return false;
};

// handle add record in user_season_rank
const handleAddRecordUserSeasonRank = async (season_id, user_id, minRank) => {
  const existRecord = await User_Season_Rank.findOne({
    where: {
      season_id,
      user_id,
    },
  });
  if (!existRecord) {
    await User_Season_Rank.create({
      point: 0,
      season_id,
      user_id,
      rank_id: minRank.id,
    });
  }
};
