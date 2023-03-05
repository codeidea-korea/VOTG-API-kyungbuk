const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('BoardExample', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "글 고유식별자",
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
      comment: "내용"
    },
    OwnerCode: {
      type: DataTypes.BLOB,
      allowNull: true,
      comment: "사용자 고유식별자",
      references: {
        model: 'Users',
        key: 'code'
      }
    }
  }, {
    sequelize,
    tableName: 'BoardExample',
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
        name: "fk_board_example_users_code",
        using: "BTREE",
        fields: [
          { name: "OwnerCode" },
        ]
      },
    ]
  });
};
