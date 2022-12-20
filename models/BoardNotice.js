const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('BoardNotice', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    code: {
      type: DataTypes.BLOB,
      allowNull: false,
      comment: "조직 고유식별자",
      unique: "code"
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "이름"
    },
    contents: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "접속주소"
    },
    OwnerCode: {
      type: DataTypes.BLOB,
      allowNull: true,
      comment: "사용자 고유식별자",
      references: {
        model: 'Users',
        key: 'code'
      },
      unique: "fk_board_notice_users_code"
    }
  }, {
    sequelize,
    tableName: 'BoardNotice',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "code",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "code" },
        ]
      },
      {
        name: "OwnerCode",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "OwnerCode" },
        ]
      },
    ]
  });
};
