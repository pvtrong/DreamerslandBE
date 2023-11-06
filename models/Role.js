const { DataTypes } = require("sequelize");
module.exports.ROLE = {
    ADMIN: 1,
    NORMAL_USER: 2,
}
module.exports.RoleModel = (sequelize) => {
    return sequelize.define(
        "Role",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            role_id: {
                type: DataTypes.SMALLINT,
                allowNull: false
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
