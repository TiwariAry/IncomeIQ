import React from 'react';
import { GitCompare, Brain, Check, Sparkles, TrendingUp, Shield, Zap, Info } from 'lucide-react';

const ComparerView = ({ strategies, setCurrentView, selectedStrategies, handleStrategySelect, runComparison, comparisonVerdict, isComparing }) => {
    // Local frontend math for the visual cards (RESTORED!)
    const getComparisonConclusion = () => {
        if (selectedStrategies.length < 2) return null;
        const compared = selectedStrategies.map(id => strategies.find(s => s.id === id));

        const bestCAGR = compared.reduce((best, strat) => parseFloat(strat.backtestStats.cagr) > parseFloat(best.backtestStats.cagr) ? strat : best);
        const lowestRisk = compared.reduce((best, strat) => parseFloat(strat.backtestStats.maxDrawdown) < parseFloat(best.backtestStats.maxDrawdown) ? strat : best);
        const highestSharpe = compared.reduce((best, strat) => parseFloat(strat.backtestStats.sharpe) > parseFloat(best.backtestStats.sharpe) ? strat : best);

        return { bestCAGR, lowestRisk, highestSharpe, compared };
    };

    const conclusion = getComparisonConclusion();

    // Helper function to extract the correct Postgres ID for the backend
    const handleRunComparison = () => {
        const strat1 = strategies.find(s => s.id === selectedStrategies[0]);
        const strat2 = strategies.find(s => s.id === selectedStrategies[1]);

        // We explicitly pass the portfolioId, which matches your Analysis.findOne query!
        runComparison(strat1.portfolioId, strat2.portfolioId);
    };

    return (
        <div className="app-container">
            <div className="comparer-header">
                <h1 className="page-title"><GitCompare size={40} /> Strategy Comparison</h1>
                <p className="page-subtitle">Compare multiple strategies side-by-side to make informed decisions</p>
            </div>

            {strategies.length < 2 ? (
                <div className="comparer-empty glass-card">
                    <GitCompare size={64} className="empty-icon" />
                    <h2>Generate at least 2 strategies to compare</h2>
                    <button type="button" className="generate-button active" onClick={() => setCurrentView('generator')}><Brain size={20} /> Go to Generator</button>
                </div>
            ) : (
                <div className="comparer-content">
                    <div className="strategy-selector glass-card">
                        <h3 className="card-title">Select Exactly 2 Strategies to Compare</h3>
                        <div className="strategy-list">
                            {strategies.map(strat => (
                                <div key={strat.id} className={`strategy-selector-item ${selectedStrategies.includes(strat.id) ? 'selected' : ''}`} onClick={() => handleStrategySelect(strat.id)}>
                                    <div className="strategy-selector-checkbox">{selectedStrategies.includes(strat.id) && <Check size={18} />}</div>
                                    <div className="strategy-selector-details">
                                        <div className="strategy-selector-name">{strat.strategyName}</div>
                                        <div className="strategy-selector-meta">{strat.riskLevel} Risk • {strat.expectedReturn}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {selectedStrategies.length === 2 && (
                        <>
                            {/* The Backend Trigger Button */}
                            <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                                <button
                                    type="button"
                                    className={`generate-button ${isComparing ? 'disabled' : 'active'}`}
                                    onClick={handleRunComparison}
                                    disabled={isComparing}
                                >
                                    {isComparing ? (
                                        <><div className="spinner"></div><span>Analyzing Engine Data...</span></>
                                    ) : (
                                        <><Brain size={24} /><span>Run Backend AI Comparison</span></>
                                    )}
                                </button>
                            </div>

                            {/* The Side-by-Side Visuals */}
                            <div className="comparison-grid">
                                {selectedStrategies.map(id => {
                                    const strat = strategies.find(s => s.id === id);
                                    return (
                                        <div key={id} className="comparison-card glass-card">
                                            <div className="comparison-header"><h3>{strat.strategyName}</h3><span className="risk-badge">{strat.riskLevel}</span></div>
                                            <div className="comparison-metrics">
                                                <div className="comparison-metric"><span className="metric-label">Expected Return</span><span className="metric-value green-text">{strat.expectedReturn}</span></div>
                                                <div className="comparison-metric"><span className="metric-label">CAGR</span><span className="metric-value">{strat.backtestStats.cagr}</span></div>
                                                <div className="comparison-metric"><span className="metric-label">Sharpe Ratio</span><span className="metric-value">{strat.backtestStats.sharpe}</span></div>
                                                <div className="comparison-metric"><span className="metric-label">Max Drawdown</span><span className="metric-value red-text">{strat.backtestStats.maxDrawdown}</span></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* The Official Backend Verdict */}
                            {comparisonVerdict && (
                                <div className="comparison-conclusion glass-card" style={{ border: '2px solid #8b5cf6', marginBottom: '20px' }}>
                                    <h3 className="section-title"><Brain size={24} /> Official Engine Verdict</h3>
                                    <p style={{ fontSize: '1.1rem', padding: '10px' }}>{comparisonVerdict}</p>
                                </div>
                            )}

                            {/* The Restored Frontend Visual Conclusion Cards */}
                            {conclusion && (
                                <div className="comparison-conclusion glass-card">
                                    <h3 className="section-title"><Sparkles size={24} /> Performance Breakdown</h3>
                                    <div className="conclusion-content">
                                        <div className="conclusion-item best">
                                            <div className="conclusion-icon"><TrendingUp size={32} /></div>
                                            <div className="conclusion-details">
                                                <div className="conclusion-label">Best Performance</div>
                                                <div className="conclusion-strategy">{conclusion.bestCAGR.strategyName}</div>
                                                <div className="conclusion-value">CAGR: {conclusion.bestCAGR.backtestStats.cagr}</div>
                                            </div>
                                        </div>
                                        <div className="conclusion-item safe">
                                            <div className="conclusion-icon"><Shield size={32} /></div>
                                            <div className="conclusion-details">
                                                <div className="conclusion-label">Lowest Risk</div>
                                                <div className="conclusion-strategy">{conclusion.lowestRisk.strategyName}</div>
                                                <div className="conclusion-value">Max Drawdown: {conclusion.lowestRisk.backtestStats.maxDrawdown}</div>
                                            </div>
                                        </div>
                                        <div className="conclusion-item balanced">
                                            <div className="conclusion-icon"><Zap size={32} /></div>
                                            <div className="conclusion-details">
                                                <div className="conclusion-label">Best Risk-Adjusted Returns</div>
                                                <div className="conclusion-strategy">{conclusion.highestSharpe.strategyName}</div>
                                                <div className="conclusion-value">Sharpe Ratio: {conclusion.highestSharpe.backtestStats.sharpe}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ComparerView;