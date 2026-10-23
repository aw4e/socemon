import { redirect } from 'next/navigation'

/* The Event tab became Explore; old links, installed shortcuts and the check-in flow still land here. */
export default function EventPage() {
  redirect('/app/explore')
}
