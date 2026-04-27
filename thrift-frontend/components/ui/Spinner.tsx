export default function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 16 : size === 'lg' ? 32 : 20
  return (
    <div
      className="spinner"
      style={{ width: s, height: s }}
      role="status"
      aria-label="Loading"
    />
  )
}