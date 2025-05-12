// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Login';
import Index from './Index1'; // Import the Index component
import BusinessOwnerDashboard from './BusinessOwnerDashboard';
import AdminDashboard from './AdminDashboard';
import AddListing from './AddListing';
import UpdateInfo from './UpdateInfo';
import Register from './Register';
import PrivateRoute from './PrivateRoute';
import RestaurantList from './RestaurantList';
import RestaurantDetails from './RestaurantDetails';
import ManageListing from './ManageListing';
import EditListing from './EditListing';
// import About from './about';
import Profile from './Profile'
import Navbar from './Navbar';
function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Index />} />  {/* This sets Index as the homepage */}
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<privateRoute allowedRoles={["user"]}><Profile /></privateRoute>} />
                <Route path="/BusinessOwnerDashboard" element={<privateRoute allowedRoles={["owner"]}><BusinessOwnerDashboard /></privateRoute>} />
                <Route path="/AdminDashboard" element={<privateRoute allowedRoles={["admin"]}><AdminDashboard /></privateRoute>} />
                <Route path="/AddListing" element={<AddListing />} />
                <Route path="/UpdateInfo" element={<UpdateInfo />} />
                <Route path="/Register" element={<Register />} />
                <Route path="/RestaurantList" element={<RestaurantList />} />
                <Route path="/restaurant/google/:placeId" element={<RestaurantDetails />} />
                <Route path="/restaurant/:id" element={<RestaurantDetails />} />
                <Route path="/manage-listings" element={<ManageListing />} />
                <Route path="/manage-listings/edit/:id" element={<EditListing />} />
                {/* <Route path="/About" element={<About />} /> */}
                <Route path="/Navbar" element={<Navbar />} />
            </Routes>
        </Router>
    );
}

export default App;
