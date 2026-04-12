import type { NextApiRequest, NextApiResponse } from 'next';
import { loadScheduleSnapshot, sortTimes } from '../../../lib/schedule-data';

interface PlannerSuggestion {
  title: string;
  subtitle: string;
  time: string;
  location: string;
  reason: string;
  actionLabel: string;
  actionUrl: string;
}

interface WeekendPlannerResponse {
  generatedAt: string;
  timeframeLabel: string;
  movie: PlannerSuggestion;
  activity: PlannerSuggestion;
}

const MOVIE_FALLBACK: PlannerSuggestion = {
  title: 'Project Hail Mary',
  subtitle: 'Big fun sci-fi date-night energy',
  time: 'Friday 7:00 PM',
  location: 'Regal Sherman Oaks Galleria',
  reason: 'Easy local plan with a clean dinner-then-movie flow.',
  actionLabel: 'See showtimes',
  actionUrl: 'https://www.regmovies.com/theatres/regal-sherman-oaks-galleria/0628',
};

const ACTIVITY_FALLBACK: PlannerSuggestion = {
  title: 'Studio City farmers market + coffee walk',
  subtitle: 'Low-pressure daytime reset',
  time: 'Saturday 10:30 AM',
  location: 'Studio City',
  reason: 'Simple, outdoors, and actually pleasant if the week was heavy.',
  actionLabel: 'Open map',
  actionUrl: 'https://maps.google.com/?q=Studio+City+Farmers+Market',
};

function getNextWeekendWindow(now: Date) {
  const local = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const day = local.getDay();
  const daysUntilFriday = (5 - day + 7) % 7;
  const friday = new Date(local);
  friday.setDate(local.getDate() + daysUntilFriday);
  friday.setHours(15, 0, 0, 0);

  const saturday = new Date(friday);
  saturday.setDate(friday.getDate() + 1);
  saturday.setHours(10, 30, 0, 0);

  const timeframeLabel = daysUntilFriday === 0
    ? 'This weekend'
    : daysUntilFriday === 1
      ? 'Tomorrow night + Saturday'
      : 'Next weekend';

  return { friday, saturday, timeframeLabel };
}

function formatPlannerSlot(weekday: 'Friday' | 'Saturday', time: string) {
  return `${weekday} ${time}`;
}

function pickMovieSuggestion(friday: Date): PlannerSuggestion {
  const snapshot = loadScheduleSnapshot();
  const fridayDate = `${friday.getFullYear()}-${String(friday.getMonth() + 1).padStart(2, '0')}-${String(friday.getDate()).padStart(2, '0')}`;
  const targetDay = snapshot?.movies?.days?.find((day) => day.date === fridayDate || day.key === 'fri');

  if (!targetDay?.movies?.length) {
    return MOVIE_FALLBACK;
  }

  const rankedMovies = targetDay.movies
    .map((movie) => {
      const flatFormats = (movie.formats || []).flatMap((formatGroup) =>
        (formatGroup.showtimes || []).map((showtime) => ({ format: formatGroup.format, showtime }))
      );
      const showtimes = sortTimes([
        ...(movie.showtimes || []),
        ...flatFormats.map((entry) => entry.showtime),
      ]);
      const eveningTime = showtimes.find((showtime) => {
        const lowered = showtime.toLowerCase();
        return lowered.includes('pm') && !lowered.startsWith('12:');
      }) || showtimes[0];
      const preferredFormat = flatFormats.find((entry) => entry.showtime === eveningTime)?.format || movie.formats?.[0]?.format;
      return { movie, eveningTime, preferredFormat };
    })
    .filter((entry) => Boolean(entry.eveningTime))
    .sort((a, b) => a.eveningTime!.localeCompare(b.eveningTime!));

  const choice = rankedMovies[0];
  if (!choice?.eveningTime) {
    return MOVIE_FALLBACK;
  }

  return {
    title: choice.movie.title,
    subtitle: choice.preferredFormat ? `${choice.preferredFormat} screening` : 'Friday night movie pick',
    time: formatPlannerSlot('Friday', choice.eveningTime.toUpperCase()),
    location: snapshot?.movies?.theater || 'Regal Sherman Oaks Galleria',
    reason: 'Closest clean Friday-night option from the current movie slate.',
    actionLabel: 'See showtimes',
    actionUrl: 'https://www.regmovies.com/theatres/regal-sherman-oaks-galleria/0628',
  };
}

function pickActivitySuggestion(_saturday: Date): PlannerSuggestion {
  return ACTIVITY_FALLBACK;
}

export default function handler(req: NextApiRequest, res: NextApiResponse<WeekendPlannerResponse | { error: string }>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const now = new Date();
  const { friday, saturday, timeframeLabel } = getNextWeekendWindow(now);

  return res.status(200).json({
    generatedAt: now.toISOString(),
    timeframeLabel,
    movie: pickMovieSuggestion(friday),
    activity: pickActivitySuggestion(saturday),
  });
}
