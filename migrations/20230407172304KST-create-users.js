'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('User', {
        number: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            },
            email: {
            type: Sequelize.STRING(40),
            allowNull: false,
            required: true,
            unique: true,
            defaultValue: 0,
            },
            name: {
            type: Sequelize.STRING(40),
            allowNull: false,
            required: true,
            unique: false,
            defaultValue: 0,
            },
            password: {
            type:Sequelize.STRING(100),
            allowNull: false,
            required: true,
            unique: false,
            },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('User');
  },
};