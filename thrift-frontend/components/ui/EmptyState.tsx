import Link from 'next/link'

interface Props {
  icon:    string
  title:   string
  desc?:   string
  action?: { label: string; href: string }
}

export default function EmptyState({ icon, title, desc, action }: Props) {
  return (
    <div style={{
      textAlign: 'center',
      padding:   '64px 24px',
      color:     'var(--text-muted)',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }} aria-hidden="true">{icon}</div>
      <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
        {title}
      </p>
      {desc && <p style={{ fontSize: 13, marginBottom: 20 }}>{desc}</p>}
      {action && (
        <Link href={action.href} className="btn btn-primary btn-sm">
          {action.label}
        </Link>
      )}
    </div>
  )
}