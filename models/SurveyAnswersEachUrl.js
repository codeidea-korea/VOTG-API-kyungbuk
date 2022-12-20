const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('SurveyAnswersEachUrl', {
    identifyCode: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      comment: "응답자 고유식별자"
    },
    phoneCode: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "응답자 휴대전화번호 식별자"
    },
    surveyCode: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      comment: "파일 업로드 고유넘버"
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "변경된 설문 데이터"
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "0:응답전, 1:응답중, 2:응답완료"
    }
  }, {
    sequelize,
    tableName: 'SurveyAnswersEachUrl',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "identifyCode" },
          { name: "surveyCode" },
        ]
      },
    ]
  });
};