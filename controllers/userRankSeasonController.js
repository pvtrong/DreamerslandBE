require("dotenv").config();
// Load model
const { User_Season_Rank } = require("../db");
const { Op } = require("sequelize");

const utils = require("../utils");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

// SignUp
module.exports.CreateUserRankSeason = async (req, res, next) => {
  try {
    const { point, season_id, user_id, rank_id } = req.body;

    const record = await User_Season_Rank.create({
      point,
      season_id,
      user_id,
      rank_id,
    });
    return res.status(201).json(record);
  } catch (err) {
    return next(err);
  }
};
