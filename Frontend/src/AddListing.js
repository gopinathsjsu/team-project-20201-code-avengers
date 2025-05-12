// src/AddListing.js
import React, { useEffect, useState } from "react";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./AddListing.css";

import { refreshAccessToken } from "./auth";
import Footer from "./Footer";

function AddListing() {
  const navigate  = useNavigate();
  const API_URL   = process.env.REACT_APP_API_URL;   // → http://localhost:8000/api
  const token     = sessionStorage.getItem("accessToken");

  /* ───── auth / preload ───── */
  const [role, setRole] = useState(null);
  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    setRole(sessionStorage.getItem("role"));
    fetchListings();
    // eslint‑disable‑next‑line
  }, []);

  const fetchListings = async () => {
    try {
      const res = await fetch(`${API_URL}/restaurants/owner/my/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not get listings");
      // const data = await res.json();  // ← use if you need the list
    } catch (e) {
      console.error("Failed to fetch listings", e);
    }
  };

  /* ───── form state ───── */
  const [formData, setFormData] = useState({
    name: "", address: "", city: "", state: "", zip_code: "",
    cuisine_type: [], food_type: [],
    price_range: "", hours_of_operation: "",
    website: "", phone_number: "", description: "",
    photos_to_upload: [],
  });

  /* tables state */
  const SLOT_OPTIONS = Array.from({ length: 48 }, (_, i) => {
    const h = String(Math.floor(i / 2)).padStart(2, "0");
    const m = i % 2 ? "30" : "00";
    return { value: `${h}:${m}`, label: `${h}:${m}` };
  });
  const [tables, setTables] = useState([{ size: 2, available_times: [] }]);

  /* choice lists */
  const CUISINE_CHOICES = [
    { value: 1, label: "Greek" },
    { value: 2, label: "Mexican" },
    { value: 3, label: "Italian" },
    { value: 4, label: "Chinese" },
  ];
  const FOOD_TYPE_CHOICES = [
    { value: 1, label: "Vegan" },
    { value: 2, label: "Vegetarian" },
    { value: 3, label: "Gluten‑free" },
  ];
  const PRICE_RANGE_CHOICES = [
    { value: "$",  label: "Low ($)" },
    { value: "$$", label: "Moderate ($$)" },
    { value: "$$$",label: "Expensive ($$$)" },
  ];

  /* ───── handlers ───── */
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSelectChange = (choice, field) =>
    setFormData({ ...formData, [field]: choice.map((o) => o.value) });

  const handleFileChange = (e) =>
    setFormData((p) => ({
      ...p,
      photos_to_upload: [...p.photos_to_upload, ...Array.from(e.target.files)],
    }));

  const handleRemovePhoto = (i) =>
    setFormData((p) => ({
      ...p,
      photos_to_upload: p.photos_to_upload.filter((_, idx) => idx !== i),
    }));

  /* table helpers */
  const addTableRow    = () => setTables([...tables, { size: 2, available_times: [] }]);
  const removeTableRow = (i) => setTables(tables.filter((_, idx) => idx !== i));
  const updateTable    = (i, field, val) =>
    setTables(tables.map((t, idx) => (idx === i ? { ...t, [field]: val } : t)));

  /* ───── submit ───── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      /* build multipart body */
      const payload = { ...formData, tables };
      const form = new FormData();

      payload.cuisine_type.forEach((v) => form.append("cuisine_type", v));
      payload.food_type.forEach((v)   => form.append("food_type",   v));
      form.append("tables", JSON.stringify(payload.tables));

      Object.entries(payload).forEach(([k, v]) => {
        if (["cuisine_type", "food_type", "photos_to_upload", "tables"].includes(k))
          return;
        form.append(k, v);
      });
      payload.photos_to_upload.forEach((f) => form.append("photos", f));

      const res = await fetch(`${API_URL}/restaurants/owner/add/`, {
        method: "POST",
        body: form,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 201) {
        alert("Restaurant added successfully!");
        setFormData({
          name: "", address: "", city: "", state: "", zip_code: "",
          cuisine_type: [], food_type: [], price_range: "",
          hours_of_operation: "", website: "", phone_number: "",
          description: "", photos_to_upload: [],
        });
        setTables([{ size: 2, available_times: [] }]);
        navigate("/BusinessOwnerDashboard");
      } else {
        const err = await res.json();
        throw new Error(err.error || "Server error");
      }
    } catch (err) {
      console.error("Submit error", err);
      alert("Failed to add restaurant — check console.");
    }
  };

  /* ───── render ───── */
  return (
    <>
      {/* 🟦 simple nav stripped for brevity */}
      <div className="add-listing-container d-flex flex-column align-items-center">
        <div className="card listing-card shadow-lg p-4 mt-5">
          <h2 className="text-center mb-4">Add a New Restaurant</h2>

          <form onSubmit={handleSubmit}>
            {/* ── primitive fields ── */}
            {["name","address","city","state","zip_code","hours_of_operation",
              "website","phone_number"].map((field) => (
              <div className="form-group mb-3" key={field}>
                <label>{field.replace(/_/g," ").replace(/\b\w/g,(c)=>c.toUpperCase())}</label>
                <input
                  type="text"
                  className="form-control"
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  required={["name","address","city","state","zip_code","phone_number"].includes(field)}
                />
              </div>
            ))}

            <div className="form-group mb-3">
              <label>Description</label>
              <textarea
                className="form-control"
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            {/* ── selects ── */}
            <div className="form-group mb-3">
              <label>Cuisine Type</label>
              <Select
                options={CUISINE_CHOICES}
                isMulti
                value={CUISINE_CHOICES.filter((c) => formData.cuisine_type.includes(c.value))}
                onChange={(sel) => handleSelectChange(sel,"cuisine_type")}
              />
            </div>
            <div className="form-group mb-3">
              <label>Food Type</label>
              <Select
                options={FOOD_TYPE_CHOICES}
                isMulti
                value={FOOD_TYPE_CHOICES.filter((c) => formData.food_type.includes(c.value))}
                onChange={(sel) => handleSelectChange(sel,"food_type")}
              />
            </div>
            <div className="form-group mb-3">
              <label>Price Range</label>
              <select
                className="form-control"
                name="price_range"
                value={formData.price_range}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                {PRICE_RANGE_CHOICES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* ── tables ── */}
            <h5 className="mt-4 mb-2">Tables & Available Times</h5>
            {tables.map((t, idx) => (
              <div key={idx} className="border p-3 mb-2 rounded">
                <div className="d-flex justify-content-between">
                  <strong>Table {idx + 1}</strong>
                  {tables.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => removeTableRow(idx)}
                    >Remove</button>
                  )}
                </div>

                <label className="mt-2">Seats</label>
                <select
                  className="form-control"
                  value={t.size}
                  onChange={(e) => updateTable(idx,"size",Number(e.target.value))}
                >
                  {[2,4,6,8].map((n)=>(
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>

                <label className="mt-2">Available start‑times</label>
                <Select
                  options={SLOT_OPTIONS}
                  isMulti
                  onChange={(sel) =>
                    updateTable(idx,"available_times",sel.map((o)=>o.value))
                  }
                  placeholder="Select time slots"
                />
              </div>
            ))}
            <button type="button" className="btn btn-secondary mt-2" onClick={addTableRow}>
              + Add another table
            </button>

            {/* ── photo upload ── */}
            <div className="form-group mb-3">
              <label>Upload Photos</label>
              <input
                type="file"
                className="form-control"
                multiple
                accept="image/*"
                onChange={handleFileChange}
              />
              <div className="mt-2">
                {formData.photos_to_upload.map((f, i) => (
                  <div key={i} className="d-flex align-items-center">
                    <span className="me-2">{f.name}</span>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemovePhoto(i)}
                    >Remove</button>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 mt-3">
              Add Restaurant
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default AddListing;
