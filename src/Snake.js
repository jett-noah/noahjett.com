import React, { useState, useEffect, useCallback } from 'react';
import './Snake.css';

const GRID_SIZE = 20;
const CELL_SIZE = 20;

function Snake({ onClose }) {
    const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
    const [food, setFood] = useState({ x: 15, y: 15 });
    const [direction, setDirection] = useState({ x: 1, y: 0 });
    const [nextDirection, setNextDirection] = useState({ x: 1, y: 0 });
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [speed, setSpeed] = useState(100);

    const generateFood = useCallback(() => {
        return {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }
            const keyMap = {
                ArrowUp: { x: 0, y: -1 },
                ArrowDown: { x: 0, y: 1 },
                ArrowLeft: { x: -1, y: 0 },
                ArrowRight: { x: 1, y: 0 },
                w: { x: 0, y: -1 },
                W: { x: 0, y: -1 },
                s: { x: 0, y: 1 },
                S: { x: 0, y: 1 },
                a: { x: -1, y: 0 },
                A: { x: -1, y: 0 },
                d: { x: 1, y: 0 },
                D: { x: 1, y: 0 },
            };
            if (keyMap[e.key]) {
                e.preventDefault();
                const newDir = keyMap[e.key];
                if (!(newDir.x === -direction.x && newDir.y === -direction.y)) {
                    setNextDirection(newDir);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [direction, onClose]);

    useEffect(() => {
        if (gameOver) return;
        const gameInterval = setInterval(() => {
            setSnake((prevSnake) => {
                setDirection(nextDirection);
                const head = prevSnake[0];
                const newHead = {
                    x: (head.x + nextDirection.x + GRID_SIZE) % GRID_SIZE,
                    y: (head.y + nextDirection.y + GRID_SIZE) % GRID_SIZE,
                };
                if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
                    setGameOver(true);
                    return prevSnake;
                }
                let newSnake = [newHead, ...prevSnake];
                if (newHead.x === food.x && newHead.y === food.y) {
                    setScore((prev) => prev + 10);
                    setSpeed((prev) => Math.max(50, prev - 2));
                    setFood(generateFood());
                } else {
                    newSnake.pop();
                }
                return newSnake;
            });
        }, speed);
        return () => clearInterval(gameInterval);
    }, [speed, gameOver, food, nextDirection, generateFood]);

    const handleRetry = () => {
        setSnake([{ x: 10, y: 10 }]);
        setFood(generateFood());
        setDirection({ x: 1, y: 0 });
        setNextDirection({ x: 1, y: 0 });
        setGameOver(false);
        setScore(0);
        setSpeed(100);
    };

    return (
        <div className="snake-game-container">
            <div className="snake-header">
                <div className="snake-title">🐍 SNAKE GAME 🐍</div>
                <div className="snake-info">
                    <div>Score: {score}</div>
                    <div>Speed: {101 - Math.floor(speed / 50)}</div>
                </div>
            </div>
            <div className="snake-board">
                <svg width={GRID_SIZE * CELL_SIZE} height={GRID_SIZE * CELL_SIZE} className="snake-canvas">
                    <defs>
                        <pattern id="grid" width={CELL_SIZE} height={CELL_SIZE} patternUnits="userSpaceOnUse">
                            <path d={`M ${CELL_SIZE} 0 L 0 0 0 ${CELL_SIZE}`} fill="none" stroke="#333" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width={GRID_SIZE * CELL_SIZE} height={GRID_SIZE * CELL_SIZE} fill="url(#grid)" />
                    <rect x={food.x * CELL_SIZE + 2} y={food.y * CELL_SIZE + 2} width={CELL_SIZE - 4} height={CELL_SIZE - 4} fill="#ff00ff" className="food" />
                    {snake.map((segment, index) => (
                        <rect key={index} x={segment.x * CELL_SIZE + 1} y={segment.y * CELL_SIZE + 1} width={CELL_SIZE - 2} height={CELL_SIZE - 2} fill={index === 0 ? '#00ff00' : '#00cc00'} className={index === 0 ? 'snake-head' : 'snake-body'} />
                    ))}
                </svg>
            </div>
            <div className="snake-controls">
                <div className="controls-text">Arrow Keys or WASD to move • ESC to exit</div>
            </div>
            {gameOver && (
                <div className="game-over-overlay">
                    <div className="game-over-content">
                        <h2>GAME OVER!</h2>
                        <p>Final Score: {score}</p>
                        <button onClick={handleRetry}>Play Again</button>
                        <button onClick={onClose}>Back to Terminal</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Snake;
