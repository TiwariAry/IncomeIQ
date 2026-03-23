import { useState, useEffect } from 'react';
import api, { setAccessToken} from "../helper/api.js";

export const useAuth = (logActivity) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });

    useEffect(() => {
        const savedUser = localStorage.getItem('aiInvestUser');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/auth/login', {
                email: authForm.email,
                password: authForm.password
            });

            const { user: userData, accessToken } = response.data.data;

            setAccessToken(accessToken);
            localStorage.setItem('aiInvestUser', JSON.stringify(userData));

            setUser(userData);
            setIsAuthenticated(true);
            setShowAuthModal(false);
            setAuthForm({ email: '', password: '', name: '' });

            const displayName = userData.firstName || userData.email.split('@')[0];
            logActivity('auth', 'User Login', `${displayName} logged in successfully`, userData.email);

        } catch (error) {
            console.error('Login Error:', error);
            alert(error.response?.data?.message || 'Login failed.');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const nameParts = authForm.name.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

            const response = await api.post('/auth/register', {
                email: authForm.email,
                password: authForm.password,
                firstName,
                lastName
            });

            const { user: userData, accessToken } = response.data.data;

            setAccessToken(accessToken);
            localStorage.setItem('aiInvestUser', JSON.stringify(userData));

            setUser(userData);
            setIsAuthenticated(true);
            setShowAuthModal(false);
            setAuthForm({ email: '', password: '', name: '' });

            logActivity('auth', 'User Registration', `${firstName} created a new account`, userData.email);

        } catch (error) {
            console.error('Registration Error:', error);
            alert(error.response?.data?.message || 'Registration failed.');
        }
    };

    const handleLogout = async (setCurrentView) => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error(`Server logout failed with error, ${error}`);
        } finally {
            logActivity('auth', 'User Logout', `User logged out`, user?.email);
            setAccessToken(null);
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem('aiInvestUser');
            setCurrentView('generator');
        }
    };

    return {
        isAuthenticated, user,
        showAuthModal, setShowAuthModal,
        authMode, setAuthMode,
        authForm, setAuthForm,
        handleLogin, handleRegister, handleLogout
    };
};