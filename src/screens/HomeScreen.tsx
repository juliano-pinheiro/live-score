import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AppState,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MatchCard } from '../components/MatchCard';
import { MatchDetailModal } from '../components/MatchDetailModal';
import { CountryFlag } from '../components/CountryFlag';
import { API_CONFIG } from '../config/api';
import { fetchMatchesFromApi } from '../services/matchService';
import { Match } from '../types/match';

type MainTab = 'ALL' | 'FAVORITES' | 'COMPETITIONS';
type StatusFilter = 'ALL' | 'LIVE' | 'FINISHED' | 'UPCOMING';

const WEEKDAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
const WEEKDAYS_SHORT = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];
const MONTHS_SHORT = [
  'jan.',
  'fev.',
  'mar.',
  'abr.',
  'mai.',
  'jun.',
  'jul.',
  'ago.',
  'set.',
  'out.',
  'nov.',
  'dez.',
];
const MONTHS_LONG = [
  'JANEIRO',
  'FEVEREIRO',
  'MARÇO',
  'ABRIL',
  'MAIO',
  'JUNHO',
  'JULHO',
  'AGOSTO',
  'SETEMBRO',
  'OUTUBRO',
  'NOVEMBRO',
  'DEZEMBRO',
];

const FONT_SANS = Platform.select({ web: 'Plus Jakarta Sans', default: undefined });
const FONT_DISPLAY = Platform.select({ web: 'Outfit', default: undefined });

interface MatchGroup {
  id: string;
  leagueName: string;
  leagueCountry: string;
  matches: Match[];
}

const LEAGUE_REPUTATION: Record<string, number> = {
  '700': 1000,
  '740': 990,
  '730': 980,
  '720': 970,
  '710': 960,
  '725': 940,
  '630': 900,
  '745': 890,
  '760': 880,
  '21231': 870,
  '8316': 850,
  '8376': 840,
  '3906': 820,
  '680': 810,
  '660': 800,
  '670': 790,
  '620': 780,
  '20922': 770,
  '2391': 920,
  '18000': 860,
};

function getLeagueReputation(leagueId: string, leagueName: string): number {
  const name = leagueName.toLocaleLowerCase();
  if (
    /champions league|copa libertadores|copa sudamericana|club world cup/.test(
      name
    )
  ) {
    return 1100;
  }
  if (
    /europa league|conference league|afc champions|concacaf champions|caf champions/.test(
      name
    )
  ) {
    return 950;
  }
  if (LEAGUE_REPUTATION[leagueId]) return LEAGUE_REPUTATION[leagueId];
  if (/premier league|laliga|serie a|bundesliga|ligue 1|eredivisie/.test(name)) {
    return 900;
  }
  if (/women|feminino/.test(name)) return 700;
  if (
    /segunda|second|division 2|division two|serie b|ligue 2|2\. bundesliga|championship|nacional b|expansión|ascenso|primera b|primera nacional|league one|league two/.test(
      name
    )
  ) {
    return 500;
  }
  return 600;
}

function getKickoffMinutes(startTime: string): number {
  const time = startTime.match(/^(\d{1,2}):(\d{2})$/);
  if (!time) return Number.MAX_SAFE_INTEGER;
  return Number(time[1]) * 60 + Number(time[2]);
}

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonthDays(date: Date): Date[] {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const leadingDays = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  ).getDate();
  const cellCount = Math.ceil((leadingDays + daysInMonth) / 7) * 7;

  return Array.from({ length: cellCount }, (_, index) => {
    const day = index - leadingDays + 1;
    return new Date(date.getFullYear(), date.getMonth(), day);
  });
}

interface LeagueGroupItemProps {
  group: MatchGroup;
  isCollapsed: boolean;
  selectedMatchId: string | null;
  onToggleCollapse: (groupId: string) => void;
  onSelectMatch: (match: Match) => void;
  onTogglePin: (matchId: string) => void;
}

