import { API_CONFIG } from '../config/api';
import {
  EssentialStats,
  ClubProfile,
  Match,
  MatchEvent,
  MatchHeadToHead,
  MatchInfoItem,
  MatchLineup,
  MatchStanding,
  MatchStatistic,
  MatchStatus,
  TeamInfo,
} from '../types/match';

interface ESPNTeamStatistic {
  name: string;
  displayValue: string;
  displayName?: string;
}

interface ESPNCompetitor {
  id: string;
  homeAway: 'home' | 'away';
  score?: string;
  team: {
    id: string;
    displayName: string;
    abbreviation?: string;
    logo?: string;
  };
  statistics?: ESPNTeamStatistic[];
}

interface ESPNEvent {
  id: string;
  uid: string;
  date: string;
  season?: {
    slug?: string;
    year?: number;
    name?: string;
    displayName?: string;
  };
  seasonType?: {
    name?: string;
    abbreviation?: string;
    displayName?: string;
  };
  week?: {
    number?: number;
    text?: string;
  };
  status: {
    displayClock?: string;
    period?: number;
    type: {
      state: 'pre' | 'in' | 'post';
      description?: string;
      detail?: string;
      shortDetail?: string;
    };
  };
  competitions?: Array<{
    competitors: ESPNCompetitor[];
  }>;
}

interface ESPNScoreboard {
  events?: ESPNEvent[];
}

interface ESPNBoxscoreTeam {
  homeAway: 'home' | 'away';
  team: {
    id: string;
    displayName: string;
  };
  statistics?: ESPNTeamStatistic[];
}

interface ESPNKeyEvent {
  id: string;
  text?: string;
  shortText?: string;
  type?: {
    text?: string;
    type?: string;
  };
  clock?: {
    displayValue?: string;
    value?: number;
  };
  period?: number | { number?: number };
  team?: {
    id: string;
  };
  scoringPlay?: boolean;
  participants?: Array<{
    athlete?: {
      displayName?: string;
    };
  }>;
}

interface ESPNMatchSummary {
  header?: {
    league?: {
      name?: string;
      displayName?: string;
      abbreviation?: string;
    };
    season?: {
      name?: string;
      displayName?: string;
      year?: number;
    };
    seasonType?: {
      name?: string;
      abbreviation?: string;
      displayName?: string;
    };
    week?: {
      number?: number;
      text?: string;
    };
    competitions?: Array<{
      date?: string;
      competitors?: Array<ESPNCompetitor & { homeAway: 'home' | 'away' }>;
      status?: ESPNEvent['status'];
      venue?: ESPNVenue;
      attendance?: number | string;
      broadcasts?: ESPNBroadcast[];
      officials?: Array<{
        displayName?: string;
        fullName?: string;
        position?: {
          name?: string;
          displayName?: string;
        };
      }>;
      notes?: Array<{
        headline?: string;
        text?: string;
      }>;
    }>;
  };
  gameInfo?: {
    venue?: ESPNVenue;
    attendance?: number | string;
    officials?: Array<{
      displayName?: string;
      fullName?: string;
      position?: {
        name?: string;
        displayName?: string;
      };
    }>;
    weather?: {
      displayValue?: string;
      temperature?: number;
      condition?: string;
    };
  };
  broadcasts?: ESPNBroadcast[];
  boxscore?: {
    teams?: ESPNBoxscoreTeam[];
  };
  keyEvents?: ESPNKeyEvent[];
  rosters?: Array<{
    homeAway: 'home' | 'away';
    team?: {
      displayName?: string;
      logo?: string;
      logos?: Array<{ href?: string }>;
    };
    formation?: string;
    roster?: Array<{
      jersey?: string;
      starter?: boolean;
      subbedIn?: boolean;
      subbedOut?: boolean;
      subbedInFor?: {
        jersey?: string;
        athlete?: {
        id?: string;
        displayName?: string;
        shortName?: string;
      } & {
          id?: string;
          displayName?: string;
          shortName?: string;
        };
      };
      subbedOutFor?: {
        jersey?: string;
        athlete?: {
        id?: string;
        displayName?: string;
        shortName?: string;
      } & {
          id?: string;
          displayName?: string;
          shortName?: string;
        };
      };
      plays?: Array<{
        clock?: {
          displayValue?: string;
        };
        substitution?: boolean;
        scoringPlay?: boolean;
        yellowCard?: boolean;
        redCard?: boolean;
        ownGoal?: boolean;
      }>;
      stats?: Array<{
        name: string;
        value?: number;
        displayValue?: string;
      }>;
      formationPlace?: string | number;
      athlete?: {
        id?: string;
        displayName?: string;
        shortName?: string;
      } & {
        id?: string;
        displayName?: string;
      };
      position?: {
        displayName?: string;
      };
    }>;
  }>;
  seasonseries?: Array<{
    type?: string;
    summary?: string;
    seriesScore?: string;
    events?: Array<{
      id?: string;
      date?: string;
      statusType?: {
        shortDetail?: string;
      };
      competitionName?: string;
      competitors?: Array<{
        homeAway?: 'home' | 'away';
        score?: string;
        team?: {
          id?: string;
          displayName?: string;
          abbreviation?: string;
          logo?: string;
          logos?: Array<{ href?: string }>;
        };
      }>;
    }>;
  }>;
  standings?: {
    fullViewLink?: {
      href?: string;
    };
    groups?: Array<{
      standings?: {
        entries?: Array<{
          id?: string;
          team:
            | string
            | {
                id?: string;
                displayName?: string;
                logo?: string;
                logos?: Array<{ href?: string }>;
              };
          logo?: Array<{ href: string }> | { href: string };
          stats?: Array<{
            name: string;
            value?: number;
            displayValue?: string;
          }>;
        }>;
      };
    }>;
  };
}

