import React from 'react';
import { ArrowRight, TrendingUp, Activity, Zap, TrendingDown, BarChart3, Brain, Sparkles, Check, AlertCircle, Download, ExternalLink, Bell, Target } from 'lucide-react';
// Added LineChart components for the AI forecast
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const ResultsView = ({ strategy, setCurrentView, aiExplanation, isExplaining, callGeminiAPI }) => {
    if (!strategy) return null;

    // --- DATA TRANSFORMATION FOR THE AI FORECAST CHART ---
    // Recharts needs an array of objects. We map the PyTorch [p10, p50, p90] arrays into a single timeline.
    const hasSimulatedPaths = strategy.simulatedPaths && strategy.simulatedPaths.length === 3;
    let forecastChartData = [];

    if (hasSimulatedPaths) {
        const [p10, p50, p90] = strategy.simulatedPaths;
        // Assuming 30 days of predictions based on your Python model
        forecastChartData = p50.map((val, index) => ({
            day: `Day ${index + 1}`,
            bear: p10[index],       // 10th percentile (Worst Case)
            expected: val,          // 50th percentile (Median)
            bull: p90[index]        // 90th percentile (Best Case)
        }));
    }
    // -----------------------------------------------------

    return (
        <div className="app-container results-container">
            <button className="back-button" onClick={() => setCurrentView('generator')}>
                <ArrowRight size={18} style={{ transform: 'rotate(180deg)' }} /> Back to Generator
            </button>

            <div className="strategy-overview glass-card">
                <div className="strategy-header">
                    {/* Render the XGBoost Risk Score if available */}
                    <div className="strategy-badge">
                        {strategy.aiRiskScore ? `AI Risk Score: ${strategy.aiRiskScore}/10` : `${strategy.riskLevel} Risk`}
                    </div>
                    <h2 className="strategy-name">{strategy.strategyName}</h2>
                    <p className="strategy-description">{strategy.description}</p>
                </div>

                <div className="strategy-metrics">
                    <div className="metric-card"><TrendingUp className="metric-icon green" /><div className="metric-content"><div className="metric-value green-text">{strategy.expectedReturn}</div><div className="metric-label">Expected Return</div></div></div>
                    <div className="metric-card"><Activity className="metric-icon blue" /><div className="metric-content"><div className="metric-value blue-text">{strategy.backtestStats.cagr}</div><div className="metric-label">CAGR</div></div></div>
                    <div className="metric-card"><Zap className="metric-icon purple" /><div className="metric-content"><div className="metric-value purple-text">{strategy.backtestStats.sharpe}</div><div className="metric-label">Sharpe Ratio</div></div></div>
                    <div className="metric-card"><TrendingDown className="metric-icon red" /><div className="metric-content"><div className="metric-value red-text">{strategy.backtestStats.maxDrawdown}</div><div className="metric-label">Max Drawdown</div></div></div>
                </div>

                <div className="strategy-stats-grid">
                    <div className="stat-item"><span className="stat-label">Win Rate</span><span className="stat-value">{strategy.backtestStats.winRate}</span></div>
                    <div className="stat-item"><span className="stat-label">Volatility</span><span className="stat-value">{strategy.backtestStats.volatility}</span></div>
                    <div className="stat-item"><span className="stat-label">Alpha</span><span className="stat-value">{strategy.backtestStats.alpha}</span></div>
                    <div className="stat-item"><span className="stat-label">Rebalance</span><span className="stat-value">{strategy.rebalanceFrequency}</span></div>
                </div>
            </div>

            {/* --- NEW: DEEP LEARNING FORECAST CHART --- */}
            {hasSimulatedPaths && (
                <div className="forecast-section glass-card" style={{ marginTop: '20px', marginBottom: '20px' }}>
                    <h3 className="section-title"><Target size={24} /> AI Price Trajectory (30-Day LSTM Forecast)</h3>
                    <div className="chart-container" style={{ height: '300px', marginTop: '20px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={forecastChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="day" stroke="#94a3b8" tick={{fontSize: 12}} />
                                {/* domain={['auto', 'auto']} ensures the chart scales perfectly even if PyTorch outputs tiny unscaled decimals */}
                                <YAxis stroke="#94a3b8" tick={{fontSize: 12}} domain={['auto', 'auto']} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                                    itemStyle={{ fontWeight: 'bold' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                <Line type="monotone" dataKey="bull" name="Bull Case (P90)" stroke="#10b981" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="expected" name="Expected (P50)" stroke="#3b82f6" strokeWidth={3} dot={false} />
                                <Line type="monotone" dataKey="bear" name="Bear Case (P10)" stroke="#ef4444" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
            {/* ----------------------------------------- */}

            <div className="strategy-details">
                <div className="portfolio-section glass-card">
                    <h3 className="section-title"><BarChart3 size={24} /> Target Allocation</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={strategy.allocation} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}%`} outerRadius={120} dataKey="value">
                                    {strategy.allocation.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="allocation-list">
                        {strategy.allocation.map((item, index) => (
                            <div key={index} className="allocation-item">
                                <div className="allocation-left"><div className="allocation-color" style={{ backgroundColor: item.color }}></div><div className="allocation-info"><div className="allocation-name">{item.name}</div><div className="allocation-amount">₹{item.amount.toLocaleString('en-IN')}</div></div></div>
                                <div className="allocation-percentage">{item.value}%</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="explanation-section glass-card">
                    <h3 className="section-title"><Brain size={24} /> AI Strategy Explanation</h3>
                    {!aiExplanation && !isExplaining && (
                        <button type="button" className="generate-button active" onClick={() => callGeminiAPI(strategy)}><Sparkles size={20} /> Generate AI Explanation</button>
                    )}
                    {isExplaining && <div className="loading-explanation"><div className="spinner"></div><p>AI is analyzing your strategy...</p></div>}
                    {aiExplanation && (
                        <div className="explanation-content">
                            <div className="explanation-section-block"><h4 className="explanation-heading">Overview</h4><p className="explanation-text">{aiExplanation.overview}</p></div>
                            <div className="explanation-section-block"><h4 className="explanation-heading">Why This Strategy Works</h4><ul className="explanation-list">{aiExplanation.reasoning.map((reason, idx) => <li key={idx}><Check size={16} /> {reason}</li>)}</ul></div>
                            <div className="explanation-section-block"><h4 className="explanation-heading">Risk Factors</h4><ul className="explanation-list warning">{aiExplanation.riskFactors.map((risk, idx) => <li key={idx}><AlertCircle size={16} /> {risk}</li>)}</ul></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="action-section">
                <button type="button" className="action-button primary"><Download size={20} /> Download Report</button>
                <button type="button" className="action-button secondary"><ExternalLink size={20} /> Share Strategy</button>
                <button type="button" className="action-button secondary" onClick={() => setCurrentView('alerts')}><Bell size={20} /> Set Alerts</button>
            </div>
        </div>
    );
};

export default ResultsView;