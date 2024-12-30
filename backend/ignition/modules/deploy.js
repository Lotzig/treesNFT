const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("Deployment", (m) => {

  const treesNFTMarket = m.contract("TreesNFTMarket");
  const treesNFT = m.contract("TreesNFT", [treesNFTMarket]);
  
  return { treesNFTMarket, treesNFT };
});

