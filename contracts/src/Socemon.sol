// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// Socemon v2: the contract is the whole backend. Profiles, connection requests, Eggs and monsters live here, and only
/// the server relayer (MINTER_ROLE) writes, always on behalf of the user passed as the first argument.
/// ponytail: the relayer is fully trusted; move to EIP-712 user-signed intents when actions must be trustless.
contract Socemon is ERC1155, AccessControl {
    using Strings for uint256;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 public constant STARTER_ID = 0;
    uint256 public constant NEXMON_ID = 19;
    uint8 public constant POOL_WILD = 0;
    uint8 public constant MAX_ROLE = 5;
    uint8 public constant POOL_EVENT = 6;
    uint8 public constant POOL_BONUS = 7;
    /// Wearables: tradeable items that blind boxes drop, worn in one of SLOTS slots on the trainer's avatar.
    uint8 public constant POOL_ITEM = 8;
    uint8 public constant SLOTS = 9;
    /// Every trainer's avatar is its own soulbound token: AVATAR_FLAG | address, so its metadata can show what they wear.
    uint256 public constant AVATAR_FLAG = 1 << 255;
    uint8 private constant ALL_TYPES = 0x3E; // bits 1..5, one per role type
    uint8 private constant REQUESTED = 1;
    uint8 private constant CONNECTED = 2;

    string public constant name = "Socemon";
    string public constant symbol = "SOCE";

    struct Species {
        uint8 pool;
        uint32 maxSupply;
        uint32 minted;
        bool transferable;
        bool exists;
    }

    /// Slots: 0 skin, 1 bottom, 2 top, 3 outer, 4 hair, 5 head, 6 eyewear, 7 hand, 8 back.
    /// `drop` wearables stay out of blind boxes: they are event drops, minted once per trainer by mintDrop.
    struct ItemInit {
        uint256 id;
        uint8 slot;
        uint32 maxSupply;
        bool drop;
    }

    struct SpeciesInit {
        uint256 id;
        uint8 pool;
        uint32 maxSupply;
        bool transferable;
    }

    /// `role` is also the Egg pool the other person gets: 0 Wild, 1 Byte, 2 Blaze, 3 Prism, 4 Gold, 5 Echo.
    struct Profile {
        string name;
        uint8 role;
        uint256 partner;
        bool registered;
    }

    mapping(uint256 => Species) public species;
    mapping(address => uint8) public typeMask;
    /// link[a][b]: 0 none, 1 a requested b, 2 connected (set both ways).
    mapping(address => mapping(address => uint8)) public link;
    /// Event drops are once per trainer, tracked apart from balances because drops are tradeable.
    mapping(address => mapping(uint256 => bool)) public claimedDrop;
    mapping(uint8 => uint256[]) private _pools;
    mapping(address => Profile) private _profiles;
    mapping(address => address[]) private _incoming;
    mapping(address => address[]) private _connections;
    mapping(address => uint16[6]) private _eggs;
    mapping(uint256 => uint8) public slotOf;
    mapping(uint256 => bool) public isWearable;
    mapping(address => uint16) public boxes;
    mapping(address => uint256[9]) private _equipped;
    string private _baseUri;
    uint256 private _nonce;

    event Registered(address indexed user, string name, uint8 role);
    event ConnectRequested(address indexed from, address indexed to);
    event Connected(address indexed a, address indexed b);
    event EggHatched(address indexed to, uint8 pool, uint256 id);
    event DropMinted(address indexed to, uint256 id);
    event NexmonUnlocked(address indexed to);
    event PartnerSet(address indexed user, uint256 id);
    event BoxOpened(address indexed to, uint256 id);
    event Equipped(address indexed user, uint8 slot, uint256 id);

    error AlreadyConnected();
    error AlreadyHasDrop();
    error AlreadyRegistered();
    error AlreadyRequested();
    error InvalidName();
    error InvalidPool();
    error InvalidRole();
    error InvalidSlot();
    error NoBox();
    error InvalidSpecies();
    error NoEgg();
    error NoRequest();
    error NotOwned();
    error NotRegistered();
    error SelfConnect();
    error SoldOut();
    error Soulbound();
    error UnknownSpecies();

    constructor(address admin, string memory baseUri) ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _baseUri = baseUri;
    }

    // ---- admin ----

    function addSpecies(SpeciesInit[] calldata list) external onlyRole(DEFAULT_ADMIN_ROLE) {
        for (uint256 i; i < list.length; i++) {
            SpeciesInit calldata s = list[i];
            if (s.id == STARTER_ID || s.id >= AVATAR_FLAG || species[s.id].exists || s.pool > POOL_BONUS) revert InvalidSpecies();
            species[s.id] = Species(s.pool, s.maxSupply, 0, s.transferable, true);
            if (s.pool < POOL_EVENT) _pools[s.pool].push(s.id);
        }
    }

    function addItems(ItemInit[] calldata list) external onlyRole(DEFAULT_ADMIN_ROLE) {
        for (uint256 i; i < list.length; i++) {
            ItemInit calldata it = list[i];
            if (it.id == STARTER_ID || it.id >= AVATAR_FLAG || species[it.id].exists) revert InvalidSpecies();
            if (it.slot >= SLOTS) revert InvalidSlot();
            species[it.id] = Species(it.drop ? POOL_EVENT : POOL_ITEM, it.maxSupply, 0, true, true);
            slotOf[it.id] = it.slot;
            isWearable[it.id] = true;
            if (!it.drop) _pools[POOL_ITEM].push(it.id);
        }
    }

    function setBaseURI(string calldata baseUri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseUri = baseUri;
    }

    // ---- relayer writes ----

    function register(address user, string calldata displayName, uint8 role) external onlyRole(MINTER_ROLE) {
        Profile storage p = _profiles[user];
        if (p.registered) revert AlreadyRegistered();
        uint256 len = bytes(displayName).length;
        if (len == 0 || len > 24) revert InvalidName();
        if (role > MAX_ROLE) revert InvalidRole();
        p.name = displayName;
        p.role = role;
        p.registered = true;
        _mint(user, STARTER_ID, 1, "");
        _mint(user, avatarOf(user), 1, "");
        emit Registered(user, displayName, role);
    }

    /// Asking someone who already asked you connects you both right away.
    function requestConnect(address from, address to) external onlyRole(MINTER_ROLE) {
        if (from == to) revert SelfConnect();
        if (!_profiles[from].registered || !_profiles[to].registered) revert NotRegistered();
        if (link[from][to] == CONNECTED) revert AlreadyConnected();
        if (link[from][to] == REQUESTED) revert AlreadyRequested();
        if (link[to][from] == REQUESTED) {
            _connect(to, from);
            return;
        }
        link[from][to] = REQUESTED;
        _incoming[to].push(from);
        emit ConnectRequested(from, to);
    }

    function approveConnect(address user, address from) external onlyRole(MINTER_ROLE) {
        if (link[from][user] != REQUESTED) revert NoRequest();
        _connect(from, user);
    }

    function hatch(address user, uint8 pool) external onlyRole(MINTER_ROLE) returns (uint256 id) {
        if (pool > MAX_ROLE) revert InvalidPool();
        if (_eggs[user][pool] == 0) revert NoEgg();
        _eggs[user][pool]--;

        id = _pick(pool, user);
        if (id == STARTER_ID && pool != POOL_WILD) id = _pick(POOL_WILD, user);
        if (id == STARTER_ID) revert SoldOut();

        Species storage s = species[id];
        s.minted++;
        _mint(user, id, 1, "");
        emit EggHatched(user, pool, id);

        if (s.pool != POOL_WILD) {
            uint8 mask = typeMask[user] | (uint8(1) << s.pool);
            typeMask[user] = mask;
            if (mask == ALL_TYPES) _maybeNexmon(user);
        }
    }

    function mintDrop(address user, uint256 id) external onlyRole(MINTER_ROLE) {
        if (!_profiles[user].registered) revert NotRegistered();
        Species storage s = species[id];
        if (!s.exists || s.pool != POOL_EVENT) revert UnknownSpecies();
        if (claimedDrop[user][id]) revert AlreadyHasDrop();
        if (s.minted >= s.maxSupply) revert SoldOut();
        claimedDrop[user][id] = true;
        s.minted++;
        _mint(user, id, 1, "");
        emit DropMinted(user, id);
    }

    function openBox(address user) external onlyRole(MINTER_ROLE) returns (uint256 id) {
        if (boxes[user] == 0) revert NoBox();
        boxes[user]--;
        id = _pick(POOL_ITEM, user);
        if (id == STARTER_ID) revert SoldOut();
        species[id].minted++;
        _mint(user, id, 1, "");
        emit BoxOpened(user, id);
    }

    /// `id` 0 takes off whatever is in `slot`.
    function equip(address user, uint8 slot, uint256 id) external onlyRole(MINTER_ROLE) {
        if (slot >= SLOTS) revert InvalidSlot();
        if (id != 0) {
            if (!isWearable[id] || slotOf[id] != slot) revert InvalidSlot();
            if (balanceOf(user, id) == 0) revert NotOwned();
        }
        _equipped[user][slot] = id;
        emit Equipped(user, slot, id);
    }

    /// The partner is the monster that walks next to the avatar as its pet.
    function setPartner(address user, uint256 id) external onlyRole(MINTER_ROLE) {
        if (isWearable[id] || id >= AVATAR_FLAG) revert InvalidSpecies();
        if (balanceOf(user, id) == 0) revert NotOwned();
        _profiles[user].partner = id;
        emit PartnerSet(user, id);
    }

    // ---- views ----

    function profileOf(address user) external view returns (Profile memory) {
        return _profiles[user];
    }

    function eggsOf(address user) external view returns (uint16[6] memory) {
        return _eggs[user];
    }

    function connectionsOf(address user) external view returns (address[] memory) {
        return _connections[user];
    }

    /// Requests still waiting for `user` to approve.
    function pendingOf(address user) external view returns (address[] memory out) {
        address[] storage all = _incoming[user];
        uint256 n;
        for (uint256 i; i < all.length; i++) {
            if (link[all[i]][user] == REQUESTED) n++;
        }
        out = new address[](n);
        n = 0;
        for (uint256 i; i < all.length; i++) {
            if (link[all[i]][user] == REQUESTED) out[n++] = all[i];
        }
    }

    function equippedOf(address user) external view returns (uint256[9] memory) {
        return _equipped[user];
    }

    function avatarOf(address user) public pure returns (uint256) {
        return AVATAR_FLAG | uint160(user);
    }

    function poolSpecies(uint8 pool) external view returns (uint256[] memory) {
        return _pools[pool];
    }

    function uri(uint256 id) public view override returns (string memory) {
        return string.concat(_baseUri, id.toString());
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // ---- internals ----

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values) internal override {
        if (from != address(0) && to != address(0)) {
            for (uint256 i; i < ids.length; i++) {
                if (!species[ids[i]].transferable) revert Soulbound();
            }
        }
        super._update(from, to, ids, values);
        // A sold or given-away wearable comes off the seller's avatar.
        if (from == address(0)) return;
        for (uint256 i; i < ids.length; i++) {
            uint256 id = ids[i];
            if (!isWearable[id] || balanceOf(from, id) > 0) continue;
            uint8 slot = slotOf[id];
            if (_equipped[from][slot] == id) {
                delete _equipped[from][slot];
                emit Equipped(from, slot, 0);
            }
        }
    }

    /// Each side gets an Egg of the other side's role.
    function _connect(address a, address b) private {
        link[a][b] = CONNECTED;
        link[b][a] = CONNECTED;
        _connections[a].push(b);
        _connections[b].push(a);
        _eggs[a][_profiles[b].role]++;
        _eggs[b][_profiles[a].role]++;
        boxes[a]++;
        boxes[b]++;
        emit Connected(a, b);
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

    /// ponytail: prevrandao + nonce while the relayer picks the timing; swap for Pyth Entropy when hatches must be trustless.
    function _random(address to) private returns (uint256) {
        return uint256(keccak256(abi.encode(block.prevrandao, to, _nonce++)));
    }
}
