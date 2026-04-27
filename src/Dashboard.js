import React, { useState, useEffect } from 'react';
import './Dashboard.css';

export default function Dashboard({ onClose }) {
  const [videos, setVideos] = useState([]);
  const [ytLoading, setYtLoading] = useState(true);

  // You can change this to any YouTube Channel ID you want!
  // Currently set to SpaceX (UCtI0Hodo5o5dUb67FeUjDeA)
  const YOUTUBE_CHANNEL_ID = 'UCtI0Hodo5o5dUb67FeUjDeA';
  
  // We use a free API to convert YouTube's RSS feed into JSON data
  const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;
  const API_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`;

  useEffect(() => {
    fetch(API_URL)
      .then((response) => response.json())
      .then((data) => {
        if (data.items) {
          // Grab the 3 most recent video uploads
          setVideos(data.items.slice(0, 3));
        }
        setYtLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching YouTube data:', error);
        setYtLoading(false);
      });
  }, [API_URL]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>OVERSEER DASHBOARD</h2>
        <button className="close-btn" onClick={onClose}>[X] RETURN TO TERMINAL</button>
      </div>
      
      <div className="widget-grid">
        {/* YouTube Widget */}
        <div className="widget yt-widget">
          <h3>YouTube Feed</h3>
          <div className="widget-content yt-content">
            {ytLoading ? (
              <p>Fetching latest uplinks...</p>
            ) : videos.length > 0 ? (
              <ul className="video-list">
                {videos.map((video, index) => (
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
        
        {/* Placeholder for Weather Widget */}
        <div className="widget weather-widget">
          <h3>Local Weather</h3>
          <div className="widget-content">
            <p>Widget container ready. Awaiting location data...</p>
          </div>
        </div>

        {/* Placeholder for System Widget */}
        <div className="widget system-widget">
          <h3>System Status</h3>
          <div className="widget-content">
            <p>All systems nominal.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
