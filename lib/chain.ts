import {
  BaseError, ContractFunctionRevertedError, createPublicClient, createWalletClient, http, parseEventLogs,
  type ContractFunctionArgs, type ContractFunctionName, type Hex, type Log,
} from 'viem'
import { nonceManager, privateKeyToAccount } from 'viem/accounts'
import { monadTestnet } from 'viem/chains'
import { SOCEMON_ABI, socemonAddress } from '@/lib/abi'

/* Server-side relayer. The minter key only holds MINTER_ROLE; the admin role stays on the deployer. */

const transport = http(process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz')
export const publicClient = createPublicClient({ chain: monadTestnet, transport })

function makeWallet() {
  const key = process.env.MINTER_PRIVATE_KEY
  if (!key) throw new Error('MINTER_PRIVATE_KEY is not set')
  /* ponytail: nonceManager is per server instance; concurrent instances can collide, move to a tx queue if traffic grows */
  return createWalletClient({ account: privateKeyToAccount(key as Hex, { nonceManager }), chain: monadTestnet, transport })
}
let wallet: ReturnType<typeof makeWallet> | null = null

/** Monad bills the gas limit, so the buffer stays small. The flat 25k covers a hatch whose roll lands on a species the
    trainer does not own yet at inclusion (a fresh balance slot, ~18k more) after estimating one they do own. */
export const gasLimit = (estimate: bigint) => estimate + estimate / 10n + 25_000n

type Write = ContractFunctionName<typeof SOCEMON_ABI, 'nonpayable'>

/** Sends one write as the relayer and waits for its receipt. */
export async function relay<F extends Write>(functionName: F, args: ContractFunctionArgs<typeof SOCEMON_ABI, 'nonpayable', F>) {
  const walletClient = (wallet ??= makeWallet())
  /* viem cannot narrow a generic function name; the signature above keeps every call site typed */
  const params = { address: socemonAddress(), abi: SOCEMON_ABI, functionName, args, account: walletClient.account } as never
  const started = Date.now()
  const gas = await publicClient.estimateContractGas(params)
  const receipt = await walletClient.writeContractSync({ ...(params as object), gas: gasLimit(gas) } as never)
  if (receipt.status !== 'success') {
    /* a concurrent request changed state between estimate and inclusion; re-simulating surfaces the revert name */
    await publicClient.simulateContract(params)
    throw new Error(`${functionName} reverted`)
  }
  return { receipt, tx: receipt.transactionHash, ms: Date.now() - started }
}

/** The custom error a Socemon call reverted with, e.g. 'SoldOut', or null for any other failure. */
export function revertName(err: unknown): string | null {
  if (!(err instanceof BaseError)) return null
  const reverted = err.walk((e) => e instanceof ContractFunctionRevertedError)
  return reverted instanceof ContractFunctionRevertedError ? (reverted.data?.errorName ?? null) : null
}

/** Reads the hatched species (and whether Nexmon unlocked) from a hatch receipt. */
export function hatchResult(logs: Log[]): { monsterId: number; nexmon: boolean } {
  const events = parseEventLogs({ abi: SOCEMON_ABI, logs })
  const hatched = events.find((e) => e.eventName === 'EggHatched')
  if (!hatched || hatched.eventName !== 'EggHatched') throw new Error('EggHatched missing from receipt')
  return { monsterId: Number(hatched.args.id), nexmon: events.some((e) => e.eventName === 'NexmonUnlocked') }
}
