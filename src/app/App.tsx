import { AppRouter } from '@/app/router'
import { useBootstrapData } from '@/app/useBootstrapData'

export default function App() {
  useBootstrapData()

  return <AppRouter />
}
