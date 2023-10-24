require("dotenv").config();
// Load model
const { Season, User } = require("../db");
const { Op, fn, col } = require("sequelize");
module.exports.createManySale;
// get all season
module.exports.getAllSeason = async (req, res, next) => {
  try {
    let { season_name, limit, page } = req.query;
    if (!season_name) season_name = "";
    if (isNaN(page) || !page || !Number.isInteger(Number(page))) {
      page = 1;
    }
    if (isNaN(limit) || !limit || !Number.isInteger(Number(limit))) {
      limit = 30;
    }
    const offset = (Number(page) - 1) * Number(limit);
    const listSeason = await Season.findAll({
      where: {
        season_name: {
          [Op.like]: `%${season_name}%`,
        },
      },
      limit: Number(limit),
      offset: offset,
    });
    const totalSeason = await Season.count({
      where: {
        season_name: {
          [Op.like]: `%${season_name}%`,
        },
      },
    });
    const totalPages = Math.ceil(totalSeason / limit);

    res.status(200).json({
      data: listSeason,
      total: totalSeason,
      page: parseInt(page),
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

// get Detail
module.exports.getDeitailSeason = async (req, res, next) => {
  const id = req.params.id;
  try {
    const listSeason = await Season.findByPk(id);
    return res.status(200).json(listSeason);
  } catch (error) {
    next(error);
  }
};

// create season
module.exports.createSeason = async (req, res, next) => {
  try {
    const { season_name, start_date, end_date } = req.body;
    const newSeason = await Season.create({
      season_name,
      start_date,
      end_date,
    });
    res.status(201).json(newSeason);
  } catch (error) {
    next(error);
  }
}

// edit season
module.exports.editSeason = async (req, res, next) => {
  try {
    const { id, season_name, start_date, end_date } = req.body;
    const editSeason = await Season.update(
      {
        season_name,
        start_date,
        end_date,
      },
      {
        where: {
          id,
        },
      }
    );
    res.status(200).json(editSeason);
  } catch (error) {
    next(error);
  }
}

// delete season
module.exports.deleteSeason = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedSeason = await Season.destroy({
      where: {
        id,
      },
    });
    res.status(200).json(deletedSeason);
  } catch (error) {
    next(error);
  }
}
