const PropertyRegistry = artifacts.require("PropertyRegistry");

module.exports = function(deployer) {
  deployer.deploy(PropertyRegistry);
};
