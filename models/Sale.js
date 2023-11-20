const { DataTypes } = require('sequelize');
const moment = require('moment');
const { FORMAT_DATE } = require('../constants/common.js');
module.exports.SaleModel = (sequelize) => {
	return sequelize.define(
		'Sale',
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			amount: {
				type: DataTypes.DOUBLE,
				allowNull: false,
			},
			point: {
				type: DataTypes.DOUBLE,
				allowNull: false,
			},
			bonus: {
				type: DataTypes.DOUBLE,
				allowNull: false,
			},
			bonusTask: {
				type: DataTypes.DOUBLE,
				allowNull: false,
				defaultValue:0
			},
			date_time: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue: moment().format(FORMAT_DATE.YYYYMMDD),
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