interface ESPNVenue {
  fullName?: string;
  capacity?: number | string;
  grass?: boolean;
  address?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

interface ESPNBroadcast {
  market?: string;
  names?: string[];
}

interface ESPNCoreReference {
  $ref?: string;
}

interface ESPNCoreRecord {
  description?: string;
  summary?: string;
  stats?: Array<{
    name: string;
    value?: number;
  }>;
}

interface ESPNCoreCollection<T> {
  items?: T[];
}

interface ESPNCoreLeague {
  name?: string;
  displayName?: string;
  country?: {
    name?: string;
  };
}

interface ESPNTeamProfileResponse {
  id?: string;
  displayName?: string;
  shortDisplayName?: string;
  abbreviation?: string;
  location?: string;
  color?: string;
  form?: string;
  logos?: Array<{ href?: string }>;
  defaultLeague?: ESPNCoreReference;
  record?: ESPNCoreReference;
  venue?: {
    fullName?: string;
    address?: {
      city?: string;
      country?: string;
    };
  };
}

interface ESPNSiteTeamResponse {
  team?: {
    id?: string;
    displayName?: string;
    shortDisplayName?: string;
    abbreviation?: string;
    location?: string;
    color?: string;
    standingSummary?: string;
    logos?: Array<{ href?: string }>;
    defaultLeague?: {
      id?: string;
      name?: string;
      displayName?: string;
      abbreviation?: string;
    };
    record?: {
      items?: ESPNCoreRecord[];
    };
    athletes?: Array<{
      id?: string;
      displayName?: string;
      fullName?: string;
      jersey?: string;
      age?: number;
      citizenship?: string;
      flag?: {
        href?: string;
      };
      position?: {
        name?: string;
        displayName?: string;
        abbreviation?: string;
      };
    }>;
    nextEvent?: Array<{
      id?: string;
      date?: string;
      name?: string;
      shortName?: string;
      league?: {
        name?: string;
        displayName?: string;
      };
      competitions?: Array<{
        date?: string;
        competitors?: Array<{
          homeAway?: 'home' | 'away';
          team?: {
            displayName?: string;
            shortDisplayName?: string;
            logos?: Array<{ href?: string }>;
            logo?: string;
          };
        }>;
      }>;
    }>;
  };
}

interface LeagueMetadata {
  name: string;
  country: string;
}

function translateAthletePosition(rawPos?: string): string {
  const normalized = (rawPos ?? '').trim().toLowerCase();
  if (normalized.includes('goalkeeper') || normalized === 'g' || normalized === 'gk') {
    return 'Goleiro';
  }
  if (normalized.includes('defender') || normalized === 'd' || normalized === 'df') {
    return 'Defensor';
  }
  if (normalized.includes('midfielder') || normalized === 'm' || normalized === 'mf') {
    return 'Meio-campista';
  }
  if (
    normalized.includes('forward') ||
    normalized.includes('striker') ||
    normalized.includes('attacker') ||
    normalized === 'f' ||
    normalized === 'fw'
  ) {
    return 'Atacante';
  }
  return rawPos?.trim() || 'Jogador';
}

function translateStandingSummary(raw?: string): string | undefined {
  if (!raw?.trim()) return undefined;
  return translateMatchInfoText(
    raw
      .trim()
      .replace(/^(\d+)(?:st|nd|rd|th)\s+in\s+/i, '$1º colocado • ')
  );
}

export async function fetchClubProfile(team: TeamInfo): Promise<ClubProfile> {
  const encodedId = encodeURIComponent(team.id);
  const [coreResult, siteResult] = await Promise.allSettled([
    fetch(`${API_CONFIG.CORE_BASE_URL}/teams/${encodedId}?lang=en&region=us`).then(
      async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as ESPNTeamProfileResponse;
      }
    ),
    fetch(
      `${API_CONFIG.BASE_URL}/all/teams/${encodedId}?enable=roster,schedule,record`
    ).then(async (r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()) as ESPNSiteTeamResponse;
    }),
  ]);

  const profile =
    coreResult.status === 'fulfilled' ? coreResult.value : undefined;
  const siteTeam =
    siteResult.status === 'fulfilled' ? siteResult.value.team : undefined;

  if (!profile?.id && !siteTeam?.id) {
    throw new Error('A ESPN não retornou o perfil deste clube.');
  }

  const [recordData, leagueData] = await Promise.all([
    !siteTeam?.record?.items?.length && profile?.record?.$ref
      ? fetchEspnCoreResource<ESPNCoreCollection<ESPNCoreRecord>>(
          profile.record.$ref,
          'retrospecto do clube'
        ).catch(() => undefined)
      : Promise.resolve(undefined),
    profile?.defaultLeague?.$ref
      ? fetchEspnCoreResource<ESPNCoreLeague>(
          profile.defaultLeague.$ref,
          'liga do clube'
        ).catch(() => undefined)
      : Promise.resolve(undefined),
  ]);

  const venueCity = profile?.venue?.address?.city;
  const venueCountry = profile?.venue?.address?.country;
  const rawLocation =
    venueCity && venueCountry
      ? `${venueCity}, ${venueCountry}`
      : venueCity ?? profile?.location ?? siteTeam?.location;

  const overallRecord =
    siteTeam?.record?.items?.find((item) => item.description === 'Overall Record') ??
    siteTeam?.record?.items?.[0] ??
    recordData?.items?.find((item) => item.description === 'Overall Record') ??
    recordData?.items?.[0];

  const statMap = new Map<string, number>();
  (overallRecord?.stats ?? []).forEach((s) => {
    if (typeof s.value === 'number' && Number.isFinite(s.value)) {
      statMap.set(s.name, s.value);
    }
  });

  const seasonStats =
    statMap.size > 0
      ? {
          rank: statMap.get('rank'),
          points: statMap.get('points'),
          played: statMap.get('gamesPlayed'),
          wins: statMap.get('wins'),
          draws: statMap.get('ties'),
          losses: statMap.get('losses'),
          goalsFor: statMap.get('pointsFor'),
          goalsAgainst: statMap.get('pointsAgainst'),
          goalDifference: statMap.get('pointDifferential'),
          homeRecord:
            statMap.has('homeWins') &&
            statMap.has('homeTies') &&
            statMap.has('homeLosses')
              ? `${statMap.get('homeWins')}V · ${statMap.get('homeTies')}E · ${statMap.get('homeLosses')}D (${statMap.get('homePointsFor') ?? 0}:${statMap.get('homePointsAgainst') ?? 0})`
              : undefined,
          awayRecord:
            statMap.has('awayWins') &&
            statMap.has('awayTies') &&
            statMap.has('awayLosses')
              ? `${statMap.get('awayWins')}V · ${statMap.get('awayTies')}E · ${statMap.get('awayLosses')}D (${statMap.get('awayPointsFor') ?? 0}:${statMap.get('awayPointsAgainst') ?? 0})`
              : undefined,
        }
      : undefined;

  const positionOrder: Record<string, number> = {
    Goleiro: 1,
    Defensor: 2,
    'Meio-campista': 3,
    Atacante: 4,
    Jogador: 5,
  };

  const roster = (siteTeam?.athletes ?? [])
    .flatMap((athlete) => {
      const name = athlete.displayName ?? athlete.fullName;
      if (!athlete.id || !name) return [];
      const position = translateAthletePosition(
        athlete.position?.displayName ?? athlete.position?.name
      );
      return [
        {
          id: athlete.id,
          name,
          position,
          jersey: athlete.jersey,
          age: athlete.age,
          citizenship: athlete.citizenship
            ? translateMatchInfoText(athlete.citizenship)
            : undefined,
          flagUrl: athlete.flag?.href,
        },
      ];
    })
    .sort(
      (a, b) =>
        (positionOrder[a.position] ?? 9) - (positionOrder[b.position] ?? 9) ||
        (Number.parseInt(a.jersey ?? '999', 10) || 999) -
          (Number.parseInt(b.jersey ?? '999', 10) || 999) ||
        a.name.localeCompare(b.name)
    );

  const nextMatches = (siteTeam?.nextEvent ?? []).flatMap((ev) => {
    const comp = ev.competitions?.[0];
    const date = comp?.date ?? ev.date;
    if (!ev.id || !date) return [];
    const home = comp?.competitors?.find((c) => c.homeAway === 'home');
    const away = comp?.competitors?.find((c) => c.homeAway === 'away');
    const homeName =
      home?.team?.displayName ?? home?.team?.shortDisplayName;
    const awayName =
      away?.team?.displayName ?? away?.team?.shortDisplayName;
    const matchName =
      homeName && awayName
        ? `${homeName} vs ${awayName}`
        : ev.name ?? ev.shortName ?? 'Próxima partida';
    return [
      {
        id: ev.id,
        name: matchName,
        date,
        competitionName:
          ev.league?.displayName ?? ev.league?.name,
        homeTeamName: homeName,
        awayTeamName: awayName,
        homeTeamLogo: home?.team?.logo ?? home?.team?.logos?.[0]?.href,
        awayTeamLogo: away?.team?.logo ?? away?.team?.logos?.[0]?.href,
      },
    ];
  });

  const resolvedLeagueName =
    leagueData?.name ??
    leagueData?.displayName ??
    siteTeam?.defaultLeague?.name ??
    siteTeam?.defaultLeague?.displayName ??
    (siteTeam?.defaultLeague?.id
      ? KNOWN_LEAGUES[siteTeam.defaultLeague.id]?.name
      : undefined) ??
    siteTeam?.defaultLeague?.abbreviation;

  return {
    id: profile?.id ?? siteTeam?.id ?? team.id,
    name: profile?.displayName ?? siteTeam?.displayName ?? team.name,
    shortName:
      profile?.abbreviation ??
      siteTeam?.abbreviation ??
      profile?.shortDisplayName ??
      team.shortName,
    location: rawLocation ? translateMatchInfoText(rawLocation) : undefined,
    venue: profile?.venue?.fullName,
    logoUrl:
      profile?.logos?.[0]?.href ??
      siteTeam?.logos?.[0]?.href ??
      team.logoUrl,
    badgeColor: profile?.color ? `#${profile.color}` : team.badgeColor,
    leagueName: resolvedLeagueName,
    standingSummary: translateStandingSummary(siteTeam?.standingSummary),
    recordSummary: overallRecord?.summary,
    form: profile?.form?.trim() || undefined,
    seasonStats,
    roster,
    nextMatches,
  };
}

