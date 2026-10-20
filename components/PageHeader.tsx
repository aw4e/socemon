export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header className="flex items-end justify-between pt-6 pb-5">
      <h1 className="font-poster text-[40px] uppercase leading-none tracking-[-0.01em] text-text-primary">{title}</h1>
      {children}
    </header>
  )
}
