export type MatchStatus = 'NS' | '1H' | 'HT' | '2H' | 'FT';

export interface TeamInfo {
  id: string;
  name: string;
  shortName: string;
  badgeColor: string;
  logoUrl?: string;
  score: number;
  redCards: number | null;
}

export interface ClubProfileAthlete {
  id: string;
  name: string;
  position: string;
  jersey?: string;
  age?: number;
  citizenship?: string;
  flagUrl?: string;
}

export interface ClubProfileNextMatch {
  id: string;
  name: string;
  date: string;
  competitionName?: string;
  homeTeamName?: string;
  awayTeamName?: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
}

export interface ClubSeasonStats {
  rank?: number;
  points?: number;
  played?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;
  homeRecord?: string;
  awayRecord?: string;
}

export interface ClubProfile {
  id: string;
  name: string;
  shortName: string;
  location?: string;
  venue?: string;
  logoUrl?: string;
  badgeColor: string;
  leagueName?: string;
  standingSummary?: string;
  recordSummary?: string;
  form?: string;
  seasonStats?: ClubSeasonStats;
  roster: ClubProfileAthlete[];
  nextMatches: ClubProfileNextMatch[];
}

export interface EssentialStats {
  possession: [number | null, number | null]; // [home%, away%]
  shotsTotal: [number | null, number | null]; // [home, away]
  shotsOnTarget: [number | null, number | null]; // [home, away]
  corners: [number | null, number | null]; // [home, away]
}

export interface MatchStatistic {
  id: string;
  label: string;
  home: number | string;
  away: number | string;
  suffix?: string;
}

export interface MatchInfoItem {
  id: string;
  label: string;
  value: string;
  subtitle?: string;
  icon?: string;
  category?: 'COMPETITION' | 'SCHEDULE' | 'VENUE' | 'OFFICIALS' | 'BROADCAST';
}

export interface MatchEvent {
  id: string;
  minute: number;
  time: string;
  period: number;
  type:
    | 'GOAL'
    | 'PENALTY_MISSED'
    | 'YELLOW_CARD'
    | 'RED_CARD'
    | 'SUBSTITUTION'
    | 'VAR'
    | 'KICKOFF'
    | 'HALF_TIME'
    | 'SECOND_HALF'
    | 'FULL_TIME'
    | 'OTHER';
  label: string;
  team?: 'HOME' | 'AWAY';
  playerName: string;
  detail?: string;
}

export interface MatchStanding {
  teamId: string;
  teamName: string;
  logoUrl?: string;
  rank: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalDifference: number;
  points: number;
}

export interface MatchLineupPlayer {
  id: string;
  name: string;
  position: string;
  formationPlace?: number;
  jersey?: string;
  isStarter: boolean;
  subbedIn?: boolean;
  subbedOut?: boolean;
  subMinute?: string;
  replacedPlayerName?: string;
  shortName?: string;
  goals?: number;
  assists?: number;
  yellowCard?: boolean;
  redCard?: boolean;
  rating?: number;
}

export interface MatchLineup {
  teamSide: 'HOME' | 'AWAY';
  teamName: string;
  teamLogoUrl?: string;
  formation?: string;
  players: MatchLineupPlayer[];
}

export interface HeadToHeadMatch {
  id: string;
  date: string;
  competitionName: string;
  status: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamShortName?: string;
  awayTeamShortName?: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  homeScore: number;
  awayScore: number;
}

export interface MatchHeadToHead {
  summary?: string;
  seriesScore?: string;
  matches: HeadToHeadMatch[];
}

export interface Match {
  id: string;
  leagueId: string;
  leagueName: string;
  leagueCountry: string;
  status: MatchStatus;
  minute: number | null;
  minuteLabel?: string | null;
  startTime: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  stats: EssentialStats | null;
  additionalStats: MatchStatistic[] | null;
  events: MatchEvent[] | null;
  recentAlert?: {
    id: string;
    type: 'GOAL' | 'VAR';
    team?: 'HOME' | 'AWAY';
    createdAt?: number;
  };
  isPinned?: boolean;
  recentGoalAt?: number; // timestamp for visual real-time highlight
  recentGoalTeam?: 'HOME' | 'AWAY';
}
