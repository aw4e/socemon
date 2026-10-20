export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between h-16">
      <h1 className="font-display text-[22px] font-medium tracking-[-0.02em] text-text-primary">{title}</h1>
      {children}
    </header>
  )
}
