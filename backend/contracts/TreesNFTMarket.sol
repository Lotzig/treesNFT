// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";   // for debugging

/// @title TreesNFT Market Place contract 
/// @author JF Briche
/// @notice Add, purchase and sell NFTs on the Market Place. NFTs must be minted using the NFT contract beforehand.
contract TreesNFTMarket is ReentrancyGuard, Ownable {

    using Counters for Counters.Counter;

    // For each Individual market item
    Counters.Counter private _itemIds;

    // For global items for sale (MarketPlace owner + customers)
    Counters.Counter private _itemsForSale;

    // Default listing Fee (amount to be payed by an item owner to put it on sale. NB : contract owner does not pay listing fee)
    uint256 _listingPrice = 0.000045 ether;

    // Owner of market i.e. contract address 
    address payable MKPOwner;

    //For each user items for sale
    mapping(address => Counters.Counter) private itemsForSale;

    constructor() {
        MKPOwner = payable(msg.sender);
    }

    // Metadata of Individual Item
    struct MarketItem {
        uint256 itemId;
        uint256 tokenId;
        uint256 price;
        address payable seller;
        address payable owner;
        address nftContract;
        bool forSale;
    }
    
    // itemId that returns MarketItem
    mapping(uint256 => MarketItem) private idToMarketItem;

    // TokenId that are linked to a Marketplace item
    mapping(uint256 tokenId => uint256 mkpItemId) private tokenIdToMkpItem;

    // Event to generate on the creation of new MarketItem
    event MarketItemCreated (
        uint256 indexed itemId,
        uint256 indexed tokenId,
        uint256 price,
        address seller,
        address owner,
        address indexed nftContract,
        bool forSale
    );

    // Event to generate when an item is purchased
    event MarketItemPurchased (
        uint256 indexed itemId,
        uint256 indexed tokenId,
        uint256 price,
        address seller,
        address owner,
        address indexed nftContract,
        bool forSale
    );

    // Event to generate when an existing item is put on sale
    event MarketItemPutOnSale (
        uint256 indexed itemId,
        uint256 indexed tokenId,
        uint256 price,
        address seller,
        address owner,
        address indexed nftContract,
        bool forSale
    );

    // Event to generate when an item is removed from sale
    event MarketItemRemovedFromSale (
        uint256 indexed itemId,
        uint256 indexed tokenId,
        uint256 price,
        address seller,
        address owner,
        address indexed nftContract,
        bool forSale
    );



    /// @dev Returns the listing price
    function getListingPrice() public view returns (uint256) {
        return _listingPrice;
    }

    /// @dev Returns the listing price
    function setListingPrice(uint256 newListingPrice) public onlyOwner {
        _listingPrice = newListingPrice;
    }



    /// @dev  1. Actions on MarketPlace Items
    //---------------------------------------

    /// @dev 1.1.Creating MarketItem and places an it for sale on the marketplace 
    /// @param nftContract The NFT contract address    
    /// @param tokenId The NFT token Id from the NFT contract    
    /// @param price The Market Place item price    
    function createMarketItem(address nftContract, uint256 tokenId, uint256 price) public nonReentrant onlyOwner {

        // Marketplace item id for passed token id (if not exists then Item Id = 0)
        uint256 tokenItemId = tokenIdToMkpItem[tokenId];

        require(tokenItemId == 0, string.concat("Token already has a Marketplace item (Item Id = ", Strings.toString(tokenItemId),")"));
        require(price > 0, "Item Price must be at least 1 wei");

        // Increment items total count and set current counter value
        _itemIds.increment();
        uint256 itemId = _itemIds.current();

        // Link the token with the marketplace item
        tokenIdToMkpItem[tokenId] = itemId;
        
        // Increment global items for sale counter
        _itemsForSale.increment();

        // Increment MarketPlace's items for sale
        itemsForSale[msg.sender].increment();

        // Generate new marketItem
        idToMarketItem[itemId] =  MarketItem(
            itemId,
            tokenId,
            price,
            payable(msg.sender),    //seller
            payable(msg.sender),    //owner
            nftContract,
            true
        );

        // Changing ownership of NFT to MarketPlace Contract so MKP Contract interact with it.
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        
        // Emit the event on creation of new Market Item Creation
        emit MarketItemCreated(
            itemId,
            tokenId,
            price,
            msg.sender, // seller
            msg.sender, // owner
            nftContract,
            true
        );
    }

    /// @dev 1.2.Purchase an on sale item from the MarketPlace
    /// @param nftContract The NFT contract address
    /// @param itemId The Id of the item to be purchased
    function purchaseItem( address nftContract, uint256 itemId ) public payable nonReentrant {

        // Getting item propeties
        uint price = idToMarketItem[itemId].price;
        uint tokenId = idToMarketItem[itemId].tokenId;
        address payable itemSeller = idToMarketItem[itemId].seller;
        bool forSale = idToMarketItem[itemId].forSale;

        // Item must exist
        require(tokenId != 0, "Item does not exists");

        // Purchaser must not be the item owner
        require(msg.sender != idToMarketItem[itemId].owner, "You already own this item");

        // Item must be for sale
        require(forSale == true, "Item is not for sale");

        // To make sure price must be equal to given price
        require(msg.value == price, "Please submit the asking price in order to complete the purchase");
        
        // Transfer amount of token to seller
        itemSeller.transfer(msg.value);
        
        // Transfer ownership of token to msg.sender(i.e. purchaser )
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
        
        // Update Owner and Sold Details
        idToMarketItem[itemId].owner = payable(msg.sender);
        idToMarketItem[itemId].forSale = false;

        // Decrement items for sale counters
        _itemsForSale.decrement();
        itemsForSale[itemSeller].decrement();

        // Transfer listing price to owner of MarketPlace
        // If the seller is the MarketPlace owner, then he previously put the item on the MarketPlace using CreateMarketItem.
        // No listing price is payed by the MarketPlace owner when he puts an item on the MarketPlace --> no listing price to pay forward to the MarketPlace here
        if (idToMarketItem[itemId].seller != MKPOwner) {

            MKPOwner.transfer(_listingPrice);
        }

        // Emit purchase event
        emit MarketItemPurchased (
            itemId,
            tokenId,
            price,
            itemSeller,
            msg.sender, // new owner
            nftContract,
            forSale );
    }

    /// @dev 1.3. Put an owned item on sale on the MarketPlace
    /// @dev NB : requires NFT owner to approve MarketPlace contract for the NFT beforehand (NFT contract)
    /// @param nftContract The NFT contract address    
    /// @param itemId The id of the item to be put on sale    
    /// @param newPrice The item new price    
    function putItemOnSale(address nftContract, uint256 itemId, uint256 newPrice) public payable nonReentrant {

        // Caller must own the item
        require(idToMarketItem[itemId].owner == msg.sender, "You must be the Item owner");

        // Item must not already be for sale
        require(idToMarketItem[itemId].forSale == false, "Item already is for sale");

        // Caller must pay the listing price if not market place owner
        require(msg.value == _listingPrice || msg.sender == MKPOwner, "Passed Value must be equal to listing price");
        
        // Update Item Details
        idToMarketItem[itemId].seller = payable(msg.sender);
        idToMarketItem[itemId].price = newPrice; 
        idToMarketItem[itemId].forSale = true;

        // Increment items for sale counters
        _itemsForSale.increment();
        itemsForSale[idToMarketItem[itemId].seller].increment();

        // Changing ownership of NFT to MarketPlace Contract so MKP Contract interact with it.
        IERC721(nftContract).transferFrom(msg.sender, address(this), idToMarketItem[itemId].tokenId);

        // Emit put on sale event
        emit MarketItemPutOnSale (
            itemId,
            idToMarketItem[itemId].tokenId,
            newPrice,
            msg.sender,
            msg.sender,
            nftContract,
            true // forSale
        );

    }

    /// @dev 1.4. Remove an item from sale
    /// @param nftContract The NFT contract address    
    /// @param itemId The id of the item to be removed from sale    
    function removeItemFromSale(address nftContract, uint itemId) public {

        // Caller must be the item seller
        require(msg.sender == idToMarketItem[itemId].seller, "You must be the item seller");

        // Item must be for sale
        require(idToMarketItem[itemId].forSale == true, "Item is not for sale");

        // Remove item from sale
        idToMarketItem[itemId].forSale = false;

        // Decrement global items for sale counter
        _itemsForSale.decrement();

        // Decrement MarketPlace's items for sale
        itemsForSale[msg.sender].decrement();

        // Transfer NFT from Market Place to owner
        IERC721(nftContract).transferFrom(address(this), msg.sender, idToMarketItem[itemId].tokenId);

        // Emit removed from sale event
        emit MarketItemRemovedFromSale (
            itemId,
            idToMarketItem[itemId].tokenId,
            idToMarketItem[itemId].price,
            msg.sender,
            msg.sender,
            nftContract,
            false  //forSale
        );
    }


    /// @dev 2.Function for Frontend
    /// @dev 2.1.Returns all market items (MarketPlace and customers)
    /// @return The market items array
    function fetchAllItems() public onlyOwner view returns (MarketItem[] memory) {

        uint itemCount = _itemIds.current();
        uint currentIndex;

        // Declear MarketItem(i.e. struct) type array of length for sale Item number 
        MarketItem[] memory items = new MarketItem[](itemCount);

        // Loop in all existing items
        for (uint i = 0; i < itemCount; i++) {

            uint currentId = i + 1;
            MarketItem storage currentItem = idToMarketItem[currentId];
            items[currentIndex] = currentItem;
            currentIndex += 1;
        }
        return items;
    }

    /// @dev 2.2.Returns all for sale market items (MarketPlace and customers)
    /// @return The market items array
    function fetchItemsForSale() public view returns (MarketItem[] memory) {

        uint itemCount = _itemIds.current();
        uint forSaleItemCount = _itemsForSale.current();
        uint currentIndex;

        // Declear MarketItem(i.e. struct) type array of length for sale Item number 
        MarketItem[] memory items = new MarketItem[](forSaleItemCount);

        // Loop in all existing items
        for (uint i = 0; i < itemCount; i++) {

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

    /// @dev 2.3.Returns a specific user items 
    /// @return The market items array
    function fetchUserItems(address user) public view returns (MarketItem[] memory) {
        
        uint totalItemCount = _itemIds.current();
        uint userItemCount;
        uint currentIndex;
        address nftOwner;

        //If caller is contract owner, they can retrieve any user NFT list, otherwise only the caller's NFT are returned
        if (msg.sender == MKPOwner) {
            nftOwner = user; 
        }
        else {
            nftOwner = msg.sender;
        }

        // Getting total number of user's Token
        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == nftOwner) {
                userItemCount += 1;
            }
        }

        // Declear MarketItem(i.e. struct) type array of length user's Item number
        MarketItem[] memory items = new MarketItem[](userItemCount);
        
        // Stores user TokenId's in item
        for (uint i = 0; i < totalItemCount; i++) {

            // If item owner is the caller
            if (idToMarketItem[i + 1].owner == nftOwner) {

                uint currentId = idToMarketItem[i + 1].itemId; // Current Token Id
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }
}