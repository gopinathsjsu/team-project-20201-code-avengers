import React, { useState } from 'react';
import RestaurantList from './RestaurantList';
import { useNavigate } from 'react-router-dom';

function SearchRestaurants() {
    const [searchQuery, setSearchQuery] = useState('');
    const [cuisineType, setCuisineType] = useState('');
    const [priceRange, setPriceRange] = useState('');
    const [rating, setRating] = useState('');
    const [restaurants, setRestaurants] = useState([]);

    const handleSearchSubmit = async (e) => {
        e.preventDefault(); 

        // Initialize minRating and maxRating
        let minRating = '';
        let maxRating = '';

        if (rating) {
            const parsedRating = parseInt(rating, 10); 
            if (!isNaN(parsedRating)) {
                minRating = parsedRating;
                maxRating = parsedRating < 5 ? parsedRating + 0.99 : parsedRating;
            }
        }

        const queryParams = new URLSearchParams({
            name: searchQuery,
            cuisine_type: cuisineType,
            price_range: priceRange,
            min_rating: minRating || '',
            max_rating: maxRating || '',
        }).toString();

        console.log('Constructed Query Params:', queryParams); 

        try {
            const response = await fetch(`${API_URL}/restaurants/search/?${queryParams}`);
            if (!response.ok) throw new Error('Failed to fetch restaurants');
            const data = await response.json();
            setRestaurants(data);
        } catch (error) {
            console.error('Error fetching restaurants:', error);
        }
    };

    return (
        <div>
            <form onSubmit={handleSearchSubmit}>
                <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Cuisine Type"
                    value={cuisineType}
                    onChange={(e) => setCuisineType(e.target.value)}
                />
                <select onChange={(e) => setPriceRange(e.target.value)}>
                    <option value="">Price Range</option>
                    <option value="$">Low</option>
                    <option value="$$">Medium</option>
                    <option value="$$$">High</option>
                </select>
                <select value={rating} onChange={(e) => setRating(e.target.value)}>
                    <option value="">Rating</option>
                    <option value="1">1 Star (1.0 - 1.99)</option>
                    <option value="2">2 Stars (2.0 - 2.99)</option>
                    <option value="3">3 Stars (3.0 - 3.99)</option>
                    <option value="4">4 Stars (4.0 - 4.99)</option>
                    <option value="5">5 Stars (5.0 - 5.0)</option>
                </select>
                <button type="submit">Search</button>
            </form>

            {/* Display RestaurantList Component */}
            <RestaurantList restaurants={restaurants} />
        </div>
    );
}

export default SearchRestaurants;
