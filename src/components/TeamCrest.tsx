import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface TeamCrestProps {
  logoUrl?: string;
  shortName: string;
  color: string;
  size: number;
}

export const TeamCrest = React.memo<TeamCrestProps>(({
  logoUrl,
  shortName,
  color,
  size,
}) => {
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    setHasLoadError(false);
  }, [logoUrl]);

  if (logoUrl && !hasLoadError) {
    return (
      <Image
        accessibilityLabel={`Escudo do ${shortName}`}
        onError={() => setHasLoadError(true)}
        fadeDuration={0}
        resizeMode="contain"
        source={{ uri: logoUrl }}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      ]}
    >
      <Text style={[styles.fallbackText, { fontSize: Math.max(8, size * 0.32) }]}>
        {shortName.slice(0, 3)}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});
