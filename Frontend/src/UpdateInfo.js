import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './UpdateInfo.css';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';

function UpdateInfo({ existingData }) {
    const [view, setView] = useState(''); // State to track current view
    const [allListings, setAllListings] = useState([]);
    const [duplicateListings, setDuplicateListings] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [role, setRole] = useState(null); // Role state
    const [isLoggedIn, setIsLoggedIn] = useState(false); // Login status
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        contact: '',
        hours: '',
        category: '',
        website: '',
        description: '',
        photos: null,
        menu: '',
        priceRange: '',
        amenities: '',
        features: '',
        paymentOptions: '',
        reservationLink: '',
        deliveryOptions: '',
        healthSafety: '',
        policies: ''
    });
    

    useEffect(() => {
        if (existingData) {
            setFormData(existingData);
        }
    }, [existingData]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData({
            ...formData,
            [name]: name === "photos" ? files : value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Implement the API call here for updating the listing
        console.log("Updated Info Submitted:", formData);
    };

    return (
        <div className="update-info-container d-flex flex-column align-items-center">
            <div className="card update-card shadow-lg p-4 mt-5">
                <h2 className="text-center mb-4">Update Business Info</h2>
                <form onSubmit={handleSubmit}>
                    
                    {/* Business Name */}
                    <div className="form-group mb-3">
                        <label>Business Name</label>
                        <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    
                    {/* Address */}
                    <div className="form-group mb-3">
                        <label>Address</label>
                        <input type="text" className="form-control" name="address" value={formData.address} onChange={handleChange} required />
                    </div>

                    {/* Contact */}
                    <div className="form-group mb-3">
                        <label>Contact Information</label>
                        <input type="text" className="form-control" name="contact" value={formData.contact} onChange={handleChange} required />
                    </div>

                    {/* Hours */}
                    <div className="form-group mb-3">
                        <label>Operating Hours</label>
                        <input type="text" className="form-control" name="hours" value={formData.hours} onChange={handleChange} />
                    </div>

                    {/* Category */}
                    <div className="form-group mb-3">
                        <label>Category</label>
                        <input type="text" className="form-control" name="category" value={formData.category} onChange={handleChange} />
                    </div>

                    {/* Description */}
                    <div className="form-group mb-3">
                        <label>Business Description</label>
                        <textarea className="form-control" name="description" value={formData.description} onChange={handleChange} />
                    </div>

                    {/* Photos */}
                    <div className="form-group mb-3">
                        <label>Upload Photos</label>
                        <input type="file" className="form-control" name="photos" multiple onChange={handleChange} />
                    </div>

                    {/* Price Range */}
                    <div className="form-group mb-3">
                        <label>Price Range</label>
                        <input type="text" className="form-control" name="priceRange" value={formData.priceRange} onChange={handleChange} />
                    </div>

                    {/* Amenities */}
                    <div className="form-group mb-3">
                        <label>Amenities</label>
                        <input type="text" className="form-control" name="amenities" value={formData.amenities} onChange={handleChange} />
                    </div>

                    {/* Features */}
                    <div className="form-group mb-3">
                        <label>Special Features</label>
                        <input type="text" className="form-control" name="features" value={formData.features} onChange={handleChange} />
                    </div>

                    {/* Payment Options */}
                    <div className="form-group mb-3">
                        <label>Payment Options</label>
                        <input type="text" className="form-control" name="paymentOptions" value={formData.paymentOptions} onChange={handleChange} />
                    </div>

                    {/* Reservation Options */}
                    <div className="form-group mb-3">
                        <label>Reservation Link</label>
                        <input type="text" className="form-control" name="reservationLink" value={formData.reservationLink} onChange={handleChange} />
                    </div>

                    {/* Delivery Options */}
                    <div className="form-group mb-3">
                        <label>Delivery Options</label>
                        <textarea className="form-control" name="deliveryOptions" value={formData.deliveryOptions} onChange={handleChange} />
                    </div>

                    {/* Health & Safety */}
                    <div className="form-group mb-3">
                        <label>Health & Safety Protocols</label>
                        <textarea className="form-control" name="healthSafety" value={formData.healthSafety} onChange={handleChange} />
                    </div>

                    {/* Policies */}
                    <div className="form-group mb-3">
                        <label>Business Policies</label>
                        <textarea className="form-control" name="policies" value={formData.policies} onChange={handleChange} />
                    </div>

                    {/* Submission */}
                    <button type="submit" className="btn btn-primary w-100 mt-4">Save Updates</button>
                </form>
            </div>
            <div>
                {/* Main Content */}
                <Footer />
            </div>
        </div>
    );
}

export default UpdateInfo;
