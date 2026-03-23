import React, { useState } from 'react';
import { BookOpen, Brain, ChevronDown, Sparkles, Check, TrendingUp, AlertCircle, Zap } from 'lucide-react';

const ExplanationsView = ({ strategies, setCurrentView, callGeminiAPI, isExplaining, aiExplanation }) => {
    const [selectedExplanationStrategy, setSelectedExplanationStrategy] = useState(null);

    return (
        <div className="app-container">
            <div className="explanations-header">
                <h1 className="page-title"><BookOpen size={40} /> Strategy Explanations</h1>
                <p className="page-subtitle">Deep dive into AI-powered analysis of your investment strategies</p>
            </div>

            {strategies.length === 0 ? (
                <div className="explanations-empty glass-card">
                    <BookOpen size={64} className="empty-icon" />
                    <h2>No strategies to explain yet</h2>
                    <button type="button" className="generate-button active" onClick={() => setCurrentView('generator')}><Brain size={20} /> Go to Generator</button>
                </div>
            ) : (
                <div className="explanations-content">
                    <div className="explanations-list glass-card">
                        <h3 className="card-title">Your Strategies</h3>
                        <div className="strategy-list">
                            {strategies.map(strat => (
                                <div key={strat.id} className={`explanation-strategy-item ${selectedExplanationStrategy?.id === strat.id ? 'selected' : ''}`} onClick={() => { setSelectedExplanationStrategy(strat); callGeminiAPI(strat); }}>
                                    <div className="explanation-strategy-icon"><Brain size={24} /></div>
                                    <div className="explanation-strategy-details">
                                        <div className="explanation-strategy-name">{strat.strategyName}</div>
                                        <div className="explanation-strategy-meta">{strat.riskLevel} Risk • {strat.expectedReturn}</div>
                                    </div>
                                    <ChevronDown className="explanation-chevron" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {selectedExplanationStrategy && (
                        <div className="explanation-details glass-card">
                            <div className="explanation-details-header">
                                <h2 className="card-title">{selectedExplanationStrategy.strategyName}</h2>
                                <div className="explanation-risk-badge">{selectedExplanationStrategy.riskLevel} Risk</div>
                            </div>

                            {isExplaining && <div className="loading-explanation"><div className="spinner"></div><p>AI is analyzing your strategy...</p></div>}
                            {aiExplanation && !isExplaining && (
                                <div className="explanation-content">
                                    <div className="explanation-section-block"><h4 className="explanation-heading"><Sparkles size={20} /> Overview</h4><p className="explanation-text">{aiExplanation.overview}</p></div>
                                    <div className="explanation-section-block"><h4 className="explanation-heading"><Check size={20} /> Why This Strategy Works</h4><ul className="explanation-list">{aiExplanation.reasoning.map((reason, idx) => <li key={idx}><Check size={16} /> {reason}</li>)}</ul></div>
                                    <div className="explanation-section-block"><h4 className="explanation-heading"><TrendingUp size={20} /> Market Analysis</h4><p className="explanation-text">{aiExplanation.marketAnalysis}</p></div>
                                    <div className="explanation-section-block"><h4 className="explanation-heading"><AlertCircle size={20} /> Risk Factors</h4><ul className="explanation-list warning">{aiExplanation.riskFactors.map((risk, idx) => <li key={idx}><AlertCircle size={16} /> {risk}</li>)}</ul></div>
                                    <div className="explanation-section-block"><h4 className="explanation-heading"><Zap size={20} /> AI Recommendations</h4><ul className="explanation-list success">{aiExplanation.recommendations.map((rec, idx) => <li key={idx}><Zap size={16} /> {rec}</li>)}</ul></div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ExplanationsView;