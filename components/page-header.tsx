export function PageHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-6">
      <h1 className="bg-gradient-to-r from-purple-400 to-red-500 bg-clip-text text-4xl font-extrabold tracking-wide text-transparent">
        {title}
      </h1>

      {subtitle && (
        <p className="mt-1 text-sm text-zinc-500">
          {subtitle}
        </p>
      )}
    </div>
  )
}