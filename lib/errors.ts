/* Contract revert names → HTTP status and what the UI shows. Anything unknown is an RPC or chain failure, safe to retry. */
const REVERTS: Record<string, [number, string]> = {
  InvalidName: [400, 'Pick a name between 1 and 24 characters'],
  InvalidRole: [400, 'Pick one of the roles'],
  InvalidPool: [400, 'That Egg type does not exist'],
  SelfConnect: [400, 'That is you'],
  NotRegistered: [403, 'Both trainers need to claim Soci first'],
  NotOwned: [403, 'You have not caught that Socemon yet'],
  AlreadyRegistered: [409, 'You already have Soci'],
  AlreadyConnected: [409, 'You are already connected'],
  AlreadyRequested: [409, 'Request already sent'],
  NoRequest: [409, 'That request is no longer there'],
  NoEgg: [409, 'No Egg of that type left to hatch'],
  AlreadyHasDrop: [409, 'You already caught this event drop'],
  SoldOut: [409, 'Sold out'],
  UnknownSpecies: [409, 'This event has no drop'],
}

export function errorFor(revert: string | null): { status: number; error: string } {
  const hit = revert ? REVERTS[revert] : undefined
  return hit ? { status: hit[0], error: hit[1] } : { status: 502, error: 'Monad is busy, try again' }
}
