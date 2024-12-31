/// @notice TreesNFTMarket contract tests
//----------------------------------------

const {
  time,
  loadFixture,
  ZeroAddress
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

/// @dev Fixture
describe("TreesNFTMarket contract tests", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContractsFixture() {

    // Contracts are deployed using the first signer/account by default
    const [owner, customer1, customer2, customer3] = await ethers.getSigners();

    // First deploy TreesNFTMarket contract which address is required by TreesNFT contract
    const TreesNFTMarket = await ethers.getContractFactory("TreesNFTMarket");
    const treesNFTMarket = await TreesNFTMarket.deploy();
    const marketContractAddress = await treesNFTMarket.getAddress();

    // Then deploy TreesNFT contract passing it TreesNFTMarket address
    const TreesNFT = await ethers.getContractFactory("TreesNFT");
    const treesNFT = await TreesNFT.deploy(marketContractAddress);
    const nftContractAddress = await treesNFT.getAddress();

    return { treesNFTMarket, treesNFT, nftContractAddress, owner, customer1, customer2, customer3 };
  }

  describe("Deployment", function () {

    it("Should deploy the Market contract", async function () {

      const { treesNFTMarket, owner } = await loadFixture(deployContractsFixture);
      
      // Check that contract owner is owner (owner deployed the contract)
      expect(await treesNFTMarket.owner()).to.equal(owner.address);
    });
    
    it("Should deploy the NFT contract", async function () {

      const { treesNFT, owner } = await loadFixture(deployContractsFixture);

      // Check that contract owner is owner (owner deployed the contract)
      expect(await treesNFT.owner()).to.equal(owner.address);
    });

  }); //describe("Deployment"

  
  describe("Listing Price", function () {

    it("Should return the default listing price", async function () {
      const { treesNFTMarket } = await loadFixture(deployContractsFixture);
      const defaultListingPrice = 45000000000000 // weis

      // Get default listing price from contract
      const listingPrice = await treesNFTMarket.getListingPrice();

      // Check the contract returns the correct default listing price
      expect(listingPrice).to.equal(defaultListingPrice);
    });

    it("Should revert if a non owner attempts to set a new listing price", async function () {
      const { treesNFTMarket, customer1 } = await loadFixture(deployContractsFixture);
      const newListingPrice = 66000000000000 // weis

      // Attempt to set the new listing price
      await treesNFTMarket.setListingPrice(newListingPrice);

      await expect(treesNFTMarket.connect(customer1).setListingPrice(newListingPrice)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should properly set a new listing price", async function () {
      const { treesNFTMarket } = await loadFixture(deployContractsFixture);
      const newListingPrice = 66000000000000 // weis

      // Set the new listing price
      await treesNFTMarket.setListingPrice(newListingPrice);

      // Get default listing price from contract
      const contractListingPrice = await treesNFTMarket.getListingPrice();

      // Check the contract returns the correct listing price
      expect(contractListingPrice).to.equal(newListingPrice);
    });

  }); //describe("Listing Price"


  describe("Marketplace actions", function () {

    describe("Create a new marketplace item", function () {
    
      it("Should revert if a non owner attempts to create a new item", async function () {
        const { treesNFTMarket, nftContractAddress, customer1 } = await loadFixture(deployContractsFixture);
        const tokenId = 1;
        const price = 15000000000000000000n
        
        // Attempt from non owner to create a new item : check the proper error has raised
        await expect(treesNFTMarket.connect(customer1).createMarketItem(nftContractAddress, tokenId, price)).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("Should revert if token does not exists", async function () {
        const { treesNFTMarket, nftContractAddress } = await loadFixture(deployContractsFixture);
        const tokenId = 1;
        const price = 15000000000000000000n
        
        // Attempt from non owner to create a new item : check the proper error has raised
        await expect(treesNFTMarket.createMarketItem(nftContractAddress, tokenId, price)).to.be.revertedWith("ERC721: invalid token ID");
      });

      it("Should revert if the token already is linked to a marketplace item", async function () {
        const { treesNFT, treesNFTMarket, nftContractAddress } = await loadFixture(deployContractsFixture);
        
        const tokenId = 1;
        const price = 15000000000000000000n
        
        // Create a token (tokenId = 1)
        await treesNFT.createToken("URI_1");

        // Create an item for the created token
        await treesNFTMarket.createMarketItem(nftContractAddress, tokenId, price);

        // Attempt to create another item for the same token
        await expect(treesNFTMarket.createMarketItem(nftContractAddress, tokenId, price))
                    .to.be.revertedWith("Token already has a Marketplace item (Item Id = 1)");
      });

      it("Should revert if passed price is nul", async function () {
        const { treesNFT, treesNFTMarket, nftContractAddress } = await loadFixture(deployContractsFixture);
        
        const tokenId = 1;
        const price = 0;
        
        // Create a token (tokenId = 1)
        await treesNFT.createToken("URI_1");

        // Attempt to create the item
        await expect(treesNFTMarket.createMarketItem(nftContractAddress, tokenId, price))
                    .to.be.revertedWith("Item Price must be at least 1 wei");
      });

      it("Should emit the item creation event (item creation success)", async function () {
        const { treesNFT, treesNFTMarket, nftContractAddress, owner } = await loadFixture(deployContractsFixture);
        
        const tokenId = 1;
        const price = 15000000000000000000n;
        
        // Create a token (tokenId = 1)
        await treesNFT.createToken("URI_1");

        // Create the item
        expect(await treesNFTMarket.createMarketItem(nftContractAddress, tokenId, price))
              .to.emit(treesNFT, "Transfer")
              .withArgs({itemId: 1, tokenId: tokenId, price: price, seller: owner.address, owner: owner.address, nftContract: nftContractAddress, forSale: true});
      });

    }); //describe("Create a new marketplace item"


    describe("Purchase a marketplace item", function () {

      it("Should revert if item does not exists", async function () {

        const { treesNFTMarket, nftContractAddress } = await loadFixture(deployContractsFixture);
        
        const itemId = 1; // will not exist as we will NOT create any item

        // Attempt to purchase the unexisting item
        await expect(treesNFTMarket.purchaseItem(nftContractAddress, itemId))
                    .to.be.revertedWith("Item does not exists");
      });


      it("Should revert if purchaser already owns the item", async function () {
        const { treesNFT, treesNFTMarket, nftContractAddress } = await loadFixture(deployContractsFixture);
        
        const tokenId = 1;
        const itemId = 1;
        const price = 15000000000000000000n;
        
        // Create a token (tokenId = 1)
        await treesNFT.createToken("URI_1");

        // Create an item for new token
        await treesNFTMarket.createMarketItem(nftContractAddress, tokenId, price);

        // Attempt to purchase the owned item
        await expect(treesNFTMarket.purchaseItem(nftContractAddress, itemId))
                    .to.be.revertedWith("You already own this item");
      });

      it("Should revert if the item is not for sale", async function () {
        const { treesNFT, treesNFTMarket, nftContractAddress, customer1 } = await loadFixture(deployContractsFixture);
        
        const tokenId = 1;
        const itemId = 1;
        const price = 15000000000000000000n;
        
        // Create a token (tokenId = 1)
        await treesNFT.createToken("URI_1");

        // Create an item for new token
        await treesNFTMarket.createMarketItem(nftContractAddress, tokenId, price);

        // Remove item from sale
        await treesNFTMarket.removeItemFromSale(nftContractAddress, tokenId);

        // Attempt to purchase the off sale item
        await expect(treesNFTMarket.connect(customer1).purchaseItem(nftContractAddress, itemId))
                    .to.be.revertedWith("Item is not for sale");
      });

      it("Should revert if the passed value does not match the item price", async function () {
        const { treesNFT, treesNFTMarket, nftContractAddress, customer1 } = await loadFixture(deployContractsFixture);
        
        const tokenId = 1;
        const itemId = 1;
        const price = 15000000000000000000n;

        // Create a token (tokenId = 1)
        await treesNFT.createToken("URI_1");

        // Create an item for new token
        await treesNFTMarket.createMarketItem(nftContractAddress, tokenId, price);

        // Attempt to purchase the item with value 0 (omitted)
        await expect(treesNFTMarket.connect(customer1).purchaseItem(nftContractAddress, itemId))
                    .to.be.revertedWith("Please submit the asking price in order to complete the purchase");
      });

      it("Should emit the purchase event (purchase success)", async function () {
        const { treesNFT, treesNFTMarket, nftContractAddress, owner, customer1 } = await loadFixture(deployContractsFixture);
        
        const tokenId = 1;
        const itemId = 1;
        const price = 15000000000000000000n;

        // Create a token (tokenId = 1)
        await treesNFT.createToken("URI_1");

        // Create an item for new token
        await treesNFTMarket.createMarketItem(nftContractAddress, tokenId, price);

        // Purchase the item
        expect(await treesNFTMarket.connect(customer1).purchaseItem(nftContractAddress, tokenId, {value: price}))
              .to.emit(treesNFT, "MarketItemPurchased")
              .withArgs({itemId: 1, tokenId: tokenId, price: price, seller: owner.address, owner: customer1.address, nftContract: nftContractAddress, forSale: false});
      });
      
    }); //describe("Purchase a marketplace item"


    describe("Put an item on sale", function () {

      it("Should revert if item does not exist (the caller can therefore not be the item owner", async function () {
        const { treesNFT, treesNFTMarket, nftContractAddress, customer1 } = await loadFixture(deployContractsFixture);
        
        const itemId = 1;
        const newPrice = 15000000000000000000n;

        // Attempt to purchase the item with value 0 (omitted)
        await expect(treesNFTMarket.putItemOnSale(nftContractAddress, itemId, newPrice))
                    .to.be.revertedWith("You must be the Item owner");
      });

      it("Should revert if the caller is not the item owner", async function () {
        const { treesNFT, treesNFTMarket, nftContractAddress, customer1 } = await loadFixture(deployContractsFixture);
        
        const tokenId = 1;
        const itemId = 1;
        const price = 15000000000000000000n;

        // Create a token (tokenId = 1)
        await treesNFT.createToken("URI_1");

        // Create an item for new token
        await treesNFTMarket.createMarketItem(nftContractAddress, tokenId, price);
        const newPrice = 25000000000000000000n;

        // Attempt to purchase the item with value 0 (omitted)
        await expect(treesNFTMarket.connect(customer1).putItemOnSale(nftContractAddress, itemId, newPrice))
                    .to.be.revertedWith("You must be the Item owner");
      });

      it("Should revert if the item already is for sale", async function () {
        const { treesNFT, treesNFTMarket, nftContractAddress } = await loadFixture(deployContractsFixture);
        
        const tokenId = 1;
        const itemId = 1;
        const price = 15000000000000000000n;

        // Create a token (tokenId = 1)
        await treesNFT.createToken("URI_1");

        // Create an item for new token
        await treesNFTMarket.createMarketItem(nftContractAddress, tokenId, price);
        const newPrice = 25000000000000000000n;

        // Attempt to purchase the item with value 0 (omitted)
        await expect(treesNFTMarket.putItemOnSale(nftContractAddress, itemId, newPrice))
                    .to.be.revertedWith("Item already is for sale");
      });

    }); //describe("Put an item on sale"

  }); //describe("Marketplace actions"

}); //describe("TreesNFT contract tests"
