import React from 'react';
import { Sparkles, DollarSign, Clock, Target, Shield, BarChart3, Brain, ArrowRight, Info } from 'lucide-react';

const GeneratorView = ({ formData, handleInputChange, goals, markets, handleMarketToggle, generateStrategy, isGenerating, isAuthenticated, setShowAuthModal }) => {
    return (
        <div className="app-container">
            <div className="form-header">
                <h1 className="form-title"><Sparkles className="title-icon" /> AI Investment Strategy Generator</h1>
                <p className="form-subtitle">Harness the power of advanced machine learning to create personalized investment strategies</p>
                <div className="form-divider"></div>
            </div>

            <div className="form-card glass-card">
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label"><DollarSign className="label-icon" /> Investment Capital (₹)</label>
                        <input type="number" className="form-input" placeholder="Enter amount (e.g., 100000)" value={formData.capital} onChange={(e) => handleInputChange('capital', e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label className="form-label"><Clock className="label-icon" /> Time Horizon</label>
                        <div className="time-inputs">
                            <input type="number" className="time-input" min="1" value={formData.timeHorizon} onChange={(e) => handleInputChange('timeHorizon', e.target.value)} />
                            <select className="time-select" value={formData.timeUnit} onChange={(e) => handleInputChange('timeUnit', e.target.value)}>
                                <option value="months">Months</option>
                                <option value="years">Years</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label"><Target className="label-icon" /> Investment Goal</label>
                        <select className="form-select" value={formData.goal} onChange={(e) => handleInputChange('goal', e.target.value)}>
                            {goals.map(goal => <option key={goal} value={goal}>{goal}</option>)}
                        </select>
                    </div>
                </div>

                <div className="form-group risk-section">
                    <label className="form-label"><Shield className="label-icon" /> Risk Appetite</label>
                    <div className="risk-buttons">
                        {['Low', 'Medium', 'High'].map(risk => (
                            <button key={risk} type="button" className={`risk-button ${formData.riskAppetite === risk ? 'active' : ''}`} onClick={() => handleInputChange('riskAppetite', risk)}>
                                <div className="risk-indicator" data-risk={risk.toLowerCase()}></div>
                                <span>{risk}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group market-section">
                    <label className="form-label"><BarChart3 className="label-icon" /> Market Preferences <span className="label-hint">Select all that apply</span></label>
                    <div className="market-grid">
                        {markets.map(market => (
                            <button key={market} type="button" className={`market-button ${formData.marketPreference.includes(market) ? 'active' : ''}`} onClick={() => handleMarketToggle(market)}>
                                <span className="market-check">{formData.marketPreference.includes(market) && '✓'}</span>{market}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="generate-section">
                    <button type="button" className={`generate-button ${formData.capital && !isGenerating ? 'active' : 'disabled'}`} onClick={generateStrategy} disabled={!formData.capital || isGenerating}>
                        {isGenerating ? (<><div className="spinner"></div><span>Generating AI Strategy...</span></>) : (<><Brain size={24} /><span>Generate AI Strategy</span><ArrowRight size={20} /></>)}
                    </button>
                    {!isAuthenticated && <p className="generate-hint"><Info size={16} /> Please login to generate personalized strategies</p>}
                </div>
            </div>
        </div>
    );
};

export default GeneratorView;