async function fetchEspnCoreResource<T>(
  reference: string,
  resourceName: string
): Promise<T> {
  if (!/^https?:\/\/sports\.core\.api\.espn\.com\//i.test(reference.trim())) {
    throw new Error('A ESPN retornou uma referência inválida para o perfil.');
  }
  const safeUrl = reference.trim().replace(/^http:\/\//i, 'https://');

  const response = await fetch(safeUrl);
  if (!response.ok) {
    throw new Error(
      `A ESPN respondeu com HTTP ${response.status} ao buscar ${resourceName}.`
    );
  }
  const data: T = await response.json();
  return data;
}

const TEAM_LOGO_OVERRIDES: Record<string, string> = {
  '8392': 'https://upload.wikimedia.org/wikipedia/commons/5/58/Zamalek_SC_icon.png',
  '18827':
    'https://upload.wikimedia.org/wikipedia/en/thumb/8/8e/Al_Ahli_SC_%28Tripoli%29_Logo.svg/250px-Al_Ahli_SC_%28Tripoli%29_Logo.svg.png',
  '20220':
    'https://upload.wikimedia.org/wikipedia/en/8/87/Pyramids_FC_%282020%29.png',
  '131551': 'https://upload.wikimedia.org/wikipedia/en/4/4a/Azam_F.C._logo.png',
  '132883': 'https://upload.wikimedia.org/wikipedia/en/3/39/ZED_FC_logo.png',
  '132916':
    'https://upload.wikimedia.org/wikipedia/en/8/8f/Arm%C3%A9e_Patriotique_Rwandaise_FC_%28logo%29.jpg',
  '133114':
    'https://upload.wikimedia.org/wikipedia/en/2/2c/Welwalo_Adigrat_University_FC_logo.png',
};

const KNOWN_LEAGUES: Record<string, LeagueMetadata> = {
  '2': { name: 'UEFA Champions League', country: 'Europa' },
  '620': { name: 'Bolivian Liga Profesional', country: 'Bolívia' },
  '630': { name: 'Brazilian Serie A', country: 'Brasil' },
  '660': { name: 'LigaPro Ecuador', country: 'Equador' },
  '670': { name: 'Peruvian Liga 1', country: 'Peru' },
  '680': { name: 'Liga AUF Uruguaya', country: 'Uruguai' },
  '700': { name: 'English Premier League', country: 'Inglaterra' },
  '710': { name: 'French Ligue 1', country: 'França' },
  '720': { name: 'German Bundesliga', country: 'Alemanha' },
  '725': { name: 'Dutch Eredivisie', country: 'Países Baixos' },
  '730': { name: 'Italian Serie A', country: 'Itália' },
  '740': { name: 'Spanish LALIGA', country: 'Espanha' },
  '745': { name: 'Argentine Liga Profesional de Fútbol', country: 'Argentina' },
  '760': { name: 'Mexican Liga BBVA MX', country: 'México' },
  '2391': { name: 'CAF Champions League', country: 'África' },
  '3903': { name: 'Argentine Nacional B', country: 'Argentina' },
  '3906': { name: 'Australian A-League Men', country: 'Austrália' },
  '3907': { name: 'Austrian Bundesliga', country: 'Áustria' },
  '3913': { name: 'Danish Superliga', country: 'Dinamarca' },
  '3914': { name: 'English League Championship', country: 'Inglaterra' },
  '3921': { name: 'Spanish LALIGA 2', country: 'Espanha' },
  '3926': { name: 'French Ligue 2', country: 'França' },
  '3927': { name: 'German 2. Bundesliga', country: 'Alemanha' },
  '3931': { name: 'Italian Serie B', country: 'Itália' },
  '3932': { name: 'Mexican Liga de Expansión MX', country: 'México' },
  '3933': { name: 'Dutch Keuken Kampioen Divisie', country: 'Países Baixos' },
  '3934': { name: 'Paraguayan Primera División', country: 'Paraguai' },
  '3940': { name: 'Scottish Championship', country: 'Escócia' },
  '3943': { name: 'Salvadoran Primera Division', country: 'El Salvador' },
  '3945': { name: 'Swedish Allsvenskan', country: 'Suécia' },
  '3946': { name: 'Turkish Super Lig', country: 'Turquia' },
  '4007': { name: 'Brazilian Serie B', country: 'Brasil' },
  '5487': { name: "NCAA Men's Soccer", country: 'Estados Unidos' },
  '5499': { name: "NCAA Women's Soccer", country: 'Estados Unidos' },
  '8301': { name: 'NWSL', country: 'Estados Unidos' },
  '8316': { name: 'Indian Super League', country: 'Índia' },
  '8376': { name: 'Chinese Super League', country: 'China' },
  '18000': { name: 'CAF Confederation Cup', country: 'África' },
  '19834': { name: 'Club Friendly', country: 'Internacional' },
  '20115': { name: 'Dutch KNVB Beker Vrouwen', country: 'Países Baixos' },
  '20922': { name: 'Taça de Portugal', country: 'Portugal' },
  '21231': { name: 'Saudi Pro League', country: 'Arábia Saudita' },
  '23633': { name: 'USL Super League', country: 'Estados Unidos' },
};

const DYNAMIC_LEAGUES = new Map<string, LeagueMetadata>();

function getLeagueId(event: ESPNEvent): string {
  return event.uid.match(/~l:(\d+)/)?.[1] ?? 'unknown';
}

function getSeasonSlug(event: ESPNEvent): string | undefined {
  return event.season?.slug
    ?.replace(/^\d{4}(?:-\d{2})?-/, '')
    .replace(/-\d{4}$/, '');
}

function getLeagueMetadata(event: ESPNEvent): LeagueMetadata {
  const leagueId = getLeagueId(event);
  const knownLeague = KNOWN_LEAGUES[leagueId] ?? DYNAMIC_LEAGUES.get(leagueId);
  if (knownLeague) return knownLeague;

  const slug = getSeasonSlug(event);
  if (
    !slug ||
    slug === 'regular-season' ||
    slug === 'fall-season' ||
    slug === 'first-round' ||
    slug === 'second-preliminary-round' ||
    slug === '3rd-round' ||
    slug === 'final-stage' ||
    slug === 'group-stage' ||
    slug === 'knockout-stage' ||
    /(^|-)league-phase($|-)/i.test(slug)
  ) {
    return { name: 'Competição internacional', country: 'Internacional' };
  }

  const name = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return { name, country: 'Internacional' };
}

const ATTEMPTED_LEAGUES = new Set<string>();

async function resolveLeagueName(event: ESPNEvent): Promise<void> {
  const leagueId = getLeagueId(event);
  if (DYNAMIC_LEAGUES.has(leagueId) || ATTEMPTED_LEAGUES.has(leagueId)) return;
  ATTEMPTED_LEAGUES.add(leagueId);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/all/summary?event=${encodeURIComponent(event.id)}&_=${Date.now()}`,
      { signal: controller.signal }
    ).finally(() => clearTimeout(timeoutId));
    if (!response.ok) return;

    const data: {
      header?: {
        league?: {
          name?: string;
        };
      };
    } = await response.json();
    const name = data.header?.league?.name?.trim();
    if (name) {
      DYNAMIC_LEAGUES.set(leagueId, { name, country: 'Internacional' });
    }
  } catch {
    // Falha silenciosa para não quebrar a listagem e não repetir em loop
  }
}

function getEventStatus(status: ESPNEvent['status']): MatchStatus {
  const { state, description, detail } = status.type;
  if (state === 'post') return 'FT';
  if (state === 'pre') return 'NS';

  if (/half.?time|halftime/i.test(`${description ?? ''} ${detail ?? ''}`)) {
    return 'HT';
  }
  return (status.period ?? 1) <= 1 ? '1H' : '2H';
}

function getMinuteLabel(
  displayClock?: string,
  details?: Array<string | undefined>,
  period?: number
): string | null {
  const stoppageTimePattern = /(\d{1,3})\s*['′]?\s*\+\s*(\d{1,2})/;
  for (const value of [...(details ?? []), displayClock]) {
    const stoppageTime = value?.match(stoppageTimePattern);
    if (stoppageTime) return `${stoppageTime[1]}+${stoppageTime[2]}`;
  }

  const elapsedTime = displayClock?.match(/^(\d{1,3}):\d{2}$/);
  if (!elapsedTime) return null;
  const elapsedMinute = Number(elapsedTime[1]);
  const halfLength = period === 1 ? 45 : period === 2 ? 90 : null;
  if (halfLength !== null && elapsedMinute > halfLength) {
    return `${halfLength}+${elapsedMinute - halfLength}`;
  }
  return null;
}

function toMatch(event: ESPNEvent): Match | null {
  const competitors = event.competitions?.[0]?.competitors;
  const home = competitors?.find((team) => team.homeAway === 'home');
  const away = competitors?.find((team) => team.homeAway === 'away');
  if (!home || !away) return null;

  const status = getEventStatus(event.status);
  const parsedMinute = Number.parseInt(
    event.status.displayClock ?? event.status.type.detail ?? '',
    10
  );
  const minute =
    status === 'NS' || status === 'FT'
      ? null
      : Number.isFinite(parsedMinute)
      ? parsedMinute
      : null;
  const minuteLabel =
    status === 'NS' || status === 'FT'
      ? null
      : getMinuteLabel(
          event.status.displayClock,
          [event.status.type.shortDetail, event.status.type.detail],
          event.status.period
        );
  const leagueId = getLeagueId(event);
  const league = getLeagueMetadata(event);
  const getLogoUrl = (competitor: ESPNCompetitor): string | undefined =>
    competitor.team.logo ?? TEAM_LOGO_OVERRIDES[competitor.id];
  const getRedCardCount = (competitor: ESPNCompetitor): number | null => {
    const value = competitor.statistics?.find(
      (statistic) => statistic.name === 'redCards'
    )?.displayValue;
    if (value === undefined) return null;
    const count = Number.parseInt(value, 10);
    return Number.isFinite(count) ? count : null;
  };

  return {
    id: event.id,
    leagueId,
    leagueName: league.name,
    leagueCountry: league.country,
    status,
    minute,
    minuteLabel,
    startTime: (() => {
      const kickoff = new Date(event.date);
      const hh = String(kickoff.getHours()).padStart(2, '0');
      const mm = String(kickoff.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    })(),
    homeTeam: {
      id: home.id,
      name: home.team.displayName,
      shortName: home.team.abbreviation || home.team.displayName.slice(0, 3).toUpperCase(),
      badgeColor: '#38BDF8',
      logoUrl: getLogoUrl(home),
      score: Number(home.score ?? 0),
      redCards: getRedCardCount(home),
    },
    awayTeam: {
      id: away.id,
      name: away.team.displayName,
      shortName: away.team.abbreviation || away.team.displayName.slice(0, 3).toUpperCase(),
      badgeColor: '#F43F5E',
      logoUrl: getLogoUrl(away),
      score: Number(away.score ?? 0),
      redCards: getRedCardCount(away),
    },
    stats: null,
    additionalStats: null,
    events: null,
  };
}

let isVarAlertsRunning = false;

async function fetchRecentVARAlerts(
  matches: Match[]
): Promise<
  Map<
    string,
    {
      alertId?: string;
      alertTeam?: 'HOME' | 'AWAY';
      homeRedCards?: number;
      awayRedCards?: number;
      homeScore?: number;
      awayScore?: number;
      status?: MatchStatus;
      minute?: number | null;
      minuteLabel?: string | null;
    }
  >
> {
  if (isVarAlertsRunning) {
    return new Map();
  }
  isVarAlertsRunning = true;

  try {
    const liveMatches = matches.filter(
      (match) => match.status === '1H' || match.status === '2H' || match.status === 'HT'
    );
    if (liveMatches.length === 0) {
      return new Map();
    }

    // Limit concurrent requests: pinned matches first, max 4 matches per tick to prevent network pool & memory exhaustion
    const prioritizedMatches = [...liveMatches]
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      })
      .slice(0, 4);

    const alerts = new Map<
      string,
      {
        alertId?: string;
        alertTeam?: 'HOME' | 'AWAY';
        homeRedCards?: number;
        awayRedCards?: number;
        homeScore?: number;
        awayScore?: number;
        status?: MatchStatus;
        minute?: number | null;
        minuteLabel?: string | null;
      }
    >();

    await Promise.all(
      prioritizedMatches.map(async (match) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          const response = await fetch(
            `${API_CONFIG.BASE_URL}/all/summary?event=${encodeURIComponent(match.id)}&_=${Date.now()}`,
            { signal: controller.signal }
          ).finally(() => clearTimeout(timeoutId));
          if (!response.ok) {
            throw new Error(`resposta HTTP ${response.status}`);
          }
          const summary: ESPNMatchSummary = await response.json();
          const latestReview = [...(summary.keyEvents ?? [])].reverse().find((event) => {
            const description = `${event.type?.text ?? ''} ${event.type?.type ?? ''} ${
              event.text ?? ''
            } ${event.shortText ?? ''}`;
            return /\bvar\b|video assistant referee|video review/i.test(description);
          });
          const reviewDescription = latestReview
            ? `${latestReview.type?.text ?? ''} ${latestReview.type?.type ?? ''} ${
                latestReview.text ?? ''
              } ${latestReview.shortText ?? ''}`
            : '';
          const isReviewActive =
            /\bunder review\b|\bchecking\b|\breview in progress\b|\bvideo review underway\b/i.test(
              reviewDescription
            ) &&
            !/\b(?:review complete|review concluded|no change|stands|overturned|decision)\b/i.test(
              reviewDescription
            );
          const review = isReviewActive ? latestReview : undefined;
          const getRedCardCount = (homeAway: 'home' | 'away'): number | undefined =>
            getTeamStatistics(
              summary.boxscore?.teams?.find((team) => team.homeAway === homeAway)
            ).get('redCards');
          const comp = summary.header?.competitions?.[0];
          const homeComp = comp?.competitors?.find((c) => c.homeAway === 'home');
          const awayComp = comp?.competitors?.find((c) => c.homeAway === 'away');
          const rawStatus = comp?.status;
          const nextStatus = rawStatus ? getEventStatus(rawStatus) : undefined;
          const parsedMin = Number.parseInt(
            rawStatus?.displayClock ?? rawStatus?.type.detail ?? '',
            10
          );
          const nextMinute =
            nextStatus === 'NS' || nextStatus === 'FT'
              ? null
              : Number.isFinite(parsedMin)
              ? parsedMin
              : undefined;
          const nextMinuteLabel =
            nextStatus === 'NS' || nextStatus === 'FT'
              ? null
              : rawStatus
              ? getMinuteLabel(
                  rawStatus.displayClock,
                  [rawStatus.type.shortDetail, rawStatus.type.detail],
                  rawStatus.period
                )
              : undefined;

          const keyEvents = summary.keyEvents ?? [];
          const eventHomeGoals = keyEvents.filter((e) => {
            const rawType = (e.type?.text ?? e.type?.type ?? '').toLowerCase();
            return (rawType.includes('goal') || Boolean(e.scoringPlay)) && !rawType.includes('miss') && e.team?.id === match.homeTeam.id;
          }).length;
          const eventAwayGoals = keyEvents.filter((e) => {
            const rawType = (e.type?.text ?? e.type?.type ?? '').toLowerCase();
            return (rawType.includes('goal') || Boolean(e.scoringPlay)) && !rawType.includes('miss') && e.team?.id === match.awayTeam.id;
          }).length;

          const compHomeScore = homeComp?.score !== undefined ? Number(homeComp.score) : undefined;
          const compAwayScore = awayComp?.score !== undefined ? Number(awayComp.score) : undefined;

          const resolvedHomeScore =
            compHomeScore !== undefined || eventHomeGoals > 0
              ? Math.max(compHomeScore ?? 0, eventHomeGoals)
              : undefined;
          const resolvedAwayScore =
            compAwayScore !== undefined || eventAwayGoals > 0
              ? Math.max(compAwayScore ?? 0, eventAwayGoals)
              : undefined;

          const alert = {
            alertId: review?.id,
            alertTeam:
              review?.team?.id === match.homeTeam.id
                ? 'HOME' as const
                : review?.team?.id === match.awayTeam.id
                ? 'AWAY' as const
                : undefined,
            homeRedCards: getRedCardCount('home'),
            awayRedCards: getRedCardCount('away'),
            homeScore: resolvedHomeScore,
            awayScore: resolvedAwayScore,
            status: nextStatus,
            minute: nextMinute,
            minuteLabel: nextMinuteLabel,
          };
          alerts.set(match.id, alert);
        } catch (error) {
          console.warn(
            `Não foi possível verificar eventos de VAR para a partida ${match.id}:`,
            error
          );
        }
      })
    );
    return alerts;
  } finally {
    isVarAlertsRunning = false;
  }
}

const STAT_LABELS: Record<string, { label: string; suffix?: string }> = {
  foulsCommitted: { label: 'Faltas' },
  yellowCards: { label: 'Cartões amarelos' },
  redCards: { label: 'Cartões vermelhos' },
  offsides: { label: 'Impedimentos' },
  saves: { label: 'Defesas' },
  penaltyKickGoals: { label: 'Gols de pênalti' },
  penaltyKickShots: { label: 'Pênaltis cobrados' },
  blockedShots: { label: 'Chutes bloqueados' },
  totalPasses: { label: 'Passes tentados' },
  accuratePasses: { label: 'Passes certos' },
  passPct: { label: 'Precisão nos passes', suffix: '%' },
  goalDifference: { label: 'Saldo de gols' },
  totalGoals: { label: 'Gols marcados' },
  goalAssists: { label: 'Assistências' },
  goalsConceded: { label: 'Gols sofridos' },
  foulsSuffered: { label: 'Faltas sofridas' },
  penaltyKickPct: { label: 'Aproveitamento de pênaltis', suffix: '%' },
  shotsOffTarget: { label: 'Finalizações para fora' },
  shotsOnPost: { label: 'Bolas na trave' },
  shotPct: { label: 'Precisão nas finalizações', suffix: '%' },
  totalCrosses: { label: 'Cruzamentos tentados' },
  accurateCrosses: { label: 'Cruzamentos certos' },
  crossPct: { label: 'Precisão nos cruzamentos', suffix: '%' },
  totalLongBalls: { label: 'Bolas longas' },
  accurateLongBalls: { label: 'Bolas longas certas' },
  longballPct: { label: 'Precisão nas bolas longas', suffix: '%' },
  totalTackles: { label: 'Desarmes' },
  effectiveTackles: { label: 'Desarmes certos' },
  tacklePct: { label: 'Eficiência nos desarmes', suffix: '%' },
  interceptions: { label: 'Interceptações' },
  totalClearance: { label: 'Cortes' },
  effectiveClearance: { label: 'Cortes certos' },
  clearancePct: { label: 'Eficiência nos cortes', suffix: '%' },
  duelsWon: { label: 'Duelos ganhos' },
  aerialsWon: { label: 'Duelos aéreos ganhos' },
  ownGoals: { label: 'Gols contra' },
  freeKickGoals: { label: 'Gols de falta' },
  freeKickShots: { label: 'Finalizações de falta' },
  headedGoals: { label: 'Gols de cabeça' },
  leftFootShots: { label: 'Chutes de pé esquerdo' },
  rightFootShots: { label: 'Chutes de pé direito' },
  insideBoxShots: { label: 'Finalizações dentro da área' },
  outsideBoxShots: { label: 'Finalizações fora da área' },
  bigChances: { label: 'Grandes chances' },
  bigChancesMissed: { label: 'Grandes chances perdidas' },
  expectedGoals: { label: 'Gols esperados (xG)' },
  touches: { label: 'Toques na bola' },
  dispossessed: { label: 'Perdas de posse' },
  appearances: { label: 'Participações' },
  subIns: { label: 'Substituições utilizadas' },
};

const DISPLAY_NAME_TRANSLATIONS: Record<string, string> = {
  'goal difference': 'Saldo de gols',
  'total goals': 'Gols marcados',
  goals: 'Gols marcados',
  assists: 'Assistências',
  'goal assists': 'Assistências',
  'goals against': 'Gols sofridos',
  'goals conceded': 'Gols sofridos',
  fouls: 'Faltas',
  'fouls committed': 'Faltas cometidas',
  'fouls suffered': 'Faltas sofridas',
  'yellow cards': 'Cartões amarelos',
  'red cards': 'Cartões vermelhos',
  offsides: 'Impedimentos',
  saves: 'Defesas',
  'blocked shots': 'Chutes bloqueados',
  'shots off target': 'Finalizações para fora',
  'shots on post': 'Bolas na trave',
  'shot accuracy': 'Precisão nas finalizações',
  'shot %': 'Precisão nas finalizações',
  'total passes': 'Passes tentados',
  passes: 'Passes',
  'accurate passes': 'Passes certos',
  'pass completion %': 'Precisão nos passes',
  'pass accuracy': 'Precisão nos passes',
  'pass %': 'Precisão nos passes',
  crosses: 'Cruzamentos',
  'total crosses': 'Cruzamentos tentados',
  'accurate crosses': 'Cruzamentos certos',
  'cross %': 'Precisão nos cruzamentos',
  'long balls': 'Bolas longas',
  'total long balls': 'Bolas longas',
  'accurate long balls': 'Bolas longas certas',
  'long ball %': 'Precisão nas bolas longas',
  tackles: 'Desarmes',
  'total tackles': 'Desarmes',
  'effective tackles': 'Desarmes certos',
  'tackle %': 'Eficiência nos desarmes',
  interceptions: 'Interceptações',
  clearances: 'Cortes',
  'total clearances': 'Cortes',
  'effective clearances': 'Cortes certos',
  'duels won': 'Duelos ganhos',
  'aerials won': 'Duelos aéreos ganhos',
  'own goals': 'Gols contra',
  'penalty kick goals': 'Gols de pênalti',
  'penalty kick shots': 'Pênaltis cobrados',
  'penalty kicks': 'Pênaltis',
  'free kick goals': 'Gols de falta',
  'free kick shots': 'Finalizações de falta',
  'headed goals': 'Gols de cabeça',
  'expected goals': 'Gols esperados (xG)',
  touches: 'Toques na bola',
  dispossessed: 'Perdas de posse',
  appearances: 'Participações',
};

function translateStatLabel(rawLabel: string): string {
  const normalized = rawLabel.trim().toLowerCase();
  if (DISPLAY_NAME_TRANSLATIONS[normalized]) {
    return DISPLAY_NAME_TRANSLATIONS[normalized];
  }
  return rawLabel
    .replace(/\bGoal Difference\b/gi, 'Saldo de gols')
    .replace(/\bTotal Goals\b/gi, 'Gols marcados')
    .replace(/\bGoals Conceded\b/gi, 'Gols sofridos')
    .replace(/\bGoals Against\b/gi, 'Gols sofridos')
    .replace(/\bGoal Assists\b/gi, 'Assistências')
    .replace(/\bAssists\b/gi, 'Assistências')
    .replace(/\bGoals\b/gi, 'Gols')
    .replace(/\bShots\b/gi, 'Finalizações')
    .replace(/\bPasses\b/gi, 'Passes')
    .replace(/\bTackles\b/gi, 'Desarmes')
    .replace(/\bCrosses\b/gi, 'Cruzamentos')
    .replace(/\bClearances?\b/gi, 'Cortes')
    .replace(/\bInterceptions\b/gi, 'Interceptações')
    .replace(/\bSaves\b/gi, 'Defesas')
    .replace(/\bFouls\b/gi, 'Faltas')
    .replace(/\bOffsides\b/gi, 'Impedimentos')
    .replace(/\bCorners\b/gi, 'Escanteios')
    .replace(/\bCards\b/gi, 'Cartões')
    .replace(/\bAccurate\b/gi, 'Certos')
    .replace(/\bEffective\b/gi, 'Eficientes')
    .replace(/\bBlocked\b/gi, 'Bloqueados')
    .replace(/\bTotal\b/gi, 'Total de');
}

function getTeamStatistics(
  team: ESPNBoxscoreTeam | undefined
): Map<string, number> {
  const result = new Map<string, number>();
  team?.statistics?.forEach((statistic) => {
    if (typeof statistic.displayValue !== 'string') return;
    const value = Number.parseFloat(statistic.displayValue.replace('%', ''));
    if (Number.isFinite(value)) result.set(statistic.name, value);
  });
  return result;
}

function getMatchStatistics(
  summary: ESPNMatchSummary
): { stats: EssentialStats | null; additionalStats: MatchStatistic[] } {
  const teams = summary.boxscore?.teams ?? [];
  const homeTeam = teams.find((team) => team.homeAway === 'home');
  const awayTeam = teams.find((team) => team.homeAway === 'away');
  const home = getTeamStatistics(homeTeam);
  const away = getTeamStatistics(awayTeam);

  const getPair = (key: string): [number, number] | null => {
    const homeValue = home.get(key);
    const awayValue = away.get(key);
    return homeValue === undefined || awayValue === undefined
      ? null
      : [homeValue, awayValue];
  };

  const possession = getPair('possessionPct');
  const shotsTotal = getPair('totalShots');
  const shotsOnTarget = getPair('shotsOnTarget');
  const corners = getPair('wonCorners');

  const essentialValues = [
    possession,
    shotsTotal,
    shotsOnTarget,
    corners,
  ];
  const hasEssentialStats = essentialValues.some((value) => value !== null);
  const stats: EssentialStats | null = hasEssentialStats
    ? {
        possession: possession ?? [null, null],
        shotsTotal: shotsTotal ?? [null, null],
        shotsOnTarget: shotsOnTarget ?? [null, null],
        corners: corners ?? [null, null],
      }
    : null;

  const additionalStatKeys = new Set([
    ...(homeTeam?.statistics ?? []).map((statistic) => statistic.name),
    ...(awayTeam?.statistics ?? []).map((statistic) => statistic.name),
  ]);
  const essentialStatKeys = new Set([
    'possessionPct',
    'totalShots',
    'shotsOnTarget',
    'wonCorners',
  ]);
  const additionalStats = Array.from(additionalStatKeys)
    .filter((key) => !essentialStatKeys.has(key))
    .flatMap((key) => {
      const metadata = STAT_LABELS[key];
      const homeValue = homeTeam?.statistics?.find((statistic) => statistic.name === key);
      const awayValue = awayTeam?.statistics?.find((statistic) => statistic.name === key);
      if (!homeValue?.displayValue || !awayValue?.displayValue) return [];
      return [
        {
          id: key,
          label: translateStatLabel(
            metadata?.label ??
            homeValue?.displayName ??
            awayValue?.displayName ??
            key
              .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
              .replace(/^./, (character) => character.toUpperCase())
          ),
          home: homeValue.displayValue,
          away: awayValue.displayValue,
          suffix: metadata?.suffix,
        },
      ];
    });

  return { stats, additionalStats };
}

function translateMatchInfoText(raw: string): string {
  return raw
    .replace(/\bGroup Stage\b/gi, 'Fase de Grupos')
    .replace(/\bRegular Season\b/gi, 'Temporada Regular')
    .replace(/\bLeague Phase\b/gi, 'Fase de Liga')
    .replace(/\bKnockout Stage\b/gi, 'Fase Eliminatória')
    .replace(/\bRound of 16\b/gi, 'Oitavas de Final')
    .replace(/\bEighth-finals\b/gi, 'Oitavas de Final')
    .replace(/\bRound of 32\b/gi, '16-avos de Final')
    .replace(/\bRound of 64\b/gi, '32-avos de Final')
    .replace(/\bQuarter-?finals\b/gi, 'Quartas de Final')
    .replace(/\bSemi-?finals\b/gi, 'Semifinais')
    .replace(/\b(?:3rd Place Final|Third Place)\b/gi, 'Disputa de 3º Lugar')
    .replace(/\bFinal Stage\b/gi, 'Fase Final')
    .replace(/\bFirst Round\b/gi, '1ª Fase')
    .replace(/\bSecond Round\b/gi, '2ª Fase')
    .replace(/\bThird Round\b/gi, '3ª Fase')
    .replace(/\bQualifying\b/gi, 'Qualificatórias')
    .replace(/\bPlay-?offs\b/gi, 'Playoffs')
    .replace(/\bMatchday\s+(\d+)\b/gi, 'Rodada $1')
    .replace(/\bWeek\s+(\d+)\b/gi, 'Rodada $1')
    .replace(/\bLeg\s+(\d+)\b/gi, 'Jogo $1')
    .replace(/\bGroup\s+([A-Z0-9]+)\b/gi, 'Grupo $1')
    .replace(/\bWomen's World Cup\b/gi, 'Copa do Mundo Feminina')
    .replace(/\bWorld Cup\b/gi, 'Copa do Mundo')
    .replace(/\bU-?17\b/gi, 'Sub-17')
    .replace(/\bU-?20\b/gi, 'Sub-20')
    .replace(/\bU-?21\b/gi, 'Sub-21')
    .replace(/\bU-?23\b/gi, 'Sub-23')
    .replace(/\bMorocco\b/gi, 'Marrocos')
    .replace(/\bBrazil\b/gi, 'Brasil')
    .replace(/\bEngland\b/gi, 'Inglaterra')
    .replace(/\bSpain\b/gi, 'Espanha')
    .replace(/\bFrance\b/gi, 'França')
    .replace(/\bGermany\b/gi, 'Alemanha')
    .replace(/\bItaly\b/gi, 'Itália')
    .replace(/\bNetherlands\b/gi, 'Holanda')
    .replace(/\b(?:United States|USA)\b/gi, 'Estados Unidos')
    .replace(/\bJapan\b/gi, 'Japão')
    .replace(/\bBelgium\b/gi, 'Bélgica')
    .replace(/\bSwitzerland\b/gi, 'Suíça')
    .replace(/\bScotland\b/gi, 'Escócia')
    .replace(/\bTurkey\b/gi, 'Turquia')
    .replace(/\bSaudi Arabia\b/gi, 'Arábia Saudita')
    .replace(/\bMexico\b/gi, 'México')
    .replace(/\bUruguay\b/gi, 'Uruguai')
    .replace(/\bParaguay\b/gi, 'Paraguai')
    .replace(/\bEcuador\b/gi, 'Equador')
    .replace(/\bSouth Korea\b/gi, 'Coreia do Sul')
    .replace(/\bPoland\b/gi, 'Polônia')
    .replace(/\bAustria\b/gi, 'Áustria')
    .replace(/\bSweden\b/gi, 'Suécia')
    .replace(/\bNorway\b/gi, 'Noruega')
    .replace(/\bDenmark\b/gi, 'Dinamarca')
    .replace(/\bGreece\b/gi, 'Grécia')
    .replace(/\bCroatia\b/gi, 'Croácia')
    .replace(/\bSerbia\b/gi, 'Sérvia')
    .replace(/\bUkraine\b/gi, 'Ucrânia')
    .replace(/\bEgypt\b/gi, 'Egito')
    .replace(/\bSouth Africa\b/gi, 'África do Sul')
    .replace(/\bVideo Assistant Referee\b/gi, 'VAR')
    .replace(/\bAssistant Referee\b/gi, 'Assistente')
    .replace(/\bFourth Official\b/gi, 'Quarto Árbitro')
    .replace(/\bReferee\b/gi, 'Árbitro');
}

function getMatchInfo(summary: ESPNMatchSummary, match?: Match): MatchInfoItem[] {
  const competition = summary.header?.competitions?.[0];
  const gameInfo = summary.gameInfo;
  const venue = gameInfo?.venue ?? competition?.venue;
  const venueLocation = translateMatchInfoText(
    [
      venue?.address?.city,
      venue?.address?.state,
      venue?.address?.country,
    ]
      .filter((value): value is string => Boolean(value?.trim()))
      .filter((value, index, values) => values.indexOf(value) === index)
      .join(', ')
  );
  const stadiumName = venue?.fullName?.trim() ?? '';
  const venueValue = [stadiumName, venueLocation]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(' — ');
  const items: MatchInfoItem[] = [];

  const rawSeasonName =
    summary.header?.season?.displayName ?? summary.header?.season?.name ?? '';
  const seasonParts = rawSeasonName
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const leagueTitle = translateMatchInfoText(
    summary.header?.league?.displayName ||
      summary.header?.league?.name ||
      seasonParts[0] ||
      match?.leagueName ||
      ''
  );
  if (leagueTitle) {
    items.push({
      id: 'competition',
      label: 'Competição',
      value: leagueTitle,
      subtitle:
        match?.leagueCountry &&
        match.leagueCountry.toUpperCase() !== 'INTERNACIONAL'
          ? match.leagueCountry
          : 'Torneio Internacional',
      icon: '🏆',
      category: 'COMPETITION',
    });
  }

  const roundParts = [
    ...seasonParts.slice(1),
    summary.header?.seasonType?.displayName,
    summary.header?.week?.text,
    ...(competition?.notes ?? []).map((note) => note.headline ?? note.text),
  ]
    .map((value) => (value ? translateMatchInfoText(value.trim()) : ''))
    .filter((value): value is string => Boolean(value))
    .filter(
      (value, index, values) =>
        values.indexOf(value) === index &&
        value.toLowerCase() !== leagueTitle.toLowerCase()
    );
  const fallbackRound = translateMatchInfoText(
    [
      summary.header?.season?.displayName,
      summary.header?.season?.name,
      summary.header?.seasonType?.displayName,
      summary.header?.week?.text,
      ...(competition?.notes ?? []).map((note) => note.headline ?? note.text),
    ]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value))
      .filter((value, index, values) => values.indexOf(value) === index)
      .join(' · ')
  );
  const roundValue = roundParts.join(' · ') || fallbackRound;
  if (roundValue) {
    items.push({
      id: 'round',
      label: 'Fase / Rodada',
      value: roundValue,
      subtitle: leagueTitle || undefined,
      icon: '📌',
      category: 'COMPETITION',
    });
  }

  const rawDate = competition?.date;
  if (rawDate) {
    const parsedDate = new Date(rawDate);
    if (!Number.isNaN(parsedDate.getTime())) {
      const formattedDate = parsedDate.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const formattedTime = parsedDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      items.push({
        id: 'datetime',
        label: 'Data e Horário',
        value: `${formattedDate.replace(/^\w/, (c) => c.toUpperCase())} • ${formattedTime}`,
        subtitle: 'Horário local',
        icon: '📅',
        category: 'SCHEDULE',
      });
    }
  } else if (match?.startTime) {
    items.push({
      id: 'datetime',
      label: 'Horário de Início',
      value: match.startTime,
      subtitle: 'Horário local',
      icon: '⏰',
      category: 'SCHEDULE',
    });
  }

  if (venueValue) {
    const venueDetails: string[] = [];
    if (venueLocation && stadiumName) {
      venueDetails.push(venueLocation);
    }
    if (typeof venue?.grass === 'boolean') {
      venueDetails.push(venue.grass ? 'Gramado natural' : 'Gramado sintético');
    }
    if (venue?.capacity) {
      const cap =
        typeof venue.capacity === 'number'
          ? venue.capacity.toLocaleString('pt-BR')
          : String(venue.capacity);
      venueDetails.push(`Capacidade: ${cap}`);
    }
    items.push({
      id: 'venue',
      label: 'Estádio',
      value: stadiumName || venueValue,
      subtitle: venueDetails.join(' • ') || undefined,
      icon: '🏟️',
      category: 'VENUE',
    });
  }

  const attendance = gameInfo?.attendance ?? competition?.attendance;
  if (
    (typeof attendance === 'number' && Number.isFinite(attendance) && attendance > 0) ||
    (typeof attendance === 'string' && attendance.trim() && attendance.trim() !== '0')
  ) {
    items.push({
      id: 'attendance',
      label: 'Público',
      value:
        typeof attendance === 'number'
          ? `${attendance.toLocaleString('pt-BR')} torcedores`
          : attendance.trim(),
      icon: '👥',
      category: 'VENUE',
    });
  }

  const weather =
    gameInfo?.weather?.displayValue ??
    gameInfo?.weather?.condition ??
    (typeof gameInfo?.weather?.temperature === 'number'
      ? `${gameInfo.weather.temperature}°C`
      : undefined);
  if (weather?.trim()) {
    items.push({
      id: 'weather',
      label: 'Clima',
      value: translateMatchInfoText(weather.trim()),
      icon: '🌤️',
      category: 'VENUE',
    });
  }

  const officials = [...(gameInfo?.officials ?? []), ...(competition?.officials ?? [])]
    .map((official) => {
      const name = official.displayName ?? official.fullName;
      if (!name?.trim()) return null;
      const rawPos = official.position?.displayName ?? official.position?.name;
      const position = rawPos ? translateMatchInfoText(rawPos) : undefined;
      return position ? `${name} (${position})` : name;
    })
    .filter((value): value is string => Boolean(value));
  if (officials.length) {
    items.push({
      id: 'officials',
      label: 'Arbitragem',
      value: officials.filter((name, index) => officials.indexOf(name) === index).join(' • '),
      icon: '🧑‍⚖️',
      category: 'OFFICIALS',
    });
  }

  const broadcasts = [...(summary.broadcasts ?? []), ...(competition?.broadcasts ?? [])]
    .flatMap((broadcast) => broadcast.names ?? [])
    .map((name) => name.trim())
    .filter(Boolean)
    .filter((name, index, names) => names.indexOf(name) === index);
  if (broadcasts.length) {
    items.push({
      id: 'broadcast',
      label: 'Transmissão',
      value: broadcasts.join(', '),
      icon: '📺',
      category: 'BROADCAST',
    });
  }

  return items;
}

function parseVARDecision(
  text: string,
  shortText: string,
  rawType: string,
  participantNames: string[]
): { decision: string; playerName?: string } {
  const combined = `${rawType} ${shortText} ${text}`.toLowerCase();

  const isOverturned =
    /overturn|disallow|cancel|anulado|recusado|no goal|no penalty|not given|rescind|anula[çc][ãa]o/i.test(
      combined
    );
  const isConfirmed =
    /confirm|awarded|given|stands|marcado|concedido|validado|dado|award/i.test(
      combined
    );
  const isOffside = /offside|impedimento/i.test(combined);
  const isHandball =
    /handball|hand ball|toque de m[ãa]o|m[ãa]o/i.test(combined);
  const isFoul = /foul|falta/i.test(combined);
  const isGoal = /goal|gol/i.test(combined);
  const isPenalty = /penalty|p[êe]nalti/i.test(combined);
  const isRedCard = /red card|cart[ãa]o vermelho/i.test(combined);

  let decision = 'Revisão do VAR';

  if (isPenalty) {
    if (isOverturned) {
      decision = 'Pênalti anulado pelo VAR';
    } else if (isConfirmed) {
      decision = 'Pênalti marcado pelo VAR';
    } else {
      decision = 'Checagem de pênalti pelo VAR';
    }
  } else if (isGoal) {
    if (isOverturned) {
      if (isOffside) {
        decision = 'Gol anulado (Impedimento)';
      } else if (isHandball) {
        decision = 'Gol anulado (Toque de mão)';
      } else if (isFoul) {
        decision = 'Gol anulado (Falta)';
      } else {
        decision = 'Gol anulado pelo VAR';
      }
    } else if (isConfirmed) {
      decision = 'Gol confirmado pelo VAR';
    } else {
      decision = 'Checagem de gol pelo VAR';
    }
  } else if (isRedCard) {
    if (isOverturned) {
      decision = 'Cartão vermelho cancelado pelo VAR';
    } else {
      decision = 'Cartão vermelho após VAR';
    }
  } else if (/card|cart[ãa]o/i.test(combined)) {
    decision = isOverturned
      ? 'Cartão cancelado pelo VAR'
      : 'Cartão após revisão do VAR';
  } else if (isOverturned) {
    decision = 'Decisão alterada pelo VAR';
  } else if (/stand|mantid/i.test(combined)) {
    decision = 'Decisão de campo mantida';
  }

  let playerName: string | undefined = undefined;
  if (
    participantNames[0] &&
    !/var|video|review|delay/i.test(participantNames[0])
  ) {
    playerName = participantNames[0];
  } else {
    const playerMatch = `${shortText} ${text}`.match(
      /\(([A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'.-]+(?:\s+[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'.-]+)+)\)/
    );
    if (playerMatch?.[1]) {
      playerName = playerMatch[1];
    }
  }

  return { decision, playerName };
}

function getMatchEvents(
  summary: ESPNMatchSummary,
  homeTeamId: string,
  awayTeamId: string
): MatchEvent[] {
  const goalkeeperIds = new Set<string>();
  const goalkeeperNames = new Set<string>();
  (summary.rosters ?? []).forEach((roster) => {
    (roster.roster ?? []).forEach((player) => {
      const isGk =
        /goalkeeper|goleiro/i.test(player.position?.displayName ?? '') ||
        Number(player.formationPlace) === 1;
      if (isGk) {
        if (player.athlete?.id) goalkeeperIds.add(player.athlete.id);
        if (player.athlete?.displayName) {
          goalkeeperNames.add(player.athlete.displayName.trim().toLowerCase());
        }
        if (player.athlete?.shortName) {
          goalkeeperNames.add(player.athlete.shortName.trim().toLowerCase());
        }
      }
    });
  });

  (summary.keyEvents ?? []).forEach((event) => {
    const text = event.text ?? '';
    const savedByMatch = /saved[^.]*?\bby\s+([A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'.-]+(?:\s+[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'.-]+)*)/i.exec(
      text
    );
    if (savedByMatch?.[1]) {
      goalkeeperNames.add(savedByMatch[1].trim().toLowerCase());
    }
  });

  return (summary.keyEvents ?? []).flatMap((event) => {
    const rawType = event.type?.text ?? event.type?.type ?? '';
    const normalizedType = rawType.toLowerCase();
    const description = `${event.text ?? ''} ${event.shortText ?? ''}`;
    const isVAR =
      /\bvar\b|video assistant referee|video review/i.test(
        `${rawType} ${description}`
      );
    const isGoal = normalizedType.includes('goal') || Boolean(event.scoringPlay);
    const isPenaltyMissed =
      !isGoal &&
      !isVAR &&
      /penalty\s*(?:-?\s*)?(?:missed|saved|struck|fail|post|bar)|(?:missed|saved)\s*(?:-?\s*)?penalty|p[êe]nalti\s*(?:-?\s*)?(?:perdido|defendido|desperdi[çc]ado)|(?:perdeu|defendeu)\s*(?:o\s*)?p[êe]nalti/i.test(
        `${rawType} ${description}`
      );
    const isRedCard = normalizedType.includes('red card');
    const isYellowCard = normalizedType.includes('yellow card');
    const isSubstitution = normalizedType.includes('substitution');
    const isKickoff =
      normalizedType.includes('kickoff') ||
      normalizedType.includes('start of 1st half');
    const isFullTime =
      /end regular time|full.?time|end (?:of )?2nd half|final whistle|end extra time|match ended/i.test(
        `${rawType} ${description}`
      );
    const isHalftime =
      /half.?time|end (?:of )?1st half|end first half/i.test(normalizedType);
    const isSecondHalf = /start 2nd half|second half|2nd half/i.test(
      normalizedType
    );
    if (normalizedType.includes('delay') && !isVAR) {
      return [];
    }

    const participantNames =
      event.participants
        ?.map((participant) => participant.athlete?.displayName)
        .filter((name): name is string => Boolean(name)) ?? [];
    const shortName = event.shortText
      ?.replace(
        /\s*(?:-?\s*)?(?:own goal|goal|penalty\s*-?\s*saved|penalty\s*-?\s*missed|penalty\s*-?\s*scored|penalty|yellow card|red card|substitution)$/i,
        ''
      )
      .trim();
    const primaryPlayerName =
      (isSubstitution ? participantNames.join(' • ') : participantNames[0]) ||
      shortName ||
      rawType;

    const assistMatch = isGoal
      ? /(?:assisted\s+by|assistência\s+de)\s+([A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'.-]+(?:\s+[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'.-]+)*)/i.exec(
          event.text ?? ''
        )
      : null;
    const assistFromParticipants =
      isGoal && participantNames.length >= 2 ? participantNames[1] : undefined;
    const assistPlayerName =
      assistFromParticipants || (assistMatch ? assistMatch[1].trim() : undefined);

    const isGoalkeeperSaveEvent = (() => {
      if (!isPenaltyMissed) return false;
      const normalizedPlayer = primaryPlayerName.trim().toLowerCase();
      if (goalkeeperNames.has(normalizedPlayer)) return true;
      const escapedName = primaryPlayerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (
        escapedName &&
        new RegExp(`(?:saved\\s+.*by|saved\\s+by)\\s+${escapedName}`, 'i').test(
          event.text ?? ''
        )
      ) {
        return true;
      }
      if (
        escapedName &&
        new RegExp(
          `penalty\\s+(?:saved|missed)[.!:\\s]+(?!${escapedName})`,
          'i'
        ).test(event.text ?? '')
      ) {
        return true;
      }
      return false;
    })();

    if (isGoalkeeperSaveEvent) {
      return [];
    }

    const penaltyMissedReason = (() => {
      if (!isPenaltyMissed) return null;
      if (/post|bar|trave|madeira|woodwork/i.test(`${rawType} ${description}`)) {
        return 'Pênalti na trave';
      }
      if (/saved|defendid|defendeu/i.test(`${rawType} ${description}`)) {
        return 'Pênalti defendido';
      }
      return 'Pênalti perdido';
    })();

    const type: MatchEvent['type'] = isGoal
      ? 'GOAL'
      : isVAR
      ? 'VAR'
      : isPenaltyMissed
      ? 'PENALTY_MISSED'
      : isRedCard
      ? 'RED_CARD'
      : isYellowCard
      ? 'YELLOW_CARD'
      : isSubstitution
      ? 'SUBSTITUTION'
      : isKickoff
      ? 'KICKOFF'
      : isHalftime
      ? 'HALF_TIME'
      : isFullTime
      ? 'FULL_TIME'
      : isSecondHalf
      ? 'SECOND_HALF'
      : 'OTHER';

    const teamId = event.team?.id;
    const team =
      teamId === homeTeamId
        ? 'HOME'
        : teamId === awayTeamId
        ? 'AWAY'
        : undefined;
    const minute = Number.parseInt(event.clock?.displayValue ?? '', 10);
    const eventPeriod =
      typeof event.period === 'number' ? event.period : event.period?.number;
    const period = eventPeriod ?? (minute > 45 ? 2 : 1);
    const varParsed = isVAR
      ? parseVARDecision(
          event.text ?? '',
          event.shortText ?? '',
          rawType,
          participantNames
        )
      : null;

    const label =
      type === 'GOAL'
        ? 'Gol'
        : type === 'PENALTY_MISSED'
        ? (penaltyMissedReason ?? 'Pênalti perdido')
        : type === 'RED_CARD'
        ? 'Cartão vermelho'
        : type === 'YELLOW_CARD'
        ? 'Cartão amarelo'
        : type === 'SUBSTITUTION'
        ? 'Substituição'
        : type === 'VAR'
        ? varParsed?.decision ?? 'Revisão do VAR'
        : type === 'KICKOFF'
        ? 'Início do jogo'
        : type === 'HALF_TIME'
        ? 'Intervalo'
        : type === 'SECOND_HALF'
        ? 'Início do 2º tempo'
        : type === 'FULL_TIME'
        ? 'Fim de jogo'
        : rawType || 'Evento';

    const finalPlayerName =
      type === 'VAR'
        ? varParsed?.playerName || varParsed?.decision || 'Revisão do VAR'
        : type === 'GOAL' && (!primaryPlayerName || /^(goal|gol|scoring play|gol marcado)$/i.test(primaryPlayerName.trim()))
        ? 'Gol'
        : primaryPlayerName || (type === 'GOAL' ? 'Gol' : 'Evento da partida');

    return [
      {
        id: event.id,
        minute: Number.isFinite(minute) ? minute : 0,
        time: event.clock?.displayValue ?? (Number.isFinite(minute) ? `${minute}'` : ''),
        period: Math.max(period, 1),
        type,
        label,
        team,
        playerName: finalPlayerName,
        assistPlayerName: assistPlayerName || undefined,
        detail: event.text,
      },
    ];
  });
}

