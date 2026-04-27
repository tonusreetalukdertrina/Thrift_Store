export default function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  const rounded = Math.round(rating)
  return (
    <div
      style={{ display:'flex', alignItems:'center', gap:2 }}
      aria-label={`${rating.toFixed(1)} out of ${max} stars`}
    >
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            fontSize:   14,
            color:      i < rounded ? 'var(--warning)' : 'var(--border-strong)',
            transition: 'color var(--transition)',
          }}
        >
          {i < rounded ? '★' : '☆'}
        </span>
      ))}
      <span style={{ fontSize:12, color:'var(--text-muted)', marginLeft:4, fontVariantNumeric:'tabular-nums' }}>
        {rating.toFixed(1)}
      </span>
    </div>
  )
}