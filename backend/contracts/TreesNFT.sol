// contracts/NFT.sol
// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title TreesNFT NFT contract 
/// @author JF Briche
/// @notice A standard ERC721URIStorage contract to mint TreesNFTs
/// @dev Only contract owner can mint. 
/// Market Place contract is automatically approved for the minted NFTs, so that the contract can handle them.
contract TreesNFT is ERC721URIStorage, Ownable {

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address _MKPAddress;

    // Constructor to set Token Name, Symbol & and Get Marketplace address
    constructor(address marketplaceAddress) ERC721("TreesNFT", "TN") {
        _MKPAddress = marketplaceAddress;
    }

    /// @dev Mint a new Token
    /// @param tokenURI The new token URI (URL to reach the token metadata json file)
    /// @return the new token Id
    function createToken(string memory tokenURI) public onlyOwner returns (uint) {

        _tokenIds.increment();  // Increment token id counter
        uint256 newTokenId = _tokenIds.current();    // The new token id

        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        approve(_MKPAddress, newTokenId);    //Approves Marketplace contract for the new token

        return newTokenId;
    }
}