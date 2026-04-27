import Spinner from './Spinner'

export default function PageLoader() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Spinner size="lg" />
    </div>
  )
}