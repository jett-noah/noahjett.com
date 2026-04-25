import React, { useState } from 'react';

// ==========================================
// PURE JS AERODYNAMICS MATH ENGINE
// ==========================================
const G = 1.4;
const CP = 1004.68; // J/(kg*K)

// Bisection Root Finder
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

// --- 1. ISENTROPIC & SHOCKS ---
function calcIsentropic(M) {
    if (M < 0) return null;
    const t0_t = 1 + 0.2 * M * M;
    const p0_p = Math.pow(t0_t, 3.5);
    const rho0_rho = Math.pow(t0_t, 2.5);
    const a_astar = (1 / M) * Math.pow(t0_t / 1.2, 3.0);
    const mu = M <= 1.0 ? 90 : Math.asin(1 / M) * (180 / Math.PI);
    return { t0_t, p0_p, rho0_rho, a_astar, mu };
}

function calcNormalShock(M1) {
    if (M1 < 1.0) return null;
    const M2 = Math.sqrt((1 + 0.2 * M1 * M1) / (1.4 * M1 * M1 - 0.2));
    const p2_p1 = 1 + (2.8 / 2.4) * (M1 * M1 - 1);
    const rho2_rho1 = (2.4 * M1 * M1) / (2 + 0.4 * M1 * M1);
    const t2_t1 = p2_p1 / rho2_rho1;
    const t1_t0 = 1 / (1 + 0.2 * M1 * M1);
    const t2_t0 = 1 / (1 + 0.2 * M2 * M2);
    const p02_p01 = p2_p1 * Math.pow(t2_t0 / t1_t0, 3.5);
    return { M2, p2_p1, rho2_rho1, t2_t1, p02_p01 };
}

function pm_nu(M) {
    if (M <= 1.0) return 0.0;
    return Math.sqrt(2.4 / 0.4) * Math.atan(Math.sqrt((0.4 / 2.4) * (M * M - 1))) - Math.atan(Math.sqrt(M * M - 1));
}

function calcExpansion(M1, theta_deg) {
    if (M1 < 1.0) return null;
    const theta = theta_deg * (Math.PI / 180);
    const nu1 = pm_nu(M1);
    const nu2 = nu1 + theta;
    const func = (M) => pm_nu(M) - nu2;
    const M2 = bisection(func, M1, 50.0);
    if (!M2) return null;
    const isen1 = calcIsentropic(M1);
    const isen2 = calcIsentropic(M2);
    return { M2, p2_p1: isen1.p0_p / isen2.p0_p, t2_t1: isen1.t0_t / isen2.t0_t };
}

