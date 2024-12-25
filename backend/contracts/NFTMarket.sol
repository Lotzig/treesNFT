// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";

contract NFTMarket is ReentrancyGuard, Ownable {

    using Counters for Counters.Counter;
    // For each Individual market item
    Counters.Counter private _itemIds;
    // For sold item of each user
    //Counters.Counter private _itemsSold;
    // For global items for sale (MarketPlace owner + customers)
    Counters.Counter private _itemsForSale;
    //For each user items for sale
    mapping(address => Counters.Counter) private itemsForSale;
    // Owner of market i.e. contract address 
    address payable MKPOwner;
    // Listing Fee
    uint256 listingPrice = 0.000045 ether;
    
    constructor() Ownable(msg.sender) {
        //owner = payable(msg.sender);
        MKPOwner = payable(msg.sender);
    }

    // Metadata of Individual Item
    struct MarketItem {
        uint itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool forSale;
    }
    
    // itemId that returns MarketItem
    mapping(uint256 => MarketItem) private idToMarketItem;

    // Event to generate on the creation of new MarketItem
    event MarketItemCreated (
        uint indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool forSale
    );

    // Returns the listing price of the contract
    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    // 1. Actions on MarketPlace Items
    // 1.1.Creating MarketItem and places an it for sale on the marketplace 
    function createMarketItem(address nftContract, uint256 tokenId, uint256 price) public nonReentrant onlyOwner {

        require(price > 0, "NFT Price must be at least 1 wei");

        // Increment items total count and set current counter value
        _itemIds.increment();
        uint256 itemId = _itemIds.current();

        // Increment global items for sale counter
        _itemsForSale.increment();

        // Increment MarketPlace's items for sale
        itemsForSale[msg.sender].increment();

        // Generate new marketItem
        idToMarketItem[itemId] =  MarketItem(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),    //seller
            payable(address(this)), //owner
            price,
            true
        );

        // Changing ownership of NFT to MarketPlace Contract so MKP Contract interact with it.
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        
        // Emit the event on creation of new Market Item Creation
        emit MarketItemCreated(
            itemId,
            nftContract,
            tokenId,
            msg.sender,
            msg.sender,
            price,
            true
        );
    }

    // 1.2.Purchase an on sale item from the MarketPlace
    function purchaseItem( address nftContract, uint256 itemId ) public payable nonReentrant {

        //Debug
        console.log(string.concat("msg.value : ", Strings.toString(msg.value)));
        console.log(string.concat("Balance sender : ", Strings.toString(msg.sender.balance)));

        // Getting Price and TokenId of item
        uint price = idToMarketItem[itemId].price;
        uint tokenId = idToMarketItem[itemId].tokenId;

        // To make sure price must be equal to given price
        require(msg.value == price, "Please submit the asking price in order to complete the purchase");
        
        // Transfer amount of token to seller
        idToMarketItem[itemId].seller.transfer(msg.value);
        
        // Transfer ownership of token to msg.sender(i.e. purchaser )
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
        
        // Update Owner and Sold Details
        idToMarketItem[itemId].owner = payable(msg.sender);
        idToMarketItem[itemId].forSale = false;

        // Decrement items for sale counters
        _itemsForSale.decrement();
        itemsForSale[idToMarketItem[itemId].seller].decrement();

        // Transfer listing price to owner of MarketPlace
        //payable(owner).transfer(listingPrice);
        // If the seller is the MarketPlace owner, then he previously put the item on the MarketPlace using CreateMarketItem.
        // No listing price is payed by the MarketPlace owner when he puts an item on the MarketPlace --> no listing price to pay forward to the MarketPlace here
        if (idToMarketItem[itemId].seller != MKPOwner) {
            //payable(owner).transfer(listingPrice);
            MKPOwner.transfer(listingPrice);
        }
    }

    // 1.3. Put an owned item on sale on the MarketPlace
    // NB : requires NFT owner to approve MarketPlace contract for the NFT beforehand (NFT contract)
    function putItemOnSale(address nftContract, uint256 itemId, uint256 newPrice) public payable nonReentrant {

        // Caller must own the item
        require(idToMarketItem[itemId].owner == msg.sender, "You must be the Item owner");

        // Caller must pay the listing price
        require(msg.value == listingPrice, "Passed Value must be equal to listing price");

        // Owner must pass the listing price
        require(msg.value == listingPrice, "Passed Value must be equal to listing price");
        
        // Update Item Details
        idToMarketItem[itemId].seller = payable(msg.sender);
        idToMarketItem[itemId].price = newPrice; 
        idToMarketItem[itemId].forSale = true;

        // Increment items for sale counters
        _itemsForSale.increment();
        itemsForSale[idToMarketItem[itemId].seller].increment();

        // Changing ownership of NFT to MarketPlace Contract so MKP Contract interact with it.
        IERC721(nftContract).transferFrom(msg.sender, address(this), idToMarketItem[itemId].tokenId);

    }

    // 2.Function for Frontend i.e. Return all for sale items, my NFTs,...
    // 2.1.Returns all for sale market items (MarketPlace and customers)
    function fetchItemsForSale() public view returns (MarketItem[] memory) {

        uint itemCount = _itemIds.current();
        //uint unsoldItemCount = _itemIds.current() - itemsSold[address(this)].current();
        uint forSaleItemCount = _itemsForSale.current();
        uint currentIndex = 0;

        // Declear MarketItem(i.e. struct) type array of length for sale Item number 
        MarketItem[] memory items = new MarketItem[](forSaleItemCount);
// debug
console.log(string.concat("itemCount = ", Strings.toString(itemCount)));
console.log(string.concat("forSaleItemCount = ", Strings.toString(forSaleItemCount)));

//
        // Loop in all existing items
        for (uint i = 0; i < itemCount; i++) {

console.log(string.concat("idToMarketItem[", Strings.toString(i+1), "] = ", idToMarketItem[i + 1].forSale ? "True" : "False"));

            // If item is for sale, store it in the array to be returned
            if (idToMarketItem[i + 1].forSale == true) {
                uint currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    // 2.2.Returns a specific user items 
    function fetchUserNFTs() public view returns (MarketItem[] memory) {
        
        uint totalItemCount = _itemIds.current();
        uint userItemCount = 0;
        uint currentIndex = 0;

        // Getting total number of user's Token
        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) {
                userItemCount += 1;
            }
        }

        // Declear MarketItem(i.e. struct) type array of length user's Item number
        MarketItem[] memory items = new MarketItem[](userItemCount);
        
        // Stores user TokenId's in item
        for (uint i = 0; i < totalItemCount; i++) {
            // If item owner is the caller
            if (idToMarketItem[i + 1].owner == msg.sender) {
                uint currentId = idToMarketItem[i + 1].itemId; // Current Token Id
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }


    // FOR TESTS (remove before production deployment)
    //---------------------------------------------------------------------
    // JFB : récupérer la balance du contrat
    function getMkpBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getBalanceOf(address account) public view returns (uint256) {
        return address(account).balance;
    }
}