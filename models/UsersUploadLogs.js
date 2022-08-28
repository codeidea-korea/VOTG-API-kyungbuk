const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('UsersUploadLogs', {
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
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "파일 이름"
    },
    filePath: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "저장 경로"
    }
  }, {
    sequelize,
    tableName: 'UsersUploadLogs',
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
