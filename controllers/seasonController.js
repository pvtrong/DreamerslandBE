require("dotenv").config();
// Load model
const { Season, User } = require("../db");
const { Op, fn, col } = require("sequelize");
module.exports.createManySale;
// get all season
module.exports.getAllSeason = async (req, res, next) => {
  try {
   const listSeason = await Season.findAll({
    attributes: ['id', 'season_name', 'is_current', 'current_season'],
   })
    return res.status(200).json(listSeason);
  } catch (error) {
    next(error);
  }
};

// get Detail
module.exports.getDeitailSeason = async (req, res, next) => {
    const id = req.params.id
    try {
     const listSeason = await Season.findByPk(id)
      return res.status(200).json(listSeason);
    } catch (error) {
      next(error);
    }
  };
