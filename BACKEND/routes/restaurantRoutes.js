const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');

// Search restaurants
router.get('/search', restaurantController.searchRestaurants);

// Get restaurant details
router.get('/:id', restaurantController.getRestaurantDetails);

module.exports = router; 