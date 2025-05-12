import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { useParams, useNavigate } from 'react-router-dom';
import ImageViewer from './ImageViewer';

function EditListing() {
    const { id } = useParams(); // Get restaurant ID from URL
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const API_URL = process.env.REACT_APP_API_URL;

    const [formData, setFormData] = useState({
        name: '',
        hours_of_operation: '',
        website: '',
        phone_number: '',
        description: '',
        existing_photos: [], // Change to an array for multiple photos
        new_photos: [],
        address: '',
        city: '',
        state: '',
        zip_code: '',
        cuisine_type: [],
        food_type: [],
    });
    const [tables, setTables] = useState([]);


    const CUISINE_CHOICES = [
        { value: 1, label: 'Greek' },
        { value: 2, label: 'Mexican' },
        { value: 3, label: 'Italian' },
        { value: 4, label: 'Chinese' },
    ];

    const FOOD_TYPE_CHOICES = [
        { value: 1, label: 'Vegan' },
        { value: 2, label: 'Vegetarian' },
        { value: 3, label: 'Gluten-free' },
    ];

    useEffect(() => {
        if (id) {
            fetchRestaurantDetails();
        }
    }, [id]);

    const fetchRestaurantDetails = async () => {
        try {
            const accessToken = sessionStorage.getItem('accessToken');
            const response = await fetch(`${API_URL}/restaurants/${id}/`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const tablesRes = await fetch(`${API_URL}/restaurants/${id}/tables/`, {
                headers: { Authorization: `Bearer ${accessToken}` }
              });
            const tablesData = await tablesRes.json();
            setTables(tablesData);
              

            if (response.ok) {
                const data = await response.json();
                const mappedCuisine = data.cuisine_type
                    .map((id) => CUISINE_CHOICES.find((choice) => choice.value === id))
                    .filter(Boolean);

                const mappedFoodType = data.food_type
                    .map((id) => FOOD_TYPE_CHOICES.find((choice) => choice.value === id))
                    .filter(Boolean);

                setFormData({
                    name: data.name,
                    hours_of_operation: data.hours_of_operation,
                    website: data.website,
                    phone_number: data.phone_number,
                    description: data.description,
                    existing_photos: data.photos,
                    new_photos: [], // Photos handled separately
                    address: data.address,
                    city: data.city,
                    state: data.state,
                    zip_code: data.zip_code,
                    cuisine_type: mappedCuisine,
                    food_type: mappedFoodType,
                });
            } else {
                throw new Error('Failed to fetch restaurant details.');
            }
        } catch (err) {
            console.error(err);
            setError('Could not fetch restaurant details. Please try again later.');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (selected, field) => {
        setFormData((prev) => ({
            ...prev,
            [field]: selected || [], 
        }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setFormData((prev) => ({
            ...prev,
            new_photos: [...prev.new_photos, ...files], // Add new files to the existing photos array
        }));
    };

    const handleRemovePhoto = (index) => {
        setFormData((prev) => ({
            ...prev,
            new_photos: prev.new_photos.filter((_, i) => i !== index),
        }));
    };
    const updateTable = (index, field, value) => {
        const updatedTables = [...tables];
        if (field === 'available_times') {
          updatedTables[index][field] = value.split(',').map(t => t.trim());
        } else {
          updatedTables[index][field] = parseInt(value, 10);
        }
        setTables(updatedTables);
    };
      

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const accessToken = sessionStorage.getItem('accessToken');
            const form = new FormData();

            Object.keys(formData).forEach((key) => {
                if (key === 'new_photos') {
                    formData.new_photos.forEach((file) => form.append('photos', file)); // Append multiple photos
                }
                else if (key === "cuisine_type" || key === "food_type") {
                    formData[key]?.forEach((item) => form.append(key, item.value));
                } else if (formData[key]) {
                    form.append(key, formData[key]);
                }
            });
            form.append("tables", JSON.stringify(tables));
            console.log("Submitting Form Data:", form.cuisine_type);
    
            const response = await fetch(`${API_URL}/restaurants/${id}/`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                body: form,
            });
    
            if (response.ok) {
                alert('Restaurant updated successfully!');
                fetchRestaurantDetails(); // Re-fetch data to refresh the form
                navigate('/BusinessOwnerDashboard');
            } else {

                const errorData = await response.json();
                console.error("Error Details:", errorData);
                alert('Failed to update restaurant. Please check your input.');
            }
        } catch (err) {
            console.error('An error occurred:', err);
            setError('An error occurred while updating the restaurant. Please try again.');

        }
    };    

    return (
        <div className="container mt-5">
            <h2 className="mb-4">Edit Restaurant</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                    <label htmlFor="name">Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Address</label>
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="form-control"
                    />
                </div>
                <div className="form-group">
                    <label>City</label>
                    <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="form-control"
                    />
                </div>
                <div className="form-group">
                    <label>State</label>
                    <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="form-control"
                    />
                </div>
                <div className="form-group">
                    <label>Zip Code</label>
                    <input
                        type="text"
                        name="zip_code"
                        value={formData.zip_code}
                        onChange={handleInputChange}
                        className="form-control"
                    />
                </div>
                <div className="form-group">
                    <label>Cuisine Type</label>
                    <Select
                        options={CUISINE_CHOICES}
                        isMulti
                        value={formData.cuisine_type}
                        onChange={(selected) => handleSelectChange(selected, 'cuisine_type')}
                        placeholder="Select Cuisine Types"
                    />
                </div>
                <div className="form-group">
                    <label>Food Type</label>
                    <Select
                        options={FOOD_TYPE_CHOICES}
                        isMulti
                        value={formData.food_type}
                        onChange={(selected) => handleSelectChange(selected, 'food_type')}
                        placeholder="Select Food Types"
                    />
                </div>
                <div className="form-group">
                    <label>Hours of Operation</label>
                    <input
                        type="text"
                        id="hours_of_operation"
                        name="hours_of_operation"
                        value={formData.hours_of_operation}
                        onChange={handleInputChange}
                        className="form-control"
                    />
                </div>
                <div className="form-group mb-3">
                    <label htmlFor="website">Website</label>
                    <input
                        type="url"
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="form-control"
                    />
                </div>
                <div className="form-group mb-3">
                    <label htmlFor="phone_number">Phone Number</label>
                    <input
                        type="text"
                        id="phone_number"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleInputChange}
                        className="form-control"
                    />
                </div>
                <div className="form-group mb-3">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="form-control"
                    />
                </div>
                <div className="form-group mb-3">
                    <label>Existing Photos</label>
                    <div className="d-flex flex-wrap">
                        {formData.existing_photos.map((photo, index) => (
                            <div key={index} className="m-2">
                                <ImageViewer 
                                    thumbnailUrl={photo.thumbnail_url}
                                    highResUrl={photo.high_res_url}
                                />
                            </div>
                            
                        ))}
                    </div>
                </div>
                <div className="form-group mb-3">
                    <label htmlFor="photos">Upload Photos</label>
                    <input
                        type="file"
                        id="photos"
                        name="photos"
                        multiple
                        onChange={handleFileChange}
                        className="form-control"
                        accept="image/*"
                    />
                    

                    <div className="mt-2">
                        {formData.new_photos.map((file, index) => (
                            <div key={index} className="d-flex align-items-center">
                                <span className="me-2">{file.name}</span>
                                <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleRemovePhoto(index)}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="form-group mb-3">
                    <label>Tables</label>
                    {tables.map((table, index) => (
                        <div key={index} className="mb-2 border p-3 rounded">
                        <label>Table #{table.id} Size:</label>
                        <input
                            type="number"
                            value={table.size}
                            onChange={(e) => updateTable(index, 'size', e.target.value)}
                            className="form-control mb-2"
                            required
                        />

                        <label>Available Times (comma-separated HH:MM):</label>
                        <input
                            type="text"
                            value={table.available_times.join(",")}
                            onChange={(e) => updateTable(index, 'available_times', e.target.value)}
                            className="form-control"
                        />
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    className="btn btn-secondary mt-2"
                    onClick={() =>
                        setTables((prev) => [...prev, { size: 2, available_times: [] }])
                    }
                >
                    + Add Table
                </button>

                <button type="submit" className="btn btn-primary">Save Changes</button>
            </form>
        </div>
    );
}

export default EditListing;
