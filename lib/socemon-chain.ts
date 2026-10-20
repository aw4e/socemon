import {
  BaseError, ContractFunctionRevertedError, createPublicClient, createWalletClient, http, parseAbi, parseEventLogs,
  type Address, type Hex, type Log, type TransactionReceipt,
} from 'viem'
import { nonceManager, privateKeyToAccount } from 'viem/accounts'
import { monadTestnet } from 'viem/chains'

/* Server-side minter for the Socemon contract. The key only holds MINTER_ROLE; the admin role stays on the deployer. */

export const SOCEMON_ABI = parseAbi([
  'function mintStarter(address to)',
  'function hatchEgg(address to, uint8 pool) returns (uint256 id)',
  'function mintDrop(address to, uint256 id)',
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'event EggHatched(address indexed to, uint8 pool, uint256 id)',
  'event NexmonUnlocked(address indexed to)',
  'error AlreadyHasStarter()',
  'error AlreadyHasDrop()',
  'error InvalidPool()',
  'error SoldOut()',
  'error UnknownSpecies()',
])

function contractAddress(): Address {
  const address = process.env.NEXT_PUBLIC_SOCEMON_ADDRESS
  if (!address) throw new Error('NEXT_PUBLIC_SOCEMON_ADDRESS is not set')
  return address as Address
}

function makeClients() {
  const key = process.env.MINTER_PRIVATE_KEY
  if (!key) throw new Error('MINTER_PRIVATE_KEY is not set')
  const transport = http(process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz')
  /* ponytail: nonceManager is per serverless instance; concurrent instances can collide, move to a tx queue if traffic grows */
  const account = privateKeyToAccount(key as Hex, { nonceManager })
  return {
    publicClient: createPublicClient({ chain: monadTestnet, transport }),
    walletClient: createWalletClient({ account, chain: monadTestnet, transport }),
  }
}

let clients: ReturnType<typeof makeClients> | null = null
const getClients = () => (clients ??= makeClients())

/* Monad bills the gas limit, not the gas used, so the buffer stays small */
const withBuffer = (gas: bigint) => gas + gas / 10n

function confirmed(receipt: TransactionReceipt, what: string) {
  if (receipt.status !== 'success') throw new Error(`${what} reverted`)
  return receipt
}

export async function mintStarter(to: Address) {
  const { publicClient, walletClient } = getClients()
  const params = { address: contractAddress(), abi: SOCEMON_ABI, functionName: 'mintStarter', args: [to], account: walletClient.account } as const
  const gas = withBuffer(await publicClient.estimateContractGas(params))
  return confirmed(await walletClient.writeContractSync({ ...params, gas }), 'mintStarter')
}

export async function hatchEgg(to: Address, pool: number) {
  const { publicClient, walletClient } = getClients()
  const params = { address: contractAddress(), abi: SOCEMON_ABI, functionName: 'hatchEgg', args: [to, pool], account: walletClient.account } as const
  const gas = withBuffer(await publicClient.estimateContractGas(params))
  return confirmed(await walletClient.writeContractSync({ ...params, gas }), 'hatchEgg')
}

export async function mintDrop(to: Address, id: number) {
  const { publicClient, walletClient } = getClients()
  const params = { address: contractAddress(), abi: SOCEMON_ABI, functionName: 'mintDrop', args: [to, BigInt(id)], account: walletClient.account } as const
  const gas = withBuffer(await publicClient.estimateContractGas(params))
  return confirmed(await walletClient.writeContractSync({ ...params, gas }), 'mintDrop')
}

export async function balanceOf(owner: Address, id: number): Promise<bigint> {
  return getClients().publicClient.readContract({
    address: contractAddress(), abi: SOCEMON_ABI, functionName: 'balanceOf', args: [owner, BigInt(id)],
  })
}

/** The custom error a Socemon call reverted with, e.g. 'SoldOut', or null for any other failure. */
export function revertName(err: unknown): string | null {
  if (!(err instanceof BaseError)) return null
  const reverted = err.walk((e) => e instanceof ContractFunctionRevertedError)
  return reverted instanceof ContractFunctionRevertedError ? (reverted.data?.errorName ?? null) : null
}

/** Reads the hatched species (and whether Nexmon unlocked) from a hatchEgg receipt. */
export function hatchResult(logs: Log[]): { id: number; nexmon: boolean } {
  const events = parseEventLogs({ abi: SOCEMON_ABI, logs })
  const hatched = events.find((e) => e.eventName === 'EggHatched')
  if (!hatched || hatched.eventName !== 'EggHatched') throw new Error('EggHatched missing from receipt')
  return { id: Number(hatched.args.id), nexmon: events.some((e) => e.eventName === 'NexmonUnlocked') }
}
