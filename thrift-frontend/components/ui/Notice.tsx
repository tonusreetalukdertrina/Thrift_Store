type NoticeType = 'info' | 'warning' | 'success' | 'danger'

const ICONS: Record<NoticeType, string> = {
  info:    'ℹ',
  warning: '⚠',
  success: '✓',
  danger:  '✕',
}

export default function Notice({
  type = 'info',
  children,
}: {
  type?: NoticeType
  children: React.ReactNode
}) {
  return (
    <div className={`notice notice-${type}`} role="alert">
      <span aria-hidden="true" style={{ flexShrink: 0, fontWeight: 700 }}>
        {ICONS[type]}
      </span>
      <span>{children}</span>
    </div>
  )
}