const { DataTypes } = require('sequelize');

module.exports.SeasonModel = (sequelize) => {
	return sequelize.define(
		'Season',
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			start_date: {
				type: DataTypes.DATE,
				allowNull: false,
			},
			end_date: {
				type: DataTypes.DATE,
				allowNull: false,
			},
			season_name: {
				type: DataTypes.STRING,
				allowNull: false,
				
			},
            current_season: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
            is_current: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
                defaultValue : false
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
