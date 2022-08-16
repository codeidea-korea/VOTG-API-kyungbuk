const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('OrganizationsMembers', {
    OrgCode: {
      type: DataTypes.BLOB,
      allowNull: false,
      primaryKey: true,
      comment: "조직 고유식별자",
      references: {
        model: 'Organizations',
        key: 'code'
      }
    },
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
    mode: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "0:사용자, 1:편집자, 2:관리자, 3:소유자"
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "0:대기(회색), 1:경고(노랑), 2:정지(빨강), 3:승인(검정), 4:삭제(보라)"
    },
    loggedInAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "로그인 기록"
    }
  }, {
    sequelize,
    tableName: 'OrganizationsMembers',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "OrgCode" },
          { name: "UserCode" },
        ]
      },
      {
        name: "fk_members_users_code",
        using: "BTREE",
        fields: [
          { name: "UserCode" },
        ]
      },
    ]
  });
};
