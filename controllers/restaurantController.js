const Restaurant = require('../models/Restaurant');
const Reservation = require('../models/Reservation');

// Utility function to check if a restaurant has availability
const checkAvailability = async (restaurantId, date, time, people) => {
  // Parse the requested time
  const [hours, minutes] = time.split(':').map(Number);
  const requestedTime = new Date(date);
  requestedTime.setHours(hours, minutes, 0, 0);
  
  // Define time window (±30 minutes)
  const startTime = new Date(requestedTime);
  startTime.setMinutes(startTime.getMinutes() - 30);
  
  const endTime = new Date(requestedTime);
  endTime.setMinutes(endTime.getMinutes() + 30);
  
  // Get restaurant details to check tables
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return false;
  
  // Calculate total capacity for party size
  const suitableTables = restaurant.tables.filter(table => table.capacity >= people);
  const totalTablesAvailable = suitableTables.reduce((sum, table) => sum + table.quantity, 0);
  
  // Get existing reservations for the time window
  const existingReservations = await Reservation.find({
    restaurant: restaurantId,
    date: { $gte: startTime, $lte: endTime },
    status: 'confirmed'
  });
  
  // Simple availability check (can be made more sophisticated)
  return existingReservations.length < totalTablesAvailable;
};

// Search restaurants by date, time, people, and location
exports.searchRestaurants = async (req, res) => {
  try {
    const { date, time, people, location } = req.query;
    
    if (!date || !time || !people) {
      return res.status(400).json({ 
        success: false, 
        message: 'Date, time and number of people are required' 
      });
    }
    
    // Query restaurants based on location (city/state or zip)
    let locationQuery = {};
    
    if (location) {
      // Check if location is a zip code (usually 5 digits in US)
      if (/^\d{5}$/.test(location)) {
        locationQuery = { 'address.zipCode': location };
      } else {
        // Assume city/state format like "San Francisco, CA"
        const [city, state] = location.split(',').map(part => part.trim());
        if (city) locationQuery['address.city'] = new RegExp(city, 'i');
        if (state) locationQuery['address.state'] = new RegExp(state, 'i');
      }
    }
    
    // Find approved restaurants matching the location criteria
    const restaurants = await Restaurant.find({
      ...locationQuery,
      approved: true
    });
    
    // Check availability for each restaurant
    const availableRestaurants = [];
    
    for (const restaurant of restaurants) {
      const isAvailable = await checkAvailability(
        restaurant._id, 
        date, 
        time, 
        parseInt(people)
      );
      
      if (isAvailable) {
        // Generate available time slots (±30 minutes)
        const [hours, minutes] = time.split(':').map(Number);
        const requestedTime = new Date();
        requestedTime.setHours(hours, minutes, 0, 0);
        
        const timeSlots = [];
        for (let i = -30; i <= 30; i += 15) {
          const slotTime = new Date(requestedTime);
          slotTime.setMinutes(slotTime.getMinutes() + i);
          timeSlots.push(
            slotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          );
        }
        
        availableRestaurants.push({
          _id: restaurant._id,
          name: restaurant.name,
          cuisine: restaurant.cuisine,
          costRating: restaurant.costRating,
          averageRating: restaurant.averageRating,
          totalReviews: restaurant.totalReviews,
          bookingsToday: restaurant.bookingsToday,
          address: restaurant.address,
          photos: restaurant.photos.slice(0, 1), // Just send the first photo
          availableTimeSlots: timeSlots
        });
      }
    }
    
    res.status(200).json({
      success: true,
      count: availableRestaurants.length,
      data: availableRestaurants
    });
    
  } catch (error) {
    console.error('Search restaurants error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get restaurant details
exports.getRestaurantDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const restaurant = await Restaurant.findById(id);
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: restaurant
    });
    
  } catch (error) {
    console.error('Get restaurant details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 