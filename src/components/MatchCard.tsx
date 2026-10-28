import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { TeamCrest } from './TeamCrest';
import { Match } from '../types/match';

const FONT_SANS = Platform.select({ web: 'Plus Jakarta Sans', default: undefined });
const FONT_DISPLAY = Platform.select({ web: 'Outfit', default: undefined });
const FONT_SCORE = Platform.select({
  web: "'Chivo Mono', 'DM Mono', monospace, -apple-system, sans-serif",
  android: 'monospace',
  ios: 'Menlo',
  default: undefined,
});

interface MatchCardProps {
  match: Match;
  isSelected?: boolean;
  isDarkMode?: boolean;
  onPress: (match: Match) => void;
  onTogglePin: (matchId: string) => void;
}

const MatchCardComponent: React.FC<MatchCardProps> = ({
  match,
  isSelected = false,
  isDarkMode = false,
  onPress,
  onTogglePin,
}) => {
  const alertOpacity = useRef(new Animated.Value(0)).current;
  const goalPulseOpacity = useRef(new Animated.Value(0)).current;
  const pinScale = useRef(new Animated.Value(1)).current;
  const pinHaloScale = useRef(new Animated.Value(0.8)).current;
  const pinHaloOpacity = useRef(new Animated.Value(0)).current;
  const previousPinned = useRef(Boolean(match.isPinned));
  const homeScoreScale = useRef(new Animated.Value(1)).current;
  const awayScoreScale = useRef(new Animated.Value(1)).current;
  const homeScoreHighlight = useRef(new Animated.Value(0)).current;
  const awayScoreHighlight = useRef(new Animated.Value(0)).current;
  const previousScores = useRef({
    matchId: match.id,
    home: match.homeTeam.score,
    away: match.awayTeam.score,
  });
  const [visibleAlertId, setVisibleAlertId] = useState<string | null>(null);
  const [animatingHome, setAnimatingHome] = useState(false);
  const [animatingAway, setAnimatingAway] = useState(false);
  const homeRedCards = match.homeTeam.redCards ?? 0;
  const awayRedCards = match.awayTeam.redCards ?? 0;
  const isLive = match.status === '1H' || match.status === '2H' || match.status === 'HT';
  const isFinished = match.status === 'FT';
  const hasStarted = isLive || isFinished;
  const isHomeWinner = isFinished && match.homeTeam.score > match.awayTeam.score;
  const isAwayWinner = isFinished && match.awayTeam.score > match.homeTeam.score;
  const alertTeam =
    match.recentAlert?.team ??
    (match.recentAlert?.type === 'GOAL' ? match.recentGoalTeam : undefined) ??
    'HOME';
  const alertLabel = match.recentAlert?.type === 'VAR' ? 'VAR' : '⚽ GOL!';
  const statusLabel =
    match.status === 'HT'
      ? 'INT'
      : match.status === 'FT'
      ? 'FIM'
      : match.status === 'NS'
      ? ''
      : `${match.minuteLabel ?? match.minute ?? ''}'`;

  useEffect(() => {
    if (previousScores.current.matchId !== match.id) {
      previousScores.current = {
        matchId: match.id,
        home: match.homeTeam.score,
        away: match.awayTeam.score,
      };
      setAnimatingHome(false);
      setAnimatingAway(false);
      homeScoreHighlight.setValue(0);
      awayScoreHighlight.setValue(0);
      homeScoreScale.setValue(1);
      awayScoreScale.setValue(1);
      return;
    }

    if (!hasStarted) {
      previousScores.current = {
        matchId: match.id,
        home: match.homeTeam.score,
        away: match.awayTeam.score,
      };
      return;
    }
    const { home, away } = previousScores.current;
    if (isLive && match.homeTeam.score > home) {
      setAnimatingHome(true);
      Animated.parallel([
        Animated.sequence([
          Animated.timing(homeScoreScale, {
            toValue: 1.35,
            duration: 170,
            useNativeDriver: true,
          }),
          Animated.spring(homeScoreScale, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(homeScoreHighlight, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.delay(1200),
          Animated.timing(homeScoreHighlight, {
            toValue: 0,
            duration: 450,
            useNativeDriver: false,
          }),
        ]),
      ]).start(() => {
        setAnimatingHome(false);
        homeScoreHighlight.setValue(0);
        homeScoreScale.setValue(1);
      });
    }
    if (isLive && match.awayTeam.score > away) {
      setAnimatingAway(true);
      Animated.parallel([
        Animated.sequence([
          Animated.timing(awayScoreScale, {
            toValue: 1.35,
            duration: 170,
            useNativeDriver: true,
          }),
          Animated.spring(awayScoreScale, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(awayScoreHighlight, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.delay(1200),
          Animated.timing(awayScoreHighlight, {
            toValue: 0,
            duration: 450,
            useNativeDriver: false,
          }),
        ]),
      ]).start(() => {
        setAnimatingAway(false);
        awayScoreHighlight.setValue(0);
        awayScoreScale.setValue(1);
      });
    }
    previousScores.current = {
      matchId: match.id,
      home: match.homeTeam.score,
      away: match.awayTeam.score,
    };
  }, [
    match.id,
    hasStarted,
    isLive,
    awayScoreScale,
    awayScoreHighlight,
    homeScoreScale,
    homeScoreHighlight,
    match.awayTeam.score,
    match.homeTeam.score,
  ]);

  useEffect(() => {
    if (match.recentAlert?.type !== 'GOAL') {
      goalPulseOpacity.setValue(0);
      return;
    }

    goalPulseOpacity.setValue(0);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(goalPulseOpacity, {
          toValue: 0.85,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(goalPulseOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      { iterations: 3 }
    );
    animation.start();
    const timeout = setTimeout(() => {
      animation.stop();
      goalPulseOpacity.setValue(0);
    }, 3000);
    return () => {
      clearTimeout(timeout);
      animation.stop();
    };
  }, [goalPulseOpacity, match.recentAlert?.id, match.recentAlert?.type]);

  useEffect(() => {
    const alertId = match.recentAlert?.id;
    if (!alertId) {
      setVisibleAlertId(null);
      alertOpacity.setValue(0);
      return;
    }

    if (match.recentAlert?.type === 'VAR') {
      setVisibleAlertId(alertId);
      alertOpacity.setValue(0.35);
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(alertOpacity, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(alertOpacity, {
            toValue: 0.35,
            duration: 450,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }

    const remainingMs = Math.max(
      0,
      5000 - (Date.now() - (match.recentAlert?.createdAt ?? Date.now()))
    );
    if (remainingMs === 0) {
      setVisibleAlertId(null);
      alertOpacity.setValue(0);
      return;
    }

    setVisibleAlertId(alertId);
    alertOpacity.setValue(0);
    const fadeDuration = Math.min(250, remainingMs / 2);
    const animation = Animated.sequence([
      Animated.timing(alertOpacity, {
        toValue: 1,
        duration: fadeDuration,
        useNativeDriver: true,
      }),
      Animated.delay(remainingMs - fadeDuration * 2),
      Animated.timing(alertOpacity, {
        toValue: 0,
        duration: fadeDuration,
        useNativeDriver: true,
      }),
    ]);
    animation.start(({ finished }) => {
      if (finished) {
        setVisibleAlertId((currentId) => (currentId === alertId ? null : currentId));
      }
    });
    return () => animation.stop();
  }, [
    alertOpacity,
    match.recentAlert?.createdAt,
    match.recentAlert?.id,
    match.recentAlert?.type,
  ]);

  useEffect(() => {
    const isNowPinned = Boolean(match.isPinned);
    if (previousPinned.current === isNowPinned) return;
    previousPinned.current = isNowPinned;

    pinScale.setValue(0.82);
    Animated.spring(pinScale, {
      toValue: 1,
      friction: 4,
      tension: 120,
      useNativeDriver: true,
    }).start();

    if (isNowPinned) {
      pinHaloScale.setValue(0.75);
      pinHaloOpacity.setValue(0.75);
      Animated.parallel([
        Animated.timing(pinHaloScale, {
          toValue: 1.55,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.timing(pinHaloOpacity, {
          toValue: 0,
          duration: 380,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [match.isPinned, pinHaloOpacity, pinHaloScale, pinScale]);

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={() => onPress(match)}
      style={[
        styles.card,
        isDarkMode && styles.cardDark,
        isLive && (isDarkMode ? styles.cardLiveDark : styles.cardLive),
        match.isPinned && styles.cardPinned,
        isSelected && (isDarkMode ? styles.cardSelectedDark : styles.cardSelected),
      ]}
    >
      <View style={styles.statusColumn}>
        <Text style={[styles.startTimeText, isDarkMode && styles.startTimeTextDark]}>
          {match.startTime}
        </Text>
        {statusLabel ? (
          <View style={styles.statusLine}>
            {isLive && (
              <View
                style={[
                  styles.liveDot,
                  match.status === 'HT' && styles.liveDotHalftime,
                ]}
              />
            )}
            <Text
              style={[
                styles.statusText,
                isDarkMode && styles.statusTextDark,
                match.status === 'HT'
                  ? styles.statusTextHalftime
                  : isLive && styles.statusTextLive,
              ]}
            >
              {statusLabel}
            </Text>
          </View>
        ) : (
          <View style={styles.statusLine}>
            <Text style={[styles.statusTextScheduled, isDarkMode && styles.statusTextScheduledDark]}>
              AGD
            </Text>
          </View>
        )}
      </View>

      <View style={styles.teamsColumn}>
        <View style={styles.teamRow}>
          <View style={styles.teamIdentity}>
            <TeamCrest
              logoUrl={match.homeTeam.logoUrl}
              shortName={match.homeTeam.shortName}
              color={match.homeTeam.badgeColor}
              size={16}
            />
            <Text
              style={[
                styles.teamName,
                isDarkMode && styles.teamNameDark,
                isFinished && isHomeWinner && (isDarkMode ? styles.teamNameWinnerDark : styles.teamNameWinner),
                isFinished && isAwayWinner && (isDarkMode ? styles.teamNameLoserDark : styles.teamNameLoser),
              ]}
              numberOfLines={1}
            >
              {match.homeTeam.name}
            </Text>
            {homeRedCards > 0 && (
              <View style={styles.redCard}>
                {homeRedCards > 1 && <Text style={styles.redCardCount}>{homeRedCards}</Text>}
              </View>
            )}
          </View>
          {match.recentAlert &&
            alertTeam === 'HOME' &&
            visibleAlertId === match.recentAlert.id && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.goalAlertBadge,
                  match.recentAlert.type === 'VAR' && styles.varAlertBadge,
                  { opacity: alertOpacity },
                ]}
              >
                <Text
                  style={[
                    styles.goalAlertText,
                    match.recentAlert.type === 'VAR' && styles.varAlertText,
                  ]}
                >
                  {alertLabel}
                </Text>
              </Animated.View>
            )}
          <Animated.Text
            style={[
              styles.score,
              isDarkMode && styles.scoreDark,
              isLive && styles.scoreLive,
              isFinished &&
                (isHomeWinner
                  ? (isDarkMode ? styles.scoreWinnerDark : styles.scoreWinner)
                  : isAwayWinner
                  ? (isDarkMode ? styles.scoreLoserDark : styles.scoreLoser)
                  : null),
              animatingHome
                ? {
                    transform: [{ scale: homeScoreScale }],
                    color: homeScoreHighlight.interpolate({
                      inputRange: [0, 1],
                      outputRange: [isLive ? '#EF4444' : isDarkMode ? '#F9FAFB' : '#0F172A', '#16A34A'],
                    }),
                  }
                : null,
            ]}
          >
            {hasStarted ? match.homeTeam.score : ''}
          </Animated.Text>
        </View>
        <View style={styles.teamRow}>
          <View style={styles.teamIdentity}>
            <TeamCrest
              logoUrl={match.awayTeam.logoUrl}
              shortName={match.awayTeam.shortName}
              color={match.awayTeam.badgeColor}
              size={16}
            />
            <Text
              style={[
                styles.teamName,
                isDarkMode && styles.teamNameDark,
                isFinished && isAwayWinner && (isDarkMode ? styles.teamNameWinnerDark : styles.teamNameWinner),
                isFinished && isHomeWinner && (isDarkMode ? styles.teamNameLoserDark : styles.teamNameLoser),
              ]}
              numberOfLines={1}
            >
              {match.awayTeam.name}
            </Text>
            {awayRedCards > 0 && (
              <View style={styles.redCard}>
                {awayRedCards > 1 && <Text style={styles.redCardCount}>{awayRedCards}</Text>}
              </View>
            )}
          </View>
          {match.recentAlert &&
            alertTeam === 'AWAY' &&
            visibleAlertId === match.recentAlert.id && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.goalAlertBadge,
                  match.recentAlert.type === 'VAR' && styles.varAlertBadge,
                  { opacity: alertOpacity },
                ]}
              >
                <Text
                  style={[
                    styles.goalAlertText,
                    match.recentAlert.type === 'VAR' && styles.varAlertText,
                  ]}
                >
                  {alertLabel}
                </Text>
              </Animated.View>
            )}
          <Animated.Text
            style={[
              styles.score,
              isDarkMode && styles.scoreDark,
              isLive && styles.scoreLive,
              isFinished &&
                (isAwayWinner
                  ? (isDarkMode ? styles.scoreWinnerDark : styles.scoreWinner)
                  : isHomeWinner
                  ? (isDarkMode ? styles.scoreLoserDark : styles.scoreLoser)
                  : null),
              animatingAway
                ? {
                    transform: [{ scale: awayScoreScale }],
                    color: awayScoreHighlight.interpolate({
                      inputRange: [0, 1],
                      outputRange: [isLive ? '#EF4444' : isDarkMode ? '#F9FAFB' : '#0F172A', '#16A34A'],
                    }),
                  }
                : null,
            ]}
          >
            {hasStarted ? match.awayTeam.score : ''}
          </Animated.Text>
        </View>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={
          match.isPinned
            ? 'Remover dos favoritos no topo'
            : 'Favoritar e fixar partida no topo'
        }
        activeOpacity={0.75}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        onPress={() => onTogglePin(match.id)}
        style={styles.pinButtonWrapper}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pinHalo,
            {
              opacity: pinHaloOpacity,
              transform: [{ scale: pinHaloScale }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.pinButton,
            isDarkMode && styles.pinButtonDark,
            match.isPinned && (isDarkMode ? styles.pinButtonActiveDark : styles.pinButtonActive),
            { transform: [{ scale: pinScale }] },
          ]}
        >
          <Text style={[styles.pinIcon, isDarkMode && styles.pinIconDark, match.isPinned && styles.pinIconActive]}>
            {match.isPinned ? '★' : '☆'}
          </Text>
        </Animated.View>
      </TouchableOpacity>
      {match.recentAlert?.type === 'GOAL' && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.goalPulseOverlay,
            { opacity: goalPulseOpacity },
          ]}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  goalPulseOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderRadius: 10,
  },
  cardLive: {
    backgroundColor: '#FFFDFD',
    borderLeftColor: '#EF4444',
  },
  cardPinned: {
    borderLeftColor: '#00FF66',
  },
  cardSelected: {
    backgroundColor: '#F0F9FF',
    borderLeftColor: '#00E5FF',
  },
  statusColumn: {
    width: 48,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    gap: 3,
  },
  startTimeText: {
    color: '#475569',
    fontFamily: FONT_DISPLAY,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
    fontVariant: ['tabular-nums'],
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 3,
  },
  liveDotHalftime: {
    backgroundColor: '#D97706',
  },
  statusText: {
    color: '#64748B',
    fontFamily: FONT_DISPLAY,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statusTextLive: {
    color: '#EF4444',
    fontWeight: '800',
  },
  statusTextHalftime: {
    color: '#D97706',
    fontWeight: '800',
  },
  statusTextScheduled: {
    color: '#64748B',
    fontFamily: FONT_DISPLAY,
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: '700',
  },
  teamsColumn: {
    flex: 1,
    gap: 3,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  teamIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamName: {
    color: '#0F172A',
    fontFamily: FONT_SANS,
    flexShrink: 1,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
  },
  teamNameWinner: {
    color: '#000000',
    fontWeight: '700',
  },
  teamNameLoser: {
    color: '#64748B',
    fontWeight: '400',
  },
  score: {
    color: '#0F172A',
    fontFamily: FONT_SCORE,
    minWidth: 20,
    textAlign: 'right',
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.2,
  },
  scoreWinner: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 15,
  },
  scoreLoser: {
    color: '#94A3B8',
    fontWeight: '400',
    opacity: 0.65,
  },
  scoreLive: {
    color: '#EF4444',
    fontWeight: '800',
  },
  redCard: {
    minWidth: 10,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  redCardCount: {
    color: '#FFFFFF',
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '900',
  },
  goalAlertBadge: {
    minWidth: 38,
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: '#E6F5EF',
  },
  goalAlertText: {
    color: '#078B61',
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  varAlertBadge: {
    backgroundColor: '#E8F1FF',
    borderColor: '#9AB9F2',
  },
  varAlertText: {
    color: '#2457A7',
  },
  pinButtonWrapper: {
    position: 'relative',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  pinHalo: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.28)',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  pinButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  pinButtonActive: {
    borderColor: '#FDE68A',
    backgroundColor: '#FEF3C7',
  },
  pinIcon: {
    fontSize: 18,
    lineHeight: 20,
    color: '#94A3B8',
  },
  pinIconActive: {
    color: '#D97706',
  },
  cardDark: {
    backgroundColor: '#111827',
    borderBottomColor: '#1F2937',
  },
  cardLiveDark: {
    backgroundColor: '#16131D',
    borderLeftColor: '#EF4444',
  },
  cardSelectedDark: {
    backgroundColor: '#142038',
    borderLeftColor: '#00E5FF',
  },
  startTimeTextDark: {
    color: '#94A3B8',
  },
  statusTextDark: {
    color: '#94A3B8',
  },
  statusTextScheduledDark: {
    color: '#94A3B8',
  },
  teamNameDark: {
    color: '#F9FAFB',
  },
  teamNameWinnerDark: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  teamNameLoserDark: {
    color: '#6B7280',
    fontWeight: '400',
  },
  scoreDark: {
    color: '#F9FAFB',
  },
  scoreWinnerDark: {
    color: '#00E5FF',
    fontWeight: '700',
  },
  scoreLoserDark: {
    color: '#6B7280',
  },
  pinButtonDark: {
    borderColor: '#374151',
    backgroundColor: '#1F2937',
  },
  pinButtonActiveDark: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  pinIconDark: {
    color: '#9CA3AF',
  },
});

export const MatchCard = React.memo<MatchCardProps>(MatchCardComponent, (prevProps, nextProps) => {
  if (prevProps.isDarkMode !== nextProps.isDarkMode) return false;
  if (prevProps.isSelected !== nextProps.isSelected) return false;
  if (prevProps.match === nextProps.match) return true;
  const prev = prevProps.match;
  const next = nextProps.match;
  return (
    prev.id === next.id &&
    prev.status === next.status &&
    prev.minute === next.minute &&
    prev.minuteLabel === next.minuteLabel &&
    prev.isPinned === next.isPinned &&
    prev.homeTeam.score === next.homeTeam.score &&
    prev.awayTeam.score === next.awayTeam.score &&
    prev.homeTeam.redCards === next.homeTeam.redCards &&
    prev.awayTeam.redCards === next.awayTeam.redCards &&
    prev.recentAlert?.id === next.recentAlert?.id &&
    prev.recentAlert?.type === next.recentAlert?.type &&
    prev.recentGoalTeam === next.recentGoalTeam
  );
});
