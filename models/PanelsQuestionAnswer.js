const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('PanelsQuestionAnswer', {
    PanelCode: {
      type: DataTypes.BLOB,
      allowNull: false,
      primaryKey: true,
      comment: "패널 고유식별자",
      references: {
        model: 'Panels',
        key: 'code'
      }
    },
    QuestionCode: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      comment: "답변에 고유넘버",
      references: {
        model: 'PanelsQuestionList',
        key: 'QuestionCode'
      }
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "변경된 설문 데이터"
    }
  }, {
    sequelize,
    tableName: 'PanelsQuestionAnswer',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "PanelCode" },
          { name: "QuestionCode" },
        ]
      },
      {
        name: "fk_answer_question_code",
        using: "BTREE",
        fields: [
          { name: "QuestionCode" },
        ]
      },
    ]
  });
};
