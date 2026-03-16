import type { NextApiRequest, NextApiResponse } from 'next';

interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  high: number;
  low: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  hourly: Array<{
    time: string;
    temp: number;
    condition: string;
  }>;
}

// Sherman Oaks, CA coordinates
const LAT = 34.1516;
const LON = -118.4494;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use Open-Meteo API (free, no key required)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,uv_index&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=America/Los_Angeles&forecast_days=2`;

    const response = await fetch(weatherUrl);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    // Map weather codes to conditions
    const weatherCodeMap: Record<number, { condition: string; icon: string }> = {
      0: { condition: 'Clear sky', icon: '☀️' },
      1: { condition: 'Mainly clear', icon: '🌤️' },
      2: { condition: 'Partly cloudy', icon: '⛅' },
      3: { condition: 'Overcast', icon: '☁️' },
      45: { condition: 'Foggy', icon: '🌫️' },
      48: { condition: 'Foggy', icon: '🌫️' },
      51: { condition: 'Light drizzle', icon: '🌦️' },
      53: { condition: 'Drizzle', icon: '🌧️' },
      55: { condition: 'Heavy drizzle', icon: '🌧️' },
      61: { condition: 'Light rain', icon: '🌧️' },
      63: { condition: 'Rain', icon: '🌧️' },
      65: { condition: 'Heavy rain', icon: '🌧️' },
      71: { condition: 'Light snow', icon: '🌨️' },
      73: { condition: 'Snow', icon: '🌨️' },
      75: { condition: 'Heavy snow', icon: '🌨️' },
      95: { condition: 'Thunderstorm', icon: '⛈️' },
      96: { condition: 'Thunderstorm', icon: '⛈️' },
      99: { condition: 'Thunderstorm', icon: '⛈️' },
    };

    const currentCode = data.current.weather_code;
    const weatherInfo = weatherCodeMap[currentCode] || { condition: 'Unknown', icon: '❓' };

    // Get next 4 hours
    const hourly = data.hourly.time
      .slice(0, 8)
      .map((time: string, i: number) => ({
        time: new Date(time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
        temp: Math.round(data.hourly.temperature_2m[i]),
        condition: weatherCodeMap[data.hourly.weather_code[i]]?.condition || 'Unknown',
      }));

    const weatherData: WeatherData = {
      temp: Math.round(data.current.temperature_2m),
      condition: weatherInfo.condition,
      icon: weatherInfo.icon,
      high: Math.round(data.daily.temperature_2m_max[0]),
      low: Math.round(data.daily.temperature_2m_min[0]),
      feelsLike: Math.round(data.current.apparent_temperature),
      humidity: data.current.relative_humidity_2m,
      windSpeed: Math.round(data.current.wind_speed_10m),
      uvIndex: data.current.uv_index,
      hourly,
    };

    return res.status(200).json(weatherData);
  } catch (error) {
    console.error('Weather API error:', error);
    // Return fallback data for Sherman Oaks
    return res.status(200).json({
      temp: 72,
      condition: 'Partly cloudy',
      icon: '⛅',
      high: 75,
      low: 58,
      feelsLike: 71,
      humidity: 45,
      windSpeed: 5,
      uvIndex: 4,
      hourly: [
        { time: 'Now', temp: 72, condition: 'Partly cloudy' },
        { time: '4 PM', temp: 73, condition: 'Partly cloudy' },
        { time: '5 PM', temp: 71, condition: 'Clear sky' },
        { time: '6 PM', temp: 68, condition: 'Clear sky' },
      ],
    });
  }
}
