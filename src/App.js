import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [history, setHistory] = useState([
    { command: '', output: 'Welcome to noahjett.com. Type "help" to see available commands.' }
  ]);
  const [input, setInput] = useState('');
  const historyEndRef = useRef(null);

  // Auto-scroll to the bottom when new history is added
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (e) => {
    if (e.key === 'Enter') {
      const cmd = input.trim().toLowerCase();
      let output = '';

      switch (cmd) {
        case 'help':
          output = `Available commands:
  about      - Brief introduction
  education  - Academic background
  experience - Work and internship history
  skills     - Technical toolset
  clear      - Clear the terminal`;
          break;
        case 'about':
          output = 'Noah Jett\nA Junior studying Aerospace Engineering at Iowa State University, with a minor in Non-Destructive Evaluation. Seeking to apply a strong background in CAD modeling, engineering principles, and process analysis to aerospace manufacturing technology.';
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
        case '':
          output = '';
          break;
        default:
          output = `Command not found: ${cmd}. Type "help" for a list of commands.`;
      }

      setHistory([...history, { command: `visitor@noahjett.com:~$ ${input}`, output }]);
      setInput('');
    }
  };

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
