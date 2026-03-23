import { useState, useEffect } from 'react';
import api from '../helper/api.js'

export const usePortfolio = (isAuthenticated, currentView) => {
    const [livePortfolios, setLivePortfolios] = useState([]);
    const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);

    useEffect(() => {
        const fetchPortfolioData = async () => {
            // Only fetch when the user actually navigates to the Portfolio tab
            if (isAuthenticated && currentView === 'portfolio') {
                setIsLoadingPortfolio(true);
                try {
                    const response = await api.get('/portfolio');
                    // Your backend returns an array of portfolios
                    setLivePortfolios(response.data.data || []);
                } catch (error) {
                    console.error("Failed to fetch live portfolio data:", error);
                } finally {
                    setIsLoadingPortfolio(false);
                }
            }
        };

        fetchPortfolioData();
    }, [isAuthenticated, currentView]);

    return { livePortfolios, isLoadingPortfolio };
};