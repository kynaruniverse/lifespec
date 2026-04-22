import Link from 'next/link'

type Props = {
  title: string
  backHref?: string
  backLabel?: string
  action?: React.ReactNode
}

export default function PageHeader({
  title, backHref, backLabel = '← Back', action
}: Props) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-xs tracking-[0.3em] uppercase"
          style={{ color: '#7C3AED' }}>
          STATOSPHERE
        </p>
        <h1 className="text-2xl font-black" style={{ color: '#F1F5F9' }}>
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {action}
        {backHref && (
          <Link
            href={backHref}
            className="text-sm px-4 py-2 rounded-xl border"
            style={{ borderColor: '#2D3158', color: '#64748B' }}>
            {backLabel}
          </Link>
        )}
      </div>
    </div>
  )
}