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

    return { treesNFTMarket, marketContractAddress, treesNFT, nftContractAddress, owner, customer1, customer2, customer3 };
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

        const { treesNFT, treesNFTMarket, nftContractAddress, marketContractAddress, owner, customer1, customer2 } = await loadFixture(deployContractsFixture);
        
        const tokenId = 1;
        const itemId = 1;
        const price = 15000000000000000000n;
        const newPrice = 25000000000000000000n;
        const listingPrice = await treesNFTMarket.getListingPrice();

        // Create a token (tokenId = 1)
        await treesNFT.createToken("URI_1");

        // Create an item for new token
        await treesNFTMarket.createMarketItem(nftContractAddress, tokenId, price);

        // Customer1 purchases the item
        await treesNFTMarket.connect(customer1).purchaseItem(nftContractAddress, itemId, {value: 15000000000000000000n});

        // Customer 1 will resale the item to customer2 in order to cover listing price transfer to the marketplace owner
        // Customer1 approves marketplace for token
        await treesNFT.connect(customer1).approve(marketContractAddress, tokenId);

        // Customer1 puts the item on sale passing the right listing price
        expect(await treesNFTMarket.connect(customer1).putItemOnSale(nftContractAddress, itemId, newPrice, {value: listingPrice}))

        // Customer2 purchases the item (listing price will be transfered to marketplace owner)
        expect(await treesNFTMarket.connect(customer2).purchaseItem(nftContractAddress, tokenId, {value: newPrice}))
              .to.emit(treesNFT, "MarketItemPurchased")
              .withArgs({itemId: 1, tokenId: tokenId, price: price, seller: customer1.address, owner: customer2.address, 
                        nftContract: nftContractAddress, forSale: false});
      });
      
    }); //describe("Purchase a marketplace item"


    describe("Put an item on sale", function () {

      it("Should revert if item does not exist (the caller can therefore not be the item owner", async function () {
        const { treesNFTMarket, nftContractAddress } = await loadFixture(deployContractsFixture);
        
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
        const newPrice = 25000000000000000000n;

        // Create a token (tokenId = 1)
        await treesNFT.createToken("URI_1");

        // Create an item for new token (automatically puts the item on sale)
        await treesNFTMarket.createMarketItem(nftContractAddress, tokenId, price);

        // Attempt to put the item on sale
        await expect(treesNFTMarket.putItemOnSale(nftContractAddress, itemId, newPrice))
                    .to.be.revertedWith("Item already is for sale");
      });


      it("Should revert if caller is not the marketplace owner and does not pass any value for listing price", async function () {
        const { treesNFT, treesNFTMarket, nftContractAddress, customer1 } = await loadFixture(deployContractsFixture);
        
        const tokenId = 1;
        const itemId = 1;
        const price = 15000000000000000000n;
        const newPrice = 25000000000000000000n;
  
        // Create a token (tokenId = 1)
        await treesNFT.createToken("URI_1");
  
        // Create an item for new token
        await treesNFTMarket.createMarketItem(nftContractAddress, tokenId, price);
  
        // Customer1 purchases the item
        await treesNFTMarket.connect(customer1).purchaseItem(nftContractAddress, itemId, {value: 15000000000000000000n});
  
        // Customer1 attempt to put the item on sale without passing the listing price
        await expect(treesNFTMarket.connect(customer1).putItemOnSale(nftContractAddress, itemId, newPrice))
                    .to.be.revertedWith("Passed Value must be equal to listing price");
      });

      
      it("Should revert if caller is not the marketplace owner and does not pass the correct listing price", async function () {
        const { treesNFT, treesNFTMarket, nftContractAddress, customer1 } = await loadFixture(deployContractsFixture);
        
        const tokenId = 1;
        const itemId = 1;
        const price = 15000000000000000000n;
        const newPrice = 25000000000000000000n;
        const wrongListingPrice = 45000;

        // Create a token (tokenId = 1)
        await treesNFT.createToken("URI_1");
  
        // Create an item for new token
        await treesNFTMarket.createMarketItem(nftContractAddress, tokenId, price);
  
        // Customer1 purchases the item
        await treesNFTMarket.connect(customer1).purchaseItem(nftContractAddress, itemId, {value: 15000000000000000000n});
  
        // Customer1 attempt to put the item on sale passing a wrong listing price
        await expect(treesNFTMarket.connect(customer1).putItemOnSale(nftContractAddress, itemId, newPrice, {value: wrongListingPrice}))
                    .to.be.revertedWith("Passed Value must be equal to listing price");
      });


      it("Should emit put on sale event if success", async function () {
        const { treesNFT, treesNFTMarket, nftContractAddress, marketContractAddress, customer1 } = await loadFixture(deployContractsFixture);
        
        const tokenId = 1;
        const itemId = 1;
        const price = 15000000000000000000n;
        const newPrice = 25000000000000000000n;
        const listingPrice = await treesNFTMarket.getListingPrice();

        // Create a token (tokenId = 1)
        await treesNFT.createToken("URI_1");
  
        // Create an item for new token
        await treesNFTMarket.createMarketItem(nftContractAddress, tokenId, price);
  
        // Customer1 purchases the item
        await treesNFTMarket.connect(customer1).purchaseItem(nftContractAddress, itemId, {value: 15000000000000000000n});

        // Customer1 approves marketplace for token
        await treesNFT.connect(customer1).approve(marketContractAddress, tokenId);

        // Customer1 puts the item on sale passing the right listing price
        expect(await treesNFTMarket.connect(customer1).putItemOnSale(nftContractAddress, itemId, newPrice, {value: listingPrice}))
              .to.emit(treesNFT, "MarketItemPutOnSale")
              .withArgs({itemId: itemId, tokenId: tokenId, price: newPrice, seller: customer1.address, 
                        owner: customer1.address, nftContract: nftContractAddress, forSale: true});
      
      });

    }); //describe("Put an item on sale"


    describe("Remove an item from sale", function () {

      it("Should revert if item does not exist (the caller can therefore not be the item seller", async function () {
        const { treesNFTMarket, nftContractAddress } = await loadFixture(deployContractsFixture);
        
        const itemId = 1;
        const newPrice = 15000000000000000000n;

        // Attempt to purchase the item with value 0 (omitted)
        await expect(treesNFTMarket.removeItemFromSale(nftContractAddress, itemId))
                    .to.be.revertedWith("You must be the item seller");
      });


      it("Should revert if the caller is not the item seller", async function () {
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
        await expect(treesNFTMarket.connect(customer1).removeItemFromSale(nftContractAddress, itemId))
                    .to.be.revertedWith("You must be the item seller");
      });

      
      it("Should revert if the item already is NOT for sale", async function () {
        const { treesNFT, treesNFTMarket, nftContractAddress } = await loadFixture(deployContractsFixture);
        
        const tokenId = 1;
        const itemId = 1;
        const price = 15000000000000000000n;
        const newPrice = 25000000000000000000n;

        // Create a token (tokenId = 1)
        await treesNFT.createToken("URI_1");

        // Create an item for new token (automatically puts the item on sale)
        await treesNFTMarket.createMarketItem(nftContractAddress, tokenId, price);

        // Remove item from sale a first time
        await treesNFTMarket.removeItemFromSale(nftContractAddress, tokenId);

        // Attempt to remove item from sale again
        await expect(treesNFTMarket.removeItemFromSale(nftContractAddress, itemId))
                    .to.be.revertedWith("Item is not for sale");
      });      


      it("Should emit item removed from sale event if success", async function () {

        const { treesNFT, treesNFTMarket, nftContractAddress, owner } = await loadFixture(deployContractsFixture);
        
        const tokenId = 1;
        const itemId = 1;
        const price = 15000000000000000000n;

        // Create a token (tokenId = 1)
        await treesNFT.createToken("URI_1");

        // Create an item for new token (automatically puts the item on sale)
        await treesNFTMarket.createMarketItem(nftContractAddress, tokenId, price);

        // Remove item from sale
        expect(await treesNFTMarket.removeItemFromSale(nftContractAddress, itemId))
              .to.emit(treesNFT, "MarketItemRemovedFromSale")
              .withArgs({itemId: itemId, tokenId: tokenId, price: price, seller: owner.address, 
                        owner: owner.address, nftContract: nftContractAddress, forSale: false});
      });

    }); //describe("Remove an item from sale

  }); //describe("Marketplace actions"


  describe("Functions for Frontend", function () {
/*
    describe("Fetch all marketplace items", function () {
    
      it("Should return the correct item count", async function () {

        const { treesNFT, treesNFTMarket, nftContractAddress } = await loadFixture(deployContractsFixture);
        
        var tokenId;
        const price = 15000000000000000000n;
        const newPrice = 25000000000000000000n;

        // Create 3 items
        for (i=1 ; i<=3; i++) {

          let tokenId = i;

          // Create a token
          await treesNFT.createToken("URI");

          // Create an item for new token (automatically puts the item on sale)
          await treesNFTMarket.createMarketItem(nftContractAddress, tokenId, price);
        };

        // Fetch all items and get the items array
        let itemsArray = await treesNFTMarket.fetchAllItems();

          // Attempt to remove item from sale again
          expect(itemsArray.length).to.equal(3);

      });      
    
    }); //describe("Fetch all marketplace items"
*/

    describe("Fetch all marketplace items", function () {
    
      it("Should return the correct item count", async function () {

        const { treesNFT, treesNFTMarket, nftContractAddress, customer1 } = await loadFixture(deployContractsFixture);
        
        var tokenId;
        var itemId;
        const price = 15000000000000000000n;

        // Create 6 items
        for (i=1 ; i<=6; i++) {

          let tokenId = i;

          // Create a token
          await treesNFT.createToken("URI");

          // Create an item for new token (automatically puts the item on sale)
          await treesNFTMarket.createMarketItem(nftContractAddress, tokenId, price);

        };

        // Customer1 purchases the 2 first items
        for (i=1 ; i<=2; i++) {

          let itemId = i;

          // Customer1 purchases the item
          await treesNFTMarket.connect(customer1).purchaseItem(nftContractAddress, itemId, {value: price});
        };

        // Fetch all items and get the items array
        let itemsArray = await treesNFTMarket.fetchAllItems();

        // Check the fetched items count
        expect(itemsArray.length).to.equal(6);

      });      
    
    }); //describe("Fetch all marketplace items"


    describe("Fetch for sale marketplace items", function () {
    
      it("Should return the correct item count", async function () {

        const { treesNFT, treesNFTMarket, nftContractAddress, customer1 } = await loadFixture(deployContractsFixture);
        
        var tokenId;
        var itemId;
        const price = 15000000000000000000n;

        // Create 6 items
        for (i=1 ; i<=6; i++) {

          let tokenId = i;

          // Create a token
          await treesNFT.createToken("URI");

          // Create an item for new token (automatically puts the item on sale)
          await treesNFTMarket.createMarketItem(nftContractAddress, tokenId, price);

        };

        // Customer1 purchases the 2 first items (items are not for sale anymore, until new owner eventually put them on sale)
        for (i=1 ; i<=2; i++) {

          let itemId = i;

          // Customer1 purchases the item
          await treesNFTMarket.connect(customer1).purchaseItem(nftContractAddress, itemId, {value: price});
        };

        // Fetch for sale items and get the items array
        let itemsArray = await treesNFTMarket.fetchItemsForSale();

        // We should have 4 items for sale, the remaining marketplace ones
        expect(itemsArray.length).to.equal(4);

      });      
      
    }); //describe("Fetch for sale marketplace items"

    describe("Fetch a specific user marketplace items", function () {
    
      it("Should return the correct item count", async function () {

        const { treesNFT, treesNFTMarket, nftContractAddress, customer1 } = await loadFixture(deployContractsFixture);
        
        var tokenId;
        var itemId;
        const price = 15000000000000000000n;

        // Create 6 items
        for (i=1 ; i<=6; i++) {

          let tokenId = i;

          // Create a token
          await treesNFT.createToken("URI");

          // Create an item for new token (automatically puts the item on sale)
          await treesNFTMarket.createMarketItem(nftContractAddress, tokenId, price);

        };

        // Customer1 purchases the 2 first items (items are not for sale anymore, until new owner eventually put them on sale)
        for (i=1 ; i<=2; i++) {

          let itemId = i;

          // Customer1 purchases the item
          await treesNFTMarket.connect(customer1).purchaseItem(nftContractAddress, itemId, {value: price});
        };

        // Fetch for sale items and get the items array (marketplace owner call)
        let itemsArray = await treesNFTMarket.fetchUserItems(customer1.address);

        // We should have 2 items for customer1
        expect(itemsArray.length).to.equal(2);

        // Fetch for sale items and get the items array (user call)
        let itemsArray2 = await treesNFTMarket.connect(customer1).fetchUserItems(customer1.address);

        // We should have 2 items for customer1
        expect(itemsArray2.length).to.equal(2);

      });      
    
    }); //describe("Fetch a specific user marketplace items"

  }); //describe("Functions for Frontend"

}); //describe("TreesNFTMarket contract tests"
