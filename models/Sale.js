const { DataTypes } = require('sequelize');
const moment = require('moment');
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
				allowNull: true,
			},
			date_time: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue:  moment().format('YYYY-MM-DD'),
			},
            user_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
            season_id: {
				type: DataTypes.INTEGER,
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
