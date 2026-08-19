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

      // --- 1. GOOGLE SEARCH DETECTION (-g flag) ---
      if (cmd.endsWith('-g')) {
        // Extract the search query by removing the '-g' and any extra spaces
        const searchQuery = input.trim().slice(0, -2).trim(); 
        output = `Initiating Google search for "${searchQuery}"...`;
        window.location.href = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
      } 
      // --- 2. URL DETECTION ---
      else if (/^((https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\n\s]*)?)$/.test(cmd)) {
        output = `Initiating hyperspace jump to ${cmd}...`;
        const targetUrl = cmd.startsWith('http') ? cmd : `https://${cmd}`;
        window.location.href = targetUrl;
      } 
      // --- 3. COMMAND & SHORTCUT PROCESSING ---
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
  
  * Web Shortcuts: Type any valid URL (e.g. github.com) to navigate.
  * Web Search: Type any phrase followed by -g to search Google.`;
            break;
          case 'about':
            output = `Noah Jett — Software Engineer & Aerospace Student\n\nObjective: Eager to rejoin State Farm’s collaborative problem-solving culture. Combining Aerospace Engineering rigor and experience with AI-accelerated workflows to rapidly engineer quality front-end/iOS platforms. Bringing three prior State Farm internships and a proven track record of innovation, including a patent‑pending iOS application.\n\nContact: noahjett@noahjett.com • linkedin.com/in/noahjett • github.com/jett-noah`;
            break;
          case 'education':
            output = `Iowa State University — Ames, IA\nBachelor of Science in Aerospace Engineering | Minor: Non-Destructive Evaluation\nExpected Graduation: December 2027 | GPA: 3.87/4.0\n\nHeartland Community College — Normal, IL\nAssociate of Science, Computer Science (ADP with State Farm Mentor)\nGraduation: May 2023 | GPA: 3.86/4.0`;
            break;
          case 'experience':
            output = `Software Engineering Intern — State Farm (Summers 2023, 2024, 2025)\n- Engineered responsive, cross-device interfaces for the Digital Auto Quote and Purchase UI team; refactored Angular (TypeScript/HTML) components to match UX mockups and resolve production issues.\n- Led a team of interns in collaboration with JFrog engineering to architect and build a React-based internal portal for sharing innersource tools.\n- Worked within an Agile team, managed tasks via GitLab, and presented progress to stakeholders and executives bi-weekly.\n\nAerospace Avionics Systems Engineering Co-op — Collins Aerospace (June–Dec 2026)\n- Conceptualized a Python GUI utility (pandas, PyQt6) and rapidly prototyped the architecture; led beta testing and onboarding which reduced manual sorting time by ~70%.\n\nUndergraduate Teaching Assistant — Engineering Statics, Iowa State University (Fall 2024 – Fall 2025)\n- Led weekly review sessions for 30+ students, prepared lesson plans, and graded assignments to reinforce core statics concepts.`;
            break;
          case 'skills':
            output = `Front-end: SwiftUI, JavaScript, Angular, React, HTML\nBack-end: Python, Java, C, Agentic AI scripting\nOther: Git, Agile/Scrum, MATLAB, SolidWorks`;
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
