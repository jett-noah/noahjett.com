import React, { useState } from 'react';

// ==========================================
// PURE JS AERODYNAMICS MATH ENGINE
// Replaces numpy and scipy.optimize.fsolve
// ==========================================
const G = 1.4;

// Bisection Root Finder (Replaces fsolve)
function bisection(func, a, b, tol = 1e-6, maxIter = 100) {
    if (func(a) * func(b) > 0) return null; // Root not bracketed
    let mid = a;
    for (let i = 0; i < maxIter; i++) {
        mid = (a + b) / 2;
        if (Math.abs(func(mid)) < tol || (b - a) / 2 < tol) return mid;
        if (func(mid) * func(a) < 0) b = mid;
        else a = mid;
    }
    return mid;
}

// 1. Isentropic Relations
function calcIsentropic(M) {
    if (M < 0) return null;
    const t0_t = 1 + 0.2 * M * M;
    const p0_p = Math.pow(t0_t, 3.5);
    const rho0_rho = Math.pow(t0_t, 2.5);
    const a_astar = (1 / M) * Math.pow(t0_t / 1.2, 3.0);
    const mu = M <= 1.0 ? 90 : Math.asin(1 / M) * (180 / Math.PI);
    return { t0_t, p0_p, rho0_rho, a_astar, mu };
}

// 2. Normal Shock
function calcNormalShock(M1) {
    if (M1 < 1.0) return null; // No shock possible
    const M2 = Math.sqrt((1 + 0.2 * M1 * M1) / (1.4 * M1 * M1 - 0.2));
    const p2_p1 = 1 + (2.8 / 2.4) * (M1 * M1 - 1);
    const rho2_rho1 = (2.4 * M1 * M1) / (2 + 0.4 * M1 * M1);
    const t2_t1 = p2_p1 / rho2_rho1;
    const t1_t0 = 1 / (1 + 0.2 * M1 * M1);
    const t2_t0 = 1 / (1 + 0.2 * M2 * M2);
    const p02_p01 = p2_p1 * Math.pow(t2_t0 / t1_t0, 3.5);
    return { M2, p2_p1, rho2_rho1, t2_t1, p02_p01 };
}

// 3. Prandtl-Meyer Expansion
function pm_nu(M) {
    if (M <= 1.0) return 0.0;
    return Math.sqrt(2.4 / 0.4) * Math.atan(Math.sqrt((0.4 / 2.4) * (M * M - 1))) - Math.atan(Math.sqrt(M * M - 1));
}

function calcExpansion(M1, theta_deg) {
    if (M1 < 1.0) return null;
    const theta = theta_deg * (Math.PI / 180);
    const nu1 = pm_nu(M1);
    const nu2 = nu1 + theta;

    // Inverse PM using bisection
    const func = (M) => pm_nu(M) - nu2;
    const M2 = bisection(func, M1, 50.0);
    
    if (!M2) return null;
    const isen1 = calcIsentropic(M1);
    const isen2 = calcIsentropic(M2);
    return { M2, p2_p1: isen1.p0_p / isen2.p0_p, t2_t1: isen1.t0_t / isen2.t0_t };
}

// 4. Oblique Shock (Theta-Beta-Mach)
function calcObliqueShock(M1, theta_deg, weak = true) {
    if (M1 <= 1.0 || theta_deg <= 0) return null;
    const th = theta_deg * (Math.PI / 180);
    const mu = Math.asin(1 / M1);

    const func = (beta) => Math.tan(th) - 2 * (1 / Math.tan(beta)) * (M1 * M1 * Math.sin(beta) * Math.sin(beta) - 1) / (M1 * M1 * (G + Math.cos(2 * beta)) + 2);

    // Scan for max beta (theta_max)
    let max_beta = mu;
    let max_th = 0;
    for (let b = mu; b < Math.PI / 2; b += 0.001) {
        let f = 2 * (1 / Math.tan(b)) * (M1 * M1 * Math.sin(b) * Math.sin(b) - 1) / (M1 * M1 * (G + Math.cos(2 * b)) + 2);
        let t = Math.atan(f);
        if (t > max_th) { max_th = t; max_beta = b; }
    }

    if (th > max_th) return { error: "Shock is Detached!" };

    const beta = weak ? bisection(func, mu + 0.0001, max_beta) : bisection(func, max_beta, Math.PI / 2 - 0.0001);
    if (!beta) return null;

    const beta_deg = beta * (180 / Math.PI);
    const Mn1 = M1 * Math.sin(beta);
    const ns = calcNormalShock(Mn1);
    const M2 = ns.M2 / Math.sin(beta - th);

    return { beta: beta_deg, Mn1, M2, p2_p1: ns.p2_p1, rho2_rho1: ns.rho2_rho1, t2_t1: ns.t2_t1, p02_p01: ns.p02_p01 };
}

// ==========================================
// REACT UI COMPONENTS
// ==========================================
export default function Aero({ onClose }) {
    const [tab, setTab] = useState('components');
    const [M, setM] = useState(2.0);
    const [theta, setTheta] = useState(10);

    const renderComponentsTab = () => {
        const isen = calcIsentropic(M);
        const ns = calcNormalShock(M);
        const os = calcObliqueShock(M, theta, true);
        const pm = calcExpansion(M, theta);

        return (
            <div className="aero-content">
                <div className="input-group">
                    <label>Mach Number (M1): <input type="number" step="0.1" value={M} onChange={e => setM(parseFloat(e.target.value) || 0)} /></label>
                    <label>Deflection Angle (θ): <input type="number" step="1" value={theta} onChange={e => setTheta(parseFloat(e.target.value) || 0)} /></label>
                </div>

                {isen && (
                    <div className="result-card">
                        <h3>Isentropic Relations</h3>
                        <p>T0/T: {isen.t0_t.toFixed(4)} | P0/P: {isen.p0_p.toFixed(4)} | ρ0/ρ: {isen.rho0_rho.toFixed(4)}</p>
                        <p>A/A*: {isen.a_astar.toFixed(4)} | Mach Angle: {isen.mu.toFixed(2)}°</p>
                    </div>
                )}

                {ns ? (
                    <div className="result-card">
                        <h3>Normal Shock</h3>
                        <p>M2: {ns.M2.toFixed(4)} | P2/P1: {ns.p2_p1.toFixed(4)} | T2/T1: {ns.t2_t1.toFixed(4)}</p>
                        <p>ρ2/ρ1: {ns.rho2_rho1.toFixed(4)} | P02/P01: {ns.p02_p01.toFixed(4)}</p>
                    </div>
                ) : <div className="result-card error">Normal Shock: Requires M &gt; 1.0</div>}

                {os ? (
                    os.error ? <div className="result-card error">Oblique Shock: {os.error}</div> :
                    <div className="result-card">
                        <h3>Oblique Shock (Weak)</h3>
                        <p>Wave Angle (β): {os.beta.toFixed(2)}° | M2: {os.M2.toFixed(4)}</p>
                        <p>P2/P1: {os.p2_p1.toFixed(4)} | P02/P01: {os.p02_p01.toFixed(4)}</p>
                    </div>
                ) : <div className="result-card error">Oblique Shock: Requires M &gt; 1.0 and θ &gt; 0</div>}

                {pm ? (
                    <div className="result-card">
                        <h3>Prandtl-Meyer Expansion</h3>
                        <p>M2: {pm.M2.toFixed(4)} | P2/P1: {pm.p2_p1.toFixed(4)} | T2/T1: {pm.t2_t1.toFixed(4)}</p>
                    </div>
                ) : <div className="result-card error">Expansion: Requires M &gt; 1.0</div>}
            </div>
        );
    };

    return (
        <div className="aero-container">
            <style>{`
                .aero-container { width: 100%; height: 100vh; background: #050505; color: #00ff00; font-family: 'Courier New', Courier, monospace; display: flex; flex-direction: column; overflow: hidden; }
                .aero-header { padding: 15px 20px; border-bottom: 2px solid #00ff00; display: flex; justify-content: space-between; align-items: center; background: #0a0a0a; }
                .aero-header h2 { margin: 0; font-size: 20px; letter-spacing: 2px; text-shadow: 0 0 10px #00ff00; }
                .close-btn { background: transparent; color: #00ff00; border: 1px solid #00ff00; padding: 5px 15px; cursor: pointer; transition: all 0.2s; }
                .close-btn:hover { background: #00ff00; color: #000; }
                .aero-body { display: flex; flex: 1; overflow: hidden; }
                .aero-sidebar { width: 250px; border-right: 1px dashed #00ff00; padding: 20px; background: #080808; display: flex; flex-direction: column; gap: 10px; }
                .tab-btn { background: transparent; border: 1px solid #333; color: #aaa; padding: 10px; text-align: left; cursor: pointer; transition: 0.2s; }
                .tab-btn.active, .tab-btn:hover { border-color: #00ff00; color: #00ff00; box-shadow: inset 5px 0 0 #00ff00; background: rgba(0,255,0,0.05); }
                .aero-content { flex: 1; padding: 30px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
                .input-group { display: flex; gap: 20px; background: #111; padding: 20px; border: 1px solid #333; border-radius: 5px; }
                .input-group label { display: flex; flex-direction: column; font-size: 14px; gap: 5px; }
                .input-group input { background: #000; border: 1px solid #00ff00; color: #00ff00; padding: 8px; font-family: inherit; font-size: 16px; width: 150px; }
                .input-group input:focus { outline: none; box-shadow: 0 0 10px rgba(0,255,0,0.3); }
                .result-card { background: #0a0a0a; border-left: 3px solid #00ff00; padding: 15px 20px; display: flex; flex-direction: column; gap: 5px; }
                .result-card h3 { margin: 0 0 10px 0; color: #fff; font-size: 16px; border-bottom: 1px dashed #333; padding-bottom: 5px; }
                .result-card p { margin: 0; font-size: 15px; color: #ccc; }
                .result-card.error { border-left-color: #ff0000; color: #ff0000; }
            `}</style>

            <div className="aero-header">
                <h2>AE COMPRESSIBLE FLOW ENGINE</h2>
                <button className="close-btn" onClick={onClose}>[X] EXIT TO TERMINAL</button>
            </div>

            <div className="aero-body">
                <div className="aero-sidebar">
                    <button className={`tab-btn ${tab === 'components' ? 'active' : ''}`} onClick={() => setTab('components')}>1. Shock / Expansion Solver</button>
                    <button className="tab-btn" onClick={() => alert("Tab coming soon! Stick to Tab 1 for now.")}>2. Airfoil Solver</button>
                    <button className="tab-btn" onClick={() => alert("Tab coming soon!")}>3. Rayleigh Flow</button>
                </div>
                {tab === 'components' && renderComponentsTab()}
            </div>
        </div>
    );
}