function getStandings(summary: ESPNMatchSummary): MatchStanding[] | null {
  const entries =
    summary.standings?.groups?.flatMap(
      (group) => group.standings?.entries ?? []
    ) ?? [];
  const standings = entries.flatMap((entry, index) => {
    const teamId =
      typeof entry.team === 'string' ? entry.id : entry.team.id ?? entry.id;
    const teamName =
      typeof entry.team === 'string' ? entry.team : entry.team.displayName;
    const stats = new Map(
      (entry.stats ?? []).map((stat) => [
        stat.name,
        stat.value ??
          (stat.displayValue
            ? Number.parseFloat(stat.displayValue.replace('+', ''))
            : undefined),
      ])
    );
    const getStat = (name: string): number => stats.get(name) ?? 0;
    const logo =
      (Array.isArray(entry.logo) ? entry.logo[0]?.href : entry.logo?.href) ??
      (typeof entry.team === 'string'
        ? undefined
        : entry.team.logo ?? entry.team.logos?.[0]?.href);
    if (!teamId || !teamName || !stats.has('points')) return [];
    return [
      {
        teamId,
        teamName,
        logoUrl: logo,
        rank: getStat('rank') || index + 1,
        played: getStat('gamesPlayed'),
        wins: getStat('wins'),
        draws: getStat('ties'),
        losses: getStat('losses'),
        goalDifference: getStat('pointDifferential'),
        points: getStat('points'),
      },
    ];
  });
  return standings.length > 0 ? standings : null;
}

