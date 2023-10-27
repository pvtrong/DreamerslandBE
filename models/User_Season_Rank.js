const { DataTypes } = require('sequelize');

module.exports.User_Season_Rank_Model = (sequelize) => {
	return sequelize.define(
		'User_Season_Rank',
		{
			point: {
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
