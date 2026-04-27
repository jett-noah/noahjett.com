import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import Snake from './Snake';
import Aero from './Aero';
import Dashboard from './Dashboard';

function App() {
  const [history, setHistory] = useState([
    { command: '', output: 'Welcome to noahjett.com. Type "help" to see available commands, or type any URL to navigate.' }
  ]);
  const [input, setInput] = useState('');
  const [showSnakeGame, setShowSnakeGame] = useState(false);
  const [showAero, setShowAero] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const historyEndRef = useRef(null);

  // Auto-scroll to the bottom when new history is added
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (e) => {
    if (e.key === 'Enter') {
      const cmd = input.trim().toLowerCase();
      let output = '';

      // --- 1. URL DETECTION ---
      // This Regex checks if the user typed something that looks like a website (e.g., google.com)
      const isUrl = /^((https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)$/.test(cmd);
      
      if (isUrl) {
        output = `Initiating hyperspace jump to ${cmd}...`;
        const targetUrl = cmd.startsWith('http') ? cmd : `https://${cmd}`;
        window.location.href = targetUrl; // Redirects the current tab
      } 
      // --- 2. COMMAND & SHORTCUT PROCESSING ---
      else {
        switch (cmd) {
          // --- Custom Homepage Shortcuts ---
          case 'youtube':
            output = 'Navigating to YouTube...';
            window.location.href = 'https://www.youtube.com';
            break;
          case 'gemini':
            output = 'Navigating to Gemini...';
            window.location.href = 'https://gemini.google.com';
            break;
          case 'vudu':
            output = 'Navigating to Fandango at Home...';
            window.location.href = 'https://www.fandangoathome.com/';
            break;
          case 'budget':
            output = 'Navigating to Goodbudget...';
            window.location.href = 'https://goodbudget.com';
            break;
          case 'amazon':
            output = 'Navigating to Amazon...';
            window.location.href = 'https://www.amazon.com';
            break;
          case 'chase':
            output = 'Navigating to Chase...';
            window.location.href = 'https://www.chase.com';
            break;
          case 'discover':
            output = 'Navigating to Discover...';
            window.location.href = 'https://www.discover.com';
            break;
          case 'instagram':
            output = 'Navigating to Instagram...';
            window.location.href = 'https://www.instagram.com';
            break;

          // --- Standard Terminal Commands ---
          case 'help':
            output = `Available commands:
  about      - Brief introduction
  education  - Academic background
  experience - Work and internship history
  skills     - Technical toolset
  aero       - Launch AE Compressible Flow Calculator
  snake      - Launch Snake Game
  clear      - Clear the terminal
  
  * Note: You can also type any valid URL (e.g. github.com) or use hidden shortcuts to navigate the web.`;
            break;
          case 'about':
            output = 'Noah Jett\nA Junior studying Aerospace Engineering at Iowa State University, with a minor in Non-Destructive Evaluation. Seeking to apply a strong background in CAD modeling, etc...';
            break;
          case 'education':
            output = `[Iowa State University] - Ames, IA
  B.S. Aerospace Engineering | Minor: Non-Destructive Evaluation
  Expected: May 2027 | GPA: 3.98/4.0

[Heartland Community College] - Normal, IL
  A.S. Computer Science Focus
  Graduated: May 2023 | GPA: 3.86/4.0`;
            break;
          case 'experience':
            output = `[Software Engineering Intern] - State Farm (Summers 2023, 2024, 2025)
  - Operated within a 16-person Agile/Scrum team to engineer and deploy 5+ major feature updates.
  - Engineered a novel, patent-pending iOS application for an internal coding competition.

[Undergraduate Teaching Assistant] - Iowa State University (Fall 2024 - Fall 2025)
  - Clarified complex engineering principles in Engineering Statics for 30+ students.`;
            break;
          case 'skills':
            output = `CAD & NDE: SolidWorks, XFLR5, Liquid Penetrant (LPI), Magnetic Particle (MPI), Ultrasound (UT)
Programming: MATLAB, Python, Java, Git, GitLab, Agile/Scrum`;
            break;
          case 'clear':
            setHistory([]);
            setInput('');
            return;
          case 'snake':
            setShowSnakeGame(true);
            output = 'Launching snake...';
            break;
          case 'aero':
            setShowAero(true);
            output = 'Launching Aerodynamics Engine...';
            break;
          case 'overseer':
            setShowDashboard(true);
            output = 'Access granted. Initializing dashboard...';
            break;
          case '':
            output = '';
            break;
          default:
            output = `Command not found: ${cmd}. Type "help" for a list of commands.`;
        }
      }

      setHistory([...history, { command: `visitor@noahjett.com:~$ ${input}`, output }]);
      setInput('');
    }
  };

  if (showSnakeGame) {
    return <Snake onClose={() => setShowSnakeGame(false)} />;
  }
  
  if (showAero) {
    return <Aero onClose={() => setShowAero(false)} />;
  }

  if (showDashboard) {
    return <Dashboard onClose={() => setShowDashboard(false)} />;
  }

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <span>guest@noahjett.com</span>
        <span>v1.0.0</span>
      </div>
      
      <div className="terminal-history">
        {history.map((item, index) => (
          <div key={index} className="history-item">
            {item.command && <div className="command-line">{item.command}</div>}
            {item.output && <div className="output-text">{item.output}</div>}
          </div>
        ))}
        <div ref={historyEndRef} />
      </div>

      <div className="input-area">
        <span className="prompt">visitor@noahjett.com:~$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleCommand}
          autoFocus
          spellCheck="false"
        />
      </div>
    </div>
  );
}

export default App;