function getMatchLineups(summary: ESPNMatchSummary): MatchLineup[] | null {
  const lineups = (summary.rosters ?? []).flatMap((roster) => {
    const teamSide: MatchLineup['teamSide'] =
      roster.homeAway === 'home' ? 'HOME' : 'AWAY';
    const players = (roster.roster ?? []).flatMap((player, index) => {
      const name = player.athlete?.displayName;
      if (!name) return [];
      const parsedFormationPlace = Number.parseInt(
        String(player.formationPlace ?? ''),
        10
      );
      return [
        {
          id: player.athlete?.id ?? `${roster.homeAway}-${index}-${name}`,
          name,
          position: player.position?.displayName ?? '',
          formationPlace: Number.isInteger(parsedFormationPlace)
            ? parsedFormationPlace
            : undefined,
          shortName:
            player.athlete?.shortName ??
            (() => {
              const parts = name.trim().split(/\s+/);
              return parts.length > 1
                ? `${parts[0][0]}. ${parts[parts.length - 1]}`
                : name;
            })(),
          jersey: player.jersey,
          ...(() => {
            const statMap = new Map(
              (player.stats ?? []).map((s) => [
                s.name,
                typeof s.value === 'number'
                  ? s.value
                  : Number.parseFloat(s.displayValue ?? '0') || 0,
              ])
            );
            const getStat = (key: string) => statMap.get(key) ?? 0;
            const goals =
              getStat('totalGoals') ||
              (player.plays?.filter((p) => p.scoringPlay && !p.ownGoal).length ?? 0);
            const assists = getStat('goalAssists');
            const yellowCard =
              getStat('yellowCards') > 0 ||
              Boolean(player.plays?.some((p) => p.yellowCard));
            const redCard =
              getStat('redCards') > 0 ||
              Boolean(player.plays?.some((p) => p.redCard));
            const idSeed = Array.from(player.athlete?.id ?? name).reduce(
              (sum, ch) => sum + ch.charCodeAt(0),
              0
            );
            const baseVariation = ((idSeed % 9) - 4) * 0.1;
            const rawRating =
              6.7 +
              baseVariation +
              goals * 1.1 +
              assists * 0.7 +
              getStat('shotsOnTarget') * 0.25 +
              getStat('saves') * 0.2 +
              getStat('foulsSuffered') * 0.08 -
              getStat('foulsCommitted') * 0.12 -
              (yellowCard ? 0.35 : 0) -
              (redCard ? 1.4 : 0) -
              getStat('goalsConceded') * 0.15;
            const rating =
              Math.round(Math.max(5.2, Math.min(9.8, rawRating)) * 10) / 10;
            return {
              goals,
              assists,
              yellowCard,
              redCard,
              rating,
            };
          })(),
          isStarter: Boolean(player.starter),
          subbedIn: Boolean(player.subbedIn),
          subbedOut: Boolean(player.subbedOut),
          subMinute: player.plays?.find((play) => play.substitution)?.clock?.displayValue?.trim(),
          replacedPlayerName: player.subbedIn
            ? player.subbedInFor?.athlete?.shortName ??
              player.subbedInFor?.athlete?.displayName
            : player.subbedOut
            ? player.subbedOutFor?.athlete?.shortName ??
              player.subbedOutFor?.athlete?.displayName
            : undefined,
        },
      ];
    });
    if (!players.length) return [];
    return [
      {
        teamSide,
        teamName: roster.team?.displayName ?? '',
        teamLogoUrl: roster.team?.logo ?? roster.team?.logos?.[0]?.href,
        formation: roster.formation,
        players,
      },
    ];
  });
  return lineups.length ? lineups : null;
}

