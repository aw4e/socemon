// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// Socemon monsters. Only the server minter mints; everything but event drops is soulbound.
contract Socemon is ERC1155, AccessControl {
    using Strings for uint256;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 public constant STARTER_ID = 0;
    uint256 public constant NEXMON_ID = 19;
    uint8 public constant POOL_WILD = 0;
    uint8 public constant POOL_EVENT = 6;
    uint8 public constant POOL_BONUS = 7;
    uint8 private constant ALL_TYPES = 0x3E; // bits 1..5, one per role type

    string public constant name = "Socemon";
    string public constant symbol = "SOCE";

    struct Species {
        uint8 pool;
        uint32 maxSupply;
        uint32 minted;
        bool transferable;
        bool exists;
    }

    struct SpeciesInit {
        uint256 id;
        uint8 pool;
        uint32 maxSupply;
        bool transferable;
    }

    mapping(uint256 => Species) public species;
    mapping(address => uint8) public typeMask;
    mapping(uint8 => uint256[]) private _pools;
    string private _baseUri;
    uint256 private _nonce;

    event StarterMinted(address indexed to);
    event EggHatched(address indexed to, uint8 pool, uint256 id);
    event DropMinted(address indexed to, uint256 id);
    event NexmonUnlocked(address indexed to);

    error AlreadyHasStarter();
    error AlreadyHasDrop();
    error InvalidPool();
    error InvalidSpecies();
    error SoldOut();
    error Soulbound();
    error UnknownSpecies();

    constructor(address admin, string memory baseUri) ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _baseUri = baseUri;
    }

    function addSpecies(SpeciesInit[] calldata list) external onlyRole(DEFAULT_ADMIN_ROLE) {
        for (uint256 i; i < list.length; i++) {
            SpeciesInit calldata s = list[i];
            if (s.id == STARTER_ID || species[s.id].exists || s.pool > POOL_BONUS) revert InvalidSpecies();
            species[s.id] = Species(s.pool, s.maxSupply, 0, s.transferable, true);
            if (s.pool < POOL_EVENT) _pools[s.pool].push(s.id);
        }
    }

    function setBaseURI(string calldata baseUri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseUri = baseUri;
    }

    function poolSpecies(uint8 pool) external view returns (uint256[] memory) {
        return _pools[pool];
    }

    function mintStarter(address to) external onlyRole(MINTER_ROLE) {
        if (balanceOf(to, STARTER_ID) > 0) revert AlreadyHasStarter();
        _mint(to, STARTER_ID, 1, "");
        emit StarterMinted(to);
    }

    function hatchEgg(address to, uint8 pool) external onlyRole(MINTER_ROLE) returns (uint256 id) {
        if (pool >= POOL_EVENT) revert InvalidPool();
        id = _pick(pool, to);
        if (id == STARTER_ID && pool != POOL_WILD) id = _pick(POOL_WILD, to);
        if (id == STARTER_ID) revert SoldOut();

        Species storage s = species[id];
        s.minted++;
        _mint(to, id, 1, "");
        emit EggHatched(to, pool, id);

        if (s.pool != POOL_WILD) {
            uint8 mask = typeMask[to] | (uint8(1) << s.pool);
            typeMask[to] = mask;
            if (mask == ALL_TYPES) _maybeNexmon(to);
        }
    }

    function mintDrop(address to, uint256 id) external onlyRole(MINTER_ROLE) {
        Species storage s = species[id];
        if (!s.exists || s.pool != POOL_EVENT) revert UnknownSpecies();
        if (balanceOf(to, id) > 0) revert AlreadyHasDrop();
        if (s.minted >= s.maxSupply) revert SoldOut();
        s.minted++;
        _mint(to, id, 1, "");
        emit DropMinted(to, id);
    }

    function uri(uint256 id) public view override returns (string memory) {
        return string.concat(_baseUri, id.toString());
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values) internal override {
        if (from != address(0) && to != address(0)) {
            for (uint256 i; i < ids.length; i++) {
                if (!species[ids[i]].transferable) revert Soulbound();
            }
        }
        super._update(from, to, ids, values);
    }

    function _maybeNexmon(address to) private {
        Species storage n = species[NEXMON_ID];
        if (!n.exists || n.minted >= n.maxSupply || balanceOf(to, NEXMON_ID) > 0) return;
        n.minted++;
        _mint(to, NEXMON_ID, 1, "");
        emit NexmonUnlocked(to);
    }

    /// Weighted by remaining supply. Returns STARTER_ID (never a pool member) when the pool is sold out.
    function _pick(uint8 pool, address to) private returns (uint256) {
        uint256[] storage ids = _pools[pool];
        uint256 total;
        for (uint256 i; i < ids.length; i++) {
            Species storage s = species[ids[i]];
            total += s.maxSupply - s.minted;
        }
        if (total == 0) return STARTER_ID;

        uint256 r = _random(to) % total;
        for (uint256 i; i < ids.length; i++) {
            Species storage s = species[ids[i]];
            uint256 left = s.maxSupply - s.minted;
            if (r < left) return ids[i];
            r -= left;
        }
        return STARTER_ID;
    }

    /// ponytail: prevrandao + nonce while the server minter picks the timing; swap for Pyth Entropy when hatches must be trustless.
    function _random(address to) private returns (uint256) {
        return uint256(keccak256(abi.encode(block.prevrandao, to, _nonce++)));
    }
}
