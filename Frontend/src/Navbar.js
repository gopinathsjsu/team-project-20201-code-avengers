import React from 'react';
import { useNavigate } from 'react-router-dom';
import './navbar.css'; // Create a separate CSS file for Navbar if needed

function Navbar() {
    const navigate = useNavigate();

    // Get login status and role
    const isLoggedIn = !!sessionStorage.getItem("accessToken");
    const role = sessionStorage.getItem("role");

    const handleLogout = () => {
        sessionStorage.clear(); // Clear session data
        navigate("/"); // Redirect to the home page
    };

    return (
     
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
      
    );
}

export default Navbar;
