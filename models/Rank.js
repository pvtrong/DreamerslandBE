const { DataTypes } = require("sequelize");
const moment = require("moment");
module.exports.RankModel = (sequelize) => {
  return sequelize.define(
    "Rank",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      rank_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      min_point: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      max_point: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      image_url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      // Other model options go here
      freezeTableName: true,
      //tableName: 'tablename',
      timestamps: true,
    }
  );
};
