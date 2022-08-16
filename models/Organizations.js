const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Organizations', {
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
    name: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: "이름",
      unique: "name"
    },
    url: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: "접속주소",
      unique: "url"
    },
    OwnerCode: {
      type: DataTypes.BLOB,
      allowNull: true,
      comment: "사용자 고유식별자",
      references: {
        model: 'Users',
        key: 'code'
      },
      unique: "fk_organizations_users_code"
    }
  }, {
    sequelize,
    tableName: 'Organizations',
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
        name: "name",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "name" },
        ]
      },
      {
        name: "url",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "url" },
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
