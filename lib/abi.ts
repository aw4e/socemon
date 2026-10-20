import { parseAbi, type Address } from 'viem'

/* Shared by the browser (reads) and the server relayer (writes). Mirrors contracts/src/Socemon.sol. */
export const SOCEMON_ABI = parseAbi([
  'function register(address user, string displayName, uint8 role)',
  'function requestConnect(address from, address to)',
  'function approveConnect(address user, address from)',
  'function hatch(address user, uint8 pool) returns (uint256 id)',
  'function mintDrop(address user, uint256 id)',
  'function setPartner(address user, uint256 id)',
  'function profileOf(address user) view returns ((string name, uint8 role, uint256 partner, bool registered))',
  'function eggsOf(address user) view returns (uint16[6])',
  'function pendingOf(address user) view returns (address[])',
  'function connectionsOf(address user) view returns (address[])',
  'function link(address a, address b) view returns (uint8)',
  'function claimedDrop(address user, uint256 id) view returns (bool)',
  'function species(uint256 id) view returns (uint8 pool, uint32 maxSupply, uint32 minted, bool transferable, bool exists)',
  'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
  'event Registered(address indexed user, string name, uint8 role)',
  'event ConnectRequested(address indexed from, address indexed to)',
  'event Connected(address indexed a, address indexed b)',
  'event EggHatched(address indexed to, uint8 pool, uint256 id)',
  'event DropMinted(address indexed to, uint256 id)',
  'event NexmonUnlocked(address indexed to)',
  'event PartnerSet(address indexed user, uint256 id)',
  'error AlreadyConnected()',
  'error AlreadyHasDrop()',
  'error AlreadyRegistered()',
  'error AlreadyRequested()',
  'error InvalidName()',
  'error InvalidPool()',
  'error InvalidRole()',
  'error InvalidSpecies()',
  'error NoEgg()',
  'error NoRequest()',
  'error NotOwned()',
  'error NotRegistered()',
  'error SelfConnect()',
  'error SoldOut()',
  'error Soulbound()',
  'error UnknownSpecies()',
])

export function socemonAddress(): Address {
  const address = process.env.NEXT_PUBLIC_SOCEMON_ADDRESS
  if (!address) throw new Error('NEXT_PUBLIC_SOCEMON_ADDRESS is not set')
  return address as Address
}
