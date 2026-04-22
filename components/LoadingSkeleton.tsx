type Props = {
  lines?: number
  className?: string
}

export function SkeletonLine({ width = 'full', height = 4 }: {
  width?: string | number
  height?: number
}) {
  return (
    <div
      className={`rounded-lg animate-pulse w-${width}`}
      style={{
        height: `${height * 4}px`,
        backgroundColor: '#1B1F3B',
      }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div
      className="p-5 rounded-2xl border space-y-3 animate-pulse"
      style={{ backgroundColor: '#1B1F3B', borderColor: '#2D3158' }}>
      <SkeletonLine width="1/3" height={3} />
      <SkeletonLine width="full" height={4} />
      <SkeletonLine width="4/5" height={3} />
    </div>
  )
}

export function SkeletonStat() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg"
            style={{ backgroundColor: '#1B1F3B' }} />
          <div className="w-20 h-4 rounded-lg"
            style={{ backgroundColor: '#1B1F3B' }} />
        </div>
        <div className="w-8 h-4 rounded-lg"
          style={{ backgroundColor: '#1B1F3B' }} />
      </div>
      <div className="w-full h-2 rounded-full"
        style={{ backgroundColor: '#1B1F3B' }} />
    </div>
  )
}

export default function LoadingSkeleton({ lines = 3 }: Props) {
  return (
    <main className="min-h-screen px-6 py-12"
      style={{ backgroundColor: '#0F1117' }}>
      <div className="max-w-md mx-auto space-y-8">
        <div className="space-y-2">
          <SkeletonLine width="1/4" height={3} />
          <SkeletonLine width="1/2" height={6} />
        </div>
        <SkeletonCard />
        <div className="space-y-4">
          {Array.from({ length: lines }).map((_, i) => (
            <SkeletonStat key={i} />
          ))}
        </div>
        <SkeletonCard />
      </div>
    </main>
  )
}