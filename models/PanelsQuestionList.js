const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('PanelsQuestionList', {
    QuestionCode: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      comment: "사용자 고유식별자"
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "질문"
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "질문 설명"
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "0:객관식사각형, 1:객관식리스트, 2:객관식육각형, 3:주관식"
    },
    item: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "'[]'",
      comment: "설문 질문 데이터"
    }
  }, {
    sequelize,
    tableName: 'PanelsQuestionList',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "QuestionCode" },
        ]
      },
    ]
  });
};