function translateH2HCompetitionName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed
    .replace(/\bQualifying\b/gi, 'Qualificatória')
    .replace(/\bGroup Stage\b/gi, 'Fase de Grupos')
    .replace(/\bKnockout Stage\b/gi, 'Mata-mata')
    .replace(/\bRound of 16\b/gi, 'Oitavas de Final')
    .replace(/\bQuarterfinals?\b/gi, 'Quartas de Final')
    .replace(/\bSemifinals?\b/gi, 'Semifinal')
    .replace(/\bClub Friendly\b/gi, 'Amistoso de Clubes')
    .replace(/\bFriendly\b/gi, 'Amistoso');
}

function translateH2HSummary(rawSummary?: string): string | undefined {
  if (!rawSummary) return undefined;
  const trimmed = rawSummary.trim();
  const leadsMatch = /^(.+?)\s+leads\s+series\s+(\d+-\d+(?:-\d+)?)$/i.exec(trimmed);
  if (leadsMatch) {
    return `${leadsMatch[1]} lidera o confronto (${leadsMatch[2]})`;
  }
  const tiedMatch = /^series\s+tied\s+(\d+-\d+(?:-\d+)?)$/i.exec(trimmed);
  if (tiedMatch) {
    return `Confronto empatado (${tiedMatch[1]})`;
  }
  return trimmed;
}

