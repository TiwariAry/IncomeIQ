import React, { useState } from 'react';
import { Brain, TrendingUp, BookOpen, GitCompare, Bell, BarChart3, User, Menu, X, UserCircle, Eye, LogOut } from 'lucide-react';

const Navigation = ({ currentView, setCurrentView, isAuthenticated, setShowAuthModal, setAuthMode, user, handleLogout }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const UserMenu = () => (
        <div className="user-menu-container">
            <button className="user-menu-trigger" onClick={() => setShowUserMenu(!showUserMenu)}>
                <UserCircle size={32} />
            </button>

            {showUserMenu && (
                <div className="user-menu-dropdown">
                    <div className="user-menu-header">
                        <UserCircle size={40} />
                        <div className="user-menu-info">
                            <div className="user-menu-name">{user?.name}</div>
                            <div className="user-menu-email">{user?.email}</div>
                        </div>
                    </div>
                    <div className="user-menu-divider"></div>
                    <button className="user-menu-item" onClick={() => { setCurrentView('profile'); setShowUserMenu(false); }}>
                        <User size={18} />
                        <span>Profile</span>
                    </button>
                    <button className="user-menu-item" onClick={() => { setCurrentView('activity'); setShowUserMenu(false); }}>
                        <Eye size={18} />
                        <span>Activity</span>
                    </button>
                    <div className="user-menu-divider"></div>
                    <button className="user-menu-item logout-item" onClick={() => { handleLogout(); setShowUserMenu(false); }}>
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <nav className="navigation">
            <div className="nav-container">
                <div className="nav-brand">
                    <Brain className="brand-icon" />
                    <span>AI Strategy Lab</span>
                </div>

                <div className="nav-menu desktop-menu">
                    <button className={`nav-item ${currentView === 'generator' ? 'active' : ''}`} onClick={() => setCurrentView('generator')}>
                        <TrendingUp size={18} /><span>Generator</span>
                    </button>
                    <button className={`nav-item ${currentView === 'explanations' ? 'active' : ''}`} onClick={() => setCurrentView('explanations')}>
                        <BookOpen size={18} /><span>Explanations</span>
                    </button>
                    <button className={`nav-item ${currentView === 'comparer' ? 'active' : ''}`} onClick={() => setCurrentView('comparer')}>
                        <GitCompare size={18} /><span>Compare</span>
                    </button>
                    <button className={`nav-item ${currentView === 'alerts' ? 'active' : ''}`} onClick={() => setCurrentView('alerts')}>
                        <Bell size={18} /><span>Alerts</span>
                    </button>
                    <button className={`nav-item ${currentView === 'portfolio' ? 'active' : ''}`} onClick={() => setCurrentView('portfolio')}>
                        <BarChart3 size={18} /><span>Portfolio</span>
                    </button>
                </div>

                <div className="nav-right">
                    {isAuthenticated ? (
                        <UserMenu />
                    ) : (
                        <button className="login-btn" onClick={() => { setShowAuthModal(true); setAuthMode('login'); }}>
                            <User size={20} /> Login
                        </button>
                    )}
                </div>

                <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {mobileMenuOpen && (
                <div className="mobile-menu">
                    {['generator', 'explanations', 'comparer', 'alerts', 'portfolio'].map(view => (
                        <button key={view} className={`nav-item ${currentView === view ? 'active' : ''}`} onClick={() => { setCurrentView(view); setMobileMenuOpen(false); }}>
                            <span>{view.charAt(0).toUpperCase() + view.slice(1)}</span>
                        </button>
                    ))}
                </div>
            )}
        </nav>
    );
};

export default Navigation;