'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  sectionName?: string
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error(`[ErrorBoundary:${this.props.sectionName ?? 'unknown'}]`, error.message)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-gray-200 rounded-xl">
          <p className="text-sm text-gray-500 mb-3">
            Cette section est temporairement indisponible.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-sm text-green-600 hover:text-green-700 font-medium hover:underline"
          >
            Réessayer
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
