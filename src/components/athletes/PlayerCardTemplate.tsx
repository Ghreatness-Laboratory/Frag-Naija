import type { CSSProperties } from 'react';
import { Flag, Shield } from 'lucide-react';
import { combatAttributes } from '@/lib/athlete-display';

export type PlayerCardTemplateAthlete = {
  ign: string;
  name?: string | null;
  known_name?: string | null;
  team?: string | null;
  role?: string | null;
  status?: string | null;
  photo_url?: string | null;
  jersey_number?: number | string | null;
  attack?: number | null;
  defense?: number | null;
  survival?: number | null;
  clutch?: number | null;
  iq?: number | null;
  game_slug?: string | null;
};

export type PlayerCardTemplateTeam = {
  name: string;
  logo_url?: string | null;
  rank?: number | null;
};

export type PlayerCardTemplateVariant = 'full' | 'featured' | 'compact' | 'showcase';

export type PlayerCardTemplateProps = {
  athlete: PlayerCardTemplateAthlete;
  team?: PlayerCardTemplateTeam | null;
  rating: number;
  primary: string;
  gameName: string;
  brandLabel?: string;
  variant?: PlayerCardTemplateVariant;
  rank?: number | string;
  className?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function playerAccentHue(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) % 360;
  return hash;
}

function playerBackdropStyle(primary: string, athlete: PlayerCardTemplateAthlete, team: PlayerCardTemplateTeam | null, includePhoto = true): CSSProperties {
  const identity = `${athlete.name || ''}-${athlete.known_name || athlete.ign}-${team?.name || athlete.team || ''}-${athlete.role || ''}-${athlete.game_slug || ''}`;
  const isMeleMisayo = /mele|misayo/i.test(`${athlete.name || ''} ${athlete.known_name || ''} ${athlete.ign || ''}`);
  const hue = isMeleMisayo ? 146 : playerAccentHue(identity);
  const secondaryHue = isMeleMisayo ? 44 : (hue + 42) % 360;
  const photoLayer = includePhoto && athlete.photo_url
    ? `linear-gradient(180deg, rgba(2,7,3,0.12), rgba(2,7,3,0.9)), url(${athlete.photo_url})`
    : undefined;

  return {
    backgroundImage: [
      `radial-gradient(circle at 28% 18%, hsl(${hue} 85% 55% / 0.24), transparent 28%)`,
      `radial-gradient(circle at 76% 38%, ${primary}42, transparent 32%)`,
      `linear-gradient(135deg, ${primary}14, transparent 45%, hsl(${secondaryHue} 92% 48% / ${isMeleMisayo ? 0.24 : 0.18}))`,
      photoLayer,
    ].filter(Boolean).join(', '),
    backgroundPosition: 'center, center, center, center 20%',
    backgroundSize: 'cover, cover, cover, cover',
  };
}

function cardShellStyle(primary: string): CSSProperties {
  return {
    clipPath: 'polygon(0 0, calc(100% - 40px) 0, 100% 40px, 100% calc(100% - 46px), calc(100% - 46px) 100%, 0 100%)',
    background: 'linear-gradient(155deg, #020703 0%, #051706 45%, #020602 100%)',
    boxShadow: `0 18px 40px rgba(0,0,0,0.45), 0 0 26px ${primary}14`,
  };
}

function cardNumberFrom(athlete: PlayerCardTemplateAthlete, team: PlayerCardTemplateTeam | null, rating: number, rank?: number | string) {
  return athlete.jersey_number || rank || team?.rank || Math.max(1, Math.min(10, Math.round((Number(rating) || 0) / 10)));
}

function CardBackdrop({
  primary,
  athlete,
  team,
  includePhoto = true,
}: {
  primary: string;
  athlete: PlayerCardTemplateAthlete;
  team: PlayerCardTemplateTeam | null;
  includePhoto?: boolean;
}) {
  return (
    <>
      <div className="absolute inset-0 p-[3px]" style={{ background: `linear-gradient(135deg, ${primary}, rgba(255,255,255,0.62), ${primary}55, #061006)` }}>
        <div
          className="h-full w-full bg-[#030803]"
          style={{ clipPath: 'polygon(0 0, calc(100% - 37px) 0, 100% 37px, 100% calc(100% - 43px), calc(100% - 43px) 100%, 0 100%)' }}
        />
      </div>
      <div className="absolute inset-[9px] border border-white/10" style={{ clipPath: 'polygon(0 0, calc(100% - 32px) 0, 100% 32px, 100% calc(100% - 38px), calc(100% - 38px) 100%, 0 100%)' }} />
      <div className="player-card-identity-bg absolute inset-[3px] opacity-90" style={playerBackdropStyle(primary, athlete, team, includePhoto)} />
      <div className="absolute inset-0 opacity-85" style={{ background: `radial-gradient(circle at 78% 30%, ${primary}42, transparent 27%), radial-gradient(circle at 88% 48%, ${primary}26, transparent 18%), linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.82) 73%)` }} />
      <div className="absolute inset-0 opacity-60" style={{ background: `repeating-linear-gradient(118deg, transparent 0 12px, ${primary}10 12px 13px, transparent 13px 26px)` }} />
      <div className="fn-scanlines absolute inset-0 opacity-30" />
    </>
  );
}

