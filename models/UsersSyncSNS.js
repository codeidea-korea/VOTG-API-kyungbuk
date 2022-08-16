const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('UsersSyncSNS', {
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
    auth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      primaryKey: true,
      comment: "0:일반, 1:애플, 2:구글, 3:카카오, 4:네이버"
    },
    identify: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "소셜 인증 고유 식별자"
    }
  }, {
    sequelize,
    tableName: 'UsersSyncSNS',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "UserCode" },
          { name: "auth" },
        ]
      },
    ]
  });
};
