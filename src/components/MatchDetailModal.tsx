import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

const FONT_SANS = Platform.select({ web: 'Plus Jakarta Sans', default: undefined });
const FONT_DISPLAY = Platform.select({ web: 'Outfit', default: undefined });
const FONT_SCORE = Platform.select({
  web: "'Chivo Mono', 'DM Mono', monospace, -apple-system, sans-serif",
  android: 'monospace',
  ios: 'Menlo',
  default: undefined,
});
import {
  HeadToHeadMatch,
  ClubProfile,
  Match,
  MatchEvent,
  MatchHeadToHead,
  MatchInfoItem,
  MatchLineup,
  MatchStanding,
  TeamInfo,
} from '../types/match';
import { API_CONFIG } from '../config/api';
import {
  fetchClubProfile,
  fetchMatchDetails,
  MatchDetails,
} from '../services/matchService';
import { TeamCrest } from './TeamCrest';

interface MatchDetailModalProps {
  match: Match | null;
  matches: Match[];
  visible: boolean;
  onClose: () => void;
  sidePanel?: boolean;
}

interface MatchDetailWrapperProps {
  sidePanel: boolean;
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const MatchDetailWrapper: React.FC<MatchDetailWrapperProps> = ({
  sidePanel,
  visible,
  onClose,
  children,
}) =>
  sidePanel ? (
    <View style={styles.inlinePanel}>{children}</View>
  ) : (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      {children}
    </Modal>
  );

interface MatchStatComparisonItem {
  id: string;
  label: string;
  homeDisplay: string;
  awayDisplay: string;
  homeValue: number;
  awayValue: number;
}

interface MatchStatisticsOverviewProps {
  possession: [number | null, number | null] | null;
  items: MatchStatComparisonItem[];
}

const MatchStatisticsOverview: React.FC<MatchStatisticsOverviewProps> = ({
  possession,
  items,
}) => {
  const hasPossession =
    possession !== null &&
    possession[0] !== null &&
    possession[0] !== undefined &&
    possession[1] !== null &&
    possession[1] !== undefined;
  const homePoss = hasPossession ? Number(possession[0]) : 50;
  const awayPoss = hasPossession ? Number(possession[1]) : 50;

  return (
    <View style={styles.statsOverviewContainer}>
      <Text style={styles.statsOverviewTitle}>Visão geral da partida</Text>

      {hasPossession && (
        <View style={styles.statsPossessionBlock}>
          <View style={styles.statsPossessionHeader}>
            <View style={[styles.statsPossessionPill, styles.statsPossessionPillHome]}>
              <Text style={styles.statsPossessionPillText}>{homePoss}%</Text>
            </View>
            <Text style={styles.statsItemLabel}>Posse de bola</Text>
            <View style={[styles.statsPossessionPill, styles.statsPossessionPillAway]}>
              <Text style={styles.statsPossessionPillText}>{awayPoss}%</Text>
            </View>
          </View>
          <View style={styles.statsPossessionBar}>
            <View
              style={[
                styles.statsPossessionFillHome,
                { flex: Math.max(1, homePoss) },
              ]}
            />
            <View
              style={[
                styles.statsPossessionFillAway,
                { flex: Math.max(1, awayPoss) },
              ]}
            />
          </View>
        </View>
      )}

      {items.map((item) => {
        const total = item.homeValue + item.awayValue;
        const homePct =
          total > 0 ? Math.min(100, Math.round((item.homeValue / total) * 100)) : 0;
        const awayPct =
          total > 0 ? Math.min(100, Math.round((item.awayValue / total) * 100)) : 0;
        const homeLeads = item.homeValue > item.awayValue;
        const awayLeads = item.awayValue > item.homeValue;

        return (
          <View key={item.id} style={styles.statsComparisonRow}>
            <View style={styles.statsComparisonHeader}>
              <Text
                style={[
                  styles.statsComparisonValue,
                  homeLeads && styles.statsValueHomeLead,
                ]}
              >
                {item.homeDisplay}
              </Text>
              <Text style={styles.statsItemLabel} numberOfLines={1}>
                {item.label}
              </Text>
              <Text
                style={[
                  styles.statsComparisonValue,
                  styles.statsComparisonValueRight,
                  awayLeads && styles.statsValueAwayLead,
                ]}
              >
                {item.awayDisplay}
              </Text>
            </View>
            <View style={styles.statsDualBarsRow}>
              <View style={[styles.statsHalfTrack, styles.statsHalfTrackLeft]}>
                <View
                  style={[
                    styles.statsHalfFill,
                    homeLeads
                      ? styles.statsFillHomeStrong
                      : styles.statsFillHomeSoft,
                    { width: `${homePct}%` },
                  ]}
                />
              </View>
              <View style={[styles.statsHalfTrack, styles.statsHalfTrackRight]}>
                <View
                  style={[
                    styles.statsHalfFill,
                    awayLeads
                      ? styles.statsFillAwayStrong
                      : styles.statsFillAwaySoft,
                    { width: `${awayPct}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const isPeriodMarkerEvent = (event: MatchEvent) =>
  event.type === 'HALF_TIME' ||
  event.type === 'SECOND_HALF' ||
  /intervalo|half.?time|in[íi]cio do 2[ºoªa]?\s*tempo|start (?:of )?2nd half/i.test(
    `${event.label} ${event.playerName} ${event.detail ?? ''}`
  );

function getVARDetails(event: MatchEvent): {
  decisionTitle: string;
  subtitle?: string;
} {
  const combined = `${event.label} ${event.playerName} ${event.detail ?? ''}`;
  const lower = combined.toLowerCase();

  const isOverturned =
    /overturn|disallow|cancel|anulado|recusado|no goal|no penalty|not given|rescind|anula[çc][ãa]o/i.test(
      lower
    );
  const isConfirmed =
    /confirm|awarded|given|stands|marcado|concedido|validado|dado|award/i.test(
      lower
    );
  const isOffside = /offside|impedimento/i.test(lower);
  const isHandball =
    /handball|hand ball|toque de m[ãa]o|m[ãa]o/i.test(lower);
  const isFoul = /foul|falta/i.test(lower);
  const isPenalty = /penalty|p[êe]nalti/i.test(lower);
  const isGoal = /goal|gol/i.test(lower);
  const isRedCard = /red card|cart[ãa]o vermelho/i.test(lower);

  let decisionTitle = 'Revisão do VAR';

  if (isPenalty) {
    if (isOverturned) {
      decisionTitle = 'Pênalti anulado pelo VAR';
    } else if (isConfirmed) {
      decisionTitle = 'Pênalti marcado pelo VAR';
    } else {
      decisionTitle = 'Checagem de pênalti pelo VAR';
    }
  } else if (isGoal) {
    if (isOverturned) {
      if (isOffside) {
        decisionTitle = 'Gol anulado (Impedimento)';
      } else if (isHandball) {
        decisionTitle = 'Gol anulado (Toque de mão)';
      } else if (isFoul) {
        decisionTitle = 'Gol anulado (Falta)';
      } else {
        decisionTitle = 'Gol anulado pelo VAR';
      }
    } else if (isConfirmed) {
      decisionTitle = 'Gol confirmado pelo VAR';
    } else {
      decisionTitle = 'Checagem de gol pelo VAR';
    }
  } else if (isRedCard) {
    if (isOverturned) {
      decisionTitle = 'Cartão vermelho cancelado pelo VAR';
    } else {
      decisionTitle = 'Cartão vermelho após VAR';
    }
  } else if (/card|cart[ãa]o/i.test(lower)) {
    decisionTitle = isOverturned
      ? 'Cartão cancelado pelo VAR'
      : 'Cartão após revisão do VAR';
  } else if (isOverturned) {
    decisionTitle = 'Decisão alterada pelo VAR';
  } else if (/stand|mantid/i.test(lower)) {
    decisionTitle = 'Decisão de campo mantida';
  } else if (
    event.label &&
    event.label !== 'Revisão do VAR' &&
    event.label !== 'Video Review' &&
    event.label !== 'VAR'
  ) {
    decisionTitle = event.label;
  }

  let subtitle: string | undefined = undefined;
  const isGenericName =
    /video review|var|delay|revis[ãa]o|evento da partida/i.test(
      event.playerName
    );
  if (!isGenericName && event.playerName && event.playerName !== decisionTitle) {
    subtitle = event.playerName;
  } else {
    const playerMatch = `${event.detail ?? ''}`.match(
      /\(([A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'.-]+(?:\s+[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'.-]+)+)\)/
    );
    if (playerMatch?.[1]) {
      subtitle = playerMatch[1];
    }
  }

  return { decisionTitle, subtitle };
}

interface MatchEventsListProps {
  events: MatchEvent[];
}

const MatchEventsList: React.FC<MatchEventsListProps> = ({ events }) => {
  const visibleEvents = events.filter(
    (event) => event.type !== 'KICKOFF' && !isPeriodMarkerEvent(event)
  );
  return visibleEvents.length ? (
    <View>
      {visibleEvents.map((event) => {
        const isFullTimeEvent =
          event.type === 'FULL_TIME' ||
          /end regular time|full.?time|fim de jogo|end (?:of )?2nd half/i.test(
            `${event.label} ${event.playerName}`
          );
        const tagLabel =
          event.type === 'SUBSTITUTION'
            ? '⇄'
            : event.type === 'VAR'
            ? 'VAR'
            : '•';
        const rawMinute = event.time || (event.minute ? `${event.minute}'` : '');
        const minuteMatch = rawMinute.match(/^(\d{1,3}(?:\+\d{1,2})?)(?:['′:]|$)/);
        const minute = minuteMatch
          ? `${minuteMatch[1]}'`
          : rawMinute || '—';
        if (isFullTimeEvent) {
          return (
            <View
              key={event.id}
              accessibilityLabel={`FIM DE JOGO${minute !== '—' ? ` aos ${minute}` : ''}`}
              style={styles.eventHalfTime}
            >
              <View style={styles.eventHalfTimeLine} />
              <View style={styles.eventHalfTimePill}>
                <Text style={styles.eventFullTimeIcon}>🏁</Text>
                {minute !== '—' && (
                  <Text style={styles.eventHalfTimeMinute}>{minute}</Text>
                )}
                <Text style={styles.eventHalfTimeText}>FIM DE JOGO</Text>
              </View>
              <View style={styles.eventHalfTimeLine} />
            </View>
          );
        }
        const isVAREvent = event.type === 'VAR';
        const varDetails = isVAREvent ? getVARDetails(event) : null;
        const iconLabel =
          event.type === 'GOAL'
            ? 'Gol'
            : event.type === 'PENALTY_MISSED'
            ? 'Pênalti perdido'
            : event.type === 'YELLOW_CARD'
            ? 'Cartão amarelo'
            : event.type === 'RED_CARD'
            ? 'Cartão vermelho'
            : event.type === 'SUBSTITUTION'
            ? 'Substituição'
            : event.type === 'VAR'
            ? 'VAR'
            : event.label || tagLabel;
        const eventIcon = (
          <View
            accessibilityLabel={iconLabel}
            style={styles.eventIcon}
          >
            {event.type === 'GOAL' ? (
              <Text style={styles.eventBall}>⚽</Text>
            ) : event.type === 'PENALTY_MISSED' ? (
              <View style={styles.eventPenaltyGoalpost}>
                <Text style={styles.eventPenaltyGoalpostCross}>✕</Text>
              </View>
            ) : event.type === 'YELLOW_CARD' || event.type === 'RED_CARD' ? (
              <View
                style={[
                  styles.eventCardIcon,
                  event.type === 'YELLOW_CARD'
                    ? styles.eventYellowCard
                    : styles.eventRedCard,
                ]}
              />
            ) : event.type === 'VAR' ? (
              <View style={styles.eventVarBadge}>
                <Text style={styles.eventVarBadgeText}>VAR</Text>
              </View>
            ) : (
              <Text
                style={[
                  styles.eventTagText,
                  event.type === 'SUBSTITUTION' && styles.eventSubstitutionIcon,
                ]}
              >
                {tagLabel}
              </Text>
            )}
          </View>
        );
        const substitutionPlayers =
          event.type === 'SUBSTITUTION'
            ? event.playerName
                .split(' • ')
                .map((name) => name.trim())
                .filter(Boolean)
            : [];
        const eventSecondaryReason =
          event.type === 'PENALTY_MISSED'
            ? /trave/i.test(event.label) || /trave|post|bar/i.test(event.detail ?? '')
              ? 'Pênalti na trave'
              : /defendid/i.test(event.label) || /saved|defendid/i.test(event.detail ?? '')
              ? 'Pênalti defendido'
              : 'Pênalti perdido'
            : event.type === 'GOAL' && /own goal|gol contra/i.test(event.detail ?? '')
            ? 'Gol contra'
            : event.type === 'GOAL' && /penalty|pênalti/i.test(event.detail ?? '')
            ? 'Pênalti'
            : null;

        const eventPlayer =
          isVAREvent && varDetails ? (
            <View
              style={[
                styles.eventPlayerCol,
                event.team === 'AWAY' && styles.eventPlayerColAway,
              ]}
            >
              <Text
                style={[
                  styles.eventPlayer,
                  event.team === 'AWAY' && styles.eventPlayerAway,
                ]}
                numberOfLines={1}
              >
                <Text style={styles.eventVarDecisionText}>
                  {varDetails.decisionTitle}
                </Text>
              </Text>
              {Boolean(varDetails.subtitle) && (
                <Text
                  style={[
                    styles.eventVarSubtitle,
                    event.team === 'AWAY' && styles.eventVarSubtitleAway,
                  ]}
                  numberOfLines={1}
                >
                  {varDetails.subtitle}
                </Text>
              )}
            </View>
          ) : substitutionPlayers.length >= 2 ? (
            <Text
              style={[
                styles.eventPlayer,
                event.team === 'AWAY' && styles.eventPlayerAway,
              ]}
              numberOfLines={1}
            >
              <Text style={styles.eventSubPlayerIn}>
                {substitutionPlayers[0]}
              </Text>
              <Text style={styles.eventSubSeparator}> • </Text>
              <Text style={styles.eventSubPlayerOut}>
                {substitutionPlayers.slice(1).join(' • ')}
              </Text>
            </Text>
          ) : (
            <View
              style={[
                styles.eventPlayerCol,
                event.team === 'AWAY' && styles.eventPlayerColAway,
              ]}
            >
              <Text
                style={[
                  styles.eventPlayer,
                  event.team === 'AWAY' && styles.eventPlayerAway,
                ]}
                numberOfLines={1}
              >
                {event.team === 'AWAY' && eventSecondaryReason ? (
                  <>
                    <Text style={styles.eventReasonSubtle}>
                      {eventSecondaryReason}{' '}
                    </Text>
                    <Text style={styles.eventPlayerMainName}>
                      {event.playerName}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.eventPlayerMainName}>
                      {event.playerName}
                    </Text>
                    {eventSecondaryReason ? (
                      <Text style={styles.eventReasonSubtle}>
                        {'  '}
                        {eventSecondaryReason}
                      </Text>
                    ) : null}
                  </>
                )}
              </Text>
              {Boolean(event.assistPlayerName) && (
                <Text
                  style={[
                    styles.eventAssistText,
                    event.team === 'AWAY' && styles.eventAssistTextAway,
                  ]}
                  numberOfLines={1}
                >
                  Assistência: {event.assistPlayerName}
                </Text>
              )}
            </View>
          );

        return (
          <View key={event.id} style={styles.eventItem}>
            {event.team === 'AWAY' ? (
              <>
                <View style={[styles.eventContent, styles.eventContentAway]}>
                  {eventPlayer}
                  {eventIcon}
                </View>
                <Text style={[styles.eventMinute, styles.eventMinuteAway]}>
                  {minute}
                </Text>
              </>
            ) : event.team === 'HOME' ? (
              <>
                <Text style={styles.eventMinute}>{minute}</Text>
                <View style={styles.eventContent}>
                  {eventIcon}
                  {eventPlayer}
                </View>
              </>
              ) : (
              <>
                <Text style={styles.eventMinute}>{minute}</Text>
                <View style={[styles.eventContent, styles.eventContentNeutral]}>
                  {eventIcon}
                  {eventPlayer}
                </View>
              </>
            )}
          </View>
        );
      })}
    </View>
  ) : (
    <Text style={styles.emptyTabText}>Nenhum evento registrado neste tempo.</Text>
  );
};

interface StandingsTableProps {
  standings: MatchStanding[];
  isProjected: boolean;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
}

interface MatchInfoPanelProps {
  info: MatchInfoItem[];
  match: Match;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  status: Match['status'];
  minute: number | null;
  minuteLabel?: string | null;
  events: MatchEvent[];
}

const MatchInfoPanel: React.FC<MatchInfoPanelProps> = ({
  info,
  match,
  homeTeam,
  awayTeam,
  status,
  minute,
  minuteLabel,
  events,
}) => {
  const findItem = (id: string) => info.find((item) => item.id === id);
  const competitionItem = findItem('competition');
  const roundItem = findItem('round');
  const datetimeItem = findItem('datetime');
  const venueItem = findItem('venue');
  const attendanceItem = findItem('attendance');
  const weatherItem = findItem('weather');
  const officialsItem = findItem('officials');
  const broadcastItem = findItem('broadcast');
  const extraItems = info.filter(
    (item) =>
      ![
        'competition',
        'round',
        'datetime',
        'venue',
        'attendance',
        'weather',
        'officials',
        'broadcast',
      ].includes(item.id)
  );

  const isLive = status === '1H' || status === '2H' || status === 'HT';
  const statusLabel =
    status === 'HT'
      ? 'Intervalo'
      : status === '1H'
      ? `Ao vivo • 1º Tempo (${minuteLabel ?? minute ?? ''}’)`
      : status === '2H'
      ? `Ao vivo • 2º Tempo (${minuteLabel ?? minute ?? ''}’)`
      : status === 'FT'
      ? 'Partida encerrada'
      : `Agendado • ${match.startTime}`;

  const getTeamYellowCards = (side: 'HOME' | 'AWAY') =>
    events.filter((e) => e.team === side && e.type === 'YELLOW_CARD').length;
  const getTeamRedCards = (side: 'HOME' | 'AWAY', team: TeamInfo) =>
    team.redCards ??
    events.filter((e) => e.team === side && e.type === 'RED_CARD').length;

  const parsedOfficials = officialsItem
    ? officialsItem.value
        .split(/\s*(?:•|,)\s*/)
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => {
          const roleMatch = entry.match(/^(.+?)\s*\((.+)\)$/);
          return roleMatch
            ? { name: roleMatch[1].trim(), role: roleMatch[2].trim() }
            : { name: entry, role: 'Arbitragem' };
        })
    : [];

  const parsedBroadcasts = broadcastItem
    ? broadcastItem.value
        .split(/\s*,\s*/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  return (
    <View style={styles.matchInfoContainer}>
      {/* Card 1: Ficha Técnica e Competição */}
      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>FICHA DA PARTIDA</Text>

        <View style={styles.matchInfoCompetitionCard}>
          <View style={styles.matchInfoIconBadge}>
            <Text style={styles.matchInfoIconEmoji}>
              {competitionItem?.icon ?? '🏆'}
            </Text>
          </View>
          <View style={styles.matchInfoCompetitionBody}>
            <Text style={styles.matchInfoCompetitionLabel}>
              {competitionItem?.subtitle ??
                (match.leagueCountry.toUpperCase() === 'INTERNACIONAL'
                  ? 'Torneio Internacional'
                  : match.leagueCountry)}
            </Text>
            <Text style={styles.matchInfoCompetitionTitle}>
              {competitionItem?.value ?? match.leagueName}
            </Text>
            {roundItem && (
              <View style={styles.matchInfoRoundBadge}>
                <Text style={styles.matchInfoRoundBadgeText}>
                  {roundItem.value}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.matchInfoGridRow}>
          <View style={styles.matchInfoGridCard}>
            <View style={styles.matchInfoGridHeader}>
              <Text style={styles.matchInfoGridIcon}>
                {datetimeItem?.icon ?? '📅'}
              </Text>
              <Text style={styles.matchInfoGridLabel}>
                {datetimeItem?.label ?? 'Data e Horário'}
              </Text>
            </View>
            <Text style={styles.matchInfoGridValue}>
              {datetimeItem?.value ?? match.startTime}
            </Text>
            <Text style={styles.matchInfoGridSub}>
              {datetimeItem?.subtitle ?? 'Horário de Brasília'}
            </Text>
          </View>

          <View style={styles.matchInfoGridCard}>
            <View style={styles.matchInfoGridHeader}>
              <View
                style={[
                  styles.matchInfoStatusDot,
                  isLive
                    ? styles.matchInfoStatusDotLive
                    : status === 'FT'
                    ? styles.matchInfoStatusDotDone
                    : styles.matchInfoStatusDotScheduled,
                ]}
              />
              <Text style={styles.matchInfoGridLabel}>Situação</Text>
            </View>
            <Text
              style={[
                styles.matchInfoGridValue,
                isLive && styles.matchInfoGridValueLive,
              ]}
            >
              {statusLabel}
            </Text>
            <Text style={styles.matchInfoGridSub}>
              Placar: {homeTeam.score} x {awayTeam.score}
            </Text>
          </View>
        </View>
      </View>

      {/* Card 2: Estádio, Público e Condições */}
      {(venueItem || attendanceItem || weatherItem) && (
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>LOCAL E CONDIÇÕES</Text>

          {venueItem && (
            <View style={styles.matchInfoVenueCard}>
              <View style={styles.matchInfoVenueIconBox}>
                <Text style={styles.matchInfoIconEmoji}>
                  {venueItem.icon ?? '🏟️'}
                </Text>
              </View>
              <View style={styles.matchInfoVenueBody}>
                <Text style={styles.matchInfoVenueLabel}>{venueItem.label}</Text>
                <Text style={styles.matchInfoVenueName}>{venueItem.value}</Text>
                {venueItem.subtitle && (
                  <Text style={styles.matchInfoVenueLocation}>
                    📍 {venueItem.subtitle}
                  </Text>
                )}
              </View>
            </View>
          )}

          {(attendanceItem || weatherItem) && (
            <View
              style={[
                styles.matchInfoGridRow,
                venueItem && styles.matchInfoSubGridSpacing,
              ]}
            >
              {attendanceItem && (
                <View style={styles.matchInfoGridCard}>
                  <View style={styles.matchInfoGridHeader}>
                    <Text style={styles.matchInfoGridIcon}>
                      {attendanceItem.icon ?? '👥'}
                    </Text>
                    <Text style={styles.matchInfoGridLabel}>
                      {attendanceItem.label}
                    </Text>
                  </View>
                  <Text style={styles.matchInfoGridValue}>
                    {attendanceItem.value}
                  </Text>
                </View>
              )}

              {weatherItem && (
                <View style={styles.matchInfoGridCard}>
                  <View style={styles.matchInfoGridHeader}>
                    <Text style={styles.matchInfoGridIcon}>
                      {weatherItem.icon ?? '🌤️'}
                    </Text>
                    <Text style={styles.matchInfoGridLabel}>
                      {weatherItem.label}
                    </Text>
                  </View>
                  <Text style={styles.matchInfoGridValue}>
                    {weatherItem.value}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Card 3: Equipes na Partida */}
      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>EQUIPES NA PARTIDA</Text>
        {(
          [
            { side: 'HOME' as const, role: 'Mandante', team: homeTeam },
            { side: 'AWAY' as const, role: 'Visitante', team: awayTeam },
          ] as const
        ).map(({ side, role, team }, index) => {
          const yellowCount = getTeamYellowCards(side);
          const redCount = getTeamRedCards(side, team);
          return (
            <View
              key={team.id}
              style={[
                styles.matchInfoTeamRow,
                index > 0 && styles.matchInfoTeamRowDivider,
              ]}
            >
              <TeamCrest
                logoUrl={team.logoUrl}
                shortName={team.shortName}
                color={team.badgeColor}
                size={30}
              />
              <View style={styles.matchInfoTeamIdentity}>
                <Text style={styles.matchInfoTeamName} numberOfLines={1}>
                  {team.name}
                </Text>
                <Text style={styles.matchInfoTeamRole}>{role}</Text>
              </View>
              <View style={styles.matchInfoTeamStatsRow}>
                <View style={styles.matchInfoTeamChip}>
                  <Text style={styles.matchInfoTeamChipText}>
                    ⚽ {team.score}
                  </Text>
                </View>
                <View style={styles.matchInfoTeamChip}>
                  <View
                    style={[styles.eventCardIcon, styles.eventYellowCard]}
                  />
                  <Text style={styles.matchInfoTeamChipText}>
                    {yellowCount}
                  </Text>
                </View>
                <View style={styles.matchInfoTeamChip}>
                  <View style={[styles.eventCardIcon, styles.eventRedCard]} />
                  <Text style={styles.matchInfoTeamChipText}>{redCount}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Card 4: Arbitragem, Transmissão e Extras */}
      {(parsedOfficials.length > 0 ||
        parsedBroadcasts.length > 0 ||
        extraItems.length > 0) && (
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>ARBITRAGEM E TRANSMISSÃO</Text>

          {parsedOfficials.length > 0 && (
            <View style={styles.matchInfoBlock}>
              <Text style={styles.matchInfoSubHeader}>🧑‍⚖️ Equipe de Arbitragem</Text>
              <View style={styles.matchInfoOfficialsList}>
                {parsedOfficials.map((official, index) => (
                  <View
                    key={`${official.name}-${index}`}
                    style={styles.matchInfoOfficialRow}
                  >
                    <Text style={styles.matchInfoOfficialName}>
                      {official.name}
                    </Text>
                    <View style={styles.matchInfoOfficialRoleBadge}>
                      <Text style={styles.matchInfoOfficialRoleText}>
                        {official.role}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {parsedBroadcasts.length > 0 && (
            <View
              style={[
                styles.matchInfoBlock,
                parsedOfficials.length > 0 && styles.matchInfoBlockDivider,
              ]}
            >
              <Text style={styles.matchInfoSubHeader}>📺 Transmissão</Text>
              <View style={styles.matchInfoBroadcastChips}>
                {parsedBroadcasts.map((channel) => (
                  <View key={channel} style={styles.matchInfoBroadcastChip}>
                    <Text style={styles.matchInfoBroadcastChipText}>
                      {channel}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {extraItems.map((item) => (
            <View key={item.id} style={styles.matchInfoRow}>
              <Text style={styles.matchInfoLabel}>{item.label}</Text>
              <Text style={styles.matchInfoValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const StandingsTable: React.FC<StandingsTableProps> = ({
  standings,
  isProjected,
  homeTeam,
  awayTeam,
}) => {
  const homeName = homeTeam.name.trim().toLocaleLowerCase();
  const awayName = awayTeam.name.trim().toLocaleLowerCase();
  const isCurrentMatchTeam = (standing: MatchStanding): boolean => {
    if (standing.teamId === homeTeam.id || standing.teamId === awayTeam.id) {
      return true;
    }
    const name = standing.teamName.trim().toLocaleLowerCase();
    return name === homeName || name === awayName;
  };

  return (
    <View style={styles.sectionBox}>
      {isProjected && (
        <Text style={styles.provisionalNote}>
          Classificação provisória com os placares ao vivo
        </Text>
      )}
      <View style={styles.standingsHeader}>
        <Text style={styles.standingRank} />
        <Text style={[styles.standingTeam, styles.standingColumnTitle]}>CLUBE</Text>
        <Text style={styles.standingColumnTitle}>PJ</Text>
        <Text style={styles.standingColumnTitle}>V</Text>
        <Text style={styles.standingColumnTitle}>E</Text>
        <Text style={styles.standingColumnTitle}>D</Text>
        <Text style={styles.standingColumnTitle}>SG</Text>
        <Text style={[styles.standingColumnTitle, styles.pointsColumn]}>PTS</Text>
      </View>
      {standings.map((standing) => {
        const isHighlighted = isCurrentMatchTeam(standing);
        return (
          <View
            key={standing.teamId}
            style={[
              styles.standingRow,
              isHighlighted && styles.standingRowHighlighted,
            ]}
          >
            <Text
              style={[
                styles.standingRank,
                isHighlighted && styles.standingRankHighlighted,
              ]}
            >
              {standing.rank}
            </Text>
            <View style={styles.standingTeam}>
              <TeamCrest
                logoUrl={standing.logoUrl}
                shortName={standing.teamName.slice(0, 3).toUpperCase()}
                color={isHighlighted ? '#078B61' : '#71827B'}
                size={17}
              />
              <Text
                style={[
                  styles.standingTeamName,
                  isHighlighted && styles.standingTeamNameHighlighted,
                ]}
                numberOfLines={1}
              >
                {standing.teamName}
              </Text>
            </View>
            <Text
              style={[
                styles.standingValue,
                isHighlighted && styles.standingValueHighlighted,
              ]}
            >
              {standing.played}
            </Text>
            <Text
              style={[
                styles.standingValue,
                isHighlighted && styles.standingValueHighlighted,
              ]}
            >
              {standing.wins}
            </Text>
            <Text
              style={[
                styles.standingValue,
                isHighlighted && styles.standingValueHighlighted,
              ]}
            >
              {standing.draws}
            </Text>
            <Text
              style={[
                styles.standingValue,
                isHighlighted && styles.standingValueHighlighted,
              ]}
            >
              {standing.losses}
            </Text>
            <Text
              style={[
                styles.standingValue,
                isHighlighted && styles.standingValueHighlighted,
              ]}
            >
              {standing.goalDifference}
            </Text>
            <Text
              style={[
                styles.standingValue,
                styles.pointsColumn,
                isHighlighted && styles.pointsColumnHighlighted,
              ]}
            >
              {standing.points}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

function getFormationRows(lineup: MatchLineup) {
  const starters = [...lineup.players.filter((player) => player.isStarter)].sort(
    (a, b) => (a.formationPlace ?? 99) - (b.formationPlace ?? 99)
  );
  const formationNumbers = (lineup.formation ?? '')
    .split('-')
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((num) => Number.isInteger(num) && num > 0);
  const totalOutfield = formationNumbers.reduce((sum, num) => sum + num, 0);

  if (starters.length === 11 && totalOutfield === 10) {
    const goalkeeper =
      starters.find((player) => /goalkeeper/i.test(player.position)) ??
      starters[0];
    const outfielders = starters.filter((player) => player.id !== goalkeeper.id);
    const rows: Array<{ id: string; players: typeof starters }> = [
      { id: 'goalkeeper', players: [goalkeeper] },
    ];
    let cursor = 0;
    formationNumbers.forEach((count, index) => {
      rows.push({
        id: `line-${index + 1}`,
        players: outfielders.slice(cursor, cursor + count),
      });
      cursor += count;
    });
    return rows.filter((row) => row.players.length > 0);
  }

  return [
    {
      id: 'goalkeeper',
      players: starters.filter((player) => /goalkeeper/i.test(player.position)),
    },
    {
      id: 'defense',
      players: starters.filter((player) =>
        /defender|back/i.test(player.position)
      ),
    },
    {
      id: 'midfield',
      players: starters.filter((player) =>
        /midfield|midfielder|winger/i.test(player.position)
      ),
    },
    {
      id: 'attack',
      players: starters.filter((player) =>
        /forward|striker|attacker/i.test(player.position)
      ),
    },
  ].filter((row) => row.players.length > 0);
}

function hasCompleteFormation(lineup: MatchLineup): boolean {
  const starters = lineup.players.filter((player) => player.isStarter);
  const formationRows = getFormationRows(lineup);
  return (
    Boolean(lineup.formation) &&
    starters.length === 11 &&
    formationRows.reduce((count, row) => count + row.players.length, 0) === 11
  );
}

function getShortPitchName(name: string, shortName?: string): string {
  if (shortName && shortName.trim()) return shortName.trim();
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return name.trim();
  return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}

function FormationHalf({
  lineup,
  reverse,
}: {
  lineup: MatchLineup;
  reverse?: boolean;
}) {
  const formationRows = getFormationRows(lineup);
  const orderedRows = reverse ? [...formationRows].reverse() : formationRows;

  return (
    <View style={styles.pitchHalf}>
      {!reverse && (
        <View style={styles.pitchTeamHeader}>
          <Text style={styles.pitchTeamName} numberOfLines={1}>
            {lineup.teamName}
          </Text>
          <Text style={styles.pitchFormation}>{lineup.formation}</Text>
        </View>
      )}
      <View style={styles.pitchRows}>
        {orderedRows.map((row) => (
          <View key={row.id} style={styles.pitchPlayerRow}>
            {row.players
              .sort((a, b) => (a.formationPlace ?? 0) - (b.formationPlace ?? 0))
              .map((player) => (
                <View key={player.id} style={styles.pitchPlayer}>
                  <View style={styles.pitchAvatarWrapper}>
                    <View
                      style={[
                        styles.pitchAvatarCircle,
                        reverse
                          ? styles.pitchAvatarCircleHome
                          : styles.pitchAvatarCircleAway,
                      ]}
                    >
                      <Text style={styles.pitchAvatarInitials}>
                        {getPlayerInitials(player.name)}
                      </Text>
                    </View>

                    {(player.redCard || player.yellowCard) && (
                      <View style={styles.pitchEventTopLeft}>
                        <View
                          style={[
                            styles.pitchMiniCard,
                            player.redCard
                              ? styles.pitchMiniRedCard
                              : styles.pitchMiniYellowCard,
                          ]}
                        />
                      </View>
                    )}

                    {player.subbedOut && (
                      <View style={styles.pitchEventBottomLeft}>
                        <Text style={styles.pitchEventSubIcon}>⇄</Text>
                      </View>
                    )}

                    {(player.goals ?? 0) > 0 && (
                      <View style={styles.pitchEventTopRight}>
                        <Text style={styles.pitchEventBallIcon}>⚽</Text>
                      </View>
                    )}

                    {(player.assists ?? 0) > 0 && (
                      <View style={styles.pitchEventBottomRight}>
                        <Text style={styles.pitchEventAssistIcon}>👟</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.pitchPlayerName} numberOfLines={2}>
                    <Text style={styles.pitchPlayerJerseyInline}>
                      {player.jersey ?? player.formationPlace}{' '}
                    </Text>
                    {getShortPitchName(player.name, player.shortName)}
                  </Text>
                </View>
              ))}
          </View>
        ))}
      </View>
      {reverse && (
        <View style={styles.pitchTeamHeader}>
          <Text style={styles.pitchTeamName} numberOfLines={1}>
            {lineup.teamName}
          </Text>
          <Text style={styles.pitchFormation}>{lineup.formation}</Text>
        </View>
      )}
    </View>
  );
}

function getPlayerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const MatchLineupsPanel: React.FC<{
  lineups: MatchLineup[];
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
}> = ({ lineups, homeTeam, awayTeam }) => {
  const [selectedSide, setSelectedSide] = useState<'HOME' | 'AWAY'>('HOME');
  const homeLineup = lineups.find((lineup) => lineup.teamSide === 'HOME');
  const awayLineup = lineups.find((lineup) => lineup.teamSide === 'AWAY');
  const activeLineup =
    (selectedSide === 'HOME' ? homeLineup : awayLineup) ??
    homeLineup ??
    awayLineup ??
    lineups[0];
  const canShowCombinedPitch =
    Boolean(
      homeLineup &&
        awayLineup &&
        hasCompleteFormation(homeLineup) &&
        hasCompleteFormation(awayLineup)
    );

  return (
    <View style={styles.lineupsContainer}>
      {canShowCombinedPitch && homeLineup && awayLineup && (
        <View style={styles.pitch}>
          <View style={styles.pitchPenaltyBoxTop} />
          <View style={styles.pitchGoalBoxTop} />
          <View style={styles.pitchHalfwayLine} />
          <View style={styles.pitchCenterCircle} />
          <View style={styles.pitchCenterSpot} />
          <View style={styles.pitchPenaltyBoxBottom} />
          <View style={styles.pitchGoalBoxBottom} />
          <FormationHalf lineup={awayLineup} />
          <FormationHalf lineup={homeLineup} reverse />
        </View>
      )}
      {lineups.length > 1 && (
        <View style={styles.lineupTeamSelector}>
          {(['HOME', 'AWAY'] as const).map((side) => {
            const lineup = side === 'HOME' ? homeLineup : awayLineup;
            if (!lineup) return null;
            const fallbackTeam = side === 'HOME' ? homeTeam : awayTeam;
            const isSelected = activeLineup?.teamSide === side;
            return (
              <TouchableOpacity
                key={side}
                accessibilityRole="tab"
                accessibilityLabel={`Ver formação de ${lineup.teamName || fallbackTeam.name}`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => setSelectedSide(side)}
                style={[
                  styles.lineupTeamOption,
                  isSelected && styles.lineupTeamOptionActive,
                ]}
              >
                <TeamCrest
                  logoUrl={lineup.teamLogoUrl ?? fallbackTeam.logoUrl}
                  shortName={
                    (lineup.teamName || fallbackTeam.shortName)
                      .slice(0, 3)
                      .toUpperCase()
                  }
                  color={fallbackTeam.badgeColor}
                  size={22}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      {activeLineup && (
        <MatchLineupPanel
          key={activeLineup.teamSide}
          lineup={activeLineup}
          teamInfo={activeLineup.teamSide === 'HOME' ? homeTeam : awayTeam}
          hideStarters={canShowCombinedPitch}
        />
      )}
    </View>
  );
};

const MatchLineupPanel: React.FC<{
  lineup: MatchLineup;
  teamInfo: TeamInfo;
  hideStarters?: boolean;
}> = ({ lineup, teamInfo, hideStarters = false }) => {
  const starters = lineup.players.filter((player) => player.isStarter);
  const substitutes = [...lineup.players.filter((player) => !player.isStarter)].sort(
    (a, b) => Number(Boolean(b.subbedIn)) - Number(Boolean(a.subbedIn))
  );

  return (
    <View style={styles.lineupPanel}>
      <View style={styles.lineupHeader}>
        <TeamCrest
          logoUrl={lineup.teamLogoUrl ?? teamInfo.logoUrl}
          shortName={(lineup.teamName || teamInfo.shortName).slice(0, 3).toUpperCase()}
          color={teamInfo.badgeColor}
          size={24}
        />
        <Text style={styles.lineupTeamName}>
          {lineup.teamName || teamInfo.name}
        </Text>
        {lineup.formation && (
          <Text style={styles.formationBadge}>{lineup.formation}</Text>
        )}
      </View>

      {substitutes.length > 0 && (
        <View style={styles.lineupSectionBlock}>
          <Text style={styles.lineupCenteredSectionTitle}>Substituições</Text>
          {substitutes.map((player) => (
            <View key={player.id} style={styles.lineupPlayerRow}>
              <View style={styles.lineupAvatar}>
                <Text style={styles.lineupAvatarText}>
                  {getPlayerInitials(player.name)}
                </Text>
              </View>
              <View style={styles.lineupPlayerMain}>
                <Text style={styles.lineupPlayerName} numberOfLines={1}>
                  {player.jersey ? `${player.jersey} ` : ''}
                  {player.name}
                </Text>
                {player.subbedIn && (
                  <View style={styles.lineupSubMetaRow}>
                    <View style={styles.lineupSubInBadge}>
                      <Text style={styles.lineupSubBadgeArrow}>➜</Text>
                    </View>
                    {player.subMinute && (
                      <Text style={styles.lineupSubInMinute}>
                        {player.subMinute}
                      </Text>
                    )}
                    {player.replacedPlayerName && (
                      <Text style={styles.lineupSubOutLabel} numberOfLines={1}>
                        Saiu: {player.replacedPlayerName}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {!hideStarters && starters.length > 0 && (
        <View
          style={[
            styles.lineupSectionBlock,
            substitutes.length > 0 && styles.substitutesTitle,
          ]}
        >
          <Text style={styles.lineupCenteredSectionTitle}>Titulares</Text>
          {starters.map((player) => (
            <View key={player.id} style={styles.lineupPlayerRow}>
              <View style={styles.lineupAvatar}>
                <Text style={styles.lineupAvatarText}>
                  {getPlayerInitials(player.name)}
                </Text>
              </View>
              <View style={styles.lineupPlayerMain}>
                <Text style={styles.lineupPlayerName} numberOfLines={1}>
                  {player.jersey ? `${player.jersey} ` : ''}
                  {player.name}
                </Text>
                {player.subbedOut ? (
                  <View style={styles.lineupSubMetaRow}>
                    <View style={styles.lineupSubOutBadge}>
                      <Text style={styles.lineupSubBadgeArrow}>⬅</Text>
                    </View>
                    {player.subMinute && (
                      <Text style={styles.lineupSubOutMinute}>
                        {player.subMinute}
                      </Text>
                    )}
                    {player.replacedPlayerName && (
                      <Text style={styles.lineupSubOutLabel} numberOfLines={1}>
                        Entrou: {player.replacedPlayerName}
                      </Text>
                    )}
                  </View>
                ) : player.position && !/substitute/i.test(player.position) ? (
                  <Text style={styles.lineupPosition} numberOfLines={1}>
                    {player.position}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

interface HeadToHeadPanelProps {
  history: MatchHeadToHead;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
}

const HeadToHeadPanel: React.FC<HeadToHeadPanelProps> = ({
  history,
  homeTeam,
  awayTeam,
}) => {
  const isSameClub = (
    matchTeamId: string | undefined,
    matchTeamName: string,
    referenceTeam: TeamInfo
  ): boolean => {
    if (matchTeamId && referenceTeam.id && matchTeamId === referenceTeam.id) {
      return true;
    }
    const normalizedA = matchTeamName.trim().toLocaleLowerCase();
    const normalizedB = referenceTeam.name.trim().toLocaleLowerCase();
    return (
      normalizedA === normalizedB ||
      normalizedA.includes(normalizedB) ||
      normalizedB.includes(normalizedA)
    );
  };

  const resolveTeamCrestProps = (
    teamId: string | undefined,
    teamName: string,
    teamShortName: string | undefined,
    teamLogo: string | undefined
  ) => {
    if (isSameClub(teamId, teamName, homeTeam)) {
      return {
        logoUrl: teamLogo ?? homeTeam.logoUrl,
        shortName: teamShortName ?? homeTeam.shortName,
        color: homeTeam.badgeColor,
      };
    }
    if (isSameClub(teamId, teamName, awayTeam)) {
      return {
        logoUrl: teamLogo ?? awayTeam.logoUrl,
        shortName: teamShortName ?? awayTeam.shortName,
        color: awayTeam.badgeColor,
      };
    }
    return {
      logoUrl: teamLogo,
      shortName:
        teamShortName ??
        teamName
          .split(/\s+/)
          .map((w) => w[0])
          .join('')
          .slice(0, 3)
          .toUpperCase(),
      color: '#334155',
    };
  };

  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;
  let homeGoals = 0;
  let awayGoals = 0;

  history.matches.forEach((item) => {
    const homeIsCurrentHome = isSameClub(
      item.homeTeamId,
      item.homeTeamName,
      homeTeam
    );
    const currentHomeScore = homeIsCurrentHome ? item.homeScore : item.awayScore;
    const currentAwayScore = homeIsCurrentHome ? item.awayScore : item.homeScore;

    homeGoals += currentHomeScore;
    awayGoals += currentAwayScore;

    if (currentHomeScore > currentAwayScore) {
      homeWins += 1;
    } else if (currentAwayScore > currentHomeScore) {
      awayWins += 1;
    } else {
      draws += 1;
    }
  });

  const totalMatches = history.matches.length;
  const totalGoals = homeGoals + awayGoals;
  const avgGoals =
    totalMatches > 0 ? (totalGoals / totalMatches).toFixed(1).replace('.', ',') : '0,0';

  const homeWinPct = totalMatches > 0 ? (homeWins / totalMatches) * 100 : 33;
  const drawPct = totalMatches > 0 ? (draws / totalMatches) * 100 : 34;
  const awayWinPct = totalMatches > 0 ? (awayWins / totalMatches) * 100 : 33;

  return (
    <View style={styles.h2hContainer}>
      {/* Card 1: Resumo Geral do Confronto */}
      <View style={styles.sectionBox}>
        <View style={styles.h2hHeaderRow}>
          <Text style={styles.sectionTitle}>RETROSPECTO DO CONFRONTO</Text>
          {totalMatches > 0 && (
            <View style={styles.h2hTotalCountPill}>
              <Text style={styles.h2hTotalCountText}>
                {totalMatches} {totalMatches === 1 ? 'JOGO' : 'JOGOS'}
              </Text>
            </View>
          )}
        </View>

        {totalMatches > 0 ? (
          <>
            <View style={styles.h2hSummaryGrid}>
              <View style={[styles.h2hStatCard, styles.h2hStatCardHome]}>
                <View style={styles.h2hStatTeamRow}>
                  <TeamCrest
                    logoUrl={homeTeam.logoUrl}
                    shortName={homeTeam.shortName}
                    color={homeTeam.badgeColor}
                    size={20}
                  />
                  <Text style={styles.h2hStatNumberHome}>{homeWins}</Text>
                </View>
                <Text style={styles.h2hStatLabel} numberOfLines={1}>
                  Vitórias {homeTeam.shortName || homeTeam.name}
                </Text>
              </View>

              <View style={[styles.h2hStatCard, styles.h2hStatCardDraw]}>
                <Text style={styles.h2hStatNumberDraw}>{draws}</Text>
                <Text style={styles.h2hStatLabel}>Empates</Text>
              </View>

              <View style={[styles.h2hStatCard, styles.h2hStatCardAway]}>
                <View style={styles.h2hStatTeamRow}>
                  <Text style={styles.h2hStatNumberAway}>{awayWins}</Text>
                  <TeamCrest
                    logoUrl={awayTeam.logoUrl}
                    shortName={awayTeam.shortName}
                    color={awayTeam.badgeColor}
                    size={20}
                  />
                </View>
                <Text style={styles.h2hStatLabel} numberOfLines={1}>
                  Vitórias {awayTeam.shortName || awayTeam.name}
                </Text>
              </View>
            </View>

            <View style={styles.h2hProgressBar}>
              {homeWins > 0 && (
                <View
                  style={[
                    styles.h2hProgressSegmentHome,
                    { flex: Math.max(1, homeWinPct) },
                  ]}
                />
              )}
              {draws > 0 && (
                <View
                  style={[
                    styles.h2hProgressSegmentDraw,
                    { flex: Math.max(1, drawPct) },
                  ]}
                />
              )}
              {awayWins > 0 && (
                <View
                  style={[
                    styles.h2hProgressSegmentAway,
                    { flex: Math.max(1, awayWinPct) },
                  ]}
                />
              )}
            </View>

            <View style={styles.h2hGoalsSummaryRow}>
              <View style={styles.h2hGoalsChip}>
                <Text style={styles.h2hGoalsChipLabel}>GOLS NO CONFRONTO</Text>
                <Text style={styles.h2hGoalsChipValue}>
                  {homeTeam.shortName} {homeGoals} × {awayGoals} {awayTeam.shortName}
                </Text>
              </View>
              <View style={styles.h2hGoalsChip}>
                <Text style={styles.h2hGoalsChipLabel}>MÉDIA DE GOLS</Text>
                <Text style={styles.h2hGoalsChipValue}>{avgGoals} / partida</Text>
              </View>
            </View>
          </>
        ) : (
          history.summary && (
            <Text style={styles.headToHeadSummary}>{history.summary}</Text>
          )
        )}
      </View>

      {/* Card 2: Lista de Partidas Anteriores no mesmo layout e padrão de fontes do MatchCard */}
      {history.matches.length > 0 &&
        (() => {
          const groupedByComp: Array<{
            id: string;
            competitionName: string;
            items: HeadToHeadMatch[];
          }> = [];

          history.matches.forEach((m) => {
            const compName = m.competitionName || 'Confronto Oficial';
            const last = groupedByComp[groupedByComp.length - 1];
            if (last && last.competitionName === compName) {
              last.items.push(m);
            } else {
              groupedByComp.push({
                id: `${compName}-${m.id}`,
                competitionName: compName,
                items: [m],
              });
            }
          });

          return groupedByComp.map((group) => (
            <View key={group.id} style={styles.h2hLeagueGroup}>
              <View style={styles.h2hLeagueGroupHeader}>
                <View style={styles.h2hLeagueBadge}>
                  <Text style={styles.h2hLeagueBadgeText}>🏆</Text>
                </View>
                <View style={styles.h2hLeagueGroupTitle}>
                  <Text style={styles.h2hLeagueGroupName} numberOfLines={1}>
                    {group.competitionName}
                  </Text>
                  <Text style={styles.h2hLeagueGroupSub} numberOfLines={1}>
                    Histórico Direto
                  </Text>
                </View>
                <View style={styles.h2hLeagueGroupCountPill}>
                  <Text style={styles.h2hLeagueGroupCount}>
                    {group.items.length}
                  </Text>
                </View>
              </View>

              {group.items.map((previousMatch) => {
                const homeWinner =
                  previousMatch.homeScore > previousMatch.awayScore;
                const awayWinner =
                  previousMatch.awayScore > previousMatch.homeScore;

                const homeCrest = resolveTeamCrestProps(
                  previousMatch.homeTeamId,
                  previousMatch.homeTeamName,
                  previousMatch.homeTeamShortName,
                  previousMatch.homeTeamLogo
                );
                const awayCrest = resolveTeamCrestProps(
                  previousMatch.awayTeamId,
                  previousMatch.awayTeamName,
                  previousMatch.awayTeamShortName,
                  previousMatch.awayTeamLogo
                );

                const dateObj = new Date(previousMatch.date);
                const shortDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getFullYear()).slice(-2)}`;

                return (
                  <View key={previousMatch.id} style={styles.h2hMatchRowCard}>
                    <View style={styles.h2hStatusColumn}>
                      <Text style={styles.h2hStartTimeText}>{shortDate}</Text>
                      <View style={styles.h2hStatusPillDone}>
                        <Text style={styles.h2hStatusTextDone}>FIM</Text>
                      </View>
                    </View>

                    <View style={styles.h2hTeamsColumn}>
                      <View style={styles.h2hTeamRow}>
                        <View style={styles.h2hTeamIdentity}>
                          <TeamCrest
                            logoUrl={homeCrest.logoUrl}
                            shortName={homeCrest.shortName}
                            color={homeCrest.color}
                            size={16}
                          />
                          <Text
                            style={[
                              styles.h2hTeamName,
                              homeWinner && styles.h2hTeamNameWinner,
                            ]}
                            numberOfLines={1}
                          >
                            {previousMatch.homeTeamName}
                          </Text>
                        </View>
                        <Text style={styles.h2hScoreText}>
                          {previousMatch.homeScore}
                        </Text>
                      </View>

                      <View style={styles.h2hTeamRow}>
                        <View style={styles.h2hTeamIdentity}>
                          <TeamCrest
                            logoUrl={awayCrest.logoUrl}
                            shortName={awayCrest.shortName}
                            color={awayCrest.color}
                            size={16}
                          />
                          <Text
                            style={[
                              styles.h2hTeamName,
                              awayWinner && styles.h2hTeamNameWinner,
                            ]}
                            numberOfLines={1}
                          >
                            {previousMatch.awayTeamName}
                          </Text>
                        </View>
                        <Text style={styles.h2hScoreText}>
                          {previousMatch.awayScore}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ));
        })()}
    </View>
  );
};

interface ClubProfileContentProps {
  profile: ClubProfile;
}

const ClubProfileContent: React.FC<ClubProfileContentProps> = ({ profile }) => {
  const formChars = (profile.form ?? '')
    .toUpperCase()
    .split('')
    .filter((ch) => ch === 'W' || ch === 'D' || ch === 'L');

  const stats = profile.seasonStats;
  const hasDetailedStats =
    stats &&
    (stats.played !== undefined ||
      stats.points !== undefined ||
      stats.wins !== undefined);

  return (
    <View style={styles.clubProfileContent}>
      {/* Card 1: Identidade do Clube */}
      <View style={styles.clubProfileHeader}>
        <TeamCrest
          logoUrl={profile.logoUrl}
          shortName={profile.shortName}
          color={profile.badgeColor}
          size={52}
        />
        <View style={styles.clubProfileIdentity}>
          <View style={styles.clubProfileTitleRow}>
            <Text style={styles.clubProfileName} numberOfLines={1}>
              {profile.name}
            </Text>
            {profile.shortName && (
              <View style={styles.clubProfileShortPill}>
                <Text style={styles.clubProfileShortText}>
                  {profile.shortName}
                </Text>
              </View>
            )}
          </View>
          {profile.location && (
            <Text style={styles.clubProfileLocation}>
              📍 {profile.location}
            </Text>
          )}
          {profile.venue && (
            <Text style={styles.clubProfileLocation}>
              🏟️ {profile.venue}
            </Text>
          )}
          {(profile.standingSummary || profile.leagueName) && (
            <View style={styles.clubProfileStandingPill}>
              <Text style={styles.clubProfileLeague} numberOfLines={1}>
                🏆 {profile.standingSummary ?? profile.leagueName}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Card 2: Sequência Recente (Form) */}
      {formChars.length > 0 && (
        <View style={styles.clubProfileInfoCard}>
          <Text style={styles.clubProfileSectionTitle}>SEQUÊNCIA RECENTE</Text>
          <View style={styles.clubFormRow}>
            {formChars.map((ch, idx) => {
              const label = ch === 'W' ? 'V' : ch === 'D' ? 'E' : 'D';
              return (
                <View
                  key={`${ch}-${idx}`}
                  style={[
                    styles.clubFormBadge,
                    ch === 'W'
                      ? styles.clubFormWin
                      : ch === 'D'
                      ? styles.clubFormDraw
                      : styles.clubFormLoss,
                  ]}
                >
                  <Text style={styles.clubFormBadgeText}>{label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Card 3: Desempenho na Temporada */}
      {(hasDetailedStats || profile.recordSummary) && (
        <View style={styles.clubProfileInfoCard}>
          <Text style={styles.clubProfileSectionTitle}>
            DESEMPENHO NA TEMPORADA
          </Text>
          {hasDetailedStats && stats ? (
            <View style={styles.clubStatsContainer}>
              <View style={styles.clubStatsGrid}>
                {stats.rank !== undefined && stats.rank > 0 && (
                  <View style={[styles.clubStatBox, styles.clubStatBoxPrimary]}>
                    <Text
                      style={[
                        styles.clubStatBoxValue,
                        styles.clubStatBoxValuePrimary,
                      ]}
                    >
                      {stats.rank}º
                    </Text>
                    <Text style={styles.clubStatBoxLabel}>POSIÇÃO</Text>
                  </View>
                )}
                {stats.points !== undefined && (
                  <View style={[styles.clubStatBox, styles.clubStatBoxPrimary]}>
                    <Text
                      style={[
                        styles.clubStatBoxValue,
                        styles.clubStatBoxValuePrimary,
                      ]}
                    >
                      {stats.points}
                    </Text>
                    <Text style={styles.clubStatBoxLabel}>PONTOS</Text>
                  </View>
                )}
                {stats.played !== undefined && (
                  <View style={styles.clubStatBox}>
                    <Text style={styles.clubStatBoxValue}>{stats.played}</Text>
                    <Text style={styles.clubStatBoxLabel}>JOGOS</Text>
                  </View>
                )}
              </View>

              <View style={styles.clubStatsGrid}>
                {stats.wins !== undefined && (
                  <View style={styles.clubStatBox}>
                    <Text
                      style={[
                        styles.clubStatBoxValue,
                        { color: '#1D4ED8' },
                      ]}
                    >
                      {stats.wins}
                    </Text>
                    <Text style={styles.clubStatBoxLabel}>VITÓRIAS</Text>
                  </View>
                )}
                {stats.draws !== undefined && (
                  <View style={styles.clubStatBox}>
                    <Text style={styles.clubStatBoxValue}>{stats.draws}</Text>
                    <Text style={styles.clubStatBoxLabel}>EMPATES</Text>
                  </View>
                )}
                {stats.losses !== undefined && (
                  <View style={styles.clubStatBox}>
                    <Text
                      style={[
                        styles.clubStatBoxValue,
                        { color: '#E11D48' },
                      ]}
                    >
                      {stats.losses}
                    </Text>
                    <Text style={styles.clubStatBoxLabel}>DERROTAS</Text>
                  </View>
                )}
              </View>

              {(stats.goalsFor !== undefined ||
                stats.goalsAgainst !== undefined ||
                stats.goalDifference !== undefined) && (
                <View style={styles.clubStatsGrid}>
                  {stats.goalsFor !== undefined && (
                    <View style={styles.clubStatBox}>
                      <Text style={styles.clubStatBoxValue}>
                        {stats.goalsFor}
                      </Text>
                      <Text style={styles.clubStatBoxLabel}>GOLS PRÓ</Text>
                    </View>
                  )}
                  {stats.goalsAgainst !== undefined && (
                    <View style={styles.clubStatBox}>
                      <Text style={styles.clubStatBoxValue}>
                        {stats.goalsAgainst}
                      </Text>
                      <Text style={styles.clubStatBoxLabel}>GOLS CONTRA</Text>
                    </View>
                  )}
                  {stats.goalDifference !== undefined && (
                    <View style={styles.clubStatBox}>
                      <Text style={styles.clubStatBoxValue}>
                        {stats.goalDifference > 0
                          ? `+${stats.goalDifference}`
                          : stats.goalDifference}
                      </Text>
                      <Text style={styles.clubStatBoxLabel}>SALDO</Text>
                    </View>
                  )}
                </View>
              )}

              {(stats.homeRecord || stats.awayRecord) && (
                <View style={styles.clubSplitRecordRow}>
                  {stats.homeRecord && (
                    <View style={styles.clubSplitRecordBox}>
                      <Text style={styles.clubSplitRecordLabel}>
                        🏠 EM CASA
                      </Text>
                      <Text style={styles.clubSplitRecordValue}>
                        {stats.homeRecord}
                      </Text>
                    </View>
                  )}
                  {stats.awayRecord && (
                    <View style={styles.clubSplitRecordBox}>
                      <Text style={styles.clubSplitRecordLabel}>
                        ✈️ FORA DE CASA
                      </Text>
                      <Text style={styles.clubSplitRecordValue}>
                        {stats.awayRecord}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.clubProfileRecord}>
              {profile.recordSummary}
            </Text>
          )}
        </View>
      )}

      {/* Card 4: Próximos Jogos */}
      {profile.nextMatches.length > 0 && (
        <View style={styles.clubProfileInfoCard}>
          <Text style={styles.clubProfileSectionTitle}>PRÓXIMOS JOGOS</Text>
          {profile.nextMatches.map((nextMatch, idx) => (
            <View
              key={nextMatch.id}
              style={[
                styles.clubNextMatch,
                idx === 0 && styles.clubNextMatchFirst,
              ]}
            >
              <View style={styles.clubNextMatchMetaRow}>
                {nextMatch.competitionName && (
                  <Text style={styles.clubNextMatchComp} numberOfLines={1}>
                    🏆 {nextMatch.competitionName}
                  </Text>
                )}
                <Text style={styles.clubNextMatchDate}>
                  {(() => {
                    const d = new Date(nextMatch.date);
                    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                  })()}
                </Text>
              </View>
              {nextMatch.homeTeamName && nextMatch.awayTeamName ? (
                <View style={styles.clubNextMatchTeamsRow}>
                  <View style={styles.clubNextMatchTeamCol}>
                    <TeamCrest
                      logoUrl={nextMatch.homeTeamLogo}
                      shortName={nextMatch.homeTeamName.slice(0, 3).toUpperCase()}
                      color="#334155"
                      size={16}
                    />
                    <Text style={styles.clubNextMatchName} numberOfLines={1}>
                      {nextMatch.homeTeamName}
                    </Text>
                  </View>
                  <Text style={styles.clubNextMatchVs}>vs</Text>
                  <View
                    style={[
                      styles.clubNextMatchTeamCol,
                      styles.clubNextMatchTeamColRight,
                    ]}
                  >
                    <Text style={styles.clubNextMatchName} numberOfLines={1}>
                      {nextMatch.awayTeamName}
                    </Text>
                    <TeamCrest
                      logoUrl={nextMatch.awayTeamLogo}
                      shortName={nextMatch.awayTeamName.slice(0, 3).toUpperCase()}
                      color="#334155"
                      size={16}
                    />
                  </View>
                </View>
              ) : (
                <Text style={styles.clubNextMatchName}>{nextMatch.name}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Card 5: Elenco */}
      {profile.roster.length > 0 && (
        <View style={styles.clubProfileInfoCard}>
          <Text style={styles.clubProfileSectionTitle}>
            ELENCO DO CLUBE · {profile.roster.length} ATLETAS
          </Text>
          {profile.roster.map((player, idx) => (
            <View
              key={player.id}
              style={[
                styles.clubRosterRow,
                idx === 0 && styles.clubRosterRowFirst,
              ]}
            >
              <View style={styles.clubRosterJerseyBadge}>
                <Text style={styles.clubRosterJersey}>
                  {player.jersey ?? '—'}
                </Text>
              </View>
              <View style={styles.clubRosterIdentity}>
                <Text style={styles.clubRosterName} numberOfLines={1}>
                  {player.name}
                </Text>
                <Text style={styles.clubRosterPosition} numberOfLines={1}>
                  {[
                    player.citizenship,
                    player.age ? `${player.age} anos` : '',
                  ]
                    .filter(Boolean)
                    .join(' · ') || player.position}
                </Text>
              </View>
              <View style={styles.clubRosterPosPill}>
                <Text style={styles.clubRosterPosPillText}>
                  {player.position}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  match,
  matches,
  visible,
  onClose,
  sidePanel = false,
}) => {
  const [details, setDetails] = useState<MatchDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [refreshDetailsKey, setRefreshDetailsKey] = useState(0);
  const [tabsContentWidth, setTabsContentWidth] = useState(0);
  const [tabsViewportWidth, setTabsViewportWidth] = useState(0);
  const [tabsScrollX, setTabsScrollX] = useState(0);
  const tabLayoutsRef = useRef<Record<string, { x: number; width: number }>>({});
  const tabsScrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [activeTab, setActiveTab] = useState<
    'SUMMARY' | 'STATS' | 'STANDINGS' | 'LINEUPS' | 'HEAD_TO_HEAD' | 'INFO'
  >('SUMMARY');
  const [profileTeam, setProfileTeam] = useState<TeamInfo | null>(null);
  const [clubProfile, setClubProfile] = useState<ClubProfile | null>(null);
  const [clubProfileError, setClubProfileError] = useState<string | null>(null);
  const [isLoadingClubProfile, setIsLoadingClubProfile] = useState(false);
  const [teamSearch, setTeamSearch] = useState('');
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const matchesRef = useRef(matches);
  matchesRef.current = matches;
  const searchableTeams = useMemo(() => {
    const teams = new Map<string, TeamInfo>();
    matches.forEach((fixture) => {
      teams.set(fixture.homeTeam.id, fixture.homeTeam);
      teams.set(fixture.awayTeam.id, fixture.awayTeam);
    });
    return Array.from(teams.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [matches]);
  const filteredSearchTeams = useMemo(() => {
    const query = teamSearch.trim().toLocaleLowerCase();
    if (!query) return [];
    return searchableTeams
      .filter((team) => team.name.toLocaleLowerCase().includes(query))
      .slice(0, 12);
  }, [searchableTeams, teamSearch]);
  const { width, height } = useWindowDimensions();
  const isWide = width >= 900;

  const translateY = useRef(new Animated.Value(0)).current;
  const isScrollAtTopRef = useRef(true);
  const homeScoreScale = useRef(new Animated.Value(1)).current;
  const awayScoreScale = useRef(new Animated.Value(1)).current;
  const homeScoreHighlight = useRef(new Animated.Value(0)).current;
  const awayScoreHighlight = useRef(new Animated.Value(0)).current;
  const [animatingHome, setAnimatingHome] = useState(false);
  const [animatingAway, setAnimatingAway] = useState(false);
  const previousScores = useRef<{ home: number; away: number } | null>(null);
  const profileTeamRef = useRef(profileTeam);
  profileTeamRef.current = profileTeam;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const dismissModal = () => {
    if (profileTeamRef.current) {
      setProfileTeam(null);
      return;
    }
    if (!sidePanel && !isWide) {
      Animated.timing(translateY, {
        toValue: height || 800,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        translateY.setValue(0);
        onCloseRef.current();
      });
    } else {
      onCloseRef.current();
    }
  };

  const handleGestureEnd = (gestureState: { dy: number; vy: number }) => {
    // If dragged down past 50px or flicked down with downward velocity
    if (gestureState.dy > 50 || (gestureState.dy > 15 && gestureState.vy > 0.25)) {
      Animated.timing(translateY, {
        toValue: height || 800,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        translateY.setValue(0);
        if (profileTeamRef.current) {
          setProfileTeam(null);
        } else {
          onCloseRef.current();
        }
      });
    } else {
      Animated.spring(translateY, {
        toValue: 0,
        bounciness: 3,
        speed: 16,
        useNativeDriver: true,
      }).start();
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (sidePanel || isWide) return false;
        // Respond when at the top of scroll view and dragging downward
        return (
          isScrollAtTopRef.current &&
          gestureState.dy > 6 &&
          gestureState.dy > Math.abs(gestureState.dx) * 1.2
        );
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        } else {
          translateY.setValue(0);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        handleGestureEnd(gestureState);
      },
      onPanResponderTerminate: (_, gestureState) => {
        handleGestureEnd(gestureState);
      },
    })
  ).current;

  useEffect(() => {
    translateY.setValue(0);
    isScrollAtTopRef.current = true;
    setDetails(null);
    setDetailsError(null);
    setActiveTab('SUMMARY');
    setTabsScrollX(0);
    tabsScrollRef.current?.scrollTo({ x: 0, animated: false });
    setProfileTeam(null);
    setClubProfile(null);
    setTeamSearch('');
    previousScores.current = null;
    homeScoreScale.setValue(1);
    awayScoreScale.setValue(1);
    homeScoreHighlight.setValue(0);
    awayScoreHighlight.setValue(0);
    setAnimatingHome(false);
    setAnimatingAway(false);
  }, [match?.id, visible]);

  useEffect(() => {
    if (!profileTeam) {
      setClubProfile(null);
      setClubProfileError(null);
      setIsLoadingClubProfile(false);
      return;
    }

    let isActive = true;
    setClubProfile(null);
    setIsLoadingClubProfile(true);
    setClubProfileError(null);
    fetchClubProfile(profileTeam)
      .then((profile) => {
        if (isActive) setClubProfile(profile);
      })
      .catch((error: unknown) => {
        console.error('Falha ao buscar o perfil do clube:', error);
        if (isActive) {
          setClubProfileError(
            error instanceof TypeError
              ? 'Não foi possível conectar à API da ESPN. Verifique sua conexão e tente novamente.'
              : error instanceof Error
                ? error.message
                : 'Não foi possível carregar o perfil do clube.'
          );
        }
      })
      .finally(() => {
        if (isActive) setIsLoadingClubProfile(false);
      });

    return () => {
      isActive = false;
    };
  }, [profileTeam?.id, profileRefreshKey]);

  useEffect(() => {
    if (!visible || !match) return;

    let isActive = true;
    let isFetching = false;
    let hasLoadedOnce = false;
    const loadDetails = async () => {
      if (isFetching) return;
      isFetching = true;
      if (!hasLoadedOnce) {
        setIsLoadingDetails(true);
      }
      setDetailsError(null);

      try {
        const currentMatch =
          matchesRef.current.find((item) => item.id === match.id) ?? match;
        const result = await fetchMatchDetails(currentMatch, matchesRef.current);
        if (isActive) {
          hasLoadedOnce = true;
          setDetails(result);
        }
      } catch (error) {
        console.error('Falha ao buscar detalhes da partida:', error);
        if (isActive && !hasLoadedOnce) {
          setDetailsError(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar os detalhes da partida.'
          );
        }
      } finally {
        isFetching = false;
        if (isActive) setIsLoadingDetails(false);
      }
    };
    void loadDetails();
    const interval = setInterval(
      loadDetails,
      API_CONFIG.LIVE_DETAIL_REFRESH_INTERVAL_MS
    );

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [match?.id, visible, refreshDetailsKey, match?.homeTeam.score, match?.awayTeam.score]);

  if (!match) return null;

  const matchStatus = details?.status ?? match.status;
  const matchMinute = Math.max(match.minute ?? 0, details?.minute ?? 0) || details?.minute || match.minute;
  const matchMinuteLabel = details?.minuteLabel ?? match.minuteLabel;
  const isLive = matchStatus === '1H' || matchStatus === '2H' || matchStatus === 'HT';
  const isFinished = matchStatus === 'FT';

  // Placar instantâneo: reflete imediatamente a pontuação mais recente (seja do feed de jogos ou do detalhe)
  const homeScore = Math.max(match.homeTeam.score, details?.homeTeam.score ?? 0);
  const awayScore = Math.max(match.awayTeam.score, details?.awayTeam.score ?? 0);

  const homeTeam: TeamInfo = {
    ...(details?.homeTeam ?? match.homeTeam),
    score: homeScore,
  };
  const awayTeam: TeamInfo = {
    ...(details?.awayTeam ?? match.awayTeam),
    score: awayScore,
  };
  const isHomeWinner = isFinished && homeTeam.score > awayTeam.score;
  const isAwayWinner = isFinished && awayTeam.score > homeTeam.score;

  useEffect(() => {
    if (!previousScores.current) {
      previousScores.current = {
        home: homeTeam.score,
        away: awayTeam.score,
      };
      return;
    }

    const { home, away } = previousScores.current;

    if (home !== homeTeam.score) {
      setAnimatingHome(true);
      Animated.parallel([
        Animated.sequence([
          Animated.timing(homeScoreScale, {
            toValue: 1.45,
            duration: 180,
            useNativeDriver: false,
          }),
          Animated.spring(homeScoreScale, {
            toValue: 1,
            friction: 3.5,
            tension: 130,
            useNativeDriver: false,
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
      ]).start(() => setAnimatingHome(false));
    }

    if (away !== awayTeam.score) {
      setAnimatingAway(true);
      Animated.parallel([
        Animated.sequence([
          Animated.timing(awayScoreScale, {
            toValue: 1.45,
            duration: 180,
            useNativeDriver: false,
          }),
          Animated.spring(awayScoreScale, {
            toValue: 1,
            friction: 3.5,
            tension: 130,
            useNativeDriver: false,
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
      ]).start(() => setAnimatingAway(false));
    }

    previousScores.current = {
      home: homeTeam.score,
      away: awayTeam.score,
    };
  }, [
    homeTeam.score,
    awayTeam.score,
    homeScoreScale,
    awayScoreScale,
    homeScoreHighlight,
    awayScoreHighlight,
  ]);
  const matchStats = details?.stats ?? match.stats;
  const rawMatchEvents = details?.events ?? match.events ?? [];

  // Identifica se há gols no placar que ainda não possuem evento/autor retornado pela API
  const homeGoalsInEvents = rawMatchEvents.filter(
    (event) => event.type === 'GOAL' && event.team === 'HOME'
  );
  const awayGoalsInEvents = rawMatchEvents.filter(
    (event) => event.type === 'GOAL' && event.team === 'AWAY'
  );

  const missingHomeGoals = Math.max(0, homeTeam.score - homeGoalsInEvents.length);
  const missingAwayGoals = Math.max(0, awayTeam.score - awayGoalsInEvents.length);

  const provisionalGoals = useMemo(() => {
    if (missingHomeGoals === 0 && missingAwayGoals === 0) return [];

    const list: MatchEvent[] = [];
    const currentMin = matchMinute ?? match.minute ?? 0;
    const currentPeriod =
      matchStatus === '2H' || (currentMin > 45 && matchStatus !== '1H') ? 2 : 1;
    const currentTimeStr =
      matchMinuteLabel ?? (currentMin > 0 ? `${currentMin}'` : '');

    for (let i = 0; i < missingHomeGoals; i++) {
      const idx = homeGoalsInEvents.length + i + 1;
      list.push({
        id: `provisional-goal-home-${match.id}-${idx}`,
        minute: currentMin,
        time: currentTimeStr,
        period: currentPeriod,
        type: 'GOAL',
        label: 'Gol',
        team: 'HOME',
        playerName: 'Gol',
        detail: 'Gol confirmado no placar',
      });
    }

    for (let i = 0; i < missingAwayGoals; i++) {
      const idx = awayGoalsInEvents.length + i + 1;
      list.push({
        id: `provisional-goal-away-${match.id}-${idx}`,
        minute: currentMin,
        time: currentTimeStr,
        period: currentPeriod,
        type: 'GOAL',
        label: 'Gol',
        team: 'AWAY',
        playerName: 'Gol',
        detail: 'Gol confirmado no placar',
      });
    }

    return list;
  }, [
    missingHomeGoals,
    missingAwayGoals,
    homeGoalsInEvents.length,
    awayGoalsInEvents.length,
    match.id,
    matchMinute,
    match.minute,
    matchMinuteLabel,
    matchStatus,
  ]);

  const matchEvents = useMemo(() => {
    if (provisionalGoals.length === 0) return rawMatchEvents;
    return [...rawMatchEvents, ...provisionalGoals];
  }, [rawMatchEvents, provisionalGoals]);

  const standings = details?.standings ?? null;
  const lineups = details?.lineups ?? null;
  const headToHead = details?.headToHead ?? null;
  const matchInfo = details?.info ?? [];
  const hasAdditionalStats = Boolean(details?.additionalStats.length);
  const hasStatistics = Boolean(matchStats || hasAdditionalStats);
  const firstHalfEvents = (matchEvents ?? [])
    .filter((event) => event.period === 1 && !isPeriodMarkerEvent(event))
    .reverse();
  const secondHalfEvents = (matchEvents ?? [])
    .filter((event) => event.period >= 2 && !isPeriodMarkerEvent(event))
    .reverse();
  const goalsForTeam = (team: 'HOME' | 'AWAY') =>
    (matchEvents ?? [])
      .filter((event) => event.type === 'GOAL' && event.team === team)
      .sort((a, b) => a.period - b.period || a.minute - b.minute);
  const getGoalTime = (event: MatchEvent) => {
    const time = (event.time ?? '').trim();
    return time
      ? /['′]$/.test(time)
        ? time
        : `${time}'`
      : event.minute > 0
      ? `${event.minute}'`
      : '';
  };
  const hasSecondHalfStarted =
    matchStatus === '2H' || matchStatus === 'FT' || secondHalfEvents.length > 0;
  const tabs = [
    { id: 'SUMMARY' as const, label: 'Resumo' },
    { id: 'STATS' as const, label: 'Estatísticas' },
    ...(lineups?.length ? [{ id: 'LINEUPS' as const, label: 'Formações' }] : []),
    ...(standings?.length ? [{ id: 'STANDINGS' as const, label: 'Classificação' }] : []),
    ...(matchInfo.length ? [{ id: 'INFO' as const, label: 'Informações' }] : []),
    ...(headToHead
      ? [{ id: 'HEAD_TO_HEAD' as const, label: 'Confrontos' }]
      : []),
  ];

  const handleRefreshDetails = () => {
    setRefreshDetailsKey((key) => key + 1);
  };

  const handleOpenClubProfile = (team: TeamInfo) => {
    setProfileTeam(team);
    setTeamSearch('');
  };

  const getComparisonStatistics = (): MatchStatComparisonItem[] => {
    const items: MatchStatComparisonItem[] = [];
    if (
      matchStats?.shotsTotal[0] !== null &&
      matchStats?.shotsTotal[0] !== undefined &&
      matchStats?.shotsTotal[1] !== null &&
      matchStats?.shotsTotal[1] !== undefined
    ) {
      items.push({
        id: 'shotsTotal',
        label: 'Finalizações',
        homeDisplay: `${matchStats.shotsTotal[0]}`,
        awayDisplay: `${matchStats.shotsTotal[1]}`,
        homeValue: Number(matchStats.shotsTotal[0]) || 0,
        awayValue: Number(matchStats.shotsTotal[1]) || 0,
      });
    }
    if (
      matchStats?.shotsOnTarget[0] !== null &&
      matchStats?.shotsOnTarget[0] !== undefined &&
      matchStats?.shotsOnTarget[1] !== null &&
      matchStats?.shotsOnTarget[1] !== undefined
    ) {
      items.push({
        id: 'shotsOnTarget',
        label: 'Finalizações no alvo',
        homeDisplay: `${matchStats.shotsOnTarget[0]}`,
        awayDisplay: `${matchStats.shotsOnTarget[1]}`,
        homeValue: Number(matchStats.shotsOnTarget[0]) || 0,
        awayValue: Number(matchStats.shotsOnTarget[1]) || 0,
      });
    }
    if (
      matchStats?.corners[0] !== null &&
      matchStats?.corners[0] !== undefined &&
      matchStats?.corners[1] !== null &&
      matchStats?.corners[1] !== undefined
    ) {
      items.push({
        id: 'corners',
        label: 'Escanteios',
        homeDisplay: `${matchStats.corners[0]}`,
        awayDisplay: `${matchStats.corners[1]}`,
        homeValue: Number(matchStats.corners[0]) || 0,
        awayValue: Number(matchStats.corners[1]) || 0,
      });
    }
    details?.additionalStats.forEach((statistic) => {
      const suffix = statistic.suffix ?? '';
      const label =
        statistic.id === 'saves'
          ? 'Defesas do goleiro'
          : statistic.id === 'totalPasses'
          ? 'Passes'
          : statistic.label;
      items.push({
        id: statistic.id,
        label,
        homeDisplay: `${statistic.home}${suffix}`,
        awayDisplay: `${statistic.away}${suffix}`,
        homeValue:
          Number.parseFloat(String(statistic.home).replace('%', '')) || 0,
        awayValue:
          Number.parseFloat(String(statistic.away).replace('%', '')) || 0,
      });
    });
    return items;
  };

  return (
    <MatchDetailWrapper
      sidePanel={sidePanel}
      visible={visible}
      onClose={() => (profileTeam ? setProfileTeam(null) : dismissModal())}
    >
      <View
        pointerEvents={sidePanel ? 'box-none' : 'auto'}
        style={[
          styles.backdrop,
          isWide && styles.backdropWide,
          sidePanel && styles.backdropSidePanel,
        ]}
      >
        {!sidePanel && (
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => (profileTeam ? setProfileTeam(null) : dismissModal())}
          />
        )}
        <Animated.View
          style={[
            styles.sheet,
            isWide && styles.sheetWide,
            sidePanel && styles.sheetSidePanel,
            !sidePanel &&
              !isWide && {
                transform: [{ translateY }],
              },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Barra de arraste para mobile */}
          {!sidePanel && !isWide && (
            <View style={styles.dragHandleArea}>
              <View style={styles.handle} />
            </View>
          )}

          {/* Barra superior de título e botão fechar */}
          <View style={styles.sheetTopBar}>
            <Text style={styles.modalTitle}>
              {profileTeam ? 'Perfil do clube' : 'Detalhes da partida'}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={
                profileTeam ? 'Voltar aos detalhes' : 'Fechar detalhes'
              }
              onPress={() => (profileTeam ? setProfileTeam(null) : dismissModal())}
              style={styles.closeBtn}
            >
              <Text style={styles.closeBtnText}>
                {profileTeam ? 'Voltar' : sidePanel ? '×' : 'Fechar'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
            scrollEventThrottle={16}
            onScroll={(event) => {
              const y = event.nativeEvent.contentOffset.y;
              isScrollAtTopRef.current = y <= 2;
            }}
          >
            {profileTeam ? (
              <View>
                <View style={styles.teamSearchContainer}>
                  <TextInput
                    accessibilityLabel="Pesquisar clubes nas partidas carregadas"
                    placeholder="Pesquisar clube"
                    placeholderTextColor="#87958F"
                    returnKeyType="search"
                    value={teamSearch}
                    onChangeText={setTeamSearch}
                    style={styles.teamSearchInput}
                  />
                  <Text style={styles.teamSearchHint}>
                    Busca entre os clubes das partidas carregadas
                  </Text>
                  {teamSearch.trim().length > 0 &&
                    (filteredSearchTeams.length ? (
                      <View style={styles.teamSearchResults}>
                        {filteredSearchTeams.map((team) => (
                          <TouchableOpacity
                            key={team.id}
                            accessibilityRole="button"
                            onPress={() => handleOpenClubProfile(team)}
                            style={styles.teamSearchResult}
                          >
                            <TeamCrest
                              logoUrl={team.logoUrl}
                              shortName={team.shortName}
                              color={team.badgeColor}
                              size={22}
                            />
                            <Text style={styles.teamSearchResultName}>
                              {team.name}
                            </Text>
                            <Text style={styles.teamSearchResultArrow}>›</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.clubProfileUnavailable}>
                        Nenhum clube encontrado nas partidas carregadas.
                      </Text>
                    ))}
                </View>

                {isLoadingClubProfile ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator color="#078B61" size="small" />
                    <Text style={styles.loadingText}>
                      Carregando dados da ESPN…
                    </Text>
                  </View>
                ) : clubProfileError ? (
                  <View style={styles.sectionBox}>
                    <Text style={styles.detailsUpdateError}>
                      {clubProfileError}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        setProfileRefreshKey((key) => key + 1)
                      }
                    >
                      <Text style={styles.retryDetailsText}>
                        Tentar novamente
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : clubProfile ? (
                  <ClubProfileContent profile={clubProfile} />
                ) : null}
              </View>
            ) : (
              <>
            {/* Cabeçalho da Liga */}
            <Text style={styles.leagueHeader}>
              {(() => {
                const resolvedCompetition = matchInfo.find(
                  (item) => item.id === 'competition'
                )?.value;
                const displayLeagueName =
                  resolvedCompetition &&
                  (/^(group stage|regular season|competição internacional)$/i.test(
                    match.leagueName.trim()
                  ) ||
                    match.leagueCountry.toUpperCase() === 'INTERNACIONAL')
                    ? resolvedCompetition
                    : match.leagueName;
                return match.leagueCountry.toUpperCase() === 'INTERNACIONAL'
                  ? displayLeagueName
                  : `${match.leagueCountry.toUpperCase()} • ${displayLeagueName}`;
              })()}
            </Text>

            {/* Placar Expandido */}
            <View style={styles.heroScoreboard}>
              <View style={styles.heroScoreboardTopRow}>
                <View style={styles.heroTeamCol}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Ver perfil de ${match.homeTeam.name}`}
                    activeOpacity={0.75}
                    onPress={() => handleOpenClubProfile(match.homeTeam)}
                    style={styles.heroTeamButton}
                  >
                    <TeamCrest
                      logoUrl={match.homeTeam.logoUrl}
                      shortName={match.homeTeam.shortName}
                      color={match.homeTeam.badgeColor}
                      size={48}
                    />
                    <Text
                      style={[
                        styles.heroTeamName,
                        isFinished && isHomeWinner && styles.heroTeamNameWinner,
                        isFinished && isAwayWinner && styles.heroTeamNameLoser,
                      ]}
                      numberOfLines={1}
                    >
                      {match.homeTeam.name}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.heroCenterCol}>
                  <View style={styles.heroScoreRow}>
                    <Animated.Text
                      style={[
                        styles.heroScoreText,
                        isLive && styles.heroScoreLive,
                        isFinished &&
                          (isHomeWinner
                            ? styles.heroScoreWinner
                            : isAwayWinner
                            ? styles.heroScoreLoser
                            : styles.heroScoreFinished),
                        animatingHome
                          ? {
                              transform: [{ scale: homeScoreScale }],
                              color: homeScoreHighlight.interpolate({
                                inputRange: [0, 1],
                                outputRange: [isLive ? '#CB1818' : '#0F172A', '#16A34A'],
                              }),
                            }
                          : null,
                      ]}
                    >
                      {homeTeam.score}
                    </Animated.Text>
                    <Text
                      style={[
                        styles.heroScoreDash,
                        isLive && styles.heroScoreDashLive,
                      ]}
                    >
                      -
                    </Text>
                    <Animated.Text
                      style={[
                        styles.heroScoreText,
                        isLive && styles.heroScoreLive,
                        isFinished &&
                          (isAwayWinner
                            ? styles.heroScoreWinner
                            : isHomeWinner
                            ? styles.heroScoreLoser
                            : styles.heroScoreFinished),
                        animatingAway
                          ? {
                              transform: [{ scale: awayScoreScale }],
                              color: awayScoreHighlight.interpolate({
                                inputRange: [0, 1],
                                outputRange: [isLive ? '#CB1818' : '#0F172A', '#16A34A'],
                              }),
                            }
                          : null,
                      ]}
                    >
                      {awayTeam.score}
                    </Animated.Text>
                  </View>
                  <View
                    style={[
                      styles.heroStatusPill,
                      isLive ? styles.heroStatusLive : styles.heroStatusDone,
                    ]}
                  >
                    <Text
                      style={[
                        styles.heroStatusText,
                        isLive && styles.heroStatusTextLive,
                      ]}
                    >
                      {matchStatus === 'HT'
                        ? 'INTERVALO'
                        : matchStatus === 'FT'
                        ? 'ENCERRADO'
                        : matchStatus === 'NS'
                        ? match.startTime
                        : `${matchMinuteLabel ?? matchMinute ?? ''}'`}
                    </Text>
                  </View>
                </View>

                <View style={styles.heroTeamCol}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Ver perfil de ${match.awayTeam.name}`}
                    activeOpacity={0.75}
                    onPress={() => handleOpenClubProfile(match.awayTeam)}
                    style={styles.heroTeamButton}
                  >
                    <TeamCrest
                      logoUrl={match.awayTeam.logoUrl}
                      shortName={match.awayTeam.shortName}
                      color={match.awayTeam.badgeColor}
                      size={48}
                    />
                    <Text
                      style={[
                        styles.heroTeamName,
                        isFinished && isAwayWinner && styles.heroTeamNameWinner,
                        isFinished && isHomeWinner && styles.heroTeamNameLoser,
                      ]}
                      numberOfLines={1}
                    >
                      {match.awayTeam.name}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Linha Centralizada de Gols: Mandante  ⚽  Visitante */}
              {(() => {
                const homeGoals = goalsForTeam('HOME');
                const awayGoals = goalsForTeam('AWAY');
                if (homeGoals.length === 0 && awayGoals.length === 0) return null;

                return (
                  <View style={styles.heroScorersContainer}>
                    <View style={styles.heroScorersHomeCol}>
                      {homeGoals.map((hGoal) => {
                        const timeStr = getGoalTime(hGoal);
                        const displayText = timeStr ? `${hGoal.playerName} ${timeStr}` : hGoal.playerName;
                        return (
                          <Text key={hGoal.id} style={styles.heroScorerTextHome} numberOfLines={1}>
                            {displayText}
                          </Text>
                        );
                      })}
                    </View>
                    <View style={styles.heroScorerBallCol}>
                      <Text style={styles.heroScorerBall}>⚽</Text>
                    </View>
                    <View style={styles.heroScorersAwayCol}>
                      {awayGoals.map((aGoal) => {
                        const timeStr = getGoalTime(aGoal);
                        const displayText = timeStr ? `${aGoal.playerName} ${timeStr}` : aGoal.playerName;
                        return (
                          <Text key={aGoal.id} style={styles.heroScorerTextAway} numberOfLines={1}>
                            {displayText}
                          </Text>
                        );
                      })}
                    </View>
                  </View>
                );
              })()}
            </View>

            <View style={styles.tabsRow}>
              {tabsContentWidth > tabsViewportWidth + 4 && tabsScrollX > 4 && (
                <TouchableOpacity
                  accessibilityLabel="Voltar abas para a esquerda"
                  accessibilityRole="button"
                  onPress={() => {
                    const step = Math.max(140, tabsViewportWidth * 0.65);
                    const nextX = Math.max(0, tabsScrollX - step);
                    setTabsScrollX(nextX);
                    tabsScrollRef.current?.scrollTo({ x: nextX, animated: true });
                  }}
                  style={[styles.tabScrollButton, styles.tabScrollButtonLeft]}
                >
                  <Text style={styles.tabScrollButtonText}>‹</Text>
                </TouchableOpacity>
              )}
              <ScrollView
                ref={tabsScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabsScroller}
                contentContainerStyle={styles.tabsContent}
                onLayout={(event) =>
                  setTabsViewportWidth(event.nativeEvent.layout.width)
                }
                onContentSizeChange={(contentWidth) => {
                  setTabsContentWidth(contentWidth);
                  setTabsScrollX((currentX) =>
                    Math.min(
                      currentX,
                      Math.max(0, contentWidth - tabsViewportWidth)
                    )
                  );
                }}
                onScroll={(event) => {
                  setTabsScrollX(event.nativeEvent.contentOffset.x);
                }}
                scrollEventThrottle={16}
              >
                {tabs.map((tab) => (
                  <TouchableOpacity
                    key={tab.id}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: activeTab === tab.id }}
                    onLayout={(event) => {
                      const { x, width: tabWidth } = event.nativeEvent.layout;
                      tabLayoutsRef.current[tab.id] = { x, width: tabWidth };
                    }}
                    onPress={() => {
                      setActiveTab(tab.id);
                      const layout = tabLayoutsRef.current[tab.id];
                      if (
                        layout &&
                        tabsViewportWidth > 0 &&
                        tabsContentWidth > tabsViewportWidth
                      ) {
                        const targetX = Math.max(
                          0,
                          Math.min(
                            tabsContentWidth - tabsViewportWidth,
                            layout.x - (tabsViewportWidth - layout.width) / 2
                          )
                        );
                        setTabsScrollX(targetX);
                        tabsScrollRef.current?.scrollTo({
                          x: targetX,
                          animated: true,
                        });
                      }
                    }}
                    style={[
                      styles.tabButton,
                      activeTab === tab.id && styles.tabButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === tab.id && styles.tabTextActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {tabsContentWidth > tabsViewportWidth + 4 &&
                tabsScrollX < Math.max(0, tabsContentWidth - tabsViewportWidth) - 4 && (
                  <TouchableOpacity
                    accessibilityLabel="Ver mais abas para a direita"
                    accessibilityRole="button"
                    onPress={() => {
                      const maxScrollX = Math.max(
                        0,
                        tabsContentWidth - tabsViewportWidth
                      );
                      const step = Math.max(140, tabsViewportWidth * 0.65);
                      const nextX = Math.min(maxScrollX, tabsScrollX + step);
                      setTabsScrollX(nextX);
                      tabsScrollRef.current?.scrollTo({
                        x: nextX,
                        animated: true,
                      });
                    }}
                    style={[styles.tabScrollButton, styles.tabScrollButtonRight]}
                  >
                    <Text style={styles.tabScrollButtonText}>›</Text>
                  </TouchableOpacity>
                )}
            </View>

            {detailsError && details && (
              <Text style={styles.detailsUpdateError}>
                Falha ao atualizar: {detailsError}
              </Text>
            )}
            {isLoadingDetails && !details ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#078B61" size="small" />
                <Text style={styles.loadingText}>Carregando informações…</Text>
              </View>
            ) : detailsError && !details ? (
              <View style={styles.sectionBox}>
                <Text style={styles.detailsUpdateError}>{detailsError}</Text>
                <TouchableOpacity onPress={handleRefreshDetails}>
                  <Text style={styles.retryDetailsText}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            ) : activeTab === 'SUMMARY' ? (
              <>
                {hasSecondHalfStarted && (
                  <View style={styles.sectionBox}>
                    <Text style={[styles.sectionTitle, styles.sectionTitleCentered]}>
                      SEGUNDO TEMPO
                    </Text>
                    <MatchEventsList events={secondHalfEvents} />
                  </View>
                )}
                <View style={styles.sectionBox}>
                  <Text style={[styles.sectionTitle, styles.sectionTitleCentered]}>
                    PRIMEIRO TEMPO
                  </Text>
                  <MatchEventsList events={firstHalfEvents} />
                </View>
              </>
            ) : activeTab === 'STATS' ? (
              <View style={styles.sectionBox}>
                {hasStatistics ? (
                  <MatchStatisticsOverview
                    possession={matchStats?.possession ?? null}
                    items={getComparisonStatistics()}
                  />
                ) : (
                  <Text style={styles.emptyTabText}>
                    Nenhuma estatística disponível para esta partida.
                  </Text>
                )}
              </View>
            ) : activeTab === 'INFO' ? (
              <MatchInfoPanel
                info={matchInfo}
                match={match}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                status={matchStatus}
                minute={matchMinute}
                minuteLabel={matchMinuteLabel}
                events={matchEvents ?? []}
              />
            ) : activeTab === 'STANDINGS' ? (
              <StandingsTable
                standings={standings ?? []}
                isProjected={details?.standingsAreProjected ?? false}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
              />
            ) : activeTab === 'LINEUPS' && lineups ? (
              <MatchLineupsPanel
                lineups={lineups}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
              />
            ) : activeTab === 'HEAD_TO_HEAD' && headToHead ? (
              <HeadToHeadPanel
                history={headToHead}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
              />
            ) : null}
              </>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </MatchDetailWrapper>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(23, 43, 37, 0.38)',
    justifyContent: 'flex-end',
  },
  backdropWide: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropSidePanel: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    backgroundColor: 'transparent',
  },
  sheet: {
    backgroundColor: '#F8FAF9',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 24,
    height: '92%',
    maxHeight: '92%',
    borderTopWidth: 1,
    borderColor: '#DCE6E1',
  },
  sheetWide: {
    width: '92%',
    maxWidth: 560,
    maxHeight: '78%',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
  },
  sheetSidePanel: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    maxHeight: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCE6E1',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  inlinePanel: {
    flex: 1,
    minWidth: 0,
    height: '100%',
  },
  sheetTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 32,
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
  },
  dragHandleArea: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 10,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  closeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  closeBtnText: {
    color: '#334155',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  leagueHeader: {
    color: '#1D4ED8',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 0.7,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 10,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 7,
  },
  tabButtonActive: {
    backgroundColor: '#1D4ED8',
  },
  tabText: {
    color: '#334155',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  tabScrollButton: {
    width: 26,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DBEAFE',
    borderRadius: 7,
  },
  tabScrollButtonLeft: {
    marginRight: 3,
  },
  tabScrollButtonRight: {
    marginLeft: 3,
  },
  tabScrollButtonText: {
    color: '#1D4ED8',
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '800',
  },
  tabsScroller: {
    flex: 1,
  },
  tabsContent: {
    gap: 3,
  },
  heroScoreboard: {
    flexDirection: 'column',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  heroScoreboardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },
  heroScorersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  heroScorersHomeCol: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 6,
    gap: 2,
  },
  heroScorerTextHome: {
    color: '#64748B',
    fontFamily: FONT_SANS,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  heroScorerBallCol: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroScorerBall: {
    fontSize: 11,
    lineHeight: 14,
  },
  heroScorersAwayCol: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 6,
    gap: 2,
  },
  heroScorerTextAway: {
    color: '#64748B',
    fontFamily: FONT_SANS,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    textAlign: 'left',
    fontVariant: ['tabular-nums'],
  },
  heroTeamCol: {
    flex: 1,
    alignItems: 'center',
  },
  heroTeamName: {
    color: '#0F172A',
    fontFamily: FONT_SANS,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroCenterCol: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  heroScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroScoreText: {
    color: '#0F172A',
    fontFamily: FONT_SCORE,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  heroScoreLive: {
    color: '#CB1818',
    fontWeight: '700',
  },
  heroScoreDashLive: {
    color: '#CB1818',
    fontWeight: '700',
  },
  heroScoreFinished: {
    color: '#0F172A',
    fontWeight: '700',
  },
  heroScoreWinner: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 30,
  },
  heroScoreLoser: {
    color: '#94A3B8',
    fontWeight: '500',
    fontSize: 26,
    opacity: 0.65,
  },
  heroTeamNameWinner: {
    color: '#000000',
    fontWeight: '700',
  },
  heroTeamNameLoser: {
    color: '#64748B',
    fontWeight: '500',
  },
  heroScoreDash: {
    color: '#94A3B8',
    fontFamily: FONT_SCORE,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
    marginHorizontal: 6,
  },
  heroStatusPill: {
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  heroStatusLive: {
    backgroundColor: 'transparent',
  },
  heroStatusDone: {
    backgroundColor: 'transparent',
  },
  heroStatusText: {
    color: '#475569',
    fontFamily: FONT_SCORE,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  heroStatusTextLive: {
    color: '#CB1818',
    fontWeight: '700',
  },
  sectionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  matchInfoContainer: {
    gap: 2,
  },
  matchInfoCompetitionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  matchInfoIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  matchInfoIconEmoji: {
    fontSize: 18,
  },
  matchInfoCompetitionBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  matchInfoCompetitionLabel: {
    color: '#1D4ED8',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  matchInfoCompetitionTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  matchInfoRoundBadge: {
    alignSelf: 'flex-start',
    marginTop: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  matchInfoRoundBadgeText: {
    color: '#1E3A8A',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
  },
  matchInfoGridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  matchInfoSubGridSpacing: {
    marginTop: 8,
  },
  matchInfoGridCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 9,
    gap: 3,
  },
  matchInfoGridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  matchInfoGridIcon: {
    fontSize: 11,
  },
  matchInfoGridLabel: {
    color: '#64748B',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  matchInfoGridValue: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 15,
    fontVariant: ['tabular-nums'],
  },
  matchInfoGridValueLive: {
    color: '#E11D48',
  },
  matchInfoGridSub: {
    color: '#64748B',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  matchInfoStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  matchInfoStatusDotLive: {
    backgroundColor: '#E11D48',
  },
  matchInfoStatusDotDone: {
    backgroundColor: '#64748B',
  },
  matchInfoStatusDotScheduled: {
    backgroundColor: '#D97706',
  },
  matchInfoVenueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
  },
  matchInfoVenueIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  matchInfoVenueBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  matchInfoVenueLabel: {
    color: '#64748B',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  matchInfoVenueName: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  matchInfoVenueLocation: {
    color: '#475569',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    marginTop: 1,
  },
  matchInfoTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
  },
  matchInfoTeamRowDivider: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  matchInfoTeamIdentity: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  matchInfoTeamName: {
    color: '#0F172A',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
  },
  matchInfoTeamRole: {
    color: '#64748B',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '600',
  },
  matchInfoTeamStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchInfoTeamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  matchInfoTeamChipText: {
    color: '#0F172A',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  matchInfoBlock: {
    gap: 8,
  },
  matchInfoBlockDivider: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 8,
    paddingTop: 8,
  },
  matchInfoSubHeader: {
    color: '#334155',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
  },
  matchInfoOfficialsList: {
    gap: 6,
  },
  matchInfoOfficialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  matchInfoOfficialName: {
    flex: 1,
    color: '#0F172A',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
  matchInfoOfficialRoleBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  matchInfoOfficialRoleText: {
    color: '#1D4ED8',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
  },
  matchInfoBroadcastChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  matchInfoBroadcastChip: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  matchInfoBroadcastChipText: {
    color: '#0F172A',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
  },
  matchInfoRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  matchInfoLabel: {
    color: '#64748B',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    marginBottom: 3,
  },
  matchInfoValue: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  heroTeamButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    maxWidth: '100%',
  },
  teamSearchContainer: {
    marginBottom: 10,
  },
  teamSearchInput: {
    minHeight: 38,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    fontSize: 12,
  },
  teamSearchHint: {
    color: '#64748B',
    fontSize: 9,
    lineHeight: 12,
    marginTop: 4,
    marginHorizontal: 2,
  },
  teamSearchResults: {
    marginTop: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  teamSearchResult: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  teamSearchResultName: {
    flex: 1,
    color: '#0F172A',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  teamSearchResultArrow: {
    color: '#1D4ED8',
    fontSize: 18,
    fontWeight: '600',
  },
  clubProfileContent: {
    gap: 10,
    paddingBottom: 6,
  },
  clubProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  clubProfileIdentity: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  clubProfileTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clubProfileName: {
    flexShrink: 1,
    color: '#0F172A',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
  },
  clubProfileShortPill: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  clubProfileShortText: {
    color: '#334155',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
  },
  clubProfileLocation: {
    color: '#475569',
    fontSize: 10,
    lineHeight: 14,
  },
  clubProfileStandingPill: {
    alignSelf: 'flex-start',
    marginTop: 2,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  clubProfileLeague: {
    color: '#1D4ED8',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
  },
  clubProfileInfoCard: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  clubProfileSectionTitle: {
    color: '#64748B',
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  clubFormRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clubFormBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubFormWin: {
    backgroundColor: '#1D4ED8',
  },
  clubFormDraw: {
    backgroundColor: '#64748B',
  },
  clubFormLoss: {
    backgroundColor: '#E11D48',
  },
  clubFormBadgeText: {
    color: '#FFFFFF',
    fontFamily: FONT_DISPLAY,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
  },
  clubStatsContainer: {
    gap: 8,
  },
  clubStatsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  clubStatBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 9,
    paddingVertical: 7,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  clubStatBoxPrimary: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  clubStatBoxValue: {
    color: '#0F172A',
    fontFamily: FONT_DISPLAY,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  clubStatBoxValuePrimary: {
    color: '#1D4ED8',
  },
  clubStatBoxLabel: {
    color: '#64748B',
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  clubSplitRecordRow: {
    flexDirection: 'row',
    gap: 8,
  },
  clubSplitRecordBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 9,
    paddingVertical: 7,
    paddingHorizontal: 8,
    gap: 2,
  },
  clubSplitRecordLabel: {
    color: '#64748B',
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  clubSplitRecordValue: {
    color: '#0F172A',
    fontFamily: FONT_DISPLAY,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  clubProfileRecord: {
    color: '#0F172A',
    fontFamily: FONT_DISPLAY,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  clubNextMatch: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 5,
  },
  clubNextMatchFirst: {
    borderTopWidth: 0,
    paddingTop: 2,
  },
  clubNextMatchMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  clubNextMatchComp: {
    flex: 1,
    color: '#475569',
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '700',
  },
  clubNextMatchDate: {
    color: '#1D4ED8',
    fontFamily: FONT_DISPLAY,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  clubNextMatchTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  clubNextMatchTeamCol: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clubNextMatchTeamColRight: {
    justifyContent: 'flex-end',
  },
  clubNextMatchVs: {
    color: '#94A3B8',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
  },
  clubNextMatchName: {
    flexShrink: 1,
    color: '#0F172A',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
  },
  clubRosterRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  clubRosterRowFirst: {
    borderTopWidth: 0,
  },
  clubRosterJerseyBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubRosterJersey: {
    color: '#1D4ED8',
    fontFamily: FONT_DISPLAY,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  clubRosterIdentity: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  clubRosterName: {
    color: '#0F172A',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
  },
  clubRosterPosition: {
    color: '#64748B',
    fontSize: 9,
    lineHeight: 13,
  },
  clubRosterPosPill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  clubRosterPosPillText: {
    color: '#334155',
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '700',
  },
  clubProfileUnavailable: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 14,
    marginTop: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionTitle: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.9,
    marginBottom: 6,
  },
  sectionTitleCentered: {
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 6,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  emptyTabText: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
    paddingVertical: 8,
    textAlign: 'center',
  },
  halfDivider: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginVertical: 10,
  },
  retryDetailsText: {
    color: '#1D4ED8',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 6,
  },
  detailsUpdateError: {
    color: '#A33B35',
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 8,
  },
  statsOverviewContainer: {
    gap: 12,
    paddingVertical: 2,
  },
  statsOverviewTitle: {
    color: '#0F172A',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  statsPossessionBlock: {
    gap: 6,
    marginBottom: 2,
  },
  statsPossessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsPossessionPill: {
    minWidth: 40,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsPossessionPillHome: {
    backgroundColor: '#1D4ED8',
  },
  statsPossessionPillAway: {
    backgroundColor: '#D97706',
  },
  statsPossessionPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statsPossessionBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    gap: 2,
  },
  statsPossessionFillHome: {
    backgroundColor: '#2563EB',
  },
  statsPossessionFillAway: {
    backgroundColor: '#D97706',
  },
  statsComparisonRow: {
    gap: 5,
  },
  statsComparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statsComparisonValue: {
    minWidth: 32,
    color: '#334155',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statsComparisonValueRight: {
    textAlign: 'right',
  },
  statsValueHomeLead: {
    color: '#1D4ED8',
    fontWeight: '800',
  },
  statsValueAwayLead: {
    color: '#B45309',
    fontWeight: '800',
  },
  statsItemLabel: {
    flex: 1,
    color: '#1E293B',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  statsDualBarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statsHalfTrack: {
    flex: 1,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  statsHalfTrackLeft: {
    justifyContent: 'flex-end',
  },
  statsHalfTrackRight: {
    justifyContent: 'flex-start',
  },
  statsHalfFill: {
    height: '100%',
    borderRadius: 999,
  },
  statsFillHomeStrong: {
    backgroundColor: '#2563EB',
  },
  statsFillHomeSoft: {
    backgroundColor: '#93C5FD',
  },
  statsFillAwayStrong: {
    backgroundColor: '#D97706',
  },
  statsFillAwaySoft: {
    backgroundColor: '#FDE68A',
  },
  lineupsContainer: {
    gap: 10,
  },
  lineupTeamSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F3F5',
    borderRadius: 999,
    padding: 2,
  },
  lineupTeamOption: {
    flex: 1,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingVertical: 5,
  },
  lineupTeamOptionActive: {
    backgroundColor: '#23262B',
  },
  lineupPanel: {
    backgroundColor: '#F6F8FA',
    borderWidth: 1,
    borderColor: '#E1E9E5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  lineupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E7EC',
  },
  lineupTeamName: {
    flex: 1,
    color: '#0F172A',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  formationBadge: {
    overflow: 'hidden',
    color: '#1D4ED8',
    backgroundColor: '#DBEAFE',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    fontVariant: ['tabular-nums'],
  },
  pitch: {
    width: '100%',
    minHeight: 590,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: '#69A086',
    borderRadius: 12,
    backgroundColor: '#3F8363',
    paddingVertical: 8,
  },
  pitchPenaltyBoxTop: {
    position: 'absolute',
    top: 0,
    left: '21%',
    width: '58%',
    height: 68,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.34)',
  },
  pitchGoalBoxTop: {
    position: 'absolute',
    top: 0,
    left: '34%',
    width: '32%',
    height: 30,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.34)',
  },
  pitchPenaltyBoxBottom: {
    position: 'absolute',
    bottom: 0,
    left: '21%',
    width: '58%',
    height: 68,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.34)',
  },
  pitchGoalBoxBottom: {
    position: 'absolute',
    bottom: 0,
    left: '34%',
    width: '32%',
    height: 30,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.34)',
  },
  pitchHalf: {
    flex: 1,
    minHeight: 280,
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 6,
    zIndex: 1,
  },
  pitchTeamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  pitchTeamName: {
    maxWidth: '75%',
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10,
    fontWeight: '800',
  },
  pitchFormation: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  pitchHalfwayLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.36)',
  },
  pitchCenterCircle: {
    position: 'absolute',
    width: 78,
    height: 78,
    top: '50%',
    left: '50%',
    marginTop: -39,
    marginLeft: -39,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.36)',
    borderRadius: 39,
  },
  pitchCenterSpot: {
    position: 'absolute',
    width: 6,
    height: 6,
    top: '50%',
    left: '50%',
    marginTop: -3,
    marginLeft: -3,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  pitchRows: {
    flex: 1,
    justifyContent: 'space-around',
    paddingVertical: 4,
    gap: 6,
  },
  pitchPlayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-start',
    gap: 2,
    paddingHorizontal: 2,
  },
  pitchPlayer: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 3,
  },
  pitchAvatarWrapper: {
    position: 'relative',
    width: 36,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pitchAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  pitchAvatarCircleAway: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FFFFFF',
  },
  pitchAvatarCircleHome: {
    backgroundColor: '#EFF6FF',
    borderColor: '#FFFFFF',
  },
  pitchAvatarInitials: {
    color: '#1E293B',
    fontSize: 11,
    fontWeight: '800',
  },
  pitchEventTopLeft: {
    position: 'absolute',
    top: -2,
    left: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  pitchMiniCard: {
    width: 7,
    height: 10,
    borderRadius: 1.5,
  },
  pitchMiniYellowCard: {
    backgroundColor: '#FACC15',
  },
  pitchMiniRedCard: {
    backgroundColor: '#EF4444',
  },
  pitchEventBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  pitchEventSubIcon: {
    color: '#EA580C',
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '900',
  },
  pitchEventTopRight: {
    position: 'absolute',
    top: -2,
    right: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  pitchEventBallIcon: {
    fontSize: 8.5,
    lineHeight: 10,
  },
  pitchEventBottomRight: {
    position: 'absolute',
    bottom: -2,
    right: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  pitchEventAssistIcon: {
    fontSize: 8,
    lineHeight: 10,
  },
  pitchPlayerJerseyInline: {
    color: 'rgba(255, 255, 255, 0.76)',
    fontWeight: '600',
  },
  pitchPlayerName: {
    maxWidth: '98%',
    color: '#FFFFFF',
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  lineupSectionBlock: {
    paddingTop: 10,
  },
  lineupCenteredSectionTitle: {
    color: '#0F172A',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  substitutesTitle: {
    borderTopWidth: 1,
    borderTopColor: '#E2E7EC',
    marginTop: 8,
    paddingTop: 12,
  },
  lineupPlayerRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E8EC',
  },
  lineupAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E9EDF2',
    borderWidth: 1,
    borderColor: '#D6DCE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineupAvatarText: {
    color: '#4B5563',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
  },
  lineupPlayerMain: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  lineupPlayerName: {
    color: '#0F172A',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  lineupSubMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  lineupSubInBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineupSubOutBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineupSubBadgeArrow: {
    color: '#FFFFFF',
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '900',
  },
  lineupSubInMinute: {
    color: '#1D4ED8',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  lineupSubOutMinute: {
    color: '#E11D48',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  lineupSubOutLabel: {
    flex: 1,
    color: '#64748B',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '400',
  },
  lineupPosition: {
    color: '#64748B',
    fontSize: 9,
    lineHeight: 12,
  },
  h2hContainer: {
    gap: 2,
  },
  h2hHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  h2hTotalCountPill: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  h2hTotalCountText: {
    color: '#1E40AF',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  h2hSummaryGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  h2hStatCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  h2hStatCardHome: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  h2hStatCardDraw: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  h2hStatCardAway: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  h2hStatTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  h2hStatNumberHome: {
    color: '#1D4ED8',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  h2hStatNumberDraw: {
    color: '#334155',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  h2hStatNumberAway: {
    color: '#B45309',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  h2hStatLabel: {
    color: '#475569',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  h2hProgressBar: {
    flexDirection: 'row',
    height: 7,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    gap: 2,
    marginBottom: 10,
  },
  h2hProgressSegmentHome: {
    backgroundColor: '#2563EB',
  },
  h2hProgressSegmentDraw: {
    backgroundColor: '#94A3B8',
  },
  h2hProgressSegmentAway: {
    backgroundColor: '#D97706',
  },
  h2hGoalsSummaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  h2hGoalsChip: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 2,
  },
  h2hGoalsChipLabel: {
    color: '#64748B',
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  h2hGoalsChipValue: {
    color: '#0F172A',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  headToHeadSummary: {
    color: '#1D4ED8',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 6,
    fontVariant: ['tabular-nums'],
  },
  h2hLeagueGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 10,
    overflow: 'hidden',
  },
  h2hLeagueGroupHeader: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  h2hLeagueBadge: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  h2hLeagueBadgeText: {
    fontSize: 13,
  },
  h2hLeagueGroupTitle: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 8,
  },
  h2hLeagueGroupName: {
    color: '#0F172A',
    fontFamily: FONT_SANS,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
  },
  h2hLeagueGroupSub: {
    color: '#2563EB',
    fontFamily: FONT_SANS,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  h2hLeagueGroupCountPill: {
    minWidth: 24,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  h2hLeagueGroupCount: {
    color: '#1E40AF',
    fontFamily: FONT_DISPLAY,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  h2hMatchRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2EF',
  },
  h2hStatusColumn: {
    width: 52,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    gap: 3,
  },
  h2hStartTimeText: {
    color: '#475569',
    fontFamily: FONT_DISPLAY,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
    fontVariant: ['tabular-nums'],
  },
  h2hStatusPillDone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  h2hStatusTextDone: {
    color: '#64748B',
    fontFamily: FONT_DISPLAY,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  h2hTeamsColumn: {
    flex: 1,
    gap: 3,
  },
  h2hTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  h2hTeamIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  h2hTeamName: {
    color: '#0F172A',
    fontFamily: FONT_SANS,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  h2hTeamNameWinner: {
    fontWeight: '800',
  },
  h2hScoreText: {
    color: '#0F172A',
    fontFamily: FONT_SCORE,
    minWidth: 20,
    textAlign: 'right',
    fontSize: 13.5,
    lineHeight: 17,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  eventHalfTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  eventHalfTimeLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CBD5E1',
  },
  eventHalfTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
  },
  eventFullTimeIcon: {
    fontSize: 10,
    lineHeight: 13,
  },
  eventHalfTimeMinute: {
    color: '#64748B',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  eventHalfTimeText: {
    color: '#334155',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  eventMinute: {
    color: '#1D4ED8',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    width: 28,
    flexShrink: 0,
    fontVariant: ['tabular-nums'],
  },
  eventMinuteAway: {
    textAlign: 'right',
  },
  eventContent: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventContentAway: {
    justifyContent: 'flex-end',
  },
  eventContentNeutral: {
    justifyContent: 'center',
  },
  eventIcon: {
    minWidth: 20,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  eventVarBadge: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 26,
  },
  eventVarBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    lineHeight: 11,
    fontVariant: ['tabular-nums'],
  },
  eventVarDecisionText: {
    color: '#0F172A',
    fontSize: 12.5,
    lineHeight: 16,
    fontWeight: '700',
  },
  eventVarSubtitle: {
    color: '#64748B',
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '500',
    marginTop: 1,
  },
  eventVarSubtitleAway: {
    textAlign: 'right',
  },
  eventTagText: {
    color: '#334155',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
  },
  eventSubstitutionIcon: {
    color: '#1D4ED8',
    fontSize: 13,
    lineHeight: 16,
  },
  eventBall: {
    fontSize: 12,
    lineHeight: 15,
  },
  eventPenaltyGoalpost: {
    width: 14,
    height: 10,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#DC2626',
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  eventPenaltyGoalpostCross: {
    color: '#DC2626',
    fontSize: 8,
    lineHeight: 9,
    fontWeight: '900',
    marginBottom: -1,
  },
  eventCardIcon: {
    width: 8,
    height: 12,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  eventYellowCard: {
    backgroundColor: '#FACC15',
  },
  eventRedCard: {
    backgroundColor: '#EF4444',
  },
  eventPlayer: {
    color: '#0F172A',
    fontFamily: FONT_SANS,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    flex: 1,
    minWidth: 0,
  },
  eventPlayerMainName: {
    color: '#0F172A',
    fontFamily: FONT_SANS,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
  eventReasonSubtle: {
    color: '#64748B',
    fontFamily: FONT_SANS,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '400',
  },
  eventPlayerAway: {
    textAlign: 'right',
  },
  eventPlayerCol: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  eventPlayerColAway: {
    alignItems: 'flex-end',
  },
  eventAssistText: {
    color: '#64748B',
    fontFamily: FONT_SANS,
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: '500',
  },
  eventAssistTextAway: {
    textAlign: 'right',
  },
  eventSubPlayerIn: {
    color: '#000000',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },
  eventSubSeparator: {
    color: '#94A3B8',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '400',
  },
  eventSubPlayerOut: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '400',
  },
  provisionalNote: {
    color: '#1D4ED8',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  standingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 6,
    marginBottom: 2,
  },
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  standingRowHighlighted: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
    borderRadius: 6,
  },
  standingRank: {
    width: 22,
    color: '#64748B',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  standingRankHighlighted: {
    color: '#1D4ED8',
    fontWeight: '800',
  },
  standingTeam: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  standingColumnTitle: {
    width: 26,
    color: '#475569',
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  standingTeamName: {
    flex: 1,
    color: '#1E293B',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },
  standingTeamNameHighlighted: {
    color: '#1D4ED8',
    fontWeight: '800',
  },
  standingValue: {
    width: 26,
    color: '#334155',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  standingValueHighlighted: {
    color: '#0F172A',
    fontWeight: '800',
  },
  pointsColumn: {
    width: 32,
    color: '#0F172A',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
  },
  pointsColumnHighlighted: {
    color: '#1D4ED8',
    fontWeight: '900',
  },
});
