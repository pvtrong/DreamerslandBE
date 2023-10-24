require("dotenv").config();
// Load model
const { Rank } = require("../db");
const { Op, fn, col } = require("sequelize");
const configUpload = require("../services/upload");

module.exports.createManySale;
// get all season
module.exports.createRank = async (req, res, next) => {
  try {
    if (req.file) {
      console.log(req.file.path);
      const data = req.body;
      data.image_url = req.file.path;
      const result = await Rank.create(data);
      return res.status(201).json(result);
    } else {
      return next({ statusCode: 400, message: "Chưa có ảnh" });
    }
  } catch (error) {
    next(error);
  }
};
module.exports.editRank = async (req, res, next) => {
  try {
    const data = req.body;

    if (req.file) {
      data.image_url = req.file.path;
    }
    const result = await Rank.update(data, {
      where: {
        id: {
          [Op.eq]: req.body.id,
        },
      },
    });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
module.exports.deleteRank = async (req, res, next) => {
  const id = req.params.id;
  try {
    const deleted = await Rank.destroy({
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
module.exports.searchRank = async (req, res, next) => {
  try {
    let { rank_name, page, limit } = req.query;
    if (isNaN(page) || !page || !Number.isInteger(Number(page))) {
      page = 1;
    }
    if (isNaN(limit) || !limit||!Number.isInteger(Number(limit))) {
      limit = 30;
    }
    const offset = (Number(page) - 1) * Number(limit);
    if (!rank_name) rank_name = "";


    const totalRanks = await Rank.count({ where: {
        rank_name: {
          [Op.like]: `%${rank_name}%`,
        },
      }, });
    const result = await Rank.findAll({
      where: {
        rank_name: {
          [Op.like]: `%${rank_name}%`,
        },
      },
      limit: Number(limit),
      offset: offset,
    });

    const totalPages = Math.ceil(totalRanks / limit);

    res.status(200).json({
      data: result,
      total: totalRanks,
      page: parseInt(page),
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};
module.exports.getDetailRank = async (req, res, next) => {
  const { id } = req.params;

  try {
    const sale = await Rank.findByPk(id);

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
