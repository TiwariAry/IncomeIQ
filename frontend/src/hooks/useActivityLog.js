import { useState, useEffect } from 'react';

export const useActivityLog = () => {
    const [activityLog, setActivityLog] = useState([]);

    useEffect(() => {
        const savedActivity = localStorage.getItem('userActivity');
        if (savedActivity) setActivityLog(JSON.parse(savedActivity));
    }, []);

    const logActivity = (type, title, description, userEmail, data = null) => {
        const activity = {
            id: Date.now(),
            type,
            title,
            description,
            data,
            timestamp: new Date().toISOString(),
            userEmail
        };

        setActivityLog(prevLog => {
            const updatedLog = [activity, ...prevLog];
            localStorage.setItem('userActivity', JSON.stringify(updatedLog));
            return updatedLog;
        });
    };

    return { activityLog, logActivity };
};