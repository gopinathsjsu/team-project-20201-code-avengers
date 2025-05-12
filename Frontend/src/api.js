    import axios from 'axios';
    import { refreshAccessToken } from './auth';
    const API_URL = process.env.REACT_APP_API_URL;
    
    const api = axios.create({
        baseURL: API_URL,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Add a request interceptor
    api.interceptors.request.use(
        async (config) => {
            let accessToken = sessionStorage.getItem('accessToken');

            // Check if access token is expired
            if (!accessToken || isTokenExpired(accessToken)) {
                accessToken = await refreshAccessToken();
            }

            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            }

            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Check if token is expired
    const isTokenExpired = (token) => {
        try {
            const [, payload] = token.split('.');
            const decoded = JSON.parse(atob(payload));
            return decoded.exp * 1000 < Date.now();
        } catch (error) {
            console.error('Failed to parse token:', error);
            return true;
        }
    };

    export const getGooglePlaceDetails = async (placeId) => {
        try {
            const response = await axios.get(`${API_URL}/restaurants/google_place/${placeId}/`);
            
            if (response.status !== 200) {
                throw new Error("Failed to fetch Google Place details.");
            }

            // Check the full response data to see if price_level exists
            console.log('Full Google Place Details Response:', response.data);
            
            return response.data;
        } catch (error) {
            console.error("Error fetching Google Place details:", error);
            throw error;
        }
    };


    export default api;
