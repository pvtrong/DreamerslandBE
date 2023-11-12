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
const { getTimeExactly } = require("../services/utils");
module.exports.createManySale;
// create many
module.exports.createManySale = async (req, res, next) => {
  let { amount, users, season_id, date_time } = req.body;
  date_time = getTimeExactly(date_time);
  try {
    let listNewSale = [];
    const listRank = await Rank.findAll({
      order: [["order", "DESC"]],
      raw: true,
    });
    const minRank = listRank[listRank.length - 1];
    for (let i = 0; i < users.length; i++) {
      const id = users[i];
      await handleAddRecordUserSeasonRank(season_id, id, minRank, amount);
      const { point, bonus } = await getPoint(season_id, id, amount, next);
      const newSale = {
        season_id,
        point,
        amount,
        user_id: id,
        date_time,
        bonus,
      };
      // Check xem nếu ứng với season_id, user_id mà chưa có trong bảng Season_user_rank. Thì thêm 1 record mới.
      await updateRankUser(season_id, id, newSale, listRank);
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
  if (listId.length > 1 && req.body.date_time) {
    return next({
      statusCode: 400,
      message: "Không cho phép sửa date_time khi sửa nhiều",
    });
  }
  delete req.body.ids;
  try {
    const listRank = await Rank.findAll({
      order: [["order", "DESC"]],
      raw: true,
    });
    for (let i = 0; i < listId.length; i++) {
      let detail = await Sale.findByPk(listId[i]);
      if (!detail) return next("Error");
      detail = detail.toJSON();
      const { season_id, user_id, date_time } = detail;
      if (
        req.body.date_time &&
        !(await checkDateTime(season_id, req.body.date_time, user_id))
      ) {
        return next({ statusCode: 400, message: "Ngày update không hợp lệ" });
      }
      const { point, bonus } = await getPoint(
        season_id,
        user_id,
        req.body.amount,
        next
      );
      const dataUpdate = {
        ...req.body,
        point,
        bonus,
      };
      const newSale = {
        ...dataUpdate,
        date_time: req.body.date_time ? req.body.date_time : date_time,
        user_id,
      };
      await updateRankUser(season_id, user_id, newSale, listRank, "update");

      await Sale.update(
        {
          amount: newSale.amount,
          point: newSale.point,
          bonus: newSale.bonus,
          date_time: req.body.date_time
            ? getTimeExactly(req.body.date_time)
            : date_time,
        },
        {
          where: {
            id: listId[i],
          },
        }
      );
    }
    return res.status(200).json("success");
  } catch (error) {
    next(error);
  }
};

// Delete Sale
module.exports.deleteSale = async (req, res, next) => {
  const id = req.params.id;
  try {
    const deleteItem = await Sale.findByPk(id);
    if (!deleteItem) {
      return next({ statusCode: 404, message: "Không tồn tại" });
    }
    // Da xoa
    await Sale.destroy({
      where: {
        id: {
          [Op.eq]: id,
        },
      },
    });
    const { season_id, user_id } = deleteItem;
    const listRank = await Rank.findAll({
      order: [["order", "DESC"]],
      raw: true,
    });
    await updateRankUser(season_id, user_id, null, listRank, "delete");

    // Nếu đã xóa hết thì xóa luôn record trong bảng User_Season_Ranks
    const UserRank = await Sale.findOne({
      where: {
        season_id,
        user_id,
      },
    });
    if (!UserRank) {
      await User_Season_Rank.destroy({
        where: {
          season_id,
          user_id,
        },
      });
    }
    res.json({
      status: "success",
    });
  } catch (error) {
    next(error);
  }
};

// Search Sale
module.exports.searchSales = async (req, res, next) => {
  try {
    let { session_id, user_id, date_time, page, limit, keyword } = req.query;
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

    // Join
    const include = [
      { model: Season, as: "season" }, // Bổ sung thông tin từ mối quan hệ "season"
      {
        model: User,
        as: "user",
        attributes: { exclude: ["token", "password"] },
        where: keyword
          ? {
              deleted_at: null,
              [Op.or]: [
                {
                  phone_number: {
                    [Op.like]: `%${keyword}%`,
                  },
                },
                {
                  first_name: {
                    [Op.like]: `%${keyword}%`,
                  },
                },
                {
                  last_name: {
                    [Op.like]: `%${keyword}%`,
                  },
                },
              ],
            }
          : {
              deleted_at: null,
            },
      }, // Bổ sung thông tin từ mối quan hệ "user"
    ];
    const totalSales = await Sale.count({ where: whereClause, include });
    const sales = await Sale.findAll({
      where: whereClause,
      limit: Number(limit),
      offset: offset,
      attributes: { exclude: ["user_id", "season_id"] },
      include,
      order:[["createdAt","DESC"]]
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
    const finalPoint = caculatorPoint(amount, target_day);
    return finalPoint;
  } catch (error) {
    next(error);
  }
};

// caculcator point
const caculatorPoint = (amount, target_day) => {
  let bonus = 0;
  let point = 0;
  if (amount > target_day) {
    bonus = Math.round(((amount - target_day)/1000000)) * 2 ;
    point = Math.round(amount / 1000000) + bonus;
  }
  // Thấp hơn bị trừ
  else if (amount < target_day) {
    const minusPoint = Math.round((target_day - amount) / 1000000);

    point = Math.round(amount / 1000000) - minusPoint;
  }

  // Bằng
  else {
    point = Math.round(amount / 1000000);
  }
  return {
    point,
    bonus,
  };
};
// Update rank user

const updateRankUser = async (
  season_id,
  user_id,
  newSale,
  listRank,
  mode = "create"
) => {
  let rank = 1;
  let point = 0;
  let listUpdatePoint = [];
  let listSale = await Sale.findAll({
    where: {
      season_id,
      user_id,
    },
    raw: true,
  });
  if (mode === "update") {
    const index = listSale.findIndex((i) => {
      return isEqualTime(i.date_time, newSale.date_time);
    });
    if (index >= 0) {
      listSale[index] = { ...listSale[index], ...newSale };
    }
  } else if (mode === "create") {
    listSale.push(newSale);
  }
  listSale.sort(
    (a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
  );
  for (let i = 0; i < listSale.length; i++) {
    const exactlyRank = listRank.find((i) => i.order == rank);
    const { point: exactlyPoint, bonus } = caculatorPoint(
      listSale[i].amount,
      exactlyRank.target_day
    );

    // Nghĩa là rank đã thay đổi , ảnh hưởng đến point vì target_day thay đổi
    if (exactlyPoint != listSale[i].point) {
      listUpdatePoint.push({ ...listSale[i], point: exactlyPoint, bonus });
      point += exactlyPoint;
      // point += listSale[i].point;
    } else {
      point += listSale[i].point;
    }

    if (point >= 100) {
      // check 3 ngày chuỗi
      // chưa đủ 3 ngày để check thì rank vẫn giữ nguyên
      if (!listSale[i + 1]) {
        break;
      } else {
        const { point: exactlyPoint, bonus } = caculatorPoint(
          listSale[i + 1].amount,
          exactlyRank.target_day
        );
        if (exactlyPoint != listSale[i + 1].point) {
          listUpdatePoint.push({
            ...listSale[i + 1],
            point: exactlyPoint,
            bonus,
          });
        }
        if (!checkCompletedTarget(listSale[i + 1].amount, listRank, rank)) {
          point = 75;
          i += 1;
          continue;
        }
      }

      if (!listSale[i + 2]) {
        // point += listSale[i + 1].point;
        break;
      } else {
        const { point: exactlyPoint, bonus } = caculatorPoint(
          listSale[i + 2].amount,
          exactlyRank.target_day
        );
        if (exactlyPoint != listSale[i + 2].point) {
          listUpdatePoint.push({
            ...listSale[i + 2],
            point: exactlyPoint,
            bonus,
          });
        }
        if (!checkCompletedTarget(listSale[i + 2].amount, listRank, rank)) {
          point = 75;
          i += 2;
          continue;
        }
      }
      if (!listSale[i + 3]) {
        // point += listSale[i + 2].point;
        break;
      } else {
        const { point: exactlyPoint, bonus } = caculatorPoint(
          listSale[i + 3].amount,
          exactlyRank.target_day
        );
        if (exactlyPoint != listSale[i + 3].point) {
          listUpdatePoint.push({
            ...listSale[i + 3],
            point: exactlyPoint,
            bonus,
          });
        }
        if (!checkCompletedTarget(listSale[i + 3].amount, listRank, rank)) {
          point = 75;
          i += 3;
          continue;
        } else {
          // cập nhật lại rank
          rank += 1;
          point = 0;
          i += 3;
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

  //cập nhật lại rank va diem bonus
  const newIdRank = listRank.find((i) => i.order == rank);
  if (newIdRank) {
    await User_Season_Rank.update(
      {
        rank_id: newIdRank.id,
        point: point < 0 ? 0 : point,
      },
      {
        where: {
          season_id,
          user_id,
        },
      }
    );
  }

  // Cập nhật lại các record Sale bị thay đổi điểm
  // Tìm xem newSale có nằm trong list Update ko

  if (newSale) {
    const indexSale = listUpdatePoint.findIndex((i) =>
      isEqualTime(i.date_time, newSale.date_time)
    );

    if (indexSale >= 0) {
      newSale.point = listUpdatePoint[indexSale].point;
      newSale.bonus = listUpdatePoint[indexSale].bonus;
      listUpdatePoint = [
        ...listUpdatePoint.slice(0, indexSale),
        ...listUpdatePoint.slice(indexSale + 1),
      ];
    }
  }

  // Update point
  for (let i = 0; i < listUpdatePoint.length; i++) {
    const idUpdate = listUpdatePoint[i].id;
    const pointUpdate = listUpdatePoint[i].point;
    const bonusUpdate = listUpdatePoint[i].bonus;
    await Sale.update(
      {
        point: pointUpdate,
        bonus: bonusUpdate,
      },
      {
        where: {
          id: idUpdate,
        },
      }
    );
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
const handleAddRecordUserSeasonRank = async (
  season_id,
  user_id,
  minRank,
  amount
) => {
  const existRecord = await User_Season_Rank.findOne({
    where: {
      season_id,
      user_id,
    },
  });
  if (!existRecord) {
    await User_Season_Rank.create({
      point: caculatorPoint(amount, minRank.target_day).point,
      season_id,
      user_id,
      rank_id: minRank.id,
    });
  }
};

const isEqualTime = (time1, time2) => {
  return new Date(time1).getTime() == new Date(time2).getTime();
};

const checkDateTime = async (season_id, date_time, user_id) => {
  let sale = await Sale.findAll({
    where: {
      season_id,
      user_id,
    },
    raw: true,
  });

  let fromDate = new Date(date_time);
  fromDate.setHours(0, 0, 0, 0);
  fromDate = fromDate.getTime();

  let currentSeason = await Season.findOne({
    where: {
      id: season_id,
    },
  });
  currentSeason = currentSeason.toJSON();
  let startDate = new Date(currentSeason.start_date);
  startDate.setHours(0, 0, 0, 0);
  startDate = startDate.getTime();

  let endDate = new Date(currentSeason.end_date);
  endDate.setHours(0, 0, 0, 0);
  endDate = endDate.getTime();

  for (let i = 0; i < sale.length; i++) {
    let checkTime = new Date(sale[i].date_time);
    checkTime.setHours(0, 0, 0, 0);
    checkTime = checkTime.getTime();
    if (checkTime == fromDate) {
      return false;
    }
  }

  if (fromDate > endDate || fromDate < startDate) {
    return false;
  }
  return true;
};
