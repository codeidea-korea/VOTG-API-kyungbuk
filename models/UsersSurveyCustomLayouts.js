const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('UsersSurveyCustomLayouts', {
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
    surveyCode: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "서베이 생성 고유넘버"
    },
    fileCode: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      comment: "파일 업로드 고유넘버"
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "0:생성, 1:배포됨, 2:중단, 3:완료, 4:삭제"
    },
    survey: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "변경된 설문 데이터"
    },
    sendType: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "0:MMS, 1:카카오, 2:메일, 3:URL"
    },
    sendContact: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "응답자 발송 정보"
    },
    sendURL: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "파일 배포 고유 URL"
    },
    thumbnail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "파일 썸내일"
    }
  }, {
    sequelize,
    tableName: 'UsersSurveyCustomLayouts',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "UserCode" },
          { name: "fileCode" },
        ]
      },
    ]
  });
};
