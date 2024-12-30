/// @notice TreesNFT contract tests
//---------------------------------

const {
  time,
  loadFixture,
  ZeroAddress
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

/// @dev Fixture
describe("TreesNFT contract tests", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployTreesNFTFixture() {

    // Contracts are deployed using the first signer/account by default
    const [owner, customer1, customer2, customer3] = await ethers.getSigners();

    // First deploy TreesNFTMarket contract which is used by TreesNFT
    const TreesNFTMarket = await ethers.getContractFactory("TreesNFTMarket");
    const treesNFTMarket = await TreesNFTMarket.deploy();
    const marketcontractAddress = await treesNFTMarket.getAddress();

    // Then deploy TreesNFT contract passing it TreesNFTMarket address
    const TreesNFT = await ethers.getContractFactory("TreesNFT");
    const treesNFT = await TreesNFT.deploy(marketcontractAddress);

    return { treesNFTMarket, treesNFT, owner, customer1, customer2, customer3 };
  }

  describe("Deployment", function () {

    it("Should deploy the contract", async function () {

      const { treesNFT, owner } = await loadFixture(deployTreesNFTFixture);
      expect(await treesNFT.owner()).to.equal(owner.address);
    });

    it("Should name the token correctly", async function () {

      const { treesNFT } = await loadFixture(deployTreesNFTFixture);
      const name = "TreesNFT";
      expect(await treesNFT.name()).to.equal(name);
    });

    it("Should set the token symbol correctly", async function () {

      const { treesNFT } = await loadFixture(deployTreesNFTFixture);
      const symbol = "TN";
      expect(await treesNFT.symbol()).to.equal(symbol);
    });

  }); //describe("Deployment"

  describe("Mint an NFT", function () {

    it("Should revert if not owner", async function () {
      const { treesNFT, customer1 } = await loadFixture(deployTreesNFTFixture);
      await expect(treesNFT.connect(customer1).createToken("TokenURI")).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should mint the NFT", async function () {
        const { treesNFT, owner } = await loadFixture(deployTreesNFTFixture);
        const firstTokenId = 1;
        
        //We expect the ERC721 Transfer event to raise with the following arguments
        expect(await treesNFT.createToken("TokenURI")).to.emit(treesNFT, "Transfer").withArgs({from: ZeroAddress, to: owner.address, tokenId: firstTokenId});
    });
  
    it("Should approve Marketplace contract for the new NFT", async function () {
      const { treesNFT, treesNFTMarket, owner } = await loadFixture(deployTreesNFTFixture);
      const firstTokenId = 1;
      
      //Create a new NFT
      await treesNFT.createToken("TokenURI");

      // Get the approved address for the new token (id = 1)
      const approvedAddress = await treesNFT.getApproved(1);

      // Check that approved address is the Marketplace one
      expect(approvedAddress).to.equal(await treesNFTMarket.getAddress());
  });

}); //describe("Mint an NFT"

}); //describe("TreesNFT contract tests"
