import React, { useState, useEffect } from 'react';
import './Dashboard.css';

// ==========================================
// YOUTUBE CONFIGURATION
// ==========================================
const ryanRSS = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCjXPeBJ0L57q7548RtW99Fg';

const mainChannels = [
  { name: 'CorridorCrew', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCSpFnDQr88xCZ80N-X7t0nQ' },
  { name: 'DailyDose', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCdC0An4ZPNr_YiFiYoVbwaw' },
  { name: 'TPMvids', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCMddDi4iCT8Rz8L0JL-bH7Q' },
  { name: 'MiaMaples', url: 'https://www.youtube.com/feeds/videos.xml?user=MiaMaples' },
  { name: 'Nintendo', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCGIY_O-8vW4rfX98KlMkvRg' },
  { name: 'TimTracker', url: 'https://www.youtube.com/feeds/videos.xml?user=TheTimTracker' },
  { name: 'MKBHD', url: 'https://www.youtube.com/feeds/videos.xml?user=marquesbrownlee' },
  { name: 'Ryan', url: 'https://www.youtube.com/feeds/videos.xml?user=ryantrahan' }
];

const fetchFeed = async (rssUrl) => {
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
  const response = await fetch(apiUrl);
  const data = await response.json();
  return data.items || [];
};

// ==========================================
// WEATHER CONFIGURATION
// ==========================================
const getWeatherDesc = (code) => {
  if (code <= 1) return 'Clear';
  if (code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 95) return 'Thunderstorms';
  return 'Mixed';
};


// ==========================================
// MAIN COMPONENT
// ==========================================
export default function Dashboard({ onClose }) {
  // YouTube States
  const [ryanVideos, setRyanVideos] = useState([]);
  const [mainVideos, setMainVideos] = useState([]);
  const [ryanLoading, setRyanLoading] = useState(true);
  const [mainLoading, setMainLoading] = useState(true);

  // Weather States
  const [weather, setWeather] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    // --- 1. YOUTUBE FETCHING ---
    fetchFeed(ryanRSS)
      .then(items => {
        setRyanVideos(items.slice(0, 3));
        setRyanLoading(false);
      })
      .catch(err => {
        console.error('Error fetching Ryan 3000:', err);
        setRyanLoading(false);
      });

    const fetchMainFeeds = async () => {
      let allVideos = [];
      for (const channel of mainChannels) {
        try {
          const items = await fetchFeed(channel.url);
          const mappedItems = items.map(item => ({ ...item, channelName: channel.name }));
          allVideos = [...allVideos, ...mappedItems];
        } catch (err) {
          console.error(`Skipping ${channel.name} due to fetch error.`);
        }
      }
      allVideos.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
      setMainVideos(allVideos.slice(0, 10));
      setMainLoading(false);
    };

    fetchMainFeeds();

    // --- 2. WEATHER FETCHING ---
    const fetchWeather = async () => {
      try {
        // Coordinates for Ames, IA
        const lat = 42.0286;
        const lon = -93.6163;

        // Fetch 10-Day Forecast & Current Conditions (Open-Meteo)
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=10`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();
        setWeather(weatherData);

        // Fetch Severe Weather Alerts (NWS)
        const alertsRes = await fetch(`https://api.weather.gov/alerts/active?point=${lat},${lon}`);
        const alertsData = await alertsRes.json();
        if (alertsData.features) {
          setAlerts(alertsData.features.map(f => f.properties));
        }
        setWeatherLoading(false);
      } catch (err) {
        console.error('Weather fetch error:', err);
        setWeatherLoading(false);
      }
    };

    fetchWeather();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>OVERSEER DASHBOARD</h2>
        <button className="close-btn" onClick={onClose}>[X] RETURN TO TERMINAL</button>
      </div>
      
      <div className="widget-grid">
        
        {/* Ryan 3000 Widget */}
        <div className="widget yt-widget">
          <h3>Ryan 3000 Feed</h3>
          <div className="widget-content scrollable-content">
            {ryanLoading ? (
              <p>Fetching Ryan 3000...</p>
            ) : ryanVideos.length > 0 ? (
              <ul className="video-list">
                {ryanVideos.map((video, index) => (
                  <li key={index}>
                    <a href={video.link} target="_blank" rel="noopener noreferrer">
                      &gt; {video.title}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No videos found.</p>
            )}
          </div>
        </div>

        {/* Main Subscriptions Widget */}
        <div className="widget yt-widget">
          <h3>Main Subscriptions</h3>
          <div className="widget-content scrollable-content">
            {mainLoading ? (
              <p>Synchronizing feeds... (This takes a few seconds)</p>
            ) : mainVideos.length > 0 ? (
              <ul className="video-list">
                {mainVideos.map((video, index) => (
                  <li key={index}>
                    <a href={video.link} target="_blank" rel="noopener noreferrer">
                      &gt; <span className="channel-name">{video.channelName}</span>: {video.title}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No videos found.</p>
            )}
          </div>
        </div>
        
        {/* Weather Widget */}
        <div className="widget weather-widget">
          <h3>Local Weather (Ames, IA)</h3>
          <div className="widget-content scrollable-content">
            {weatherLoading ? (
              <p>Acquiring meteorological data...</p>
            ) : weather ? (
              <div className="weather-data">
                
                {/* Emergency Alerts Section */}
                {alerts.length > 0 && (
                  <div className="weather-alerts">
                    {alerts.map((alert, i) => (
                      <div key={i} className="alert-item">
                        <strong>[WARNING]:</strong> {alert.event}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Current Conditions Section */}
                <div className="current-weather">
                  <h4>&gt; CURRENT CONDITIONS</h4>
                  <p><strong>Temp:</strong> {weather.current.temperature_2m}°F (Feels like {weather.current.apparent_temperature}°F)</p>
                  <p><strong>Status:</strong> {getWeatherDesc(weather.current.weather_code)}</p>
                  <p><strong>Humidity:</strong> {weather.current.relative_humidity_2m}% | <strong>Wind:</strong> {weather.current.wind_speed_10m} mph</p>
                </div>

                {/* 10-Day Forecast Section */}
                <div className="forecast-weather">
                  <h4>&gt; 10-DAY FORECAST</h4>
                  <ul className="forecast-list">
                    {weather.daily.time.map((date, index) => {
                      // Skip today since we already show current conditions
                      if (index === 0) return null;
                      
                      // Format the date string cleanly
                      const dayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                      
                      return (
                        <li key={index}>
                          <span className="forecast-date">{dayDate}</span>
                          <span className="forecast-desc">{getWeatherDesc(weather.daily.weather_code[index])}</span>
                          <span className="forecast-temps">{Math.round(weather.daily.temperature_2m_max[index])}° / {Math.round(weather.daily.temperature_2m_min[index])}°</span>
                          <span className="forecast-precip">💧 {weather.daily.precipitation_probability_max[index]}%</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ) : (
              <p>Failed to load weather data.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
