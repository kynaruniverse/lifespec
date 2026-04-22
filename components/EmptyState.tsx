type Props = {
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  icon?: string
}

export default function EmptyState({ title, description, action, icon }: Props) {
  return (
    <div
      className="p-8 rounded-2xl border border-dashed text-center space-y-3"
      style={{ borderColor: '#2D3158' }}>
      {icon && <p className="text-4xl">{icon}</p>}
      <p className="font-bold" style={{ color: '#F1F5F9' }}>
        {title}
      </p>
      <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
        {description}
      </p>
      {action && (
        action.href ? (
          <a
            href={action.href}
            className="inline-block mt-2 px-6 py-3 rounded-xl font-bold text-sm
              transition-all active:scale-95"
            style={{ backgroundColor: '#7C3AED', color: '#F1F5F9' }}>
            {action.label}
          </a>
        ) : (
          <button
            onClick={action.onClick}
            className="mt-2 px-6 py-3 rounded-xl font-bold text-sm
              transition-all active:scale-95"
            style={{ backgroundColor: '#7C3AED', color: '#F1F5F9' }}>
            {action.label}
          </button>
        )
      )}
    </div>
  )
}