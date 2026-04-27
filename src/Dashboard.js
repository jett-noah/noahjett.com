import React from 'react';
import './Dashboard.css';

export default function Dashboard({ onClose }) {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>OVERSEER DASHBOARD</h2>
        <button className="close-btn" onClick={onClose}>[X] RETURN TO TERMINAL</button>
      </div>
      
      <div className="widget-grid">
        {/* Placeholder for YouTube Widget */}
        <div className="widget yt-widget">
          <h3>YouTube Feed</h3>
          <div className="widget-content">
            <p>Widget container ready. Awaiting API...</p>
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
