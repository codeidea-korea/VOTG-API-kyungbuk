const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('UsersGiftSendLog', {
    UserCode: {
      type: DataTypes.BLOB,
      allowNull: false,
      primaryKey: true,
      comment: "사용자 고유식별자",
      references: {
        model: 'Users',
        key: 'code'
      }
    },
    surveyCode: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      comment: "서베이 생성 고유넘버"
    },
    orderCode: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "주문 고유 식별번호=merchant_uid"
    },
    status: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "0:대기, 1:승인(파랑), 2:취소(노랑), 3:완료(초록)"
    },
    identifyCode: {
      type: DataTypes.BLOB,
      allowNull: false,
      primaryKey: true,
      comment: "응답자 고유식별자"
    },
    phoneCode: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "",
      comment: "응답자 휴대전화번호 식별자"
    }
  }, {
    sequelize,
    tableName: 'UsersGiftSendLog',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "UserCode" },
          { name: "surveyCode" },
          { name: "identifyCode" },
        ]
      },
    ]
  });
};
