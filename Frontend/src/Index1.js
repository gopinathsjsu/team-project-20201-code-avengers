import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Index1.css";
import Footer from "./Footer";
const API_URL  = process.env.REACT_APP_API_URL;
function Index() {
  /* ───────────── state ───────────── */
  const [cityState,   setCityState]   = useState("");
  const [zipCode,   setZipCode]   = useState("");
  const [date,        setDate]        = useState("");
  const [time,        setTime]        = useState("");
  const [numPeople,   setNumPeople]   = useState(2);
  const [restaurants, setRestaurants] = useState([]);

  const navigate = useNavigate();
   // http://localhost:8000/api

  function isWithinWindow(slot, wanted) {
    const [h, m] = slot.split(":").map(Number);      // "18:30" → 18, 30
    const slotMin = h * 60 + m;
  
    const [wh, wm] = wanted.split(":").map(Number);  // requested HH:MM
    const wantedMin = wh * 60 + wm;
  
    return Math.abs(slotMin - wantedMin) <= 30;      // ±30 min
  }
  /* ───────────── search submit ───────────── */

  
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
  
    try {
      /* build query */
      const params = new URLSearchParams({
        city_state: cityState.trim(),
        zip_code:   zipCode.trim(),
        date,
        time,
        num_people: numPeople,
      }).toString();
  
      /* call API */
      const res  = await fetch(`${API_URL}/restaurants/search/?${params}`);
      if (!res.ok) throw new Error("Failed to fetch restaurants");
      const data = await res.json();
  
      /* client‑side filter just in case */
      /* build a single list of unique ±30-min slots for tables ≥ numPeople */
        const filtered = data
        .map((r) => {
        // pull every slot from tables that seat >= numPeople
        const slots = (r.tables || [])
            .filter(tb => tb.size >= numPeople)
            .flatMap(tb => tb.times);
        // dedupe & filter by window
        const availableSlots = Array.from(new Set(
            slots.filter(t => isWithinWindow(t, time))
        )).sort();
        return { ...r, availableSlots, bookings_today: r.bookings_today || 0, };
        })
        .filter(r => r.availableSlots.length > 0);

        setRestaurants(filtered);

    } catch (err) {
      console.error("Error fetching restaurants:", err);
    }
  };

  /* ───────────── auth helpers (unchanged) ───────────── */
  const token = sessionStorage.getItem("accessToken");
  const role  = sessionStorage.getItem("role");
  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  /* ───────────── JSX ───────────── */
  return (
    <div className="index-container">
      <header className="index-header">
        <nav className="navbar">
          <div className="logo" onClick={() => navigate("/")}>
            🍽️ Restaurant Finder
          </div>
          <div className="nav-links">
            <button onClick={() => navigate("/")} className="nav-item">
              Home
            </button>
            {role === "user"  && <button onClick={() => navigate("/profile")} className="nav-item">My Profile</button>}
            {role === "owner" && <button onClick={() => navigate("/BusinessOwnerDashboard")} className="nav-item">Business Owner Dashboard</button>}
            {role === "admin" && <button onClick={() => navigate("/AdminDashboard")} className="nav-item">Admin Dashboard</button>}
            {/* <button onClick={() => navigate("/about")} className="nav-item">About Us</button> */}

            {!token ? (
              <>
                <button onClick={() => navigate("/login")}    className="login-btn">Login</button>
                <button onClick={() => navigate("/register")} className="login-btn">Register</button>
              </>
            ) : (
              <button onClick={handleLogout} className="login-btn">Logout</button>
            )}
          </div>
        </nav>
        <h1>Restaurant Finder</h1>
        <p>Reserve a table in seconds</p>
      </header>

      {/* ───────────── search form ───────────── */}
      <div className="search-section">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <input
            type="text"
            placeholder="City or State (Optional)"
            value={cityState}
            onChange={(e) => setCityState(e.target.value)}
            className="search-input"
          />
          {/* optional zip */}
          <input
            type="text"
            placeholder="Zip Code (optional)"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            className="search-input"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="search-input"
            required
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="search-input"
            required
          />
          <input
            type="number"
            min="1"
            value={numPeople}
            onChange={(e) => setNumPeople(e.target.value)}
            className="search-input"
            placeholder="# people"
            required
          />
          <button type="submit" className="search-btn">
            Search
          </button>
        </form>
      </div>

      {/* ───────────── results ───────────── */}
      <div className="restaurant-list">
        {restaurants.length ? (
            restaurants.map((r) => (
            <div className="restaurant-card" key={r.restaurant_id}>
                <h3>{r.name}</h3>
                <p>{r.address}</p>
                <p>Rating ⭐ {r.rating ?? "N/A"}</p>
                <p><strong>Booked Today:</strong> {r.bookings_today ?? 0} times</p>

                {/* ---- show one row of time buttons per table size ---- */}
                {r.availableSlots && r.availableSlots.length > 0 && (
                    <div style={{ margin: "6px 0" }}>
                        <strong>Available for {numPeople} people:</strong>{" "}
                        {r.availableSlots.map(t => {
                        const tableForSlot = r.tables.find(
                                    tb =>
                                      tb.size >= numPeople &&           // big enough
                                      tb.times.includes(t)    // includes this start‑time
                                  );
                            
                                  return (
                                    <button
                                      key={t}
                                      className="time-btn"
                                      onClick={() =>
                                        navigate(`/restaurant/${r.restaurant_id}`, {
                                          state: {
                                            tableId:       tableForSlot?.id,
                                            time:          t,        // slot they clicked
                                            requestedTime: time,     // original HH:MM they searched
                                            numPeople,               // party size they searched
                                          },
                                        })
                                      }
                                    >
                                      {t}
                                    </button>
                                  );
                                    })}
                    </div>
                )}

                {/* <button
                className="view-details-btn"
                // onClick={() => navigate(`/restaurant/${r.restaurant_id}`)}
                onClick={() => navigate(`/restaurant/${r.restaurant_id}`)}
                >
                Details
                </button> */}
            </div>
            ))
        ) : (
            <p>No restaurants match your criteria.</p>
        )}
        </div>
        {/* ───────────── footer ───────────── */}
      <Footer />
    </div>
  );
}

export default Index;
