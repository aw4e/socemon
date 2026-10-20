// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {Socemon} from "../src/Socemon.sol";
import {Deploy} from "../script/Deploy.s.sol";

contract SocemonTest is Test {
    Socemon s;
    address minter = makeAddr("minter");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function setUp() public {
        s = new Socemon(address(this), "https://socemon.test/api/socemon/");
        s.grantRole(s.MINTER_ROLE(), minter);
    }

    function _add(uint256 id, uint8 pool, uint32 maxSupply, bool transferable) internal {
        Socemon.SpeciesInit[] memory list = new Socemon.SpeciesInit[](1);
        list[0] = Socemon.SpeciesInit(id, pool, maxSupply, transferable);
        s.addSpecies(list);
    }

    function _seedRoleTypes() internal {
        for (uint8 pool = 1; pool <= 5; pool++) _add(pool, pool, 10, false);
    }

    function test_starterOncePerWallet() public {
        vm.startPrank(minter);
        s.mintStarter(alice);
        assertEq(s.balanceOf(alice, 0), 1);
        vm.expectRevert(Socemon.AlreadyHasStarter.selector);
        s.mintStarter(alice);
        vm.stopPrank();
    }

    function test_starterIsSoulbound() public {
        vm.prank(minter);
        s.mintStarter(alice);
        vm.prank(alice);
        vm.expectRevert(Socemon.Soulbound.selector);
        s.safeTransferFrom(alice, bob, 0, 1, "");
    }

    function test_hatchMintsFromRequestedPoolAndIsSoulbound() public {
        _add(1, 1, 10, false);
        vm.prank(minter);
        uint256 id = s.hatchEgg(alice, 1);
        assertEq(id, 1);
        assertEq(s.balanceOf(alice, 1), 1);
        vm.prank(alice);
        vm.expectRevert(Socemon.Soulbound.selector);
        s.safeTransferFrom(alice, bob, 1, 1, "");
    }

    function test_soldOutPoolFallsBackToWildWithoutSettingTypeBit() public {
        _add(1, 1, 1, false);
        _add(16, 0, 10, false);
        vm.startPrank(minter);
        s.hatchEgg(alice, 1);
        uint256 id = s.hatchEgg(bob, 1);
        vm.stopPrank();
        assertEq(id, 16);
        assertEq(s.typeMask(bob), 0);
    }

    function test_everythingSoldOutReverts() public {
        _add(1, 1, 1, false);
        vm.startPrank(minter);
        s.hatchEgg(alice, 1);
        vm.expectRevert(Socemon.SoldOut.selector);
        s.hatchEgg(bob, 1);
        vm.stopPrank();
    }

    function test_supplyCapNeverExceeded() public {
        _add(1, 1, 3, false);
        _add(2, 1, 2, false);
        vm.startPrank(minter);
        for (uint256 i; i < 5; i++) s.hatchEgg(makeAddr(vm.toString(i)), 1);
        vm.expectRevert(Socemon.SoldOut.selector);
        s.hatchEgg(alice, 1);
        vm.stopPrank();
        (, , uint32 minted1, , ) = s.species(1);
        (, , uint32 minted2, , ) = s.species(2);
        assertEq(minted1, 3);
        assertEq(minted2, 2);
    }

    function test_weightedByRemainingSupply() public {
        _add(1, 1, 900, false);
        _add(2, 1, 100, false);
        vm.startPrank(minter);
        uint256 rare;
        for (uint256 i; i < 300; i++) {
            vm.prevrandao(bytes32(i));
            if (s.hatchEgg(alice, 1) == 2) rare++;
        }
        vm.stopPrank();
        // ~10% expected; wide bounds keep the test stable
        assertGt(rare, 10);
        assertLt(rare, 60);
    }

    function test_nexmonUnlocksOnceAfterAllFiveTypes() public {
        _seedRoleTypes();
        _add(19, 7, 100, false);
        vm.startPrank(minter);
        for (uint8 pool = 1; pool <= 4; pool++) s.hatchEgg(alice, pool);
        assertEq(s.balanceOf(alice, 19), 0);
        vm.expectEmit(true, false, false, false);
        emit Socemon.NexmonUnlocked(alice);
        s.hatchEgg(alice, 5);
        s.hatchEgg(alice, 5);
        vm.stopPrank();
        assertEq(s.balanceOf(alice, 19), 1);
        assertEq(s.typeMask(alice), 0x3E);
    }

    function test_nexmonSoldOutIsSkippedNotReverted() public {
        _seedRoleTypes();
        _add(19, 7, 0, false);
        vm.startPrank(minter);
        for (uint8 pool = 1; pool <= 5; pool++) s.hatchEgg(alice, pool);
        vm.stopPrank();
        assertEq(s.balanceOf(alice, 19), 0);
    }

    function test_eventAndBonusPoolsCannotBeHatched() public {
        vm.startPrank(minter);
        vm.expectRevert(Socemon.InvalidPool.selector);
        s.hatchEgg(alice, 6);
        vm.expectRevert(Socemon.InvalidPool.selector);
        s.hatchEgg(alice, 7);
        vm.stopPrank();
    }

    function test_dropOncePerWalletWithinSupplyAndTransferable() public {
        _add(20, 6, 1, true);
        vm.startPrank(minter);
        s.mintDrop(alice, 20);
        vm.expectRevert(Socemon.AlreadyHasDrop.selector);
        s.mintDrop(alice, 20);
        vm.expectRevert(Socemon.SoldOut.selector);
        s.mintDrop(bob, 20);
        vm.stopPrank();
        vm.prank(alice);
        s.safeTransferFrom(alice, bob, 20, 1, "");
        assertEq(s.balanceOf(bob, 20), 1);
    }

    function test_dropRejectsNonEventSpecies() public {
        _add(1, 1, 10, false);
        vm.prank(minter);
        vm.expectRevert(Socemon.UnknownSpecies.selector);
        s.mintDrop(alice, 1);
    }

    function test_addSpeciesRejectsStarterDuplicateAndBadPool() public {
        _add(1, 1, 10, false);
        Socemon.SpeciesInit[] memory list = new Socemon.SpeciesInit[](1);
        for (uint256 k; k < 3; k++) {
            list[0] = k == 0 ? Socemon.SpeciesInit(0, 1, 10, false)
                : k == 1 ? Socemon.SpeciesInit(1, 1, 10, false)
                : Socemon.SpeciesInit(30, 8, 10, false);
            vm.expectRevert(Socemon.InvalidSpecies.selector);
            s.addSpecies(list);
        }
    }

    function test_onlyMinterMintsAndOnlyAdminConfigures() public {
        bytes32 minterRole = s.MINTER_ROLE();
        vm.startPrank(alice);
        vm.expectRevert(abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, minterRole));
        s.mintStarter(alice);
        vm.expectRevert(abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, minterRole));
        s.hatchEgg(alice, 1);
        vm.expectRevert(abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, minterRole));
        s.mintDrop(alice, 20);
        vm.expectRevert(abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, bytes32(0)));
        s.addSpecies(new Socemon.SpeciesInit[](0));
        vm.expectRevert(abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, bytes32(0)));
        s.setBaseURI("x");
        vm.stopPrank();
    }

    function test_uriAppendsId() public view {
        assertEq(s.uri(20), "https://socemon.test/api/socemon/20");
    }

    function test_catalogJsonSeedsEverySpecies() public {
        Socemon.SpeciesInit[] memory list = new Deploy().loadCatalog();
        assertEq(list.length, 20);
        s.addSpecies(list);
        (uint8 pool, uint32 maxSupply, , bool transferable, bool exists) = s.species(20);
        assertEq(pool, 6);
        assertEq(maxSupply, 100);
        assertTrue(transferable);
        assertTrue(exists);
        (pool, maxSupply, , transferable, exists) = s.species(3);
        assertEq(pool, 1);
        assertEq(maxSupply, 20);
        assertFalse(transferable);
        assertEq(s.poolSpecies(0).length, 3);
        for (uint8 p = 1; p <= 5; p++) assertEq(s.poolSpecies(p).length, 3);
        assertEq(s.poolSpecies(6).length, 0);
    }
}
