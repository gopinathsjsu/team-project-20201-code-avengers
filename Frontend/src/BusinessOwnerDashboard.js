import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './BusinessOwnerDashboard.css';
import { refreshAccessToken } from './auth';
import Footer from './Footer';

function BusinessOwnerDashboard() {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [listings, setListings] = useState([]);
    const [accountInfo, setAccountInfo] = useState({ first_name: '', last_name: '', email: '' });
    const [role, setRole] = useState(null);
    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const accessToken = sessionStorage.getItem('accessToken');
        const userRole = sessionStorage.getItem('role');
        setIsAuthenticated(!!accessToken);
        setRole(userRole);

        if (accessToken) {
            fetchListings();
            fetchAccountInfo();
            
        } else {
            alert('You are not logged in. Redirecting to login.');
            navigate('/login');
        }
    }, [navigate]);

    const fetchAccountInfo = async () => {
        try {
            let accessToken = sessionStorage.getItem('accessToken');
            if (!accessToken) {
                accessToken = await refreshAccessToken();
                if (!accessToken) {
                    navigate('/login');
                    return;
                }
            }

            const response = await fetch(`${API_URL}/accounts/account-details/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setAccountInfo({
                    id: data.id,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    email: data.email,
                });
            } else {
                throw new Error(`Failed to fetch account info. Status: ${response.status}`);
            }
        } catch (err) {
            console.error('Failed to fetch account info:', err);
        }
    };

    const fetchListings = async () => {
        try {
            let accessToken = sessionStorage.getItem('accessToken');
            if (!accessToken) {
                accessToken = await refreshAccessToken();
                if (!accessToken) {
                    navigate('/login');
                    return;
                }
            }

            const response = await fetch(`${API_URL}/accounts/owner/listings/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            setListings(data);
        } catch (err) {
            console.error('Failed to fetch listings:', err);
        }
    };

    const handleLogout = () => {
        sessionStorage.clear(); // Clear session data
        setIsAuthenticated(false);
        setRole(null);
        navigate('/'); // Redirect to home page
    };

    const handleRestaurantClick = (restaurantId) => {
        navigate(`/restaurant/${restaurantId}`);
    };

    return (
        <>
        <div className="dashboard-container container-fluid p-4">
            {!isAuthenticated ? (
                <div className="text-center">
                    <h3>Please Log In</h3>
                    <button onClick={() => navigate('/login')} className="btn btn-primary">Log In as Business Owner</button>
                </div>
            ) : (
                <>
                    <header className="index-header">
                        <nav className="navbar">
                            <div className="logo" onClick={() => navigate('/')}>🍽️ Restaurant Finder</div>
                            <div className="nav-links">
                                <button onClick={() => navigate('/')} className="nav-item">Home</button>
                                {role === 'user' && (
                                    <button onClick={() => navigate('/profile')} className="nav-item">My Profile</button>
                                )}
                                {role === 'owner' && (
                                    <button onClick={() => navigate('/BusinessOwnerDashboard')} className="nav-item">Business Owner</button>
                                )}
                                {role === 'admin' && (
                                    <button onClick={() => navigate('/AdminDashboard')} className="nav-item">Admin</button>
                                )}
                                {/* <button onClick={() => navigate('/about')} className="nav-item">About Us</button> */}
                                {isAuthenticated ? (
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

                    <div className="dashboard-header text-center mb-4">
                        <h2>Welcome, {accountInfo.first_name} {accountInfo.last_name}</h2>
                        <p className="text-muted">Email: {accountInfo.email}</p>
                    </div>

                    <div className="actions-section row mb-5">
                        <div className="col-md-4">
                            <div className="action-card" onClick={() => navigate('/AddListing')}>
                                <span role="img" aria-label="add">🏢</span>
                                <h5>Add Listing</h5>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="action-card" onClick={() => navigate('/manage-listings')}>
                                <span role="img" aria-label="view">📋</span>
                                <h5>Manage/Edit Your Listings</h5>
                            </div>
                        </div>
                    </div>

                    <div className="listings-section">
                        <h4 className="text-center mb-4">Your Listings</h4>
                        {listings.length > 0 ? (
                            <div className="row listing-cards">
                                {listings.map((listing, index) => (
                                    <div key={index} className="col-md-4 mb-4">
                                        <div
                                            className="card listing-card h-100 d-flex flex-column"
                                            onClick={() => handleRestaurantClick(listing.id)}
                                        >
                                            <div className="card-body">
                                                <h5 className="card-title">{listing.name}</h5>
                                                <p className="card-text">
                                                    {listing.description || 'No description available.'}
                                                </p>
                                                <p>
                                                    <strong>Address:</strong> {listing.address || 'No address provided.'}
                                                </p>
                                                <p>
                                                    <strong>Contact:</strong> {listing.phone_number || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="card-footer mt-auto">
                                                <p>
                                                    <strong>Rating:</strong>{' '}
                                                    {Number(listing.rating).toFixed(2) || 'No ratings yet'}
                                                </p>
                                                <p>
                                                    <strong>Reviews:</strong> {listing.review_count || 0}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted">No listings found.</p>
                        )}
                    </div>
                </>
            )}
            
        </div>
        <div>
        {/* Main Content */}
        <Footer />
    </div>
    </>
    );
}

export default BusinessOwnerDashboard;