function getHeadToHead(summary: ESPNMatchSummary): MatchHeadToHead | null {
  const series = summary.seasonseries?.find(
    (item) => item.type === 'head-to-head'
  );
  if (!series) return null;

  const matches = (series.events ?? [])
    .flatMap((event) => {
      const home = event.competitors?.find(
        (competitor) => competitor.homeAway === 'home'
      );
      const away = event.competitors?.find(
        (competitor) => competitor.homeAway === 'away'
      );
      const homeScore = Number(home?.score);
      const awayScore = Number(away?.score);
      if (
        !event.id ||
        !event.date ||
        !home?.team?.displayName ||
        !away?.team?.displayName ||
        !Number.isFinite(homeScore) ||
        !Number.isFinite(awayScore)
      ) {
        return [];
      }
      return [
        {
          id: event.id,
          date: event.date,
          competitionName: translateH2HCompetitionName(event.competitionName ?? ''),
          status: event.statusType?.shortDetail ?? '',
          homeTeamId: home.team.id,
          awayTeamId: away.team.id,
          homeTeamName: home.team.displayName,
          awayTeamName: away.team.displayName,
          homeTeamShortName: home.team.abbreviation,
          awayTeamShortName: away.team.abbreviation,
          homeTeamLogo: home.team.logo ?? home.team.logos?.[0]?.href,
          awayTeamLogo: away.team.logo ?? away.team.logos?.[0]?.href,
          homeScore,
          awayScore,
        },
      ];
    })
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  if (!matches.length && !series.summary && !series.seriesScore) return null;
  return {
    summary: translateH2HSummary(series.summary),
    seriesScore: series.seriesScore,
    matches,
  };
}

