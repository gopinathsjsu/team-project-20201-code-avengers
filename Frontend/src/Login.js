import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";
import Footer from './Footer';
import Navbar from './Navbar';

function Login() {
    // State to store the user's email input
    const [email, setEmail] = useState("");
    // State to store the user's password input
    const [password, setPassword] = useState("");
    // State to store any error message (e.g., invalid login)
    const [error, setError] = useState("");
    // State to store success message (e.g., login successful)
    const [success, setSuccess] = useState("");
    // State to indicate if the login request is in progress (e.g., for showing a loader)
    const [isLoading, setIsLoading] = useState(false);
    // Hook from React Router to navigate programmatically (e.g., redirect after login)
    const navigate = useNavigate();


    const API_URL = process.env.REACT_APP_API_URL;

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");
        setIsLoading(true);

        if (!email || !password) {
            setError("Please fill out all fields");
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${API_URL}/accounts/login/`, {
                email: email.trim(),
                password: password.trim(),
            });

            sessionStorage.setItem("accessToken", response.data.access);
            sessionStorage.setItem("refreshToken", response.data.refresh);
            sessionStorage.setItem("role", response.data.role);

            setSuccess("Login successful!");

            if (response.data.role === "user") {
                navigate("/");
            } else if (response.data.role === "owner") {
                navigate("/BusinessOwnerDashboard");
            } else if (response.data.role === "admin") {
                navigate("/AdminDashboard");
            } else {
                setError("Unknown role. Contact support.");
            }
        } catch (err) {
            if (err.response && err.response.data) {
                setError(err.response.data.error || "Invalid email or password");
            } else {
                setError("An unexpected error occurred. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
        <div className="container">
        <Navbar/>
    </div>
   
        
        <div className="login-container">
            
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                {error && <div className="error">{error}</div>}
                {success && <div className="success">{success}</div>}
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                    />
                </div>
                <button type="submit" className="login-button" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                </button>
            </form>
           
        </div>
        <div><Footer/></div>
        </>
        
    );
}

export default Login;
