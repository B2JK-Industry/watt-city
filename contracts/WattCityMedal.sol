// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
 * WattCityMedal — soulbound (non-transferable) ERC-721 for player
 * achievements. Phase 8 scaffold.
 *
 * Minimal surface by design:
 *   - owner (deployer) is the only mint + burn authority;
 *   - every transfer reverts unless from or to is zero (mint/burn);
 *   - tokenURI returns an IPFS URI set at mint time.
 *
 * DO NOT deploy to any public network until the operator completes
 * `docs/web3/DEPLOY.md`. This file is reviewed locally via Hardhat
 * (`pnpm test:contracts`). No audit has run against it.
 */

contract WattCityMedal {
    string public constant name = "Watt City Medal";
    string public constant symbol = "WCM";

    address public owner;

    mapping(uint256 => address) private _ownerOf;
    mapping(address => uint256) private _balanceOf;
    mapping(uint256 => string) private _tokenURI;
    mapping(uint256 => string) private _achievementOf;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    // Events below are NOT part of ERC-721; useful for the Watt City indexer.
    event MedalMinted(address indexed to, uint256 indexed tokenId, string achievement);
    event MedalBurned(uint256 indexed tokenId);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error InvalidAddress();
    error TokenExists();
    error TokenDoesNotExist();
    error Soulbound();
    error ApprovalsDisabled();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        address prev = owner;
        owner = newOwner;
        emit OwnershipTransferred(prev, newOwner);
    }

    // ---------- minimal ERC-721 (ownership only) ----------

    function balanceOf(address who) external view returns (uint256) {
        if (who == address(0)) revert InvalidAddress();
        return _balanceOf[who];
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address o = _ownerOf[tokenId];
        if (o == address(0)) revert TokenDoesNotExist();
        return o;
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        if (_ownerOf[tokenId] == address(0)) revert TokenDoesNotExist();
        return _tokenURI[tokenId];
    }

    function achievementOf(uint256 tokenId) external view returns (string memory) {
        if (_ownerOf[tokenId] == address(0)) revert TokenDoesNotExist();
        return _achievementOf[tokenId];
    }

    // Transfers always revert — soulbound. We implement the functions so
    // wallets don't blow up when they call them; the error message is
    // explicit so users know this is by design.
    function transferFrom(address, address, uint256) external pure {
        revert Soulbound();
    }

    function safeTransferFrom(address, address, uint256) external pure {
        revert Soulbound();
    }

    function safeTransferFrom(address, address, uint256, bytes calldata) external pure {
        revert Soulbound();
    }

    // Approval functions exist for ABI compatibility but are no-ops that
    // revert — nothing you can do with an approval on a soulbound token.
    function approve(address, uint256) external pure {
        revert ApprovalsDisabled();
    }

    function getApproved(uint256) external pure returns (address) {
        return address(0);
    }

    function setApprovalForAll(address, bool) external pure {
        revert ApprovalsDisabled();
    }

    function isApprovedForAll(address, address) external pure returns (bool) {
        return false;
    }

    // ---------- Watt City mint + burn ----------

    function mint(
        address to,
        uint256 tokenId,
        string calldata uri,
        string calldata achievement
    ) external onlyOwner {
        if (to == address(0)) revert InvalidAddress();
        if (_ownerOf[tokenId] != address(0)) revert TokenExists();
        _ownerOf[tokenId] = to;
        _balanceOf[to] += 1;
        _tokenURI[tokenId] = uri;
        _achievementOf[tokenId] = achievement;
        emit Transfer(address(0), to, tokenId);
        emit MedalMinted(to, tokenId, achievement);
    }

    function burn(uint256 tokenId) external onlyOwner {
        address holder = _ownerOf[tokenId];
        if (holder == address(0)) revert TokenDoesNotExist();
        delete _ownerOf[tokenId];
        delete _tokenURI[tokenId];
        delete _achievementOf[tokenId];
        _balanceOf[holder] -= 1;
        emit Transfer(holder, address(0), tokenId);
        emit MedalBurned(tokenId);
    }

    // ---------- ERC-165 interface detection ----------

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        // ERC-165 itself + ERC-721 base (we intentionally do NOT claim
        // ERC-721Metadata even though tokenURI exists — soulbound tokens
        // aren't strictly conformant).
        return interfaceId == 0x01ffc9a7 || interfaceId == 0x80ac58cd;
    }
}
