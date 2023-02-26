const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('UsersGiftSendLog', {
    identifyCode: {
      type: DataTypes.BLOB,
      allowNull: false,
      primaryKey: true,
      comment: "응답자 고유식별자"
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
      primaryKey: true,
      comment: "주문 고유 식별번호=merchant_uid"
    },
    cooperNumber: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "쿠폰 발행번호"
    },
    status: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "0:대기, 1:승인(파랑), 2:취소(노랑), 3:완료(초록)"
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
    hasTrigger: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "identifyCode" },
          { name: "orderCode" },
          { name: "surveyCode" },
        ]
      },
    ]
  });
};
