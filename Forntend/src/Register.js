import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Register.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

function Register() {
    const [isBusinessOwner, setIsBusinessOwner] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        businessName: '',
        address: '',
        contact: ''
    });
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_API_URL;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const toggleRegistrationType = () => {
        setIsBusinessOwner(!isBusinessOwner);
        setFormData({
            firstName: '',
            lastName: '',
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            businessName: '',
            address: '',
            contact: ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check if passwords match
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            console.log('API URL is:', API_URL);
            const response = await axios.post(`${API_URL}/accounts/register/`, {
                
                first_name: formData.firstName.trim(),
                last_name: formData.lastName.trim(),
                username: formData.username.trim(),
                email: formData.email.trim(),
                password: formData.password.trim(),
                confirm_password: formData.confirmPassword.trim(),
                role: isBusinessOwner ? 'owner' : 'user',
                business_name: isBusinessOwner ? formData.businessName.trim() : undefined,
                address: isBusinessOwner ? formData.address.trim() : undefined,
                contact: isBusinessOwner ? formData.contact.trim() : undefined,
            });
            alert(response.data.message || "Registration successful! Please log in.");
            navigate('/login');
        } catch (error) {
            if (error.response) {
                alert("Error: " + JSON.stringify(error.response.data));
            } else {
                alert("An unexpected error occurred.");
            }
        }
    };

    return (
        <>
        <div className="container ">
        <Navbar/>
    </div>
   
        <div className="container register-container d-flex justify-content-center align-items-center mt-5">
            <div className="card p-4 shadow-lg register-card">
                <h2 className="text-center mb-4">Register as {isBusinessOwner ? "Business Owner" : "User"}</h2>

                <button className="btn btn-outline-primary toggle-btn mb-3" onClick={toggleRegistrationType}>
                    Switch to {isBusinessOwner ? "User" : "Business Owner"} Registration
                </button>

                <form onSubmit={handleSubmit}>
                    {/* Shared Fields */}
                    <div className="form-group mb-3">
                        <label>First Name</label>
                        <input
                            type="text"
                            className="form-control"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group mb-3">
                        <label>Last Name</label>
                        <input
                            type="text"
                            className="form-control"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group mb-3">
                        <label>Username</label>
                        <input
                            type="text"
                            className="form-control"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group mb-3">
                        <label>Email</label>
                        <input
                            type="email"
                            className="form-control"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group mb-3">
                        <label>Password</label>
                        <input
                            type="password"
                            className="form-control"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group mb-3">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            className="form-control"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    {/* Business Owner Only Fields */}
                    {isBusinessOwner && (
                        <>
                            <div className="form-group mb-3">
                                <label>Business Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="businessName"
                                    value={formData.businessName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group mb-3">
                                <label>Address</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group mb-3">
                                <label>Contact Number</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="contact"
                                    value={formData.contact}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </>
                    )}

                    <button type="submit" className="btn btn-primary w-100 mt-3">Register</button>
                </form>
                {message && <p className="mt-3 text-center">{message}</p>}
            </div>
        </div>
        <div><Footer/></div>
        </>
    );
}

export default Register;
