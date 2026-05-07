import { lazy, Suspense, Component, ReactNode } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import ScrollToTop from './utils/ScrollToTop'

// ── Error boundary — catches lazy chunk load failures (network errors, etc.) ─
class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) {
      return (
        <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-light/40">Impossible de charger cette page.</p>
          <button
            onClick={() => { this.setState({ failed: false }); window.location.reload() }}
            className="text-xs font-medium bg-gold text-dark-bg px-5 py-2.5 hover:bg-gold/90 transition-colors"
          >
            Réessayer
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Landing page sections (loaded eagerly — visible on first paint) ──────────
import Nav from './components/Nav'
import Hero from './components/Hero'
import APropos from './components/APropos'
import System from './components/System'
import Expertises from './components/Expertises'
import Method from './components/Method'
import Results from './components/Results'
import CasEtudes from './components/CasEtudes'
import BlogSection from './components/BlogSection'
import FAQ from './components/FAQ'
import Booking from './components/Booking'
import ChatWidget from './components/ChatWidget'

// ── Heavy routes — loaded only when the user navigates to them ───────────────
// Each lazy() call becomes a separate JS chunk in the build output.
const LoginPage    = lazy(() => import('./pages/LoginPage'))
const SignupPage   = lazy(() => import('./pages/SignupPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AdminPage    = lazy(() => import('./pages/AdminPage'))
const BlogPage     = lazy(() => import('./pages/BlogPage'))

// ── Minimal suspense fallback (avoids layout shift) ──────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gold/30 border-t-gold animate-spin" />
    </div>
  )
}

function LandingPage() {
  return (
    <div className="bg-paper text-ink font-sans">
      <Nav />
      <main>
        <Hero />
        <APropos />
        <System />
        <Method />
        <Results />
        <Expertises />
        <CasEtudes />
        <BlogSection />
        <FAQ />
        <Booking />
      </main>
      <ChatWidget />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <>
      {/* Resets scroll position on every route change (except in-page anchors) */}
      <ScrollToTop />
      <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"        element={<LandingPage />} />
          <Route path="/blog"    element={<BlogPage />} />
          <Route path="/login"   element={<LoginPage />} />
          <Route path="/signup"  element={<SignupPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          {/* Catch-all: redirect unknown hashes to home instead of blank screen */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </>
  )
}
