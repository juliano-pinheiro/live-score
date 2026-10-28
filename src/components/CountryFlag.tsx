import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

const COUNTRY_CODE_MAP: Record<string, string> = {
  alemanha: 'de',
  germany: 'de',
  'arabia saudita': 'sa',
  'saudi arabia': 'sa',
  saudi: 'sa',
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
  chipre: 'cy',
  cyprus: 'cy',
  colombia: 'co',
  'coreia do sul': 'kr',
  'south korea': 'kr',
  korea: 'kr',
  'costa rica': 'cr',
  croacia: 'hr',
  croatia: 'hr',
  dinamarca: 'dk',
  denmark: 'dk',
  egito: 'eg',
  egypt: 'eg',
  'el salvador': 'sv',
  'emirados arabes unidos': 'ae',
  uae: 'ae',
  equador: 'ec',
  ecuador: 'ec',
  escocia: 'gb-sct',
  scotland: 'gb-sct',
  espanha: 'es',
  spain: 'es',
  'estados unidos': 'us',
  usa: 'us',
  eua: 'us',
  'united states': 'us',
  europa: 'eu',
  europe: 'eu',
  franca: 'fr',
  france: 'fr',
  grecia: 'gr',
  greece: 'gr',
  guatemala: 'gt',
  holanda: 'nl',
  'paises baixos': 'nl',
  netherlands: 'nl',
  honduras: 'hn',
  hungria: 'hu',
  hungary: 'hu',
  india: 'in',
  inglaterra: 'gb-eng',
  england: 'gb-eng',
  irlanda: 'ie',
  ireland: 'ie',
  'irlanda do norte': 'gb-nir',
  'northern ireland': 'gb-nir',
  italia: 'it',
  italy: 'it',
  jamaica: 'jm',
  japao: 'jp',
  japan: 'jp',
  marrocos: 'ma',
  morocco: 'ma',
  mexico: 'mx',
  noruega: 'no',
  norway: 'no',
  'pais de gales': 'gb-wls',
  wales: 'gb-wls',
  panama: 'pa',
  paraguai: 'py',
  paraguay: 'py',
  peru: 'pe',
  polonia: 'pl',
  poland: 'pl',
  portugal: 'pt',
  catar: 'qa',
  qatar: 'qa',
  'republica tcheca': 'cz',
  'czech republic': 'cz',
  czechia: 'cz',
  romenia: 'ro',
  romania: 'ro',
  russia: 'ru',
  servia: 'rs',
  serbia: 'rs',
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

const FAILED_FLAGS = new Set<string>();

export const CountryFlag = React.memo<CountryFlagProps>(({
  country,
  size = 19,
  style,
}) => {
  const [hasError, setHasError] = useState(false);

  const countryStr = typeof country === 'string' ? country : (country ? String(country) : '');

  if (!countryStr || countryStr === 'ALL' || countryStr === 'Todas as ligas') {
    return <Text style={[styles.emoji, { fontSize: Math.max(12, size * 0.7) }]}>🏆</Text>;
  }

  const normalized = countryStr
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

  if (normalized === 'asia' || normalized === 'oceania') {
    return <Text style={[styles.emoji, { fontSize: Math.max(12, size * 0.7) }]}>🌏</Text>;
  }

  if (
    normalized === 'america do sul' ||
    normalized === 'america do norte' ||
    normalized === 'america do norte e central' ||
    normalized === 'americas' ||
    normalized === 'south america'
  ) {
    return <Text style={[styles.emoji, { fontSize: Math.max(12, size * 0.7) }]}>🌎</Text>;
  }

  const code = COUNTRY_CODE_MAP[normalized];

  if (code && !hasError && !FAILED_FLAGS.has(code)) {
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
          fadeDuration={0}
          onError={() => {
            FAILED_FLAGS.add(code);
            setHasError(true);
          }}
        />
      </View>
    );
  }

  return (
    <Text style={[styles.fallbackAcronym, { fontSize: Math.max(9, size * 0.45) }]}>
      {countryStr.slice(0, 2).toUpperCase()}
    </Text>
  );
});

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

