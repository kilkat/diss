const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Sequelize.Model {}
  User.init(
    {
      number: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING(40),
        allowNull: false,
        required: true,
        unique: true,
        defaultValue: 0,
      },
      name: {
        type: DataTypes.STRING(40),
        allowNull: false,
        required: true,
        unique: false,
        defaultValue: 0,
      },
      password: {
        type: DataTypes.STRING(100),
        allowNull: false,
        required: true,
        unique: false,
      },
    },
    {
      sequelize,
      timestamps: false,
      underscored: false,
      modelName: "User",
      tableName: "User",
      paranoid: false,
      charset: "utf8mb4",
      collate: "utf8mb4_general_ci",
    }
  );
  return User;
};