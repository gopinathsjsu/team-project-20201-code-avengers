import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children, allowedRoles }) => {
    const role = sessionStorage.getItem("role"); // Get role from sessionStorage

    if (!allowedRoles.includes(role)) {
        // If the role is not allowed, redirect to a "Not Authorized" page or login
        return <Navigate to="/not-authorized" />;
    }

    return children; // Render the protected component
};

export default PrivateRoute;
