/* A wearable drawn on its own, glowing: what the trainer actually equips, in place of an icon. */
export function ItemGlyph({ id, className = 'h-6 w-auto' }: { id: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/api/avatar/x?item=${id}`} alt="" className={`object-contain [filter:drop-shadow(0_0_8px_rgba(94,200,255,0.55))] ${className}`} />
}
