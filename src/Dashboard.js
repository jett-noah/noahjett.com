import React, { useState, useEffect } from 'react';
import './Dashboard.css';

// ==========================================
// MOVED OUTSIDE THE COMPONENT TO PREVENT 
// GITHUB ACTIONS FROM CRASHING (EXIT CODE 1)
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
// MAIN COMPONENT
// ==========================================

export default function Dashboard({ onClose }) {
  const [ryanVideos, setRyanVideos] = useState([]);
  const [mainVideos, setMainVideos] = useState([]);
  const [ryanLoading, setRyanLoading] = useState(true);
  const [mainLoading, setMainLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch Ryan 3000
    fetchFeed(ryanRSS)
      .then(items => {
        setRyanVideos(items.slice(0, 3));
        setRyanLoading(false);
      })
      .catch(err => {
        console.error('Error fetching Ryan 3000:', err);
        setRyanLoading(false);
      });

    // 2. Fetch Main Channels Sequentially
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
      
      // Sort all fetched videos by publish date (newest first)
      allVideos.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
      
      // Keep the 10 most recent videos overall
      setMainVideos(allVideos.slice(0, 10));
      setMainLoading(false);
    };

    fetchMainFeeds();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>OVERSEER DASHBOARD</h2>
        <button className="close-btn" onClick={onClose}>[X] RETURN TO TERMINAL</button>
      </div>
      
      <div className="widget-grid">
        
        {/* Ryan 3000 Dedicated Widget */}
        <div className="widget yt-widget">
          <h3>Ryan 3000 Feed</h3>
          <div className="widget-content yt-content">
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
          <div className="widget-content yt-content">
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
        
        {/* Placeholder for Weather Widget */}
        <div className="widget weather-widget">
          <h3>Local Weather</h3>
          <div className="widget-content">
            <p>Widget container ready. Awaiting location data...</p>
          </div>
        </div>

      </div>
    </div>
  );
}
