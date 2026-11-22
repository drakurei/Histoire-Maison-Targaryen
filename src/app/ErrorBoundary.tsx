import { Component } from 'react';
import type { ReactNode } from 'react';

interface ErrorBoundaryProps {
  /** Quand cette valeur change, la garde se relève : une navigation sort de l'écran d'erreur. */
  resetKey: string;
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  failed: boolean;
}

/**
 * Garde d'erreur. React n'offre cette capture qu'aux composants à classe ;
 * c'est la seule classe de l'application.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  // Remise à zéro après le rendu, et non pendant : si la nouvelle vue échoue à son tour,
  // la clé n'a plus changé au rendu suivant et la garde reste levée, sans boucle.
  componentDidUpdate(previous: ErrorBoundaryProps): void {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
