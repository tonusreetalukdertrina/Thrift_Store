import Link from 'next/link'

interface Product {
  product_id:       string
  title:            string
  price:            string | number
  condition:        string
  images:           string[]
  location?:        string
  seller_avg_rating?: number | null
  seller?:          { name: string }
  status?:          string
}

const API_BASE = 'http://127.0.0.1:8000'

const CONDITION_ICONS: Record<string, string> = {
  'New':      '★',
  'Like New': '◉',
  'Good':     '◎',
  'Fair':     '○',
}

function getImageUrl(image: string): string {
  if (!image) return ''
  if (image.startsWith('http')) return image
  if (image.startsWith('/storage')) return `${API_BASE}${image}`
  return ''
}

export default function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0] || ''
  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price
  const condIcon = CONDITION_ICONS[product.condition] || '○'

  return (
    <Link
      href={`/products/${product.product_id}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <article
        className="card"
        style={{
          overflow:   'hidden',
          transition: 'box-shadow var(--transition), transform var(--transition)',
          cursor:     'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-md)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {/* Image */}
        <div style={{
          width:    '100%',
          height:   180,
          background:'var(--bg-card-alt)',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {image ? (
            <img
              src={getImageUrl(image)}
              alt={product.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              loading="lazy"
            />
          ) : (
            <div style={{
              width:          '100%',
              height:         '100%',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              color:          'var(--text-muted)',
              fontSize:       32,
            }} aria-hidden="true">
              ◻
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '12px 14px 14px' }}>
          <p style={{
            fontSize:     13,
            fontWeight:   500,
            color:        'var(--text-primary)',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
            marginBottom: 4,
          }}>
            {product.title}
          </p>
          <p style={{
            fontSize:     16,
            fontWeight:   700,
            color:        'var(--brand)',
            letterSpacing:'-0.02em',
          }}>
            ${isNaN(price) ? '0.00' : price.toFixed(2)}
          </p>

          <div style={{
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop:  8,
          }}>
            <span style={{
              fontSize:      11,
              color:         'var(--text-muted)',
              display:       'flex',
              alignItems:    'center',
              gap:           3,
            }}>
              <span aria-hidden="true">{condIcon}</span>
              <span>{product.condition}</span>
            </span>
            {product.seller_avg_rating && (
              <span style={{
                fontSize:   11,
                color:      'var(--text-secondary)',
                display:    'flex',
                alignItems: 'center',
                gap:        2,
              }} aria-label={`${product.seller_avg_rating} star rating`}>
                <span aria-hidden="true">★</span>
                {product.seller_avg_rating}
              </span>
            )}
          </div>

          {product.location && (
            <p style={{
              fontSize:     11,
              color:        'var(--text-muted)',
              marginTop:    4,
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:   'nowrap',
              display:      'flex',
              alignItems:   'center',
              gap:          3,
            }}>
              <span aria-hidden="true">◎</span> {product.location}
            </p>
          )}
        </div>
      </article>
    </Link>
  )
}