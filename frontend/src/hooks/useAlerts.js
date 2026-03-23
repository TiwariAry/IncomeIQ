import { useState, useEffect } from 'react';

export const useAlerts = (isAuthenticated, user, setShowAuthModal, setAuthMode, logActivity) => {
    const [alerts, setAlerts] = useState([]);
    const [alertForm, setAlertForm] = useState({ type: 'price', condition: 'above', value: '', asset: '', frequency: 'instant' });

    useEffect(() => {
        const savedAlerts = localStorage.getItem('userAlerts');
        if (savedAlerts) setAlerts(JSON.parse(savedAlerts));
    }, []);

    const requireAuth = () => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            setAuthMode('login');
            return false;
        }
        return true;
    };

    const handleAddAlert = (e) => {
        e.preventDefault();
        if (!requireAuth()) return;

        const newAlert = { id: Date.now(), ...alertForm, createdAt: new Date().toISOString(), enabled: true };
        const updatedAlerts = [...alerts, newAlert];

        setAlerts(updatedAlerts);
        localStorage.setItem('userAlerts', JSON.stringify(updatedAlerts));
        setAlertForm({ type: 'price', condition: 'above', value: '', asset: '', frequency: 'instant' });

        logActivity('alert', 'Alert Created', `New alert for ${alertForm.asset}`, user?.email);
    };

    const handleDeleteAlert = (id) => {
        const updatedAlerts = alerts.filter(alert => alert.id !== id);
        setAlerts(updatedAlerts);
        localStorage.setItem('userAlerts', JSON.stringify(updatedAlerts));
    };

    const handleToggleAlert = (id) => {
        const updatedAlerts = alerts.map(alert => alert.id === id ? { ...alert, enabled: !alert.enabled } : alert);
        setAlerts(updatedAlerts);
        localStorage.setItem('userAlerts', JSON.stringify(updatedAlerts));
    };

    return {
        alerts, alertForm, setAlertForm,
        handleAddAlert, handleToggleAlert, handleDeleteAlert
    };
};