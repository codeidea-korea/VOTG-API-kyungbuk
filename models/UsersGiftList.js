const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('UsersGiftList', {
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
    status: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "0:대기(회색), 1:승인(파랑), 2:발송중(노랑), 3:완료(초록), 4:취소환불(보라)"
    },
    orderCode: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      comment: "주문 고유 식별번호=merchant_uid <= UsersPaymentRequest와 동일한 값"
    },
    orderName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "주문 이름=name"
    },
    productNumber: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "제품 고유 넘버"
    },
    buying: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "구매 수량"
    },
    sending: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "발송 수량"
    }
  }, {
    sequelize,
    tableName: 'UsersGiftList',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "UserCode" },
          { name: "orderCode" },
        ]
      },
    ]
  });
};
