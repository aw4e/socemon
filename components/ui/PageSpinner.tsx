export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-svh" role="status" aria-label="Loading">
      <div className="w-6 h-6 rounded-full border-[1.5px] border-text-tertiary border-t-text-primary animate-spin" />
    </div>
  )
}
