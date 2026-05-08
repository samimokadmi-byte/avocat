import { Component, ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="border border-red-500/20 bg-red-500/5 px-6 py-4 flex flex-col gap-2">
          <p className="text-sm font-medium text-red-400">Une erreur est survenue</p>
          {this.state.message && (
            <p className="text-xs text-red-400/70">{this.state.message}</p>
          )}
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="self-start text-xs text-light/40 hover:text-light underline transition-colors mt-1"
          >
            Réessayer
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