function applyLiveResultsToStandings(
  standings: MatchStanding[],
  matches: Match[],
  leagueId: string
): MatchStanding[] {
  const projected = new Map(
    standings.map((standing) => [standing.teamId, { ...standing }])
  );
  matches
    .filter(
      (match) =>
        match.leagueId === leagueId &&
        (match.status === '1H' || match.status === '2H' || match.status === 'HT')
    )
    .forEach((match) => {
      const home = projected.get(match.homeTeam.id);
      const away = projected.get(match.awayTeam.id);
      if (!home || !away) return;

      const homeScore = match.homeTeam.score;
      const awayScore = match.awayTeam.score;
      home.played += 1;
      away.played += 1;
      home.goalDifference += homeScore - awayScore;
      away.goalDifference += awayScore - homeScore;
      if (homeScore > awayScore) {
        home.wins += 1;
        away.losses += 1;
        home.points += 3;
      } else if (homeScore < awayScore) {
        away.wins += 1;
        home.losses += 1;
        away.points += 3;
      } else {
        home.draws += 1;
        away.draws += 1;
        home.points += 1;
        away.points += 1;
      }
    });

  return Array.from(projected.values())
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.wins - a.wins ||
        a.teamName.localeCompare(b.teamName)
    )
    .map((standing, index) => ({ ...standing, rank: index + 1 }));
}

export interface MatchDetails {
  stats: EssentialStats | null;
  additionalStats: MatchStatistic[];
  events: MatchEvent[];
  lineups: MatchLineup[] | null;
  headToHead: MatchHeadToHead | null;
  standings: MatchStanding[] | null;
  standingsAreProjected: boolean;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  status: MatchStatus;
  minute: number | null;
  minuteLabel: string | null;
  info: MatchInfoItem[];
}

export async function fetchMatchDetails(
  match: Match,
  relatedMatches: Match[] = []
): Promise<MatchDetails> {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}/all/summary?event=${encodeURIComponent(match.id)}&_=${Date.now()}`
  );
  if (!response.ok) {
    throw new Error(`A API respondeu com HTTP ${response.status} ao buscar os detalhes.`);
  }

  const summary: ESPNMatchSummary = await response.json();
  if (!summary.header?.competitions?.[0]?.competitors) {
    throw new Error('A API não retornou os times para esta partida.');
  }

  const competitors = summary.header.competitions[0].competitors;
  const home = competitors.find((team) => team.homeAway === 'home');
  const away = competitors.find((team) => team.homeAway === 'away');
  if (!home || !away) {
    throw new Error('Não foi possível identificar os times desta partida.');
  }

  const statistics = getMatchStatistics(summary);
  const currentStandings = getStandings(summary);
  const standingsAreProjected =
    Boolean(currentStandings) &&
    (match.status === '1H' || match.status === '2H' || match.status === 'HT');
  const standings =
    currentStandings && standingsAreProjected
      ? applyLiveResultsToStandings(currentStandings, relatedMatches, match.leagueId)
      : currentStandings;
  const status = summary.header.competitions[0].status;
  const matchStatus = status ? getEventStatus(status) : match.status;
  const parsedMinute = Number.parseInt(
    status?.displayClock ?? status?.type.detail ?? '',
    10
  );
  const minuteLabel =
    matchStatus === 'NS' || matchStatus === 'FT'
      ? null
      : getMinuteLabel(
          status?.displayClock,
          [status?.type.shortDetail, status?.type.detail],
          status?.period
        );
  const getRedCards = (teamId: string): number | null => {
    const value = getTeamStatistics(
      summary.boxscore?.teams?.find((team) => team.team.id === teamId)
    ).get('redCards');
    return value === undefined ? null : value;
  };

  const events = getMatchEvents(summary, home.id, away.id);
  const eventHomeGoals = events.filter((e) => e.type === 'GOAL' && e.team === 'HOME').length;
  const eventAwayGoals = events.filter((e) => e.type === 'GOAL' && e.team === 'AWAY').length;

  return {
    ...statistics,
    info: getMatchInfo(summary, match),
    events,
    lineups: getMatchLineups(summary),
    headToHead: getHeadToHead(summary),
    standings,
    standingsAreProjected,
    homeTeam: {
      ...match.homeTeam,
      score: Math.max(match.homeTeam.score, Number(home.score ?? match.homeTeam.score), eventHomeGoals),
      redCards: Math.max(getRedCards(home.id) ?? 0, match.homeTeam.redCards ?? 0) || null,
    },
    awayTeam: {
      ...match.awayTeam,
      score: Math.max(match.awayTeam.score, Number(away.score ?? match.awayTeam.score), eventAwayGoals),
      redCards: Math.max(getRedCards(away.id) ?? 0, match.awayTeam.redCards ?? 0) || null,
    },
    status: matchStatus,
    minute:
      matchStatus === 'NS' || matchStatus === 'FT'
        ? null
        : Number.isFinite(parsedMinute)
        ? parsedMinute
        : null,
    minuteLabel,
  };
}

function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export async function fetchMatchesFromApi(
  selectedDate = new Date(),
  onMatchUpdates?: (matches: Match[]) => void
): Promise<Match[]> {
  const date = getLocalDateString(selectedDate);
  const url = `${API_CONFIG.BASE_URL}/all/scoreboard?dates=${date}&limit=500&_=${Date.now()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`A API global de futebol respondeu com HTTP ${response.status}.`);
  }

  const data: ESPNScoreboard = await response.json();
  if (!Array.isArray(data.events)) {
    throw new Error('A API global de futebol retornou uma resposta inválida.');
  }

  const unresolvedLeagues = new Map<string, ESPNEvent>();
  data.events.forEach((event) => {
    const slug = getSeasonSlug(event);
    const hasGenericSeason =
      !slug ||
      slug === 'regular-season' ||
      slug === 'fall-season' ||
      slug === 'first-round' ||
      slug === 'second-preliminary-round' ||
      slug === '3rd-round' ||
      slug === 'final-stage' ||
      slug === 'group-stage' ||
      slug === 'knockout-stage' ||
      /(^|-)league-phase($|-)/i.test(slug);
    const leagueId = getLeagueId(event);
    if (
      hasGenericSeason &&
      !KNOWN_LEAGUES[leagueId] &&
      !DYNAMIC_LEAGUES.has(leagueId)
    ) {
      unresolvedLeagues.set(leagueId, event);
    }
  });

  void Promise.all(
    Array.from(unresolvedLeagues.values())
      .slice(0, 2)
      .map(async (event) => {
        try {
          await resolveLeagueName(event);
        } catch {
          // Ignora para não travar
        }
      })
  );

  const matches = data.events
    .map(toMatch)
    .filter((match): match is Match => match !== null);
  void fetchRecentVARAlerts(matches).then((varAlerts) => {
    const updatedMatches = matches.flatMap((match) => {
    if (!varAlerts.has(match.id)) return [];
    const matchUpdates = varAlerts.get(match.id);
    return [{
      ...match,
      status: matchUpdates?.status ?? match.status,
      minute: matchUpdates?.minute !== undefined ? matchUpdates.minute : match.minute,
      minuteLabel:
        matchUpdates?.minuteLabel !== undefined
          ? matchUpdates.minuteLabel
          : match.minuteLabel,
      homeTeam: {
        ...match.homeTeam,
        score:
          matchUpdates?.homeScore !== undefined && Number.isFinite(matchUpdates.homeScore)
            ? matchUpdates.homeScore
            : match.homeTeam.score,
        redCards: matchUpdates?.homeRedCards ?? match.homeTeam.redCards,
      },
      awayTeam: {
        ...match.awayTeam,
        score:
          matchUpdates?.awayScore !== undefined && Number.isFinite(matchUpdates.awayScore)
            ? matchUpdates.awayScore
            : match.awayTeam.score,
        redCards: matchUpdates?.awayRedCards ?? match.awayTeam.redCards,
      },
      ...(matchUpdates?.alertId
        ? {
            recentAlert: {
              id: matchUpdates.alertId,
              type: 'VAR' as const,
              team: matchUpdates.alertTeam,
            },
          }
        : {}),
    }];
    });
    onMatchUpdates?.(updatedMatches);
  });
  return matches;
}
