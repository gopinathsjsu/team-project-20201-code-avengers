import axios from 'axios';

export const refreshAccessToken = async () => {
    const refreshToken = sessionStorage.getItem('refreshToken');

    if (!refreshToken) {
        alert('You are not logged in. Please log in to continue.');
        return null;
    }

    try {
        const response = await axios.post('http://127.0.0.1:8000/api/accounts/token/refresh/', {
            refresh: refreshToken,
        });

        const newAccessToken = response.data.access;

        // Update the access token in sessionStorage
        sessionStorage.setItem('accessToken', newAccessToken);

        return newAccessToken;
    } catch (err) {
        console.error('Failed to refresh access token:', err);
        alert('Session expired. Please log in again.');
        return null;
    }
};
