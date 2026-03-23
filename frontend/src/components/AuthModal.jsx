import React from 'react';
import { X, Brain, User, DollarSign, Shield, ArrowRight } from 'lucide-react';

const AuthModal = ({ setShowAuthModal, authMode, setAuthMode, authForm, setAuthForm, handleLogin, handleRegister }) => {
    return (
        <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                <button className="auth-modal-close" onClick={() => setShowAuthModal(false)}>
                    <X size={24} />
                </button>

                <div className="auth-modal-header">
                    <Brain className="auth-modal-icon" size={48} />
                    <h2>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                    <p>{authMode === 'login' ? 'Login to access AI-powered strategies' : 'Join thousands of smart investors'}</p>
                </div>

                <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="auth-form">
                    {authMode === 'register' && (
                        <div className="form-group">
                            <label className="auth-label">
                                <User size={18} />
                                Full Name
                            </label>
                            <input
                                type="text"
                                className="auth-input"
                                placeholder="Enter your full name"
                                value={authForm.name}
                                onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                                required={authMode === 'register'}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="auth-label">
                            <DollarSign size={18} />
                            Email Address
                        </label>
                        <input
                            type="email"
                            className="auth-input"
                            placeholder="your.email@example.com"
                            value={authForm.email}
                            onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="auth-label">
                            <Shield size={18} />
                            Password
                        </label>
                        <input
                            type="password"
                            className="auth-input"
                            placeholder="Enter your password"
                            value={authForm.password}
                            onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                            required
                        />
                    </div>

                    <button type="submit" className="auth-submit-btn">
                        {authMode === 'login' ? 'Login' : 'Create Account'}
                        <ArrowRight size={20} />
                    </button>
                </form>

                <div className="auth-switch">
                    {authMode === 'login' ? (
                        <p>
                            Don't have an account?{' '}
                            <button type="button" onClick={() => setAuthMode('register')} className="auth-switch-btn">
                                Register here
                            </button>
                        </p>
                    ) : (
                        <p>
                            Already have an account?{' '}
                            <button type="button" onClick={() => setAuthMode('login')} className="auth-switch-btn">
                                Login here
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;