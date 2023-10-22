require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql' /* 'mysql' | 'mariadb' | 'postgres' | 'mssql' */,
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log("💾 Database connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

// Create Models
const { TaskModel } = require("./models/Task");
const { UserModel } = require("./models/User");
const { SaleModel } = require("./models/Sale");
const { SeasonModel } = require("./models/Season");
const { RankModel } = require("./models/Rank");

const Task = TaskModel(sequelize);
const Sale = SaleModel(sequelize);
const Season = SeasonModel(sequelize);
const User = UserModel(sequelize);
const Rank = RankModel(sequelize)
if (process.env.MIGRATE_DB == 'TRUE') {
  sequelize.sync({ alter: true }).then(() => {
    console.log(`All tables synced!`);
    process.exit(0);
  });
  // establish relationships

  // season - sale : 1 - N
  Sale.belongsTo(Season, {
    foreignKey: {
      name: "season_id", // Đặt tên tùy chỉnh cho khóa ngoại đến Season
      allowNull: false,
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    as: "season",
  });

  // user - sale : 1 - N
  Sale.belongsTo(User, {
    foreignKey: {
      name: "user_id",
      allowNull: false,
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    as: "user",
  });

  // Season.hasMany(Sale, { foreignKey: 'season_id' })
  if (process.env.MIGRATE_DB == "TRUE") {
    sequelize.sync().then(() => {
      console.log(`All tables synced!`);
      process.exit(0);
    });
  }
}
module.exports = {
  Task,
  User,
  Sale,
  Season,
  Rank
};