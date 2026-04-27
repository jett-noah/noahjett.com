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

const filterShorts = (items) => {
  return items.filter(item => {
    const title = (item.title || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();
    return !title.includes('#short') && !desc.includes('#short');
  });
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

  // Calculator States
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState('');

  useEffect(() => {
    // --- 1. YOUTUBE FETCHING ---
    fetchFeed(ryanRSS)
      .then(items => {
        const noShorts = filterShorts(items);
        setRyanVideos(noShorts.slice(0, 3));
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
          const noShorts = filterShorts(items);
          const mappedItems = noShorts.map(item => ({ ...item, channelName: channel.name }));
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
        const lat = 42.0286;
        const lon = -93.6163;

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=10`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();
        setWeather(weatherData);

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

  // --- 3. CALCULATOR LOGIC ---
  const handleCalcClick = (val) => {
    if (val === 'C') {
      setCalcInput('');
      setCalcResult('');
    } else if (val === 'DEL') {
      setCalcInput(prev => prev.slice(0, -1));
    } else if (val === '=') {
      try {
        let expr = calcInput;
        // Translate scientific notation to native JS Math engine
        expr = expr.replace(/sin\(/g, 'Math.sin(');
        expr = expr.replace(/cos\(/g, 'Math.cos(');
        expr = expr.replace(/tan\(/g, 'Math.tan(');
        expr = expr.replace(/sqrt\(/g, 'Math.sqrt(');
        expr = expr.replace(/log\(/g, 'Math.log10(');
        expr = expr.replace(/ln\(/g, 'Math.log(');
        expr = expr.replace(/pi/g, 'Math.PI');
        expr = expr.replace(/\^/g, '**');

        // Note: Math functions evaluate in Radians by default
        // eslint-disable-next-line no-new-func
        const res = new Function('return ' + expr)();
        
        if (Number.isFinite(res)) {
            // Clean up overly long decimals
            let cleanRes = parseFloat(res.toPrecision(10)).toString();
            setCalcResult(cleanRes);
        } else {
            setCalcResult(res.toString());
        }
      } catch (err) {
        setCalcResult('ERR: SYNTAX');
      }
    } else {
      setCalcInput(prev => prev + val);
    }
  };

  const calcButtons = [
    'sin(', 'cos(', 'tan(', 'C',
    'log(', 'ln(', 'sqrt(', 'DEL',
    '(', ')', '^', '/',
    '7', '8', '9', '*',
    '4', '5', '6', '-',
    '1', '2', '3', '+',
    '0', '.', 'pi', '='
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>OVERSEER DASHBOARD</h2>
        <button className="close-btn" onClick={onClose}>[X] RETURN TO TERMINAL</button>
      </div>
      
      <div className="widget-grid">
        
        {/* =========================================
            COLUMN 1: YOUTUBE FEEDS
            ========================================= */}
        <div className="widget-column">
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

          <div className="widget yt-widget">
            <h3>Ryan 3000 Feed</h3>
            <div className="widget-content scrollable-content" style={{ maxHeight: '200px' }}>
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
        </div>

        {/* =========================================
            COLUMN 2: LOCAL WEATHER
            ========================================= */}
        <div className="widget-column">
          <div className="widget weather-widget">
            <h3>Local Weather (Ames, IA)</h3>
            <div className="widget-content scrollable-content" style={{ maxHeight: '600px' }}>
              {weatherLoading ? (
                <p>Acquiring meteorological data...</p>
              ) : weather ? (
                <div className="weather-data">
                  
                  {alerts.length > 0 && (
                    <div className="weather-alerts">
                      {alerts.map((alert, i) => (
                        <div key={i} className="alert-item">
                          <strong>[WARNING]:</strong> {alert.event}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="current-weather">
                    <h4>&gt; CURRENT CONDITIONS</h4>
                    <p><strong>Temp:</strong> {weather.current.temperature_2m}°F (Feels like {weather.current.apparent_temperature}°F)</p>
                    <p><strong>Status:</strong> {getWeatherDesc(weather.current.weather_code)}</p>
                    <p><strong>Humidity:</strong> {weather.current.relative_humidity_2m}% | <strong>Wind:</strong> {weather.current.wind_speed_10m} mph</p>
                  </div>

                  <div className="forecast-weather">
                    <h4>&gt; 10-DAY FORECAST</h4>
                    <ul className="forecast-list">
                      {weather.daily.time.map((date, index) => {
                        if (index === 0) return null;
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

        {/* =========================================
            COLUMN 3: SCIENTIFIC CALCULATOR
            ========================================= */}
        <div className="widget-column">
          <div className="widget calc-widget">
            <h3>Scientific Terminal</h3>
            <div className="widget-content calc-container">
              
              <div className="calc-screen">
                <div className="calc-history">{calcInput || '> _'}</div>
                <div className="calc-result">{calcResult || ''}</div>
              </div>

              <div className="calc-pad">
                {calcButtons.map((btn, idx) => (
                  <button 
                    key={idx} 
                    className={`calc-btn ${btn === '=' || btn === 'C' || btn === 'DEL' ? 'calc-btn-action' : ''}`}
                    onClick={() => handleCalcClick(btn)}
                  >
                    {btn}
                  </button>
                ))}
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