const LeagueGroupItem = React.memo<LeagueGroupItemProps>(
  ({
    group,
    isCollapsed,
    selectedMatchId,
    onToggleCollapse,
    onSelectMatch,
    onTogglePin,
  }) => {
    const isPinned = group.id.startsWith('pinned-');
    return (
      <View style={[styles.leagueGroup, isPinned && styles.leagueGroupPinned]}>
        <TouchableOpacity
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${isCollapsed ? 'Expandir' : 'Recolher'} ${group.leagueName}`}
          onPress={() => onToggleCollapse(group.id)}
          style={[
            styles.leagueGroupHeader,
            isPinned && styles.leagueGroupHeaderPinned,
            isCollapsed && styles.leagueGroupHeaderCollapsed,
          ]}
        >
          <View style={[styles.leagueBadge, isPinned && styles.leagueBadgePinned]}>
            <CountryFlag country={group.leagueCountry} size={18} />
          </View>
          <View style={styles.leagueGroupTitle}>
            <Text
              style={[
                styles.leagueGroupName,
                isPinned && styles.leagueGroupNamePinned,
              ]}
              numberOfLines={1}
            >
              {group.leagueName}
            </Text>
            <Text
              style={[
                styles.leagueGroupCountry,
                isPinned && styles.leagueGroupCountryPinned,
              ]}
              numberOfLines={1}
            >
              {group.leagueCountry}
            </Text>
          </View>
          <View style={styles.leagueGroupHeaderRight}>
            <View
              style={[
                styles.leagueGroupCountPill,
                isPinned && styles.leagueGroupCountPillPinned,
              ]}
            >
              <Text
                style={[
                  styles.leagueGroupCount,
                  isPinned && styles.leagueGroupCountPinned,
                ]}
              >
                {group.matches.length}
              </Text>
            </View>
            <Text style={styles.leagueCollapseChevron}>
              {isCollapsed ? '▼' : '▲'}
            </Text>
          </View>
        </TouchableOpacity>
        {!isCollapsed &&
          group.matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              isSelected={selectedMatchId === match.id}
              onPress={onSelectMatch}
              onTogglePin={onTogglePin}
            />
          ))}
      </View>
    );
  },
  (prev, next) => {
    if (prev.isCollapsed !== next.isCollapsed) return false;
    if (prev.onToggleCollapse !== next.onToggleCollapse) return false;
    if (prev.onSelectMatch !== next.onSelectMatch) return false;
    if (prev.onTogglePin !== next.onTogglePin) return false;

    const prevHasSelected = prev.group.matches.some((m) => m.id === prev.selectedMatchId);
    const nextHasSelected = next.group.matches.some((m) => m.id === next.selectedMatchId);
    if (prevHasSelected !== nextHasSelected) return false;
    if (prevHasSelected && prev.selectedMatchId !== next.selectedMatchId) return false;

    if (prev.group === next.group) return true;
    if (prev.group.id !== next.group.id) return false;
    if (prev.group.matches.length !== next.group.matches.length) return false;

    if (prev.isCollapsed && next.isCollapsed) return true;

    for (let i = 0; i < prev.group.matches.length; i++) {
      const pm = prev.group.matches[i];
      const nm = next.group.matches[i];
      if (
        pm.id !== nm.id ||
        pm.status !== nm.status ||
        pm.minute !== nm.minute ||
        pm.minuteLabel !== nm.minuteLabel ||
        pm.homeTeam.score !== nm.homeTeam.score ||
        pm.awayTeam.score !== nm.awayTeam.score ||
        pm.homeTeam.redCards !== nm.homeTeam.redCards ||
        pm.awayTeam.redCards !== nm.awayTeam.redCards ||
        pm.isPinned !== nm.isPinned ||
        pm.recentAlert?.id !== nm.recentAlert?.id ||
        pm.recentAlert?.type !== nm.recentAlert?.type ||
        pm.recentGoalTeam !== nm.recentGoalTeam
      ) {
        return false;
      }
    }
    return true;
  }
);

export const HomeScreen: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<MainTab>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [selectedLeague, setSelectedLeague] = useState<string>('ALL');
  const [sortChronologically, setSortChronologically] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Agora');
  const [pinnedTimestamps, setPinnedTimestamps] = useState<Record<string, number>>({});
  const [collapsedLeagues, setCollapsedLeagues] = useState<Set<string>>(new Set());

  const handleSelectMatch = useCallback((selected: Match) => {
    setSelectedMatchId(selected.id);
  }, []);

  const toggleCollapseLeague = useCallback((groupId: string) => {
    setCollapsedLeagues((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);
  const pinnedIdsRef = React.useRef<Set<string>>(new Set());
  const listRef = React.useRef<FlatList<MatchGroup>>(null);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const showSideDetails = width >= 760;
  const showDesktopSidebar = width >= 1120;
  const isViewingToday = getDateKey(selectedDate) === getDateKey(new Date());
  const calendarDays = useMemo(() => getMonthDays(calendarMonth), [calendarMonth]);

  useEffect(() => {
    let isActive = true;
    let isRefreshing = false;
    const refreshMatches = async () => {
      if (isRefreshing) return;
      isRefreshing = true;

      try {
        const apiMatches = await fetchMatchesFromApi(selectedDate, (updates) => {
          if (!isActive || updates.length === 0) return;
          const updatesById = new Map(updates.map((match) => [match.id, match]));
          setMatches((currentMatches) => {
            let hasAnyChange = false;
            const updated = currentMatches.map((currentMatch) => {
              const update = updatesById.get(currentMatch.id);
              if (!update) return currentMatch;
              const resolvedHomeScore = Math.max(currentMatch.homeTeam.score, update.homeTeam.score);
              const resolvedAwayScore = Math.max(currentMatch.awayTeam.score, update.awayTeam.score);
              const isMatchStarted = update.status !== 'NS' && currentMatch.status !== 'NS';
              const homeScored = isMatchStarted && resolvedHomeScore > currentMatch.homeTeam.score;
              const awayScored = isMatchStarted && resolvedAwayScore > currentMatch.awayTeam.score;
              const goalAlert =
                homeScored || awayScored
                  ? {
                      id: `${currentMatch.id}-${resolvedHomeScore}-${resolvedAwayScore}`,
                      type: 'GOAL' as const,
                      team: homeScored ? ('HOME' as const) : ('AWAY' as const),
                      createdAt: Date.now(),
                    }
                  : undefined;

              const isSame =
                currentMatch.status === update.status &&
                currentMatch.minute === update.minute &&
                currentMatch.minuteLabel === update.minuteLabel &&
                currentMatch.homeTeam.score === resolvedHomeScore &&
                currentMatch.awayTeam.score === resolvedAwayScore &&
                currentMatch.homeTeam.redCards === (Math.max(currentMatch.homeTeam.redCards ?? 0, update.homeTeam.redCards ?? 0) || null) &&
                currentMatch.awayTeam.redCards === (Math.max(currentMatch.awayTeam.redCards ?? 0, update.awayTeam.redCards ?? 0) || null) &&
                !goalAlert &&
                !update.recentAlert;

              if (isSame) return currentMatch;
              hasAnyChange = true;

              return {
                ...currentMatch,
                status: update.status,
                minute: update.minute,
                minuteLabel: update.minuteLabel,
                homeTeam: {
                  ...currentMatch.homeTeam,
                  score: resolvedHomeScore,
                  redCards:
                    Math.max(currentMatch.homeTeam.redCards ?? 0, update.homeTeam.redCards ?? 0) || null,
                },
                awayTeam: {
                  ...currentMatch.awayTeam,
                  score: resolvedAwayScore,
                  redCards:
                    Math.max(currentMatch.awayTeam.redCards ?? 0, update.awayTeam.redCards ?? 0) || null,
                },
                recentGoalTeam: homeScored
                  ? 'HOME'
                  : awayScored
                  ? 'AWAY'
                  : currentMatch.recentGoalTeam,
                recentAlert:
                  goalAlert ??
                  update.recentAlert ??
                  (currentMatch.recentAlert?.type === 'VAR'
                    ? undefined
                    : currentMatch.recentAlert),
              };
            });
            return hasAnyChange ? updated : currentMatches;
          });
        });
        if (!isActive) return;
        setMatches((previousMatches) => {
          const previousById = new Map(
            previousMatches.map((match) => [match.id, match])
          );
          const nextMatches = apiMatches.map((match) => {
            const previous = previousById.get(match.id);
            const resolvedHomeScore = Math.max(previous?.homeTeam.score ?? 0, match.homeTeam.score);
            const resolvedAwayScore = Math.max(previous?.awayTeam.score ?? 0, match.awayTeam.score);
            const isMatchStarted = match.status !== 'NS';
            const homeScored =
              isMatchStarted && previous && resolvedHomeScore > previous.homeTeam.score;
            const awayScored =
              isMatchStarted && previous && resolvedAwayScore > previous.awayTeam.score;
            let recentAlert: Match['recentAlert'];
            if (homeScored || awayScored) {
              recentAlert = {
                id: `${match.id}-${resolvedHomeScore}-${resolvedAwayScore}`,
                type: 'GOAL',
                team: homeScored ? 'HOME' : 'AWAY',
                createdAt: Date.now(),
              };
            } else if (match.recentAlert?.type === 'VAR') {
              recentAlert = {
                ...match.recentAlert,
                createdAt:
                  previous?.recentAlert?.id === match.recentAlert.id
                    ? previous.recentAlert.createdAt
                    : Date.now(),
              };
            } else if (
              previous?.recentAlert?.type === 'VAR' &&
              (match.status === '1H' ||
                match.status === '2H' ||
                match.status === 'HT')
            ) {
              recentAlert = previous.recentAlert;
            } else if (
              previous?.recentAlert?.type === 'GOAL' &&
              previous.recentAlert.createdAt &&
              Date.now() - previous.recentAlert.createdAt < 5000
            ) {
              recentAlert = previous.recentAlert;
            }

            return {
              ...match,
              events: previous?.events ?? match.events,
              stats: previous?.stats ?? match.stats,
              additionalStats: previous?.additionalStats ?? match.additionalStats,
              homeTeam: {
                ...match.homeTeam,
                score: resolvedHomeScore,
                redCards:
                  Math.max(previous?.homeTeam.redCards ?? 0, match.homeTeam.redCards ?? 0) || null,
              },
              awayTeam: {
                ...match.awayTeam,
                score: resolvedAwayScore,
                redCards:
                  Math.max(previous?.awayTeam.redCards ?? 0, match.awayTeam.redCards ?? 0) || null,
              },
              recentAlert,
              recentGoalTeam: homeScored
                ? 'HOME'
                : awayScored
                ? 'AWAY'
                : previous?.recentGoalTeam,
              isPinned:
                pinnedIdsRef.current.has(match.id) ||
                (previous?.isPinned ?? false),
            };
          });

          if (previousMatches.length === 0 || previousMatches.length !== nextMatches.length) {
            return nextMatches;
          }

          let hasDiff = false;
          for (let i = 0; i < nextMatches.length; i++) {
            const pm = previousMatches[i];
            const nm = nextMatches[i];
            if (
              !pm ||
              pm.id !== nm.id ||
              pm.status !== nm.status ||
              pm.minute !== nm.minute ||
              pm.minuteLabel !== nm.minuteLabel ||
              pm.homeTeam.score !== nm.homeTeam.score ||
              pm.awayTeam.score !== nm.awayTeam.score ||
              pm.homeTeam.redCards !== nm.homeTeam.redCards ||
              pm.awayTeam.redCards !== nm.awayTeam.redCards ||
              pm.isPinned !== nm.isPinned ||
              pm.recentAlert?.id !== nm.recentAlert?.id
            ) {
              hasDiff = true;
              break;
            }
          }

          return hasDiff ? nextMatches : previousMatches;
        });
        setApiError(null);
        const now = new Date();
        setLastSyncTime(
          `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
        );
      } catch (error) {
        console.error('Falha ao buscar partidas da API gratuita:', error);
        if (isActive) {
          setApiError(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar os jogos agora.'
          );
        }
      } finally {
        isRefreshing = false;
        if (isActive) setIsLoading(false);
      }
    };

    void refreshMatches();
    const interval = isViewingToday
      ? setInterval(refreshMatches, API_CONFIG.REFRESH_INTERVAL_MS)
      : null;
    const appStateSubscription = isViewingToday
      ? AppState.addEventListener('change', (nextState) => {
          if (nextState === 'active') {
            void refreshMatches();
          }
        })
      : null;

    return () => {
      isActive = false;
      if (interval) clearInterval(interval);
      appStateSubscription?.remove();
    };
  }, [refreshKey, selectedDate, isViewingToday]);

  useEffect(() => {
    if (isCalendarVisible) setCalendarMonth(selectedDate);
  }, [isCalendarVisible, selectedDate]);

  const handleTogglePin = useCallback((matchId: string) => {
    const isCurrentlyPinned = pinnedIdsRef.current.has(matchId);
    if (isCurrentlyPinned) {
      pinnedIdsRef.current.delete(matchId);
      setPinnedTimestamps((prev) => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
    } else {
      pinnedIdsRef.current.add(matchId);
      setPinnedTimestamps((prev) => ({
        ...prev,
        [matchId]: Date.now(),
      }));
    }

    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId ? { ...m, isPinned: !isCurrentlyPinned } : m
      )
    );
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshKey((key) => key + 1);
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setSelectedLeague('ALL');
    setActiveTab('ALL');
    setStatusFilter('ALL');
    setMatches([]);
    setApiError(null);
    setIsLoading(true);
    setIsCalendarVisible(false);
  };

  const handleGoHome = () => {
    setActiveTab('ALL');
    setSelectedLeague('ALL');
    setStatusFilter('ALL');
    setSelectedMatchId(null);
    setIsCalendarVisible(false);
    if (!isViewingToday) {
      handleSelectDate(new Date());
    } else {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const matchesForTab = useMemo(
    () => matches.filter((match) => activeTab !== 'FAVORITES' || match.isPinned),
    [matches, activeTab]
  );

  const statusFilteredMatches = useMemo(
    () =>
      matchesForTab.filter((match) => {
        if (statusFilter === 'LIVE') {
          return match.status === '1H' || match.status === '2H' || match.status === 'HT';
        }
        if (statusFilter === 'FINISHED') return match.status === 'FT';
        if (statusFilter === 'UPCOMING') return match.status === 'NS';
        return true;
      }),
    [matchesForTab, statusFilter]
  );

  const leagues = useMemo(
    () =>
      [
        {
        id: 'ALL',
        name: 'Todas as ligas',
        country: '',
        count: statusFilteredMatches.length,
        },
        ...Array.from(
          statusFilteredMatches.reduce((map, match) => {
            const current = map.get(match.leagueId);
            map.set(match.leagueId, {
              id: match.leagueId,
              name: match.leagueName,
              country: match.leagueCountry,
              count: (current?.count ?? 0) + 1,
            });
            return map;
          }, new Map<string, { id: string; name: string; country: string; count: number }>())
            .values()
        )
          .sort(
            (a, b) =>
              getLeagueReputation(b.id, b.name) -
                getLeagueReputation(a.id, a.name) ||
              a.name.localeCompare(b.name)
          ),
      ],
    [statusFilteredMatches]
  );

  const isMatchLive = (status: Match['status']) =>
    status === '1H' || status === '2H' || status === 'HT';

  const comparePinnedPriority = (a: Match, b: Match) => {
    const aPinned = Number(Boolean(a.isPinned));
    const bPinned = Number(Boolean(b.isPinned));
    if (aPinned !== bPinned) return bPinned - aPinned;
    if (aPinned && bPinned) {
      const aLive = Number(isMatchLive(a.status));
      const bLive = Number(isMatchLive(b.status));
      if (aLive !== bLive) return bLive - aLive;
      const aTime = pinnedTimestamps[a.id] ?? 0;
      const bTime = pinnedTimestamps[b.id] ?? 0;
      if (aTime !== bTime) return bTime - aTime;
    }
    return 0;
  };

  const filteredMatches = useMemo(() => {
    const filtered = statusFilteredMatches.filter(
      (match) => selectedLeague === 'ALL' || match.leagueId === selectedLeague
    );
    return [...filtered].sort((a, b) => {
      const pinDiff = comparePinnedPriority(a, b);
      if (pinDiff !== 0) return pinDiff;
      if (sortChronologically) {
        return (
          getKickoffMinutes(a.startTime) - getKickoffMinutes(b.startTime) ||
          a.leagueName.localeCompare(b.leagueName) ||
          a.homeTeam.name.localeCompare(b.homeTeam.name)
        );
      }
      const aLive = Number(isMatchLive(a.status));
      const bLive = Number(isMatchLive(b.status));
      if (aLive !== bLive) return bLive - aLive;
      return 0;
    });
  }, [statusFilteredMatches, selectedLeague, sortChronologically, pinnedTimestamps]);

  const matchGroups = useMemo(() => {
    if (sortChronologically) {
      const chronologicalGroups: MatchGroup[] = [];
      filteredMatches.forEach((match) => {
        const previousGroup = chronologicalGroups[chronologicalGroups.length - 1];
        if (
          previousGroup?.matches[0]?.leagueId === match.leagueId &&
          Boolean(previousGroup?.matches[0]?.isPinned) === Boolean(match.isPinned)
        ) {
          previousGroup.matches.push(match);
          return;
        }
        chronologicalGroups.push({
          id: `${match.leagueId}-${match.id}`,
          leagueName: match.leagueName,
          leagueCountry: match.leagueCountry,
          matches: [match],
        });
      });
      return chronologicalGroups;
    }

    const pinnedMatches =
      selectedLeague === 'ALL' && activeTab !== 'FAVORITES'
        ? filteredMatches.filter((match) => match.isPinned)
        : [];
    const regularMatches =
      pinnedMatches.length > 0
        ? filteredMatches.filter((match) => !match.isPinned)
        : filteredMatches;

    const pinnedGroups: MatchGroup[] = [];
    pinnedMatches.forEach((match) => {
      const existing = pinnedGroups.find(
        (group) => group.id === `pinned-${match.leagueId}`
      );
      if (existing) {
        existing.matches.push(match);
      } else {
        pinnedGroups.push({
          id: `pinned-${match.leagueId}`,
          leagueName: match.leagueName,
          leagueCountry: match.leagueCountry,
          matches: [match],
        });
      }
    });

    const groups = new Map<string, MatchGroup>();
    regularMatches.forEach((match) => {
      const group = groups.get(match.leagueId);
      if (group) {
        group.matches.push(match);
      } else {
        groups.set(match.leagueId, {
          id: match.leagueId,
          leagueName: match.leagueName,
          leagueCountry: match.leagueCountry,
          matches: [match],
        });
      }
    });

    const sortedLeagueGroups = Array.from(groups.values()).sort(
      (a, b) =>
        getLeagueReputation(b.id, b.leagueName) -
          getLeagueReputation(a.id, a.leagueName) ||
        a.leagueName.localeCompare(b.leagueName)
    );

    return [...pinnedGroups, ...sortedLeagueGroups];
  }, [filteredMatches, sortChronologically, selectedLeague, activeTab]);

  const selectedMatch = useMemo(
    () => matches.find((m) => m.id === selectedMatchId) || null,
    [matches, selectedMatchId]
  );

  const liveCount = useMemo(
    () =>
      matches.filter(
        (m) => m.status === '1H' || m.status === '2H' || m.status === 'HT'
      ).length,
    [matches]
  );
  const finishedCount = useMemo(
    () => matches.filter((match) => match.status === 'FT').length,
    [matches]
  );
  const upcomingCount = useMemo(
    () => matches.filter((match) => match.status === 'NS').length,
    [matches]
  );
  const pinnedCount = useMemo(
    () => matches.filter((match) => match.isPinned).length,
    [matches]
  );

  const shiftDate = (days: number) => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + days);
    handleSelectDate(nextDate);
  };

  const renderLeagueGroup = useCallback(
    ({ item: group }: { item: MatchGroup }) => (
      <LeagueGroupItem
        group={group}
        isCollapsed={collapsedLeagues.has(group.id)}
        selectedMatchId={selectedMatchId}
        onToggleCollapse={toggleCollapseLeague}
        onSelectMatch={handleSelectMatch}
        onTogglePin={handleTogglePin}
      />
    ),
    [collapsedLeagues, selectedMatchId, toggleCollapseLeague, handleSelectMatch, handleTogglePin]
  );

  const groupKeyExtractor = useCallback((group: MatchGroup) => group.id, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Top Navigation & Brand Bar */}
      <View
        style={[
          styles.topNavbar,
          {
            paddingTop:
              Math.max(
                insets.top,
                Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0
              ) + 10,
          },
        ]}
      >
        <View style={styles.topNavbarInner}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Voltar para a tela de início"
            activeOpacity={0.8}
            onPress={handleGoHome}
            style={styles.brandCluster}
          >
            <View style={styles.brandLogoMark}>
              <View style={styles.brandLivePulseDot} />
              <Text style={styles.brandLogoIcon}>⚽</Text>
            </View>
            <View style={styles.brandTextColumn}>
              <View style={styles.brandRow}>
                <Text style={styles.brandTitle}>NEXT</Text>
                <Text style={styles.brandAccent}>SCORE</Text>
              </View>
              <Text style={styles.brandSubtitle}>AO VIVO • FUTEBOL EM TEMPO REAL</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerRightActions}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Filtrar partidas ao vivo"
              activeOpacity={0.8}
              onPress={() => {
                setActiveTab('ALL');
                setSelectedLeague('ALL');
                setStatusFilter((prev) => (prev === 'LIVE' ? 'ALL' : 'LIVE'));
              }}
              style={[
                styles.headerLivePill,
                statusFilter === 'LIVE' && styles.headerLivePillActive,
              ]}
            >
              <View
                style={[
                  styles.headerLiveDot,
                  statusFilter === 'LIVE' && styles.headerLiveDotActive,
                ]}
              />
              <Text
                style={[
                  styles.headerLiveText,
                  statusFilter === 'LIVE' && styles.headerLiveTextActive,
                ]}
              >
                {liveCount > 0 ? `${liveCount} AO VIVO` : 'AO VIVO'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Atualizar placares"
              activeOpacity={0.75}
              onPress={handleRefresh}
              style={[
                styles.headerRefreshBtn,
                isLoading && styles.headerRefreshBtnLoading,
              ]}
            >
              <Text style={styles.headerRefreshIcon}>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.container,
          showSideDetails && styles.containerDesktop,
        ]}
      >
        {/* Left Sidebar on wide Desktop: Quick Competition Navigator */}
        {showDesktopSidebar && (
          <View style={styles.leagueSidebar}>
            <View style={styles.sidebarHeaderRow}>
              <Text style={styles.sidebarTitle}>COMPETIÇÕES</Text>
              <Text style={styles.sidebarBadgeCount}>
                {Math.max(0, leagues.length - 1)}
              </Text>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.leagueList}
            >
              {leagues.map((league) => {
                const isSelected = selectedLeague === league.id;
                return (
                  <TouchableOpacity
                    key={league.id}
                    onPress={() => setSelectedLeague(league.id)}
                    style={[
                      styles.leagueItem,
                      isSelected && styles.leagueItemActive,
                    ]}
                  >
                    <View style={styles.leagueSidebarFlagBox}>
                      <CountryFlag
                        country={league.id === 'ALL' ? 'ALL' : league.country}
                        size={18}
                      />
                    </View>
                    <View style={styles.leagueItemText}>
                      <Text
                        style={[
                          styles.leagueItemName,
                          isSelected && styles.leagueItemNameActive,
                        ]}
                        numberOfLines={1}
                      >
                        {league.name}
                      </Text>
                      {league.country ? (
                        <Text
                          style={styles.leagueItemCountry}
                          numberOfLines={1}
                        >
                          {league.country}
                        </Text>
                      ) : null}
                    </View>
                    <View
                      style={[
                        styles.leagueCountBadge,
                        isSelected && styles.leagueCountBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.leagueCount,
                          isSelected && styles.leagueCountActive,
                        ]}
                      >
                        {league.count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View
          style={[
            styles.mainColumn,
            showSideDetails && styles.mainColumnWithDetails,
          ]}
        >
          {/* Unified Controls Card */}
          <View style={styles.controlsCard}>
            <View
              style={[
                styles.topControlsRow,
                showSideDetails && styles.topControlsRowWide,
              ]}
            >
              <View style={styles.tabsRow}>
                <TouchableOpacity
                  accessibilityRole="tab"
                  accessibilityState={{
                    selected: activeTab === 'ALL',
                  }}
                  onPress={() => {
                    setActiveTab('ALL');
                    setStatusFilter('ALL');
                    setSelectedLeague('ALL');
                  }}
                  style={[
                    styles.tabButton,
                    activeTab === 'ALL' && styles.tabButtonActive,
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.tabText,
                      activeTab === 'ALL' && styles.tabTextActive,
                    ]}
                  >
                    Todos
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="tab"
                  accessibilityState={{
                    selected: activeTab === 'FAVORITES',
                  }}
                  onPress={() => {
                    setActiveTab('FAVORITES');
                    setStatusFilter('ALL');
                    setSelectedLeague('ALL');
                  }}
                  style={[
                    styles.tabButton,
                    activeTab === 'FAVORITES' && styles.tabButtonActive,
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.tabText,
                      activeTab === 'FAVORITES' && styles.tabTextActive,
                    ]}
                  >
                    Favoritos
                  </Text>
                  {pinnedCount > 0 && (
                    <View
                      style={[
                        styles.tabBadge,
                        activeTab === 'FAVORITES' && styles.tabBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabBadgeText,
                          activeTab === 'FAVORITES' && styles.tabBadgeTextActive,
                        ]}
                      >
                        {pinnedCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activeTab === 'COMPETITIONS' }}
                  onPress={() => {
                    setActiveTab('COMPETITIONS');
                    setStatusFilter('ALL');
                    setSelectedLeague('ALL');
                  }}
                  style={[
                    styles.tabButton,
                    activeTab === 'COMPETITIONS' && styles.tabButtonActive,
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.tabText,
                      activeTab === 'COMPETITIONS' && styles.tabTextActive,
                    ]}
                  >
                    Competições
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dateSelectorRow}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Dia anterior"
                  onPress={() => shiftDate(-1)}
                  style={styles.dateArrow}
                >
                  <Text style={styles.dateArrowText}>‹</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Escolher data das partidas"
                  onPress={() => setIsCalendarVisible(true)}
                  style={styles.dateCenterButton}
                >
                  <Text style={styles.selectedDateLabel}>
                    {isViewingToday
                      ? 'HOJE'
                      : `${String(selectedDate.getDate()).padStart(2, '0')} DE ${MONTHS_SHORT[selectedDate.getMonth()].toUpperCase()}`}
                  </Text>
                  <Text style={styles.dateSubLabel}>
                    {`${WEEKDAYS_SHORT[selectedDate.getDay()]}, ${String(selectedDate.getDate()).padStart(2, '0')} de ${MONTHS_SHORT[selectedDate.getMonth()]}`}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Próximo dia"
                  onPress={() => shiftDate(1)}
                  style={styles.dateArrow}
                >
                  <Text style={styles.dateArrowText}>›</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={[
                styles.secondaryControlsRow,
                showSideDetails && styles.secondaryControlsRowWide,
              ]}
            >
              <View style={styles.statusFiltersRow}>
                {[
                  { id: 'LIVE' as const, label: 'Ao Vivo', count: liveCount },
                  {
                    id: 'FINISHED' as const,
                    label: 'Finalizado',
                    count: finishedCount,
                  },
                  {
                    id: 'UPCOMING' as const,
                    label: 'Próximos',
                    count: upcomingCount,
                  },
                ].map((filter) => {
                  const isActive = statusFilter === filter.id;
                  return (
                    <TouchableOpacity
                      key={filter.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      onPress={() => {
                        setStatusFilter((current) =>
                          current === filter.id ? 'ALL' : filter.id
                        );
                      }}
                      style={[
                        styles.statusFilterButton,
                        filter.id === 'LIVE' && styles.statusFilterLiveIdle,
                        filter.id === 'FINISHED' &&
                          styles.statusFilterFinishedIdle,
                        filter.id === 'UPCOMING' &&
                          styles.statusFilterUpcomingIdle,
                        isActive && (
                          filter.id === 'LIVE'
                            ? styles.statusFilterLiveActive
                            : filter.id === 'FINISHED'
                              ? styles.statusFilterFinishedActive
                              : styles.statusFilterUpcomingActive
                        ),
                      ]}
                    >
                      {filter.id === 'LIVE' && (
                        <View
                          style={[
                            styles.filterLiveDot,
                            isActive && styles.filterLiveDotActive,
                          ]}
                        />
                      )}
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.statusFilterText,
                          filter.id === 'LIVE' && styles.statusFilterTextLive,
                          filter.id === 'FINISHED' &&
                            styles.statusFilterTextFinished,
                          filter.id === 'UPCOMING' &&
                            styles.statusFilterTextUpcoming,
                          isActive && styles.statusFilterTextActive,
                        ]}
                      >
                        {filter.label}
                      </Text>
                      <View
                        style={[
                          styles.statusFilterBadge,
                          filter.id === 'LIVE' && styles.statusFilterBadgeLive,
                          filter.id === 'FINISHED' &&
                            styles.statusFilterBadgeFinished,
                          filter.id === 'UPCOMING' &&
                            styles.statusFilterBadgeUpcoming,
                          isActive && styles.statusFilterBadgeActive,
                        ]}
                      >
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.statusFilterBadgeText,
                            filter.id === 'LIVE' &&
                              styles.statusFilterBadgeTextLive,
                            filter.id === 'FINISHED' &&
                              styles.statusFilterBadgeTextFinished,
                            filter.id === 'UPCOMING' &&
                              styles.statusFilterBadgeTextUpcoming,
                            isActive && styles.statusFilterBadgeTextActive,
                          ]}
                        >
                          {filter.count}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.lowerLeagueToggle}>
                <Text style={styles.lowerLeagueText}>
                  Ordenar jogos por horário de início
                </Text>
                <Switch
                  accessibilityLabel="Ordenar jogos por horário de início"
                  value={sortChronologically}
                  onValueChange={setSortChronologically}
                  trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                  thumbColor={sortChronologically ? '#1D4ED8' : '#FFFFFF'}
                  style={styles.lowerLeagueSwitch}
                />
              </View>
            </View>

            {activeTab === 'COMPETITIONS' && (
              <View style={styles.competitionSelector}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.competitionSelectorContent}
                >
                  {leagues.map((league) => (
                    <TouchableOpacity
                      key={league.id}
                      onPress={() => setSelectedLeague(league.id)}
                      style={[
                        styles.competitionChip,
                        selectedLeague === league.id &&
                          styles.competitionChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.competitionChipText,
                          selectedLeague === league.id &&
                            styles.competitionChipTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {league.id === 'ALL' ? 'Todas' : league.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {apiError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{apiError}</Text>
              <TouchableOpacity onPress={handleRefresh}>
                <Text style={styles.retryText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.matchesList}>
            <FlatList
              ref={listRef}
              data={matchGroups}
              keyExtractor={groupKeyExtractor}
              renderItem={renderLeagueGroup}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: Math.max(20, insets.bottom + 18) },
              ]}
              initialNumToRender={5}
              maxToRenderPerBatch={4}
              windowSize={4}
              updateCellsBatchingPeriod={50}
              removeClippedSubviews={Platform.OS === 'android'}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyTitle}>
                    {isLoading
                      ? 'Buscando partidas...'
                      : isViewingToday
                      ? 'Nenhuma partida neste filtro'
                      : 'Nenhuma partida encontrada nesta data'}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {isLoading
                      ? 'Carregando placares reais da API gratuita.'
                      : statusFilter !== 'ALL'
                      ? 'Mude o filtro de status para ver outras partidas.'
                      : activeTab === 'FAVORITES'
                      ? 'Toque na estrela de uma partida para adicioná-la aos favoritos.'
                      : 'A ESPN não retornou partidas para a data selecionada.'}
                  </Text>
                </View>
              }
            />
          </View>
        </View>

        {/* Right Side Panel on Desktop or Modal on Mobile */}
        {showSideDetails ? (
          <View style={styles.sideDetailsWrapper}>
            {selectedMatch ? (
              <MatchDetailModal
                match={selectedMatch}
                matches={matches}
                visible={Boolean(selectedMatch)}
                sidePanel
                onClose={() => setSelectedMatchId(null)}
              />
            ) : (
              <View style={styles.infoPanel}>
                <View style={styles.infoPanelHeroIconBox}>
                  <Text style={styles.infoPanelHeroEmoji}>🏟️</Text>
                </View>
                <Text style={styles.infoPanelEyebrow}>
                  CENTRAL DA PARTIDA • NEXT SCORE
                </Text>
                <Text style={styles.infoPanelTitle}>
                  Selecione um confronto ao lado
                </Text>
                <Text style={styles.infoPanelDescription}>
                  Clique em qualquer partida da lista para abrir o painel
                  completo com eventos em tempo real, estatísticas comparativas,
                  mapa tático das formações, classificação e ficha técnica.
                </Text>

                <View style={styles.infoPanelStatsGrid}>
                  <View
                    style={[
                      styles.infoPanelStatCard,
                      styles.infoPanelStatCardLive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.infoPanelStatNumber,
                        styles.infoPanelStatLive,
                      ]}
                    >
                      {liveCount}
                    </Text>
                    <Text
                      style={[
                        styles.infoPanelStatLabel,
                        styles.infoPanelStatLabelLive,
                      ]}
                    >
                      Ao Vivo
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.infoPanelStatCard,
                      styles.infoPanelStatCardFinished,
                    ]}
                  >
                    <Text
                      style={[
                        styles.infoPanelStatNumber,
                        styles.infoPanelStatFinished,
                      ]}
                    >
                      {finishedCount}
                    </Text>
                    <Text
                      style={[
                        styles.infoPanelStatLabel,
                        styles.infoPanelStatLabelFinished,
                      ]}
                    >
                      Encerrados
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.infoPanelStatCard,
                      styles.infoPanelStatCardUpcoming,
                    ]}
                  >
                    <Text
                      style={[
                        styles.infoPanelStatNumber,
                        styles.infoPanelStatUpcoming,
                      ]}
                    >
                      {upcomingCount}
                    </Text>
                    <Text
                      style={[
                        styles.infoPanelStatLabel,
                        styles.infoPanelStatLabelUpcoming,
                      ]}
                    >
                      Próximos
                    </Text>
                  </View>
                </View>

                {filteredMatches.length > 0 && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => setSelectedMatchId(filteredMatches[0].id)}
                    style={styles.infoPanelCtaButton}
                  >
                    <Text style={styles.infoPanelCtaText}>
                      Abrir partida em destaque →
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ) : (
          Boolean(selectedMatch) && (
            <MatchDetailModal
              match={selectedMatch}
              matches={matches}
              visible={Boolean(selectedMatch)}
              sidePanel={false}
              onClose={() => setSelectedMatchId(null)}
            />
          )
        )}

        <Modal
          visible={isCalendarVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsCalendarVisible(false)}
        >
          <View style={styles.calendarOverlay}>
            <View style={styles.calendarPanel}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarTitle}>ESCOLHER DATA</Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Fechar calendário"
                  onPress={() => setIsCalendarVisible(false)}
                  style={styles.calendarCloseButton}
                >
                  <Text style={styles.calendarCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.monthNavigation}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Mês anterior"
                  onPress={() =>
                    setCalendarMonth(
                      (month) =>
                        new Date(month.getFullYear(), month.getMonth() - 1, 1)
                    )
                  }
                  style={styles.monthArrow}
                >
                  <Text style={styles.monthArrowText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.monthTitle}>
                  {`${MONTHS_LONG[calendarMonth.getMonth()]} DE ${calendarMonth.getFullYear()}`}
                </Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Próximo mês"
                  onPress={() =>
                    setCalendarMonth(
                      (month) =>
                        new Date(month.getFullYear(), month.getMonth() + 1, 1)
                    )
                  }
                  style={styles.monthArrow}
                >
                  <Text style={styles.monthArrowText}>›</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.calendarGrid}>
                {WEEKDAYS.map((weekday) => (
                  <Text key={weekday} style={styles.weekdayLabel}>
                    {weekday}
                  </Text>
                ))}
                {calendarDays.map((day) => {
                  const isInMonth = day.getMonth() === calendarMonth.getMonth();
                  const isSelected = getDateKey(day) === getDateKey(selectedDate);
                  const isToday = getDateKey(day) === getDateKey(new Date());
                  return (
                    <TouchableOpacity
                      key={getDateKey(day)}
                      accessibilityRole="button"
                      accessibilityLabel={getDateKey(day)}
                      accessibilityState={{ selected: isSelected }}
                      disabled={!isInMonth}
                      onPress={() => handleSelectDate(day)}
                      style={[
                        styles.calendarDay,
                        isSelected && styles.calendarDaySelected,
                        isToday && !isSelected && styles.calendarDayToday,
                      ]}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          !isInMonth && styles.calendarDayOutsideMonth,
                          isSelected && styles.calendarDayTextSelected,
                          isToday && !isSelected && styles.calendarDayTextToday,
                        ]}
                      >
                        {day.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.calendarHint}>
                Consulte jogos anteriores ou a programação futura.
              </Text>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F6FA',
  },
  topNavbar: {
    width: '100%',
    backgroundColor: '#1652D0',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#1652D0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  topNavbarInner: {
    width: '100%',
    maxWidth: 1320,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brandCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogoMark: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#0F3DA6',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  brandLivePulseDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  brandLogoIcon: {
    fontSize: 18,
  },
  brandTextColumn: {
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  brandAccent: {
    color: '#38BDF8',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  brandSubtitle: {
    color: '#BFDBFE',
    fontSize: 8.5,
    lineHeight: 11,
    marginTop: 1,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  headerLivePillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  headerLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F87171',
  },
  headerLiveDotActive: {
    backgroundColor: '#DC2626',
  },
  headerLiveText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  headerLiveTextActive: {
    color: '#DC2626',
  },
  headerRefreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRefreshBtnLoading: {
    opacity: 0.5,
  },
  headerRefreshIcon: {
    fontSize: 13,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 9,
    lineHeight: 12,
    marginTop: 2,
    fontWeight: '700',
    letterSpacing: 0.4,
    fontVariant: ['tabular-nums'],
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerKpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerKpiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  headerKpiPillLive: {
    backgroundColor: '#FFE4E6',
    borderColor: '#FDA4AF',
  },
  headerKpiPillFinished: {
    backgroundColor: '#E0E7FF',
    borderColor: '#A5B4FC',
  },
  headerKpiPillTotal: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  headerKpiLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E11D48',
  },
  headerKpiLiveText: {
    color: '#BE123C',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  headerKpiFinishedText: {
    color: '#3730A3',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  headerKpiTotalText: {
    color: '#B45309',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingTop: 10,
  },
  containerDesktop: {
    maxWidth: 1320,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  mainColumn: {
    flex: 1,
    minWidth: 0,
  },
  mainColumnWithDetails: {
    flex: 1,
    minWidth: 0,
  },
  controlsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  topControlsRow: {
    flexDirection: 'column',
    gap: 8,
  },
  topControlsRowWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryControlsRow: {
    flexDirection: 'column',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  secondaryControlsRowWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    minHeight: 34,
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: '#1652D0',
  },
  tabText: {
    color: '#334155',
    fontFamily: FONT_SANS,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CBD5E1',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabBadgeText: {
    color: '#334155',
    fontFamily: FONT_SANS,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },
  dateSelectorRow: {
    height: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  selectedDateLabel: {
    color: '#0F172A',
    fontFamily: FONT_DISPLAY,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  dateArrow: {
    width: 32,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  dateArrowText: {
    color: '#334155',
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '600',
  },
  dateCenterButton: {
    flex: 1,
    minWidth: 104,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  dateSubLabel: {
    color: '#64748B',
    fontFamily: FONT_SANS,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    fontVariant: ['tabular-nums'],
  },
  statusFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusFilterButton: {
    flex: 1,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  statusFilterLiveIdle: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusFilterFinishedIdle: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  statusFilterUpcomingIdle: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  statusFilterLiveActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  statusFilterFinishedActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  statusFilterUpcomingActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
    marginRight: 4,
  },
  filterLiveDotActive: {
    backgroundColor: '#FFFFFF',
  },
  statusFilterText: {
    color: '#475569',
    fontFamily: FONT_SANS,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  statusFilterTextLive: {
    color: '#DC2626',
  },
  statusFilterTextFinished: {
    color: '#475569',
  },
  statusFilterTextUpcoming: {
    color: '#475569',
  },
  statusFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statusFilterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    backgroundColor: '#E2E8F0',
  },
  statusFilterBadgeLive: {
    backgroundColor: '#FEE2E2',
  },
  statusFilterBadgeFinished: {
    backgroundColor: '#E2E8F0',
  },
  statusFilterBadgeUpcoming: {
    backgroundColor: '#E2E8F0',
  },
  statusFilterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  statusFilterBadgeText: {
    color: '#334155',
    fontFamily: FONT_SANS,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  statusFilterBadgeTextLive: {
    color: '#B91C1C',
  },
  statusFilterBadgeTextFinished: {
    color: '#475569',
  },
  statusFilterBadgeTextUpcoming: {
    color: '#475569',
  },
  statusFilterBadgeTextActive: {
    color: '#FFFFFF',
  },
  lowerLeagueToggle: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    paddingLeft: 10,
    paddingRight: 4,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  lowerLeagueText: {
    color: '#334155',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
  },
  lowerLeagueSwitch: {
    transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }],
  },
  competitionSelector: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  competitionSelectorContent: {
    alignItems: 'center',
    gap: 6,
    paddingRight: 4,
  },
  competitionChip: {
    maxWidth: 210,
    minHeight: 28,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  competitionChipActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  competitionChipText: {
    color: '#1E3A8A',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
  },
  competitionChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF1F0',
    borderColor: '#F2C5C1',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#A33B35',
    fontSize: 12,
    flex: 1,
  },
  retryText: {
    color: '#8E302B',
    fontSize: 12,
    fontWeight: '700',
  },
  leagueSidebar: {
    width: 252,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  sidebarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1652D0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 8,
  },
  sidebarTitle: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  sidebarBadgeCount: {
    color: '#1E3A8A',
    backgroundColor: '#93C5FD',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
    fontVariant: ['tabular-nums'],
  },
  leagueList: {
    gap: 4,
    paddingBottom: 12,
  },
  leagueItem: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  leagueItemActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  leagueSidebarFlagBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueSidebarFlagText: {
    fontSize: 13,
  },
  leagueItemText: {
    flex: 1,
    minWidth: 0,
  },
  leagueItemName: {
    color: '#0F172A',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  leagueItemNameActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  leagueItemCountry: {
    color: '#64748B',
    fontSize: 9,
    lineHeight: 12,
    marginTop: 1,
  },
  leagueCountBadge: {
    minWidth: 24,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueCountBadgeActive: {
    backgroundColor: '#1D4ED8',
  },
  leagueCount: {
    color: '#334155',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  leagueCountActive: {
    color: '#FFFFFF',
  },
  matchesList: {
    flex: 1,
    minWidth: 0,
  },
  sideDetailsWrapper: {
    width: 448,
    flexShrink: 0,
  },
  infoPanel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoPanelHeroIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  infoPanelHeroEmoji: {
    fontSize: 26,
  },
  infoPanelEyebrow: {
    color: '#1D4ED8',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 5,
    textAlign: 'center',
  },
  infoPanelTitle: {
    color: '#0F172A',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  infoPanelDescription: {
    color: '#475569',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 18,
  },
  infoPanelStatsGrid: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  infoPanelStatCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 3,
  },
  infoPanelStatCardLive: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  infoPanelStatCardFinished: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  infoPanelStatCardUpcoming: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  infoPanelStatNumber: {
    color: '#0F172A',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  infoPanelStatLive: {
    color: '#E11D48',
  },
  infoPanelStatFinished: {
    color: '#4338CA',
  },
  infoPanelStatUpcoming: {
    color: '#D97706',
  },
  infoPanelStatLabel: {
    color: '#475569',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  infoPanelStatLabelLive: {
    color: '#BE123C',
  },
  infoPanelStatLabelFinished: {
    color: '#3730A3',
  },
  infoPanelStatLabelUpcoming: {
    color: '#B45309',
  },
  infoPanelCtaButton: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  infoPanelCtaText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
  },
  leagueGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 12,
    overflow: 'hidden',
  },
  leagueGroupPinned: {
    borderColor: '#FCD34D',
    backgroundColor: '#FFFBEB',
  },
  leagueGroupHeader: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    borderLeftWidth: 3.5,
    borderLeftColor: '#1652D0',
  },
  leagueGroupHeaderPinned: {
    backgroundColor: '#FEF3C7',
    borderBottomColor: '#FDE68A',
    borderLeftColor: '#D97706',
  },
  leagueGroupHeaderCollapsed: {
    borderBottomWidth: 0,
  },
  leagueGroupHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leagueCollapseChevron: {
    color: '#94A3B8',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    paddingHorizontal: 2,
  },
  leagueGroupTitle: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 8,
  },
  leagueGroupCountry: {
    color: '#1652D0',
    fontFamily: FONT_SANS,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  leagueGroupCountryPinned: {
    color: '#B45309',
  },
  leagueGroupName: {
    color: '#0F172A',
    fontFamily: FONT_SANS,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  leagueGroupNamePinned: {
    color: '#92400E',
  },
  leagueGroupCountPill: {
    minWidth: 24,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueGroupCountPillPinned: {
    backgroundColor: '#FDE68A',
  },
  leagueGroupCount: {
    color: '#1E40AF',
    fontFamily: FONT_DISPLAY,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  leagueGroupCountPinned: {
    color: '#92400E',
  },
  leagueBadge: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  leagueBadgePinned: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  leagueBadgeText: {
    fontSize: 13,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    marginBottom: 5,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },
  calendarOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  calendarPanel: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  calendarTitle: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  calendarCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  calendarCloseText: {
    color: '#334155',
    fontSize: 18,
    lineHeight: 20,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  monthArrow: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
  },
  monthArrowText: {
    color: '#1D4ED8',
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '800',
  },
  monthTitle: {
    color: '#0F172A',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekdayLabel: {
    width: '14.2857%',
    paddingVertical: 6,
    textAlign: 'center',
    color: '#64748B',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
  },
  calendarDay: {
    width: '14.2857%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  calendarDaySelected: {
    backgroundColor: '#1D4ED8',
  },
  calendarDayToday: {
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  calendarDayText: {
    color: '#0F172A',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  calendarDayOutsideMonth: {
    color: 'transparent',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  calendarDayTextToday: {
    color: '#1D4ED8',
    fontWeight: '800',
  },
  calendarHint: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 14,
    marginTop: 10,
    textAlign: 'center',
  },
});
