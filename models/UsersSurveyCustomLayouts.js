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
    fileCode: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true,
      comment: "파일 업로드 고유넘버"
    },
    survey: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "변경된 설문 데이터"
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
