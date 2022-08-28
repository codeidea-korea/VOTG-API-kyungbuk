var DataTypes = require("sequelize").DataTypes;
var _Organizations = require("./Organizations");
var _OrganizationsMembers = require("./OrganizationsMembers");
var _Services = require("./Services");
var _ServicesCustomers = require("./ServicesCustomers");
var _Users = require("./Users");
var _UsersDetail = require("./UsersDetail");
var _UsersPaymentCard = require("./UsersPaymentCard");
var _UsersPaymentPasswd = require("./UsersPaymentPasswd");
var _UsersPaymentRequest = require("./UsersPaymentRequest");
var _UsersSyncSNS = require("./UsersSyncSNS");
var _UsersUploadLogs = require("./UsersUploadLogs");

function initModels(sequelize) {
  var Organizations = _Organizations(sequelize, DataTypes);
  var OrganizationsMembers = _OrganizationsMembers(sequelize, DataTypes);
  var Services = _Services(sequelize, DataTypes);
  var ServicesCustomers = _ServicesCustomers(sequelize, DataTypes);
  var Users = _Users(sequelize, DataTypes);
  var UsersDetail = _UsersDetail(sequelize, DataTypes);
  var UsersPaymentCard = _UsersPaymentCard(sequelize, DataTypes);
  var UsersPaymentPasswd = _UsersPaymentPasswd(sequelize, DataTypes);
  var UsersPaymentRequest = _UsersPaymentRequest(sequelize, DataTypes);
  var UsersSyncSNS = _UsersSyncSNS(sequelize, DataTypes);
  var UsersUploadLogs = _UsersUploadLogs(sequelize, DataTypes);

  Organizations.belongsToMany(Users, { as: 'UserCode_Users', through: OrganizationsMembers, foreignKey: "OrgCode", otherKey: "UserCode" });
  Services.belongsToMany(Users, { as: 'UserCode_Users_ServicesCustomers', through: ServicesCustomers, foreignKey: "ServiceCode", otherKey: "UserCode" });
  Users.belongsToMany(Organizations, { as: 'OrgCode_Organizations', through: OrganizationsMembers, foreignKey: "UserCode", otherKey: "OrgCode" });
  Users.belongsToMany(Services, { as: 'ServiceCode_Services', through: ServicesCustomers, foreignKey: "UserCode", otherKey: "ServiceCode" });
  OrganizationsMembers.belongsTo(Organizations, { as: "OrgCode_Organization", foreignKey: "OrgCode"});
  Organizations.hasMany(OrganizationsMembers, { as: "OrganizationsMembers", foreignKey: "OrgCode"});
  ServicesCustomers.belongsTo(Services, { as: "ServiceCode_Service", foreignKey: "ServiceCode"});
  Services.hasMany(ServicesCustomers, { as: "ServicesCustomers", foreignKey: "ServiceCode"});
  Organizations.belongsTo(Users, { as: "OwnerCode_User", foreignKey: "OwnerCode"});
  Users.hasOne(Organizations, { as: "Organization", foreignKey: "OwnerCode"});
  OrganizationsMembers.belongsTo(Users, { as: "UserCode_User", foreignKey: "UserCode"});
  Users.hasMany(OrganizationsMembers, { as: "OrganizationsMembers", foreignKey: "UserCode"});
  Services.belongsTo(Users, { as: "OwnerCode_User", foreignKey: "OwnerCode"});
  Users.hasOne(Services, { as: "Service", foreignKey: "OwnerCode"});
  ServicesCustomers.belongsTo(Users, { as: "UserCode_User", foreignKey: "UserCode"});
  Users.hasMany(ServicesCustomers, { as: "ServicesCustomers", foreignKey: "UserCode"});
  UsersDetail.belongsTo(Users, { as: "UserCode_User", foreignKey: "UserCode"});
  Users.hasOne(UsersDetail, { as: "UsersDetail", foreignKey: "UserCode"});
  UsersPaymentCard.belongsTo(Users, { as: "UserCode_User", foreignKey: "UserCode"});
  Users.hasMany(UsersPaymentCard, { as: "UsersPaymentCards", foreignKey: "UserCode"});
  UsersPaymentPasswd.belongsTo(Users, { as: "UserCode_User", foreignKey: "UserCode"});
  Users.hasOne(UsersPaymentPasswd, { as: "UsersPaymentPasswd", foreignKey: "UserCode"});
  UsersPaymentRequest.belongsTo(Users, { as: "UserCode_User", foreignKey: "UserCode"});
  Users.hasMany(UsersPaymentRequest, { as: "UsersPaymentRequests", foreignKey: "UserCode"});
  UsersSyncSNS.belongsTo(Users, { as: "UserCode_User", foreignKey: "UserCode"});
  Users.hasMany(UsersSyncSNS, { as: "UsersSyncSNs", foreignKey: "UserCode"});
  UsersUploadLogs.belongsTo(Users, { as: "UserCode_User", foreignKey: "UserCode"});
  Users.hasMany(UsersUploadLogs, { as: "UsersUploadLogs", foreignKey: "UserCode"});

  return {
    Organizations,
    OrganizationsMembers,
    Services,
    ServicesCustomers,
    Users,
    UsersDetail,
    UsersPaymentCard,
    UsersPaymentPasswd,
    UsersPaymentRequest,
    UsersSyncSNS,
    UsersUploadLogs,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
