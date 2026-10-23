import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

const COUNTRY_CODE_MAP: Record<string, string> = {
  alemanha: 'de',
  germany: 'de',
  'arabia saudita': 'sa',
  'saudi arabia': 'sa',
  argentina: 'ar',
  australia: 'au',
  austria: 'at',
  belgica: 'be',
  belgium: 'be',
  bolivia: 'bo',
  brasil: 'br',
  brazil: 'br',
  canada: 'ca',
  chile: 'cl',
  china: 'cn',
  colombia: 'co',
  'coreia do sul': 'kr',
  'south korea': 'kr',
  croacia: 'hr',
  croatia: 'hr',
  dinamarca: 'dk',
  denmark: 'dk',
  egito: 'eg',
  egypt: 'eg',
  'el salvador': 'sv',
  equador: 'ec',
  ecuador: 'ec',
  escocia: 'gb-sct',
  scotland: 'gb-sct',
  espanha: 'es',
  spain: 'es',
  'estados unidos': 'us',
  usa: 'us',
  'united states': 'us',
  europa: 'eu',
  europe: 'eu',
  franca: 'fr',
  france: 'fr',
  grecia: 'gr',
  greece: 'gr',
  holanda: 'nl',
  'paises baixos': 'nl',
  netherlands: 'nl',
  india: 'in',
  inglaterra: 'gb-eng',
  england: 'gb-eng',
  italia: 'it',
  italy: 'it',
  japao: 'jp',
  japan: 'jp',
  marrocos: 'ma',
  morocco: 'ma',
  mexico: 'mx',
  noruega: 'no',
  norway: 'no',
  'pais de gales': 'gb-wls',
  wales: 'gb-wls',
  paraguai: 'py',
  paraguay: 'py',
  peru: 'pe',
  polonia: 'pl',
  poland: 'pl',
  portugal: 'pt',
  russia: 'ru',
  suecia: 'se',
  sweden: 'se',
  suica: 'ch',
  switzerland: 'ch',
  turquia: 'tr',
  turkey: 'tr',
  ucrania: 'ua',
  ukraine: 'ua',
  uruguai: 'uy',
  uruguay: 'uy',
  venezuela: 've',
  'africa do sul': 'za',
  'south africa': 'za',
};

interface CountryFlagProps {
  country: string;
  size?: number;
  style?: object;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({
  country,
  size = 19,
  style,
}) => {
  const [hasError, setHasError] = useState(false);

  if (!country || country === 'ALL' || country === 'Todas as ligas') {
    return <Text style={[styles.emoji, { fontSize: Math.max(12, size * 0.7) }]}>🏆</Text>;
  }

  const normalized = country
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (
    normalized === 'internacional' ||
    normalized === 'africa' ||
    normalized === 'mundo' ||
    normalized === 'world' ||
    normalized === 'torneio internacional'
  ) {
    return <Text style={[styles.emoji, { fontSize: Math.max(12, size * 0.7) }]}>🌍</Text>;
  }

  const code = COUNTRY_CODE_MAP[normalized];

  if (code && !hasError) {
    const height = Math.round(size * 0.7);
    return (
      <View
        style={[
          styles.flagWrapper,
          { width: size, height, borderRadius: 2 },
          style,
        ]}
      >
        <Image
          source={{ uri: `https://flagcdn.com/w40/${code}.png` }}
          style={{ width: size, height, borderRadius: 2 }}
          resizeMode="cover"
          onError={() => setHasError(true)}
        />
      </View>
    );
  }

  return (
    <Text style={[styles.fallbackAcronym, { fontSize: Math.max(9, size * 0.45) }]}>
      {country.slice(0, 2).toUpperCase()}
    </Text>
  );
};

const styles = StyleSheet.create({
  flagWrapper: {
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    lineHeight: 18,
    textAlign: 'center',
  },
  fallbackAcronym: {
    color: '#475569',
    fontWeight: '700',
    textAlign: 'center',
  },
});

