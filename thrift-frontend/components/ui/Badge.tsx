interface BadgeProps {
  status: string
  type?: 'status' | 'order' | 'payment'
}

const STATUS_CONFIG: Record<string, { label: string; icon: string; cls: string }> = {
  draft:      { label: 'Draft',      icon: '○', cls: 'badge-draft'    },
  active:     { label: 'Active',     icon: '●', cls: 'badge-active'   },
  sold:       { label: 'Sold',       icon: '✓', cls: 'badge-sold'     },
  archived:   { label: 'Archived',   icon: '◻', cls: 'badge-archived' },
  pending:    { label: 'Pending',    icon: '◔', cls: 'badge-warning'  },
  confirmed:  { label: 'Confirmed',  icon: '◑', cls: 'badge-info'     },
  completed:  { label: 'Completed',  icon: '✓', cls: 'badge-success'  },
  cancelled:  { label: 'Cancelled',  icon: '✗', cls: 'badge-danger'   },
  paid:       { label: 'Paid',       icon: '✓', cls: 'badge-success'  },
  failed:     { label: 'Failed',     icon: '✗', cls: 'badge-danger'   },
}

export default function Badge({ status }: BadgeProps) {
  const config = STATUS_CONFIG[status?.toLowerCase()] || {
    label: status,
    icon: '·',
    cls: 'badge-neutral',
  }
  return (
    <span className={`badge ${config.cls}`} aria-label={config.label}>
      <span aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  )
}