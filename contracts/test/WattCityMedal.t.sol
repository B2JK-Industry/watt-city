// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {WattCityMedal} from "../WattCityMedal.sol";

/*
 * Phase 8 W2 — EVM-level tests for WattCityMedal.
 *
 * Complements the static source-invariant checks in
 * contracts/test/WattCityMedal.test.ts (vitest) by actually executing
 * the bytecode. Run with:
 *   forge test -vvv
 *
 * Covered invariants:
 *   - mint gated by onlyOwner
 *   - burn gated by onlyOwner
 *   - every transferFrom/safeTransferFrom reverts with Soulbound()
 *   - approve/setApprovalForAll revert with ApprovalsDisabled()
 *   - balance accounting on mint + burn
 *   - duplicate tokenId mint reverts with TokenExists()
 *   - burn of non-existent token reverts with TokenDoesNotExist()
 *   - transferOwnership rotates the owner and retains onlyOwner on mint
 */
contract WattCityMedalTest is Test {
    WattCityMedal medal;
    address owner = address(this);
    address alice = address(0xA11CE);
    address bob = address(0xB0B);
    address relayer = address(0xCAFE);

    function setUp() public {
        medal = new WattCityMedal();
    }

    // ----- construction -----

    function test_constructor_sets_owner_and_metadata() public view {
        assertEq(medal.owner(), owner);
        assertEq(medal.name(), "Watt City Medal");
        assertEq(medal.symbol(), "WCM");
    }

    // ----- mint -----

    function test_mint_from_owner_succeeds() public {
        medal.mint(alice, 1, "ipfs://abc", "a_first_win");
        assertEq(medal.ownerOf(1), alice);
        assertEq(medal.balanceOf(alice), 1);
        assertEq(medal.tokenURI(1), "ipfs://abc");
        assertEq(medal.achievementOf(1), "a_first_win");
    }

    function test_mint_from_non_owner_reverts() public {
        vm.prank(alice);
        vm.expectRevert(WattCityMedal.NotOwner.selector);
        medal.mint(alice, 1, "ipfs://abc", "a_first_win");
    }

    function test_mint_to_zero_reverts() public {
        vm.expectRevert(WattCityMedal.InvalidAddress.selector);
        medal.mint(address(0), 1, "ipfs://abc", "a_first_win");
    }

    function test_mint_duplicate_tokenId_reverts() public {
        medal.mint(alice, 1, "ipfs://abc", "a_first_win");
        vm.expectRevert(WattCityMedal.TokenExists.selector);
        medal.mint(bob, 1, "ipfs://xyz", "a_first_win");
    }

    // ----- soulbound -----

    function test_transferFrom_always_reverts() public {
        medal.mint(alice, 1, "ipfs://abc", "a_first_win");
        vm.prank(alice);
        vm.expectRevert(WattCityMedal.Soulbound.selector);
        medal.transferFrom(alice, bob, 1);
    }

    function test_safeTransferFrom_always_reverts() public {
        medal.mint(alice, 1, "ipfs://abc", "a_first_win");
        vm.prank(alice);
        vm.expectRevert(WattCityMedal.Soulbound.selector);
        medal.safeTransferFrom(alice, bob, 1);
    }

    function test_safeTransferFrom_with_data_always_reverts() public {
        medal.mint(alice, 1, "ipfs://abc", "a_first_win");
        vm.prank(alice);
        vm.expectRevert(WattCityMedal.Soulbound.selector);
        medal.safeTransferFrom(alice, bob, 1, "");
    }

    // ----- approvals -----

    function test_approve_reverts() public {
        vm.expectRevert(WattCityMedal.ApprovalsDisabled.selector);
        medal.approve(bob, 1);
    }

    function test_setApprovalForAll_reverts() public {
        vm.expectRevert(WattCityMedal.ApprovalsDisabled.selector);
        medal.setApprovalForAll(bob, true);
    }

    function test_getApproved_returns_zero() public view {
        assertEq(medal.getApproved(1), address(0));
    }

    function test_isApprovedForAll_returns_false() public view {
        assertEq(medal.isApprovedForAll(alice, bob), false);
    }

    // ----- burn -----

    function test_burn_from_owner_succeeds() public {
        medal.mint(alice, 1, "ipfs://abc", "a_first_win");
        assertEq(medal.balanceOf(alice), 1);
        medal.burn(1);
        assertEq(medal.balanceOf(alice), 0);
        vm.expectRevert(WattCityMedal.TokenDoesNotExist.selector);
        medal.ownerOf(1);
    }

    function test_burn_from_non_owner_reverts() public {
        medal.mint(alice, 1, "ipfs://abc", "a_first_win");
        vm.prank(alice);
        vm.expectRevert(WattCityMedal.NotOwner.selector);
        medal.burn(1);
    }

    function test_burn_nonexistent_reverts() public {
        vm.expectRevert(WattCityMedal.TokenDoesNotExist.selector);
        medal.burn(1);
    }

    // ----- ownership rotation -----

    function test_transferOwnership_rotates_owner() public {
        medal.transferOwnership(relayer);
        assertEq(medal.owner(), relayer);
        // Old owner can no longer mint.
        vm.expectRevert(WattCityMedal.NotOwner.selector);
        medal.mint(alice, 1, "ipfs://abc", "a_first_win");
        // New owner can.
        vm.prank(relayer);
        medal.mint(alice, 1, "ipfs://abc", "a_first_win");
        assertEq(medal.ownerOf(1), alice);
    }

    function test_transferOwnership_to_zero_reverts() public {
        vm.expectRevert(WattCityMedal.InvalidAddress.selector);
        medal.transferOwnership(address(0));
    }

    // ----- ERC-165 -----

    function test_supportsInterface_erc165() public view {
        assertTrue(medal.supportsInterface(0x01ffc9a7));
    }

    function test_supportsInterface_erc721() public view {
        assertTrue(medal.supportsInterface(0x80ac58cd));
    }

    function test_does_not_claim_erc721_metadata() public view {
        // Intentional: metadata interface claim would imply tokenURI is
        // ERC-721Metadata-compliant, which it isn't (no name/symbol
        // getters matching that exact interface signature).
        assertFalse(medal.supportsInterface(0x5b5e139f));
    }
}
