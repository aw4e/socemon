/* Phone-sized column for the app, trainer profiles and check-in; the landing and the Event Wall use the full width. */
export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return <div className="app-column mx-auto w-full max-w-[448px] min-h-svh bg-bg-base overflow-x-clip">{children}</div>
}