function PlayerImage({
  athlete,
  displayName,
  primary,
  className,
  fallbackClassName,
}: {
  athlete: PlayerCardTemplateAthlete;
  displayName: string;
  primary: string;
  className: string;
  fallbackClassName: string;
}) {
  return athlete.photo_url ? (
    <img src={athlete.photo_url} alt={displayName} className={className} />
  ) : (
    <div className={fallbackClassName} style={{ borderColor: `${primary}70`, color: primary }}>
      <Shield size={72} />
    </div>
  );
}

export default function PlayerCardTemplate({
  athlete,
  team = null,
  rating,
  primary,
  gameName,
  brandLabel = 'FRAGNAIJA',
  variant = 'full',
  rank,
  className,
}: PlayerCardTemplateProps) {
  const displayName = athlete.known_name || athlete.ign;
  const cardNumber = cardNumberFrom(athlete, team, rating, rank);
  const combatStats = combatAttributes(athlete as unknown as Record<string, unknown>, athlete.game_slug);
  const stats = combatStats.some((stat) => stat.value > 0)
    ? combatStats
    : [{ key: 'overall', label: 'OVR', name: 'Overall', value: Math.round(Number(rating) || 0), color: primary }];
  const teamName = team?.name || athlete.team || 'Free Agent';
  const role = athlete.role || 'Player';
  const status = athlete.status || 'Active';
  const brandFirst = brandLabel.slice(0, 4);
  const brandRest = brandLabel.slice(4);
  const numericRank = Number(rank);
  const showcaseAccent = numericRank === 2 ? 'rgb(var(--fn-yellow))' : primary;

  if (variant === 'compact') {
    return (
      <div className={cx('player-card player-card-compact relative h-[118px] w-full overflow-hidden bg-[#030803] text-white', className)} style={cardShellStyle(primary)}>
        <CardBackdrop primary={primary} athlete={athlete} team={team} includePhoto={false} />
        <div
          className="player-card-portrait-frame absolute left-3 top-3 z-20 flex h-[68px] w-[68px] items-center justify-center overflow-hidden border bg-[#031207] p-[3px]"
          style={{ borderColor: `${primary}70`, boxShadow: `0 0 18px ${primary}26, inset 0 0 18px ${primary}12` }}
        >
          <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 18%, ${primary}48, transparent 46%), linear-gradient(180deg, rgba(255,255,255,0.08), transparent 34%), linear-gradient(145deg, ${primary}1f, rgba(2, 8, 3, 0.96) 64%)` }} />
          <div className="absolute inset-[2px] opacity-70" style={{ background: `radial-gradient(ellipse at 50% 72%, ${primary}30, transparent 62%)` }} />
          <div className="relative h-full w-full overflow-hidden">
            <PlayerImage
              athlete={athlete}
              displayName={displayName}
              primary={primary}
              className="player-card-portrait-subject h-full w-full scale-[1.08] object-cover object-center"
              fallbackClassName="flex h-full w-full items-center justify-center bg-transparent"
            />
          </div>
        </div>
        <div className="absolute left-[92px] right-[88px] top-3 z-20 min-w-0">
          <div className="mb-1 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest" style={{ color: primary }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: primary }} />
            {status}
          </div>
          <h3 className="truncate font-display text-lg font-black uppercase leading-none" style={{ color: primary, textShadow: `0 0 16px ${primary}55` }}>{displayName}</h3>
          <p className="mt-1 truncate text-[8px] font-bold uppercase tracking-[0.16em] text-white/60">{role} / {teamName}</p>
        </div>
        <div className="absolute right-0 top-[18px] z-30 flex w-[74px] flex-col items-center text-center">
          <div className="font-display text-2xl font-black leading-none" style={{ color: primary, textShadow: `0 0 14px ${primary}66` }}>{Math.round(Number(rating) || 0)}</div>
          <div className="mt-0.5 text-[7px] font-black uppercase tracking-widest text-white/45">OVR</div>
        </div>
        <div
          className="absolute bottom-3 left-[92px] right-[74px] z-20 grid overflow-hidden rounded-sm border bg-black/75 shadow-[inset_0_0_18px_rgba(0,255,85,0.08)]"
          style={{ borderColor: `${primary}60`, gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="border-r border-white/10 px-1 py-1.5 text-center last:border-r-0">
              <div className="font-display text-sm font-black leading-none text-white">{stat.value}</div>
              <div className="mt-0.5 text-[6px] font-black tracking-widest text-fn-green">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'showcase') {
    return (
      <div className={cx('player-card player-card-showcase relative h-[424px] w-[304px] max-w-full overflow-hidden rounded-sm border bg-[#061008] text-white transition-transform duration-200 group-hover:-translate-y-1', className)} style={{ borderColor: `${primary}3d`, boxShadow: '0 14px 28px rgba(0,0,0,0.28)' }}>
        <div className="relative h-[246px] overflow-hidden bg-white">
          <PlayerImage
            athlete={athlete}
            displayName={displayName}
            primary={primary}
            className="h-full w-full object-cover object-top"
            fallbackClassName="flex h-full w-full items-center justify-center bg-white text-black/85"
          />
          <div className="absolute left-6 top-6 z-20 text-[13px] font-black uppercase tracking-widest" style={{ color: showcaseAccent }}>
            #{rank ?? cardNumber}
          </div>
          <div className="absolute right-6 top-6 z-20 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: showcaseAccent }}>
            <span className="h-2 w-2 rounded-full" style={{ background: showcaseAccent }} />
            {status}
          </div>
        </div>

        <div className="relative h-[178px] border-t px-7 py-5" style={{ borderColor: `${primary}26`, background: `linear-gradient(180deg, ${primary}0e, rgba(7,23,12,0.98) 38%, #07130b 100%)` }}>
          <div className="flex items-center gap-3">
            <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center" style={{ color: showcaseAccent }}>
              <Shield size={15} />
            </div>
            <h3 className="min-w-0 truncate font-mono text-[21px] font-black leading-none tracking-wide text-white">{displayName}</h3>
          </div>
          <p className="mt-2 truncate text-[14px] font-mono uppercase tracking-[0.26em] text-white/48">{role}</p>

          <div
            className="mt-5 grid gap-2"
            style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
          >
            {stats.map((stat) => (
              <div key={stat.label} className="min-w-0 text-center">
                <div className="font-display text-[20px] font-black leading-none text-white">{stat.value}</div>
                <div className="mt-2 text-[9px] font-black uppercase tracking-[0.18em] text-white/45">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div className={cx('player-card player-card-featured relative h-[360px] w-[216px] max-w-full overflow-hidden bg-[#030803] text-white transition-transform duration-200 group-hover:-translate-y-1', className)} style={cardShellStyle(primary)}>
        <CardBackdrop primary={primary} athlete={athlete} team={team} />
        <div className="absolute left-4 top-4 z-20 border bg-black/70 px-2.5 py-2 text-center shadow-lg" style={{ borderColor: `${primary}80`, boxShadow: `0 0 18px ${primary}24` }}>
          <div className="font-display text-3xl font-black leading-none" style={{ color: primary }}>{cardNumber}</div>
          <div className="text-[8px] font-black tracking-[0.22em] text-white/55">RTG</div>
        </div>
        {rank && (
          <div className="absolute right-4 top-4 z-20 border px-2 py-1 text-[8px] font-black uppercase tracking-widest" style={{ borderColor: `${primary}55`, background: `${primary}16`, color: primary }}>
            #{rank}
          </div>
        )}
        <div className="absolute right-2 top-12 z-0 font-display text-[7rem] font-black leading-none opacity-[0.08]" style={{ color: primary }}>{cardNumber}</div>
        <div className="absolute inset-x-0 top-[70px] z-10 flex h-[155px] items-end justify-center px-5">
          <PlayerImage
            athlete={athlete}
            displayName={displayName}
            primary={primary}
            className="player-card-subject h-full w-full object-contain object-bottom drop-shadow-[0_20px_20px_rgba(0,0,0,0.75)]"
            fallbackClassName="mb-3 flex h-24 w-24 items-center justify-center rounded-full border bg-black/40"
          />
        </div>
        <div className="absolute bottom-[86px] left-4 right-4 z-20">
          <div className="mb-2 flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border bg-black/75" style={{ borderColor: `${primary}80` }}>
            {team?.logo_url ? <img src={team.logo_url} alt={team.name} className="h-full w-full object-cover" /> : <Flag size={13} style={{ color: primary }} />}
          </div>
          <h3 className="line-clamp-2 break-words font-display text-[23px] font-black uppercase leading-[0.88]" style={{ color: primary, textShadow: `0 0 18px ${primary}55` }}>{displayName}</h3>
          <p className="mt-1 truncate text-[8px] font-bold uppercase tracking-[0.18em] text-white/60">{role} / {teamName}</p>
        </div>
        <div
          className="absolute bottom-6 left-4 right-4 z-20 grid overflow-hidden rounded-md border bg-black/78"
          style={{ borderColor: `${primary}70`, gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="border-r border-white/10 px-1 py-2 text-center last:border-r-0">
              <div className="font-display text-base font-black leading-none text-white">{stat.value}</div>
              <div className="mt-1 text-[6px] font-black tracking-widest text-fn-green">{stat.label}</div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-1.5 left-4 z-20 font-display text-[10px] font-black tracking-widest">
          <span style={{ color: primary }}>{brandFirst}</span>{brandRest}
        </div>
        <div className="absolute bottom-1.5 right-5 z-20 text-[7px] font-black uppercase tracking-[0.18em] text-white/45">{gameName}</div>
      </div>
    );
  }

  return (
    <div className={cx('player-card player-card-full relative mx-auto h-[500px] w-[300px] max-w-full overflow-hidden bg-[#030803] text-white shadow-2xl', className)} style={cardShellStyle(primary)}>
      <CardBackdrop primary={primary} athlete={athlete} team={team} />

      <div className="absolute left-5 top-5 z-20 border bg-black/70 px-3 py-2 text-center shadow-lg" style={{ borderColor: `${primary}80`, boxShadow: `0 0 22px ${primary}24` }}>
        <div className="font-display text-5xl font-black leading-none" style={{ color: primary }}>{cardNumber}</div>
        <div className="text-[10px] font-black tracking-[0.28em] text-white/55">RTG</div>
      </div>

      <div className="absolute right-3 top-16 z-20 [writing-mode:vertical-rl] rotate-180 text-[10px] font-black uppercase tracking-[0.35em] text-white/45">NO. {cardNumber}</div>
      <div className="absolute right-2 top-10 z-0 font-display text-[12rem] font-black leading-none opacity-[0.08]" style={{ color: primary }}>{cardNumber}</div>

      <div className="absolute inset-x-0 top-[86px] z-10 flex h-[245px] items-end justify-center px-7">
        <PlayerImage
          athlete={athlete}
          displayName={displayName}
          primary={primary}
          className="player-card-subject h-full w-full object-contain object-bottom drop-shadow-[0_24px_24px_rgba(0,0,0,0.75)]"
          fallbackClassName="mb-6 flex h-36 w-36 items-center justify-center rounded-full border bg-black/40"
        />
      </div>

      <div className="absolute bottom-[112px] left-6 right-5 z-20">
        <div className="mb-2 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border bg-black/75" style={{ borderColor: `${primary}80` }}>
          {team?.logo_url ? <img src={team.logo_url} alt={team.name} className="h-full w-full object-cover" /> : <Flag size={16} style={{ color: primary }} />}
        </div>
        <h2 className="max-w-[245px] break-words font-display text-[32px] font-black uppercase leading-[0.86]" style={{ color: primary, textShadow: `0 0 20px ${primary}55` }}>{displayName}</h2>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">{teamName}</p>
      </div>

      <div
        className="absolute bottom-8 left-5 right-5 z-20 grid overflow-hidden rounded-lg border bg-black/78"
        style={{ borderColor: `${primary}70`, gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
      >
        {stats.map((stat) => (
          <div key={stat.label} className="border-r border-white/10 px-1.5 py-2 text-center last:border-r-0">
            <div className="font-display text-2xl font-black leading-none text-white">{stat.value}</div>
            <div className="mt-1 text-[8px] font-black tracking-widest text-fn-green">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-2 left-5 z-20 font-display text-sm font-black tracking-widest">
        <span style={{ color: primary }}>{brandFirst}</span>{brandRest}
      </div>
      <div className="absolute bottom-2 right-6 z-20 text-[8px] font-black uppercase tracking-[0.2em] text-white/45">{gameName}</div>
    </div>
  );
}
