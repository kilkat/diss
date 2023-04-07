const Sequelize = require("sequelize");

module.exports = class User extends Sequelize.Model {
  // init 메서드 테이블에 대한 설정을 하고
  // associate 메서드는 다른 모델과의 관계를 적습니다
  static init(sequelize) {
    return super.init(
      {
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
      },
      {
        sequelize, //해당 부분에 db.sequelize 객체가 들어간다.
        timestamps: false, //true로 하면 createdAt과 updatedAt을 생성한다.
        underscored: false, //기본적으로 테이블명과 컬럼명을 CamelCase로 바꾸는데 snake case로 변경해준다
        modelName: "User", //모델 이름을 설정할 수있다
        tableName: "User", //기본적으로 모델이름을 소문자및 복수형으로 만드는데 모델이 User면 users가된다
        paranoid: false, // true로 설정하면 deletedAt 컬럼이 생긴다. 삭제시 완전히 지워지지 않고 deletedAt에 지운시각이 기록된다.
        charset: "utf8mb4", //이모티콘까지 입력되게하려면 utf8mb4와 utf8mb4_general_ci오입력한다
        collate: "utf8mb4_general_ci",
      }
    );
  }
  static associate(db) {
    //db.User.hasMany(db.Comment, { foreignKey: "commenter", sourceKey: "id" });
  }

};