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
      comment: "상태"
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
