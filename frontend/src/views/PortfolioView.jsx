import React from 'react';
import { BarChart3, DollarSign, TrendingUp, Target, Bell, Brain } from 'lucide-react';

const PortfolioView = ({ livePortfolios, isLoadingPortfolio, alerts, setCurrentView }) => {
    // Calculate totals directly from your Postgres Database records
    const totalInvested = livePortfolios.reduce((sum, port) => sum + Number(port.initialCapital || 0), 0);
    const totalValue = livePortfolios.reduce((sum, port) => sum + Number(port.currentValue || 0), 0);

    // Calculate total actual return
    let avgReturn = 0;
    if (totalInvested > 0) {
        avgReturn = ((totalValue - totalInvested) / totalInvested) * 100;
    }

    return (
        <div className="app-container">
            <div className="portfolio-header">
                <h1 className="page-title"><BarChart3 size={40} /> Portfolio Overview</h1>
            </div>

            <div className="portfolio-summary-grid">
                <div className="summary-card glass-card">
                    <div className="summary-icon"><DollarSign size={32} /></div>
                    <div className="summary-content">
                        <div className="summary-label">Total Live Value</div>
                        <div className="summary-value">₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                    </div>
                </div>
                <div className="summary-card glass-card">
                    <div className="summary-icon"><TrendingUp size={32} /></div>
                    <div className="summary-content">
                        <div className="summary-label">Total Return</div>
                        <div className="summary-value" style={{ color: avgReturn >= 0 ? '#10b981' : '#ef4444' }}>
                            {avgReturn >= 0 ? '+' : ''}{avgReturn.toFixed(2)}%
                        </div>
                    </div>
                </div>
                <div className="summary-card glass-card">
                    <div className="summary-icon"><Target size={32} /></div>
                    <div className="summary-content">
                        <div className="summary-label">Active Portfolios</div>
                        <div className="summary-value">{livePortfolios.length}</div>
                    </div>
                </div>
                <div className="summary-card glass-card">
                    <div className="summary-icon"><Bell size={32} /></div>
                    <div className="summary-content">
                        <div className="summary-label">Active Alerts</div>
                        <div className="summary-value">{alerts.filter(a => a.enabled).length}</div>
                    </div>
                </div>
            </div>

            {isLoadingPortfolio ? (
                <div className="portfolio-empty glass-card">
                    <div className="spinner" style={{ marginBottom: '20px' }}></div>
                    <h2>Syncing with Live Database...</h2>
                </div>
            ) : livePortfolios.length > 0 ? (
                <div className="portfolio-strategies glass-card">
                    <h2 className="card-title">Your Live Portfolios</h2>
                    <div className="strategies-grid">
                        {livePortfolios.map(port => {
                            // Extract values from Postgres model
                            const inv = Number(port.initialCapital);
                            const cur = Number(port.currentValue);
                            const ret = inv > 0 ? ((cur - inv) / inv) * 100 : 0;

                            // Extract risk from the name we generated (e.g., "High AI Strategy")
                            const risk = port.name.split(' ')[0] || 'Medium';

                            return (
                                <div key={port.id} className="portfolio-strategy-card">
                                    <div className="portfolio-strategy-header">
                                        <h3>{port.name}</h3>
                                        <span className="portfolio-risk-badge">{risk}</span>
                                    </div>
                                    <div className="portfolio-strategy-stats">
                                        <div className="portfolio-stat">
                                            <span>Invested:</span>
                                            <span>₹{inv.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="portfolio-stat">
                                            <span>Current Value:</span>
                                            <span style={{ color: ret >= 0 ? '#10b981' : '#ef4444' }}>
                                                ₹{cur.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="portfolio-stat">
                                            <span>Return:</span>
                                            <span style={{ color: ret >= 0 ? '#10b981' : '#ef4444' }}>
                                                {ret >= 0 ? '+' : ''}{ret.toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="portfolio-empty glass-card">
                    <BarChart3 size={64} className="empty-icon" />
                    <h2>No live portfolios found</h2>
                    <button type="button" className="generate-button active" onClick={() => setCurrentView('generator')}>
                        <Brain size={20} /> Generate Strategy
                    </button>
                </div>
            )}
        </div>
    );
};

export default PortfolioView;