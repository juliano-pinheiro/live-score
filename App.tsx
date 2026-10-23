import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/screens/HomeScreen';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage:
        error instanceof Error ? error.message : 'Erro inesperado na interface.',
    };
  }

  componentDidCatch(error: unknown) {
    console.error('Erro capturado pelo AppErrorBoundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>PULSE SCORE</Text>
          <Text style={styles.errorSubtitle}>
            Ocorreu um erro temporário ao renderizar a tela.
          </Text>
          {Boolean(this.state.errorMessage) && (
            <Text style={styles.errorDetail}>{this.state.errorMessage}</Text>
          )}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => this.setState({ hasError: false, errorMessage: '' })}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Recarregar aplicativo</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const fontLinkId = 'pulsescore-google-fonts';
    if (!document.getElementById(fontLinkId)) {
      const link = document.createElement('link');
      link.id = fontLinkId;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Chivo+Mono:wght@600;700;800&family=DM+Mono:wght@500;600;700&family=Barlow+Semi+Condensed:wght@600;700;800&family=Outfit:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
      document.head.appendChild(link);
    }

    const styleId = 'pulsescore-global-typography';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        html, body, #root, input, button {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          text-rendering: optimizeLegibility;
        }
        /* Crisp pixel rendering and tabular alignment for numbers */
        [class*="r-fontVariant-"], [class*="tabular-nums"] {
          font-variant-numeric: tabular-nums lining-nums !important;
          text-rendering: optimizeLegibility !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <HomeScreen />
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  errorSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorDetail: {
    color: '#FCA5A5',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 18,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
