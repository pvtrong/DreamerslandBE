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
				allowNull: false,
			},
			bonus: {
				type: DataTypes.DOUBLE,
				allowNull: false,
			},
			date_time: {
				type: DataTypes.DATE,
				allowNull: false,
				defaultValue:  moment().format('YYYY-MM-DD'),
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
