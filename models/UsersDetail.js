const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('UsersDetail', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    UserCode: {
      type: DataTypes.BLOB,
      allowNull: true,
      comment: "사용자 고유식별자",
      references: {
        model: 'Users',
        key: 'code'
      },
      unique: "fk_detail_users_code"
    },
    profile: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "프로필 사진"
    },
    arg_phone: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0,
      comment: "수단별 수신동의 - 모바일"
    },
    arg_email: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0,
      comment: "수단별 수신동의 - 메일"
    },
    birthday: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "생년월일 yyyy-mm-dd"
    },
    age_range: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "생년월일 yyyy-mm-dd"
    },
    gender: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "0: 생략, 1: 남성, 2: 여성,"
    },
    address_road: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "도로면 주소 전체"
    },
    address_detail: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "상세 주소"
    },
    address_zip: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "우편번호"
    }
  }, {
    sequelize,
    tableName: 'UsersDetail',
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
        name: "UserCode",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "UserCode" },
        ]
      },
    ]
  });
};
