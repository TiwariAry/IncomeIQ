import React, { useState } from 'react';
import './App.css';

// Components & Views
import Navigation from './components/Navigation';
import AuthModal from './components/AuthModal';
import GeneratorView from './views/GeneratorView';
import ResultsView from './views/ResultsView';
import ExplanationsView from './views/ExplanationsView';
import ComparerView from './views/ComparerView';
import AlertsView from './views/AlertsView';
import ProfileView from './views/ProfileView';
import ActivityView from './views/ActivityView';
import PortfolioView from './views/PortfolioView';

// Custom Hooks (Our Logic Separators)
import { useActivityLog } from './hooks/useActivityLog';
import { useAuth } from './hooks/useAuth';
import { useAlerts } from './hooks/useAlerts';
import { useStrategies } from './hooks/useStrategies';
import { usePortfolio } from './hooks/usePortfolio';

const InvestmentStrategyGenerator = () => {
    // Global View State
    const [currentView, setCurrentView] = useState('generator');

    const goals = ['Short-term Gain', 'Long-term Growth', 'Passive Income', 'Capital Preservation', 'Aggressive Growth', 'Balanced Portfolio'];
    const markets = ['Stocks', 'Mutual Funds', 'F&O', 'Crypto', 'Bonds', 'ETFs', 'Commodities'];

    // 1. Initialize Activity Logger
    const { activityLog, logActivity } = useActivityLog();

    // 2. Initialize Auth Engine
    const {
        isAuthenticated, user,
        showAuthModal, setShowAuthModal,
        authMode, setAuthMode,
        authForm, setAuthForm,
        handleLogin, handleRegister, handleLogout
    } = useAuth(logActivity);

    // 3. Initialize Alerts Engine
    const {
        alerts, alertForm, setAlertForm,
        handleAddAlert, handleToggleAlert, handleDeleteAlert
    } = useAlerts(isAuthenticated, user, setShowAuthModal, setAuthMode, logActivity);

    // 4. Initialize Strategies Engine
    const {
        strategies, selectedStrategies, handleStrategySelect,
        formData, handleInputChange, handleMarketToggle,
        strategy, isGenerating, generateStrategy,
        aiExplanation, isExplaining, callGeminiAPI,
        comparisonVerdict, isComparing, runComparison
    } = useStrategies(isAuthenticated, user, setShowAuthModal, setAuthMode, logActivity, setCurrentView);

    // 5. Initialize Live Portfolio Engine
    const { livePortfolios, isLoadingPortfolio } = usePortfolio(isAuthenticated, currentView);

    return (
        <div className="main-app">
            <Navigation currentView={currentView} setCurrentView={setCurrentView} isAuthenticated={isAuthenticated} setShowAuthModal={setShowAuthModal} setAuthMode={setAuthMode} user={user} handleLogout={() => handleLogout(setCurrentView)} />

            <div className="main-content">
                {currentView === 'generator' && <GeneratorView formData={formData} handleInputChange={handleInputChange} goals={goals} markets={markets} handleMarketToggle={handleMarketToggle} generateStrategy={generateStrategy} isGenerating={isGenerating} isAuthenticated={isAuthenticated} setShowAuthModal={setShowAuthModal} />}
                {currentView === 'results' && <ResultsView strategy={strategy} setCurrentView={setCurrentView} aiExplanation={aiExplanation} isExplaining={isExplaining} callGeminiAPI={callGeminiAPI} />}
                {currentView === 'explanations' && <ExplanationsView strategies={strategies} setCurrentView={setCurrentView} callGeminiAPI={callGeminiAPI} isExplaining={isExplaining} aiExplanation={aiExplanation} />}
                {currentView === 'comparer' && <ComparerView strategies={strategies} setCurrentView={setCurrentView} selectedStrategies={selectedStrategies} handleStrategySelect={handleStrategySelect} runComparison={runComparison} comparisonVerdict={comparisonVerdict} isComparing={isComparing} />}                {currentView === 'alerts' && <AlertsView user={user} alerts={alerts} alertForm={alertForm} setAlertForm={setAlertForm} handleAddAlert={handleAddAlert} handleToggleAlert={handleToggleAlert} handleDeleteAlert={handleDeleteAlert} />}
                {currentView === 'profile' && <ProfileView user={user} alerts={alerts} strategies={strategies} activityLog={activityLog} />}
                {currentView === 'activity' && <ActivityView activityLog={activityLog} />}
                {currentView === 'portfolio' && <PortfolioView strategies={strategies} livePortfolios={livePortfolios} isLoadingPortfolio={isLoadingPortfolio} alerts={alerts} setCurrentView={setCurrentView} />}
            </div>

            {showAuthModal && <AuthModal setShowAuthModal={setShowAuthModal} authMode={authMode} setAuthMode={setAuthMode} authForm={authForm} setAuthForm={setAuthForm} handleLogin={handleLogin} handleRegister={handleRegister} />}
        </div>
    );
};

export default InvestmentStrategyGenerator;