function calcObliqueShock(M1, theta_deg, weak = true) {
    if (M1 <= 1.0 || theta_deg <= 0) return null;
    const th = theta_deg * (Math.PI / 180);
    const mu = Math.asin(1 / M1);
    const func = (beta) => Math.tan(th) - 2 * (1 / Math.tan(beta)) * (M1 * M1 * Math.sin(beta) * Math.sin(beta) - 1) / (M1 * M1 * (G + Math.cos(2 * beta)) + 2);
    
    let max_beta = mu, max_th = 0;
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

// Universal Turn function (Positive = Compression, Negative = Expansion)
function calcTurn(M1, theta_deg) {
    if (Math.abs(theta_deg) < 0.001) return { M2: M1, p2_p1: 1.0, type: 'Flat' };
    if (theta_deg > 0) {
        const os = calcObliqueShock(M1, theta_deg);
        if (!os || os.error) return { error: os?.error || "Detached" };
        return { M2: os.M2, p2_p1: os.p2_p1, type: `Shock (β=${os.beta.toFixed(1)}°)` };
    } else {
        const pm = calcExpansion(M1, Math.abs(theta_deg));
        if (!pm) return { error: "Expansion failed" };
        return { M2: pm.M2, p2_p1: pm.p2_p1, type: 'Expansion' };
    }
}

// --- 2. RAYLEIGH FLOW ---
function calcRayleigh(M) {
    if (M <= 0) return null;
    const M2 = M * M;
    const p_pstar = (1 + G) / (1 + G * M2);
    const t_tstar = M2 * Math.pow(p_pstar, 2);
    const rho_rhostar = 1 / (M2 * p_pstar);
    const t0_t0star = (2 * (1 + G) * M2 / Math.pow(1 + G * M2, 2)) * (1 + 0.2 * M2);
    const p0_p0star = p_pstar * Math.pow((2 + 0.4 * M2) / 2.4, 3.5);
    return { p_pstar, t_tstar, rho_rhostar, t0_t0star, p0_p0star };
}

// --- 3. LINEAR AERO ---
function calcLinearCp(Cp0, M) {
    if (M >= 1.0) return { error: "Requires Subsonic flow" };
    const beta = Math.sqrt(1 - M * M);
    const pg = Cp0 / beta;
    const laitone = Cp0 / (beta + (M * M * Cp0) / (2 * (1 + beta)));
    const kt = Cp0 / (beta + (M * M / (1 + beta)) * (Cp0 / 2));
    return { pg, laitone, kt };
}

function calcCpStar(M) {
    return (2 / (G * M * M)) * (Math.pow((2 + 0.4 * M * M) / 2.4, 3.5) - 1);
}

function findCriticalMach(Cp0) {
    const func = (M) => calcLinearCp(Cp0, M).kt - calcCpStar(M);
    return bisection(func, 0.01, 0.99);
}

// ==========================================
// REACT UI COMPONENTS
// ==========================================
export default function Aero({ onClose }) {
    const [tab, setTab] = useState('components');
    
    // Comp States
    const [compM, setCompM] = useState(2.0);
    const [compTheta, setCompTheta] = useState(10);

    // Airfoil States
    const [airM, setAirM] = useState(2.5);
    const [airAlpha, setAirAlpha] = useState(5);
    const [airEpsilon, setAirEpsilon] = useState(10);

    // Rayleigh States
    const [rayM1, setRayM1] = useState(0.2);
    const [rayT1, setRayT1] = useState(300);
    const [rayQ, setRayQ] = useState(500000);

    // Linear States
    const [linCp0, setLinCp0] = useState(-0.5);
    const [linM, setLinM] = useState(0.6);

    // --- TAB 1: COMPONENTS ---
    const renderComponentsTab = () => {
        const isen = calcIsentropic(compM);
        const ns = calcNormalShock(compM);
        const os = calcObliqueShock(compM, compTheta, true);
        const pm = calcExpansion(compM, compTheta);

        return (
            <div className="aero-content">
                <div className="input-group">
                    <label>Mach Number (M1): <input type="number" step="0.1" value={compM} onChange={e => setCompM(parseFloat(e.target.value) || 0)} /></label>
                    <label>Deflection Angle (θ°): <input type="number" step="1" value={compTheta} onChange={e => setCompTheta(parseFloat(e.target.value) || 0)} /></label>
                </div>
                <div className="grid-results">
                    {isen && (
                        <div className="result-card">
                            <h3>Isentropic</h3>
                            <p>T0/T: {isen.t0_t.toFixed(4)}</p>
                            <p>P0/P: {isen.p0_p.toFixed(4)}</p>
                            <p>A/A*: {isen.a_astar.toFixed(4)}</p>
                            <p>μ: {isen.mu.toFixed(2)}°</p>
                        </div>
                    )}
                    {ns ? (
                        <div className="result-card">
                            <h3>Normal Shock</h3>
                            <p>M2: {ns.M2.toFixed(4)}</p>
                            <p>P2/P1: {ns.p2_p1.toFixed(4)}</p>
                            <p>T2/T1: {ns.t2_t1.toFixed(4)}</p>
                            <p>P02/P01: {ns.p02_p01.toFixed(4)}</p>
                        </div>
                    ) : <div className="result-card error">Normal Shock: M &gt; 1.0</div>}
                    {os ? (
                        os.error ? <div className="result-card error">Oblique Shock: {os.error}</div> :
                        <div className="result-card">
                            <h3>Oblique Shock</h3>
                            <p>M2: {os.M2.toFixed(4)}</p>
                            <p>Wave Angle (β): {os.beta.toFixed(2)}°</p>
                            <p>P2/P1: {os.p2_p1.toFixed(4)}</p>
                            <p>P02/P01: {os.p02_p01.toFixed(4)}</p>
                        </div>
                    ) : <div className="result-card error">Oblique: M &gt; 1.0, θ &gt; 0</div>}
                    {pm ? (
                        <div className="result-card">
                            <h3>P-M Expansion</h3>
                            <p>M2: {pm.M2.toFixed(4)}</p>
                            <p>P2/P1: {pm.p2_p1.toFixed(4)}</p>
                            <p>T2/T1: {pm.t2_t1.toFixed(4)}</p>
                        </div>
                    ) : <div className="result-card error">Expansion: M &gt; 1.0</div>}
                </div>
            </div>
        );
    };

    // --- TAB 2: AIRFOIL ---
    const renderAirfoilTab = () => {
        let err = null;
        // Top Front (2)
        const th2 = airEpsilon - airAlpha;
        const z2 = calcTurn(airM, th2);
        if (z2.error) err = `Top Front (Zone 2) Error: ${z2.error}`;
        
        // Top Rear (3)
        let z3 = { error: "Awaiting Zone 2" };
        if (!err && z2.M2) {
            z3 = calcTurn(z2.M2, -2 * airEpsilon);
            if (z3.error) err = `Top Rear (Zone 3) Error: ${z3.error}`;
        }

        // Bottom Front (4)
        const th4 = airEpsilon + airAlpha;
        const z4 = calcTurn(airM, th4);
        if (!err && z4.error) err = `Bottom Front (Zone 4) Error: ${z4.error}`;

        // Bottom Rear (5)
        let z5 = { error: "Awaiting Zone 4" };
        if (!err && z4.M2) {
            z5 = calcTurn(z4.M2, -2 * airEpsilon);
            if (z5.error) err = `Bottom Rear (Zone 5) Error: ${z5.error}`;
        }

        // Lift & Drag Integration
        let cl = 0, cd = 0, cp2 = 0, cp3 = 0, cp4 = 0, cp5 = 0;
        if (!err) {
            const getCp = (p_pinf) => (2 / (1.4 * airM * airM)) * (p_pinf - 1);
            cp2 = getCp(z2.p2_p1);
            cp3 = getCp(z3.p2_p1 * z2.p2_p1);
            cp4 = getCp(z4.p2_p1);
            cp5 = getCp(z5.p2_p1 * z4.p2_p1);
            
            const cn = 0.5 * (cp4 + cp5 - cp2 - cp3);
            const ca = 0.5 * (cp2 - cp3 + cp4 - cp5) * Math.tan(airEpsilon * Math.PI / 180);
            
            const a_rad = airAlpha * Math.PI / 180;
            cl = cn * Math.cos(a_rad) - ca * Math.sin(a_rad);
            cd = cn * Math.sin(a_rad) + ca * Math.cos(a_rad);
        }

        return (
            <div className="aero-content">
                <div className="input-group">
                    <label>Freestream Mach: <input type="number" step="0.1" value={airM} onChange={e => setAirM(parseFloat(e.target.value) || 0)} /></label>
                    <label>AoA (α°): <input type="number" step="1" value={airAlpha} onChange={e => setAirAlpha(parseFloat(e.target.value) || 0)} /></label>
                    <label>Half Angle (ε°): <input type="number" step="1" value={airEpsilon} onChange={e => setAirEpsilon(parseFloat(e.target.value) || 0)} /></label>
                </div>

                {err ? <div className="result-card error" style={{gridColumn: '1 / -1'}}><h3>Airfoil Failed</h3><p>{err}</p></div> : (
                    <>
                        <div className="grid-results">
                            <div className="result-card">
                                <h3>Zone 2 (Top Front)</h3>
                                <p>Type: {z2.type}</p>
                                <p>M2: {z2.M2.toFixed(4)}</p>
                                <p>P2/P∞: {z2.p2_p1.toFixed(4)}</p>
                                <p>Cp2: {cp2.toFixed(4)}</p>
                            </div>
                            <div className="result-card">
                                <h3>Zone 3 (Top Rear)</h3>
                                <p>Type: {z3.type}</p>
                                <p>M3: {z3.M2.toFixed(4)}</p>
                                <p>P3/P∞: {(z3.p2_p1 * z2.p2_p1).toFixed(4)}</p>
                                <p>Cp3: {cp3.toFixed(4)}</p>
                            </div>
                            <div className="result-card">
                                <h3>Zone 4 (Btm Front)</h3>
                                <p>Type: {z4.type}</p>
                                <p>M4: {z4.M2.toFixed(4)}</p>
                                <p>P4/P∞: {z4.p2_p1.toFixed(4)}</p>
                                <p>Cp4: {cp4.toFixed(4)}</p>
                            </div>
                            <div className="result-card">
                                <h3>Zone 5 (Btm Rear)</h3>
                                <p>Type: {z5.type}</p>
                                <p>M5: {z5.M2.toFixed(4)}</p>
                                <p>P5/P∞: {(z5.p2_p1 * z4.p2_p1).toFixed(4)}</p>
                                <p>Cp5: {cp5.toFixed(4)}</p>
                            </div>
                        </div>
                        <div className="result-card" style={{gridColumn: '1 / -1', background: '#111'}}>
                            <h3>Airfoil Integration Results</h3>
                            <div style={{display: 'flex', gap: '40px'}}>
                                <p><strong>Lift Coefficient (Cl):</strong> {cl.toFixed(5)}</p>
                                <p><strong>Wave Drag (Cd):</strong> {cd.toFixed(5)}</p>
                                <p><strong>L/D Ratio:</strong> {(cl/cd).toFixed(2)}</p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    };

    // --- TAB 3: RAYLEIGH ---
    const renderRayleighTab = () => {
        const r1 = calcRayleigh(rayM1);
        let err = null;
        let r2 = null;
        let M2 = 0;
        let t02_t01 = 0;

        if (r1) {
            const T01 = rayT1 * (1 + 0.2 * rayM1 * rayM1);
            const T0_star = T01 / r1.t0_t0star;
            const T02 = T01 + (rayQ / CP);
            t02_t01 = T02 / T01;
            const target_t02_star = T02 / T0_star;

            if (target_t02_star > 1.0) {
                err = `Thermal Choking! Requires T02/T0* <= 1.0. (Current: ${target_t02_star.toFixed(3)})`;
            } else {
                const func = (M) => calcRayleigh(M).t0_t0star - target_t02_star;
                M2 = rayM1 < 1.0 ? bisection(func, 0.01, 1.0) : bisection(func, 1.0, 50.0);
                if (M2) r2 = calcRayleigh(M2);
            }
        }

        return (
            <div className="aero-content">
                <div className="input-group">
                    <label>M1: <input type="number" step="0.1" value={rayM1} onChange={e => setRayM1(parseFloat(e.target.value) || 0)} /></label>
                    <label>T1 (K): <input type="number" step="10" value={rayT1} onChange={e => setRayT1(parseFloat(e.target.value) || 0)} /></label>
                    <label>Heat Added q (J/kg): <input type="number" step="10000" value={rayQ} onChange={e => setRayQ(parseFloat(e.target.value) || 0)} /></label>
                </div>

                {err ? <div className="result-card error"><h3>Rayleigh Flow Failed</h3><p>{err}</p></div> : (
                    r1 && r2 && (
                        <div className="grid-results">
                            <div className="result-card">
                                <h3>State 1 (Initial)</h3>
                                <p>M1: {rayM1.toFixed(4)}</p>
                                <p>T01: {(rayT1 * (1 + 0.2 * rayM1 * rayM1)).toFixed(2)} K</p>
                                <p>P1/P*: {r1.p_pstar.toFixed(4)}</p>
                                <p>T1/T*: {r1.t_tstar.toFixed(4)}</p>
                            </div>
                            <div className="result-card" style={{borderLeftColor: '#00ccff'}}>
                                <h3>State 2 (Final)</h3>
                                <p>M2: {M2.toFixed(4)}</p>
                                <p>T02: {(rayT1 * (1 + 0.2 * rayM1 * rayM1) + rayQ/CP).toFixed(2)} K</p>
                                <p>P2/P*: {r2.p_pstar.toFixed(4)}</p>
                                <p>T2/T*: {r2.t_tstar.toFixed(4)}</p>
                            </div>
                            <div className="result-card" style={{gridColumn: '1 / -1'}}>
                                <h3>System Changes</h3>
                                <p>P2 / P1 = {(r2.p_pstar / r1.p_pstar).toFixed(4)}</p>
                                <p>T2 / T1 = {(r2.t_tstar / r1.t_tstar).toFixed(4)}</p>
                                <p>T02 / T01 = {t02_t01.toFixed(4)}</p>
                                <p>P02 / P01 = {(r2.p0_p0star / r1.p0_p0star).toFixed(4)} (Total Pressure Loss)</p>
                            </div>
                        </div>
                    )
                )}
            </div>
        );
    };

    // --- TAB 4: LINEAR AERO ---
    const renderLinearTab = () => {
        const lin = calcLinearCp(linCp0, linM);
        const mcr = findCriticalMach(linCp0);

        return (
            <div className="aero-content">
                <div className="input-group">
                    <label>Incompressible Cp0: <input type="number" step="0.1" value={linCp0} onChange={e => setLinCp0(parseFloat(e.target.value) || 0)} /></label>
                    <label>Freestream Mach: <input type="number" step="0.05" value={linM} onChange={e => setLinM(parseFloat(e.target.value) || 0)} /></label>
                </div>
                {lin.error ? <div className="result-card error"><h3>Linear Aero</h3><p>{lin.error}</p></div> : (
                    <div className="grid-results">
                        <div className="result-card">
                            <h3>Compressibility Corrections</h3>
                            <p><strong>Prandtl-Glauert Cp:</strong> {lin.pg.toFixed(4)}</p>
                            <p><strong>Laitone Cp:</strong> {lin.laitone.toFixed(4)}</p>
                            <p><strong>Karman-Tsien Cp:</strong> {lin.kt.toFixed(4)}</p>
                        </div>
                        <div className="result-card" style={{borderLeftColor: '#ff00ff'}}>
                            <h3>Critical Mach Number</h3>
                            {mcr ? (
                                <>
                                    <p><strong>M_cr:</strong> {mcr.toFixed(4)}</p>
                                    <p className="controls-text" style={{marginTop: '10px'}}>(Solved via Karman-Tsien intersection with Cp*)</p>
                                </>
                            ) : <p>Unable to find Mcr</p>}
                        </div>
                    </div>
                )}
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
                .grid-results { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
                .input-group { display: flex; flex-wrap: wrap; gap: 20px; background: #111; padding: 20px; border: 1px solid #333; border-radius: 5px; }
                .input-group label { display: flex; flex-direction: column; font-size: 14px; gap: 5px; }
                .input-group input { background: #000; border: 1px solid #00ff00; color: #00ff00; padding: 8px; font-family: inherit; font-size: 16px; width: 180px; }
                .input-group input:focus { outline: none; box-shadow: 0 0 10px rgba(0,255,0,0.3); }
                .result-card { background: #0a0a0a; border-left: 3px solid #00ff00; padding: 15px 20px; display: flex; flex-direction: column; gap: 8px; }
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
                    <button className={`tab-btn ${tab === 'components' ? 'active' : ''}`} onClick={() => setTab('components')}>1. Shocks / Expansions</button>
                    <button className={`tab-btn ${tab === 'airfoil' ? 'active' : ''}`} onClick={() => setTab('airfoil')}>2. Diamond Airfoil</button>
                    <button className={`tab-btn ${tab === 'rayleigh' ? 'active' : ''}`} onClick={() => setTab('rayleigh')}>3. Rayleigh Flow</button>
                    <button className={`tab-btn ${tab === 'linear' ? 'active' : ''}`} onClick={() => setTab('linear')}>4. Linear Aero & Mcr</button>
                </div>
                {tab === 'components' && renderComponentsTab()}
                {tab === 'airfoil' && renderAirfoilTab()}
                {tab === 'rayleigh' && renderRayleighTab()}
                {tab === 'linear' && renderLinearTab()}
            </div>
        </div>
    );
}
