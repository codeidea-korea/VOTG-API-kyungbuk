const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('UsersPaymentCard', {
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
    registerCode: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      comment: "카드 고유 식별번호"
    },
    cardNickName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "카드 별명"
    },
    cardCode: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "카드 코드"
    },
    cardName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "카드 이름"
    },
    cardNumber: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "카드 번호"
    }
  }, {
    sequelize,
    tableName: 'UsersPaymentCard',
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
