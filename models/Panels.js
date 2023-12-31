const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Panels', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    code: {
      type: DataTypes.BLOB,
      allowNull: false,
      comment: "사용자 고유식별자",
      unique: "code"
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "이름"
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "휴대전화"
    },
    email: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "이메일=아이디",
      unique: "email"
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "비밀번호"
    },
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "닉네임"
    },
    mode: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "0:일반 사용자, 1:패널가입, 2:관리자, 3:개발자"
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "0:대기(회색), 1:경고(노랑), 2:정지(빨강), 3:승인(검정), 4:삭제(보라)"
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "0:Free, 1:Basic, 2:Pro, 3:Develop"
    }
  }, {
    sequelize,
    tableName: 'Panels',
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
        name: "email",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "email" },
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
    ]
  });
};
