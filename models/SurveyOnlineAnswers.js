const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('SurveyOnlineAnswers', {
    identifyCode: {
      type: DataTypes.BLOB,
      allowNull: false,
      primaryKey: true,
      comment: "응답자 고유식별자"
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
    }
  }, {
    sequelize,
    tableName: 'SurveyOnlineAnswers',
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
