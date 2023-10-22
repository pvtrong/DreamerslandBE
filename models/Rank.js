const { DataTypes } = require('sequelize');
const moment = require('moment');
module.exports.RankModel = (sequelize) => {
	return sequelize.define(
		'Rank',
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
			},
			min_point: {
				type: DataTypes.DOUBLE,
				allowNull: true,
			},
			max_point: {
				type: DataTypes.DOUBLE,
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
