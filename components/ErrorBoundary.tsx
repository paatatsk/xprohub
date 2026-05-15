import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, Radius } from '../constants/theme';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught render error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false }, () => {
      // Navigate to a known-good screen after clearing the error state.
      // This avoids a crash loop if the broken screen remounts with the
      // same bad state. router.replace unmounts the current route tree.
      try {
        router.replace('/(tabs)');
      } catch (navErr) {
        console.error('[ErrorBoundary] Navigation reset failed:', navErr);
      }
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.safe}>
          <View style={styles.container}>
            <Text style={styles.icon}>!</Text>
            <Text style={styles.title}>SOMETHING WENT WRONG</Text>
            <Text style={styles.message}>
              We hit an unexpected issue. Please try again.
            </Text>
            <View style={styles.buttonWrap}>
              <Button label="TRY AGAIN" onPress={this.handleReset} />
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  icon: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.gold,
    marginBottom: Spacing.lg,
    width: 72,
    height: 72,
    lineHeight: 72,
    textAlign: 'center',
    borderWidth: 3,
    borderColor: Colors.gold,
    borderRadius: Radius.full,
  },
  title: {
    color: Colors.gold,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  message: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  buttonWrap: {
    width: '100%',
    maxWidth: 280,
  },
});
