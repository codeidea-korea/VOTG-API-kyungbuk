const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('UsersPaymentRequest', {
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
    issuedAt: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "처리 시기"
    },
    status: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "0:취소(회색), 1:승인(파랑), 2:실패(빨강), 3:오류(노랑)"
    },
    impUid: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "아임포트 식별번호"
    },
    registerCode: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      comment: "카드 고유 식별번호"
    },
    orderType: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "주문 타입 => 0:요금제, 1: 패널구매, 2: 리워드"
    },
    orderCode: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "주문 고유 식별번호=merchant_uid"
    },
    orderName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "주문 이름=name"
    },
    amount: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "주문 금액"
    }
  }, {
    sequelize,
    tableName: 'UsersPaymentRequest',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "UserCode" },
          { name: "registerCode" },
        ]
      },
    ]
  });
};
