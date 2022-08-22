const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('UsersPaymentPasswd', {
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
    billingPasswd: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "비밀번호"
    }
  }, {
    sequelize,
    tableName: 'UsersPaymentPasswd',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "UserCode" },
        ]
      },
    ]
  });
};
