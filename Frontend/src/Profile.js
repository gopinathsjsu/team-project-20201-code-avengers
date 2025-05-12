import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import "./Profile.css";

const Profile = () => {
    const [bookings, setBookings] = useState([]);
    const [bookingError, setBookingError] = useState('');
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const API_URL = process.env.REACT_APP_API_URL;
    const role = sessionStorage.getItem("role");
    const isLoggedIn = !!sessionStorage.getItem("accessToken");

    useEffect(() => {
        // Fetch user data when component mounts
        const fetchUserProfile = async () => {
            try {
                const token = sessionStorage.getItem("accessToken");
                if (!token) {
                    throw new Error("No access token found. Please log in.");
                }

                const response = await fetch(`${API_URL}/accounts/account-details/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch user data.");
                }

                const data = await response.json();
                setUser(data);
            } catch (error) {
                console.error("Error fetching user profile:", error);
                setErrorMessage(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();

        const fetchUserBookings = async () => {
            try {
                const token = sessionStorage.getItem("accessToken");
                if (!token) throw new Error("Not logged in");
        
                const res = await fetch(`${API_URL}/restaurants/bookings/my/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
        
                if (!res.ok) throw new Error("Failed to fetch bookings.");
                const data = await res.json();
                setBookings(data);
            } catch (err) {
                console.error("Error fetching bookings:", err);
                setBookingError(err.message);
            }
        };
        fetchUserBookings();
        
        
        
    }, []);

    const handleLogout = () => {
        // Clear session storage and redirect to login page
        sessionStorage.clear();
        navigate('/login');
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (errorMessage) {
        return <div>Error: {errorMessage}</div>;
    }

    const cancelBooking = async (bookingId) => {
        try {
            const token = sessionStorage.getItem("accessToken");
            const res = await fetch(`${API_URL}/restaurants/bookings/cancel/${bookingId}/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) throw new Error("Cancel failed");
    
            // Re-fetch bookings after cancellation
            const updated = await fetch(`${API_URL}/restaurants/bookings/my/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!updated.ok) throw new Error("Failed to refresh bookings");
            const data = await updated.json();
            setBookings(data);
        } catch (err) {
            console.error("Cancel error:", err);
            setBookingError("Could not cancel booking.");
        }
    };
    
    return (
        <div className="profile-container">
            {/* Navbar Section */}
            <header className="profile-header">
                <nav className="navbar">
                    <div className="logo" onClick={() => navigate('/')}>🍽️ Restaurant Finder</div>
                    <div className="nav-links">
                        <button onClick={() => navigate('/')} className="nav-item">Home</button>

                        {/* Conditionally render based on user role */}
                        {role === "user" && (
                            <button onClick={() => navigate('/profile')} className="nav-item">My Profile</button>
                        )}
                        {role === "owner" && (
                            <button onClick={() => navigate('/BusinessOwnerDashboard')} className="nav-item">Business Owner Dashboard</button>
                        )}
                        {role === "admin" && (
                            <button onClick={() => navigate('/AdminDashboard')} className="nav-item">Admin Dashboard</button>
                        )}

                        {/* <button onClick={() => navigate('/about')} className="nav-item">About Us</button> */}

                        {/* Show login/register or logout button based on login status */}
                        {!isLoggedIn ? (
                            <>
                                <button onClick={() => navigate('/login')} className="login-btn">Login</button>
                                <button onClick={() => navigate('/register')} className="login-btn">Register</button>
                            </>
                        ) : (
                            <button onClick={handleLogout} className="login-btn">Logout</button>
                        )}
                    </div>
                </nav>
            </header>

            {/* Profile Details Section */}
            <h1>My Profile</h1>
            {user && (
                <div className="profile-details">
                    <p><strong>Name:</strong> {user.first_name} {user.last_name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Joined on:</strong> {new Date(user.date_joined).toLocaleDateString()}</p>
                    <h2>My Bookings</h2>
                        {bookingError && <p style={{ color: "red" }}>{bookingError}</p>}

                        {bookings.length === 0 ? (
                            <p>No active bookings.</p>
                        ) : (
                            <ul className="booking-list">
                                {bookings.map((b) => (
                                    <li key={b.id} style={{ marginBottom: "15px", borderBottom: "1px solid #ccc" }}>
                                        <p><strong>Restaurant:</strong> {b.restaurant_name}</p>
                                        <p><strong>Date:</strong> {b.date}</p>
                                        <p><strong>Time:</strong> {b.time}</p>
                                        <p><strong>People:</strong> {b.num_people}</p>
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => cancelBooking(b.id)}
                                        >
                                            Cancel Booking
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                    <button onClick={() => navigate('/profile/edit')} className="btn btn-primary">
                        Edit Profile
                    </button>
                    <button onClick={handleLogout} className="btn btn-secondary">
                        Log Out
                    </button>
                </div>
            )}
            <div>
                {/* Main Content */}
                <Footer />
            </div>
        </div>
    );
};

export default Profile;