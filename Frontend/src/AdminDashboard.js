import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AdminDashboard.css';
import { useNavigate } from 'react-router-dom';
import { refreshAccessToken } from './auth';
import Footer from './Footer';

function AdminDashboard() {

    
    const [view, setView] = useState(''); // State to track current view
    const [allListings, setAllListings] = useState([]);
    // State to store listings that are identified as duplicates
    const [duplicateListings, setDuplicateListings] = useState([]);
    // State to store restaurants that are pending approval or review
    const [pendingRestaurants, setPendingRestaurants] = useState([]);
    // State to store analytics data related to reservations (e.g., counts, trends)
    const [reservationAnalytics, setReservationAnalytics] = useState([]); // New state for reservation analytics
    const [isLoading, setIsLoading] = useState(false); 
    const [error, setError] = useState(null);
    const [role, setRole] = useState(null); // Role state
    // State to store loggedin status .
    const [isLoggedIn, setIsLoggedIn] = useState(false); // Login status
    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_API_URL;

    // Fetch user role and login status
    useEffect(() => {
        const accessToken = sessionStorage.getItem('accessToken');
        const userRole = sessionStorage.getItem('role');
        setRole(userRole);
        setIsLoggedIn(!!accessToken);

        if (!accessToken || userRole !== 'admin') {
            alert('You are not authorized to access this page.');
            navigate('/login'); // Redirect if not logged in as admin
        }
    }, [navigate]);

    // Fetch all listings
    const fetchAllListings = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/restaurants/`);
            if (!response.ok) throw new Error('Failed to fetch listings');
            const data = await response.json();
            setAllListings(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPendingRestaurants = async () => {
        const accessToken = sessionStorage.getItem('accessToken');
        setIsLoading(true);
        setError(null);

        // token refresh
        if (!accessToken) {
            const newToken = await refreshAccessToken();
            if (!newToken) return; 
            accessToken = newToken;
        }

        try {
            console.log('Access Token:', accessToken);
            const response = await fetch(`${API_URL}/admin/pending-restaurants/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) throw new Error('Failed to fetch pending restaurants');
            const data = await response.json();
            setPendingRestaurants(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // New function to fetch reservation analytics
    const fetchReservationAnalytics = async () => {
        const accessToken = sessionStorage.getItem('accessToken');
        setIsLoading(true);
        setError(null);

        // Token refresh
        if (!accessToken) {
            const newToken = await refreshAccessToken();
            if (!newToken) return;
            accessToken = newToken;
        }

        try {
            const response = await fetch(`${API_URL}/admin/reservation-analytics/month/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) throw new Error('Failed to fetch reservation analytics');
            const data = await response.json();
            setReservationAnalytics(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch duplicate listings
    const fetchDuplicateListings = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/admin/duplicates/`);
            if (!response.ok) throw new Error('Failed to fetch duplicate listings');
            const data = await response.json();
            setDuplicateListings(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Group duplicate listings by shared attributes
    const groupDuplicates = (listings) => {
        const groups = {};
        listings.forEach((listing) => {
            const key = `${listing.name.toLowerCase().trim()}-${listing.address.toLowerCase().trim()}-${listing.city.toLowerCase().trim()}-${listing.state.toLowerCase().trim()}-${listing.zip_code}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(listing);
        });
        return groups;
    };

    const groupedDuplicates = groupDuplicates(duplicateListings);

    const handleDeleteListing = async (id) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this listing? This action cannot be undone.');
        if (!confirmDelete) return;

        const accessToken = sessionStorage.getItem('accessToken');
        if (!accessToken) {
            alert('You must be logged in to perform this action.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/admin/delete-listing/${id}/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!response.ok) throw new Error('Failed to delete the listing');
            alert('Listing deleted successfully.');
            setAllListings((prev) => prev.filter((listing) => listing.id !== id));
            setDuplicateListings((prev) => prev.filter((listing) => listing.id !== id));
        } catch (err) {
            console.error('Error deleting listing:', err);
            alert('Failed to delete listing. Please try again.');
        }
    };

    const handleApproveRestaurant = async (id) => {
        const confirmApprove = window.confirm('Are you sure you want to approve this restaurant? It will be publicly visible after approval.');
        if (!confirmApprove) return;

        const accessToken = sessionStorage.getItem('accessToken');
        if (!accessToken) {
            alert('You must be logged in to perform this action.');
            return;
        }
        console.log('Access Token:', accessToken);

        try {
            const response = await fetch(`${API_URL}/admin/approve-restaurant/${id}/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) throw new Error('Failed to approve the restaurant');
            alert('Restaurant approved successfully.');
            setPendingRestaurants((prev) => prev.filter((restaurant) => restaurant.id !== id));
        } catch (err) {
            console.error('Error approving restaurant:', err);
            alert('Failed to approve restaurant. Please try again.');
        }
    };
    
    const handleRejectRestaurant = async (id) => {
        const confirmReject = window.confirm('Are you sure you want to reject this restaurant? This action cannot be undone.');
        if (!confirmReject) return;

        const accessToken = sessionStorage.getItem('accessToken');
        if (!accessToken) {
            alert('You must be logged in to perform this action.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/admin/reject-restaurant/${id}/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!response.ok) throw new Error('Failed to reject the restaurant');
            alert('Restaurant rejected successfully.');
            setPendingRestaurants((prev) => prev.filter((restaurant) => restaurant.id !== id));
        } catch (err) {
            console.error('Error rejecting restaurant:', err);
            alert('Failed to reject restaurant. Please try again.');
        }
    };

    useEffect(() => {
        if (view === 'manage') fetchAllListings();
        if (view === 'duplicates') fetchDuplicateListings();
        if (view === 'approve-restaurants') fetchPendingRestaurants();
        if (view === 'analytics') fetchReservationAnalytics(); // Added for analytics view
    }, [view]);

    const handleLogout = () => {
        sessionStorage.clear(); // Clear session data
        navigate('/'); // Redirect to the home page
    };

    return (
        <div className="container admin-dashboard">
            <header className="index-header">
                <nav className="navbar">
                    <div className="logo" onClick={() => navigate('/')}>🍽️ Restaurant Finder</div>
                    <div className="nav-links">
                        <button onClick={() => navigate('/')} className="nav-item">Home</button>
                        {role === 'user' && (
                            <button onClick={() => navigate('/profile')} className="nav-item">My Profile</button>
                        )}
                        {role === 'owner' && (
                            <button onClick={() => navigate('/BusinessOwnerDashboard')} className="nav-item">Business Owner Dashboard</button>
                        )}
                        {role === 'admin' && (
                            <button onClick={() => navigate('/AdminDashboard')} className="nav-item">Admin Dashboard</button>
                        )}
                        <button onClick={() => navigate('/about')} className="nav-item">About Us</button>
                        {isLoggedIn ? (
                            <button onClick={handleLogout} className="login-btn">Logout</button>
                        ) : (
                            <>
                                <button onClick={() => navigate('/login')} className="login-btn">Login</button>
                                <button onClick={() => navigate('/register')} className="login-btn">Register</button>
                            </>
                        )}
                    </div>
                </nav>
            </header>
            <h2 className="text-center mt-4 mb-4">Admin Dashboard</h2>

            <div className="card mb-4 p-4 shadow">
                <h3>Admin Actions</h3>
                <div className="d-flex flex-column flex-md-row justify-content-around mt-3">
                    <div className='mb-12'>
                    <button 
                        onClick={() => setView('manage')}
                        className={`btn btn-primary admin-option mb-3 ${view === 'manage' ? 'active' : ''}`}
                    >
                      
                        ⚙️ Manage Listings
                    </button> 
                    </div>
                    <div className='mb-12'>
                    <button
                        onClick={() => setView('duplicates')}
                        className={`btn btn-warning admin-option mb-3 ${view === 'duplicates' ? 'active' : ''}`}
                    >
                        🔍 Check Duplicate Listings
                    </button> 
                    </div>
                    <div className='mb-12'>
                    <button
                        onClick={() => setView('approve-restaurants')}
                        className={`btn btn-info admin-option mb-3 ${view === 'approve-restaurants' ? 'active' : ''}`}
                    >
                        ✅ Approve New Restaurants
                    </button> 
                    </div>
                    <div className='mb-12'>
                    <button
                        onClick={() => setView('analytics')}
                        className={`btn btn-success admin-option mb-3 ${view === 'analytics' ? 'active' : ''}`}
                    >
                        📊 View Analytics Dashboard
                    </button> 
                    </div>
                </div>
            </div>

            {view === 'manage' && (
                <div className="card p-4 shadow">
                    <h3>Manage Listings</h3>
                    {isLoading ? (
                        <p>Loading listings...</p>
                    ) : error ? (
                        <p className="text-danger">{error}</p>
                    ) : allListings.length > 0 ? (
                        <ul className="list-group">
                            {allListings.map((listing) => (
                                <li key={listing.id} className="list-group-item d-flex justify-content-between align-items-center">
                                    <span>
                                        <strong>{listing.name}</strong> - {listing.address}
                                    </span>
                                    <button
                                        className="btn btn-danger"
                                        onClick={() => handleDeleteListing(listing.id)}
                                    >
                                        🗑️ Delete Listing
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No listings found.</p>
                    )}
                </div>
            )}

            {view === 'duplicates' && (
                <div className="card p-4 shadow">
                    <h3>Duplicate Listings</h3>
                    {isLoading ? (
                        <p>Loading duplicate listings...</p>
                    ) : error ? (
                        <p className="text-danger">{error}</p>
                    ) : Object.keys(groupedDuplicates).length > 0 ? (
                        <div>
                            {Object.entries(groupedDuplicates).map(([key, duplicates], index) => (
                                <div key={index} className="mb-4">
                                    <h5 className="text-warning">Duplicate Group {index + 1}</h5>
                                    <div className="table-responsive">
                                        <table className="table table-bordered">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Address</th>
                                                    <th>Website</th>
                                                    <th>Review Count</th>
                                                    <th>Rating</th>
                                                    <th>Last Updated</th>
                                                    <th>Phone Number</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                            {duplicates.map((listing) => (
                                                <tr key={listing.id}>
                                                    <td>{listing.name}</td>
                                                    <td>
                                                        {listing.address}, {listing.city}, {listing.state} {listing.zip_code}
                                                    </td>
                                                    <td>
                                                        {listing.website ? (
                                                            <a
                                                                href={listing.website}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                Visit
                                                            </a>
                                                        ) : (
                                                            'N/A'
                                                        )}
                                                    </td>
                                                    <td>{listing.review_count || 0}</td>
                                                    <td>{listing.rating || 'N/A'}</td>
                                                    <td>{listing.last_updated || 'Not Available'}</td>
                                                    <td>{listing.phone_number || 'N/A'}</td>
                                                    <td>
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => handleDeleteListing(listing.id)}
                                                        >
                                                            🗑️ Delete Listing
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No duplicate listings found.</p>
                    )}
                </div>
            )}


            {view === 'approve-restaurants' && (
                <div className="card p-4 shadow">
                    <h3>Approve New Restaurants</h3>
                    {isLoading ? (
                        <p>Loading pending restaurants...</p>
                    ) : error ? (
                        <p className="text-danger">{error}</p>
                    ) : pendingRestaurants.length > 0 ? (
                        <div>
                            <div className="alert alert-info mb-4">
                                <i className="fas fa-info-circle mr-2"></i>
                                Review and approve new restaurant submissions to be included in the platform.
                            </div>
                            <table className="table table-hover shadow-sm mt-4">
                                <thead className="thead-light">
                                    <tr>
                                        <th>Name</th>
                                        <th>Address</th>
                                        <th>Submission Date</th>
                                        <th>Submitted By</th>
                                        <th>Contact Info</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingRestaurants.map((restaurant) => (
                                        <tr key={restaurant.id}>
                                            <td>{restaurant.name}</td>
                                            <td>
                                                {restaurant.address}, {restaurant.city}, {restaurant.state} {restaurant.zip_code}
                                            </td>
                                            <td>{restaurant.submission_date || 'Not Available'}</td>
                                            <td>{restaurant.submitted_by || 'Anonymous'}</td>
                                            <td>{restaurant.contact_info || 'N/A'}</td>
                                            <td>
                                                <div className="d-flex">
                                                    <button
                                                        className="btn btn-success btn-sm mr-2"
                                                        onClick={() => handleApproveRestaurant(restaurant.id)}
                                                    >
                                                        ✅ Approve
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleRejectRestaurant(restaurant.id)}
                                                    >
                                                        ❌ Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p>No pending restaurants to approve.</p>
                    )}
                </div>
            )}

            {/* New analytics view */}
            {view === 'analytics' && (
                <div className="card p-4 shadow">
                    <h3>Reservation Analytics for the Last Month</h3>
                    {isLoading ? (
                        <p>Loading reservation analytics...</p>
                    ) : error ? (
                        <p className="text-danger">{error}</p>
                    ) : reservationAnalytics.length > 0 ? (
                        <div>
                            <div className="row mb-4">
                                <div className="col-md-4">
                                    <div className="card bg-primary text-white p-3">
                                        <h5>Total Reservations</h5>
                                        <h2>{reservationAnalytics.reduce((total, item) => total + item.reservation_count, 0)}</h2>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="card bg-success text-white p-3">
                                        <h5>Average Party Size</h5>
                                        <h2>
                                            {(reservationAnalytics.reduce((total, item) => total + item.avg_party_size, 0) / reservationAnalytics.length).toFixed(1)}
                                        </h2>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="card bg-info text-white p-3">
                                        <h5>Most Popular Day</h5>
                                        <h2>
                                            {reservationAnalytics.sort((a, b) => b.reservation_count - a.reservation_count)[0]?.day_of_week || 'N/A'}
                                        </h2>
                                    </div>
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="table table-hover shadow-sm">
                                    <thead className="thead-light">
                                        <tr>
                                            <th>Restaurant</th>
                                            <th>Reservations</th>
                                            <th>Avg. Party Size</th>
                                            <th>Popular Time</th>
                                            <th>Popular Day</th>
                                            <th>Cancellation Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reservationAnalytics.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.restaurant_name}</td>
                                                <td>{item.reservation_count}</td>
                                                <td>{item.avg_party_size.toFixed(1)}</td>
                                                <td>{item.popular_time}</td>
                                                <td>{item.day_of_week}</td>
                                                <td>{(item.cancellation_rate * 100).toFixed(1)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-4">
                                <h4>Insights</h4>
                                <ul className="list-group">
                                    {reservationAnalytics.filter(item => item.cancellation_rate > 0.2).length > 0 && (
                                        <li className="list-group-item list-group-item-warning">
                                            <strong>High Cancellation Alert:</strong> {reservationAnalytics.filter(item => item.cancellation_rate > 0.2).length} restaurants have cancellation rates above 20%.
                                        </li>
                                    )}
                                    <li className="list-group-item">
                                        <strong>Peak Time:</strong> Most reservations occur between {
                                            (() => {
                                                const times = reservationAnalytics.map(item => item.popular_time);
                                                const modeTime = times.sort((a, b) => 
                                                    times.filter(v => v === a).length - times.filter(v => v === b).length
                                                ).pop();
                                                return modeTime;
                                            })()
                                        }
                                    </li>
                                    <li className="list-group-item">
                                        <strong>Restaurant of the Month:</strong> {
                                            reservationAnalytics.sort((a, b) => b.reservation_count - a.reservation_count)[0]?.restaurant_name
                                        } with {
                                            reservationAnalytics.sort((a, b) => b.reservation_count - a.reservation_count)[0]?.reservation_count
                                        } reservations.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <p>No reservation data available for the last month.</p>
                    )}
                </div>
            )}

            {!view && (
                <div className="text-center mt-4">
                    <p>Select an action above to get started.</p>
                </div>
            )}
            <div>
                {/* Main Content */}
                <Footer />
            </div>
        </div>
    );
}

export default AdminDashboard;
