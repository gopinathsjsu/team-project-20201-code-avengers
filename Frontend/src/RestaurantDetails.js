// RestaurantDetails.js
import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

import "./RestaurantDetails.css";
import { refreshAccessToken } from "./auth";
import { getGooglePlaceDetails } from "./api";
import ImageViewer from "./ImageViewer";
import Navbar from "./Navbar";
import Footer from "./Footer";


/* ---------- helper: ±30‑minute window ---------- */
function isWithinWindow(slotHHMM, wantedHHMM) {
  if (!wantedHHMM) return false;                 // no filter passed
  const [h, m]   = slotHHMM.split(":").map(Number);
  const [wh, wm] = wantedHHMM.split(":").map(Number);
  return Math.abs((h * 60 + m) - (wh * 60 + wm)) <= 30;
}


/* ---------- look-up tables (for local DB restaurants) ---------- */
const CUISINE_CHOICES = [
  { id: 1, name: "Greek" },
  { id: 2, name: "Mexican" },
  { id: 3, name: "Italian" },
  { id: 4, name: "Chinese" },
];
const FOOD_TYPE_CHOICES = [
  { id: 1, name: "Vegan" },
  { id: 2, name: "Vegetarian" },
  { id: 3, name: "Gluten-free" },
];

const RestaurantDetails = () => {
  const { id, placeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  // slot chosen on the search page (may be undefined if user came directly)
  const { tableId: preselectedTableId, time: preselectedTime, requestedTime: bookingTimeFromSearch, numPeople,} =
  location.state || {};

  const API_URL = process.env.REACT_APP_API_URL;

  /* ---------- component state ---------- */
  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  /* review form */
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  /* booking form */
  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState("");
  // const [numPeople, setNumPeople] = useState(2);
  const todayISO = new Date().toISOString().slice(0, 10);
  const [bookingDate, setBookingDate] = useState(todayISO);
  const [bookingTime, setBookingTime] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [bookingId, setBookingId] = useState(null);

  /* ---------- initial fetches ---------- */
  useEffect(() => {
    if (placeId) {
      fetchGooglePlace();
    } else if (id) {
      fetchRestaurant();
      fetchReviews();
      fetchTables();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, placeId]);
  /* time originally typed on the search page */
  // const { requestedTime: bookingTimeFromSearch } = location.state || {};


  /* ---------- helpers ---------- */
  const fetchRestaurant = async () => {
    try {
      const res = await fetch(`${API_URL}/restaurants/${id}/`);
      if (!res.ok) throw new Error();
      const data = await res.json();

      data.cuisine_type = data.cuisine_type.map(
        (cid) => CUISINE_CHOICES.find((c) => c.id === cid)?.name || "Unknown"
      );
      data.food_type = data.food_type.map(
        (fid) => FOOD_TYPE_CHOICES.find((f) => f.id === fid)?.name || "Unknown"
      );
      setRestaurant(data);
    } catch (e) {
      console.error("Error fetching restaurant:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchGooglePlace = async () => {
    try {
      const details = await getGooglePlaceDetails(placeId);
      const priceMap = { 1: "$", 2: "$$", 3: "$$$" };
      const normalized = {
        name: details.name,
        address: details.address,
        rating: details.rating,
        phone_number: details.phone_number || "N/A",
        website: details.website || "N/A",
        opening_hours: details.opening_hours?.join(", ") || "N/A",
        cuisine_type:
          details.cuisine_type?.length > 0
            ? details.cuisine_type
            : ["N/A"],
        food_type:
          details.food_type?.length > 0 ? details.food_type : ["N/A"],
        price_range:
          details.price_level !== undefined
            ? priceMap[details.price_level] || "N/A"
            : "N/A",
        reviews: details.reviews || [],
        source: "google",
        description: details.description || "No description available",
        photos: details.photos || [],
      };
      setRestaurant(normalized);
    } catch (e) {
      console.error("Google Place fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/restaurants/${id}/reviews/`);
      if (!res.ok) throw new Error();
      setReviews(await res.json());
    } catch (e) {
      console.error("Fetch reviews error:", e);
    }
  };

  const fetchTables = async () => {
    try {
      const res = await fetch(`${API_URL}/restaurants/${id}/tables/`);
      if (!res.ok) throw new Error();
      const tbl = await res.json();
      const eligible = typeof numPeople === "number"
      ? tbl.filter(t => t.size >= numPeople)
      : tbl;
      console.log("eleigible - ", eligible);
      setTables(tbl);
      if (preselectedTableId) {
        console.log("if (preselectedTableId)", preselectedTableId);
        setSelectedTableId(preselectedTableId);
        setBookingTime(preselectedTime);
        console.log("selectedTableId - ", selectedTableId)
      }else if (eligible.length) {
        console.log("else if (eligible.length)");
        setSelectedTableId(eligible[0].id);
        console.log("selectedTableId - ", selectedTableId)
      }
      console.log("selectedTableId - ", selectedTableId)
      // if (!preselectedTableId && !selectedTableId && eligible.length) {
      //   console.log("inside - !preselectedTableId && !selectedTableId && eligible.length");
      //   setSelectedTableId(eligible[0].id);
      // }if (tbl.length) setSelectedTableId(tbl[0].id);
    } catch (e) {
      console.warn("Could not fetch tables:", e);
    }
  };
  // const fetchTables = async () => {
  //   const res = await fetch(`${API_URL}/restaurants/${id}/tables/`);
  //   const tbl = await res.json();
  
  //   // only keep tables that seat ≥ what the user asked for
  //   const eligible = typeof numPeople === "number"
  //     ? tbl.filter(t => t.size >= numPeople)
  //     : tbl;
  
  //   setTables(eligible);
  
  //   // preselect if needed…
  //   if (preselectedTableId) {
  //     setSelectedTableId(preselectedTableId);
  //     setBookingTime(preselectedTime);
  //   } else if (eligible.length) {
  //     setSelectedTableId(eligible[0].id);
  //   }
  // };

  /* ---------- review submission ---------- */
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (placeId) {
      setErrorMessage(
        "Reviews cannot be submitted for Google-Places restaurants."
      );
      return;
    }
    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      setErrorMessage("Log in to submit a review.");
      return;
    }
    if (!selectedRating || !reviewText.trim()) {
      setErrorMessage("Select rating and write some text.");
      return;
    }

    const reviewData = { rating: selectedRating, review_text: reviewText };
    try {
      let res = await fetch(
        `${API_URL}/restaurants/${id}/reviews/add/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(reviewData),
        }
      );

      /* token refresh */
      if (res.status === 401) {
        const newTok = await refreshAccessToken();
        if (!newTok) throw new Error("Session expired.");
        res = await fetch(
          `${API_URL}/restaurants/${id}/reviews/add/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${newTok}`,
            },
            body: JSON.stringify(reviewData),
          }
        );
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Submission failed.");
      }

      setSuccessMessage("Review submitted!");
      setSelectedRating(0);
      setReviewText("");
      fetchReviews();
      fetchRestaurant(); // update avg rating
    } catch (e) {
      setErrorMessage(e.message);
    }
  };

  /* ---------- booking submission ---------- */
  const handleBookNow = async () => {
    setBookingError("");
    setBookingSuccess("");

    if (!bookingTime) {
      setBookingError("Select a time.");
      return;
    }
    if (!selectedTableId) {
      setBookingError("No table available.");
      return;
    }
    const selectedTable = tables.find(t => t.id === selectedTableId);
    console.log("selectedTableId - ", selectedTableId)
    console.log("selectedTable - ",selectedTable)
    if (!selectedTable || selectedTable.size < numPeople) {
      setBookingError("Selected table can't accommodate your party size.");
      return;
    }
    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      setBookingError("You must be logged in to book.");
      return;
    }
    console.log("🕒 Booking Time Info:");
    console.log("Selected Date:", bookingDate);
    console.log("Selected Time:", bookingTime);
    console.log("Table ID:", selectedTableId);
    console.log("Restaurant ID:", restaurant.id);
    console.log("Num People:", numPeople);

    try {
      const res = await fetch(`${API_URL}/restaurants/bookings/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          table_id: selectedTableId,
          num_people: Number(numPeople),
          date: bookingDate,
          time: bookingTime,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Booking failed.");
      }

      const data = await res.json();
      setBookingSuccess("Booking confirmed! Check your email.");
      setBookingId(data.id);
    } catch (e) {
      setBookingError(e.message);
    }
  };



  // const handleCancelBooking = async () => {
  //   const token = sessionStorage.getItem("accessToken");
  //   if (!bookingId || !token) return;
  
  //   try {
  //     const res = await fetch(`${API_URL}/restaurants/bookings/cancel/${bookingId}/`, {
  //       method: "POST",
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });
  
  //     if (!res.ok) throw new Error("Cancellation failed.");
  //     setBookingSuccess("Booking cancelled.");
  //     setBookingId(null);
  //   } catch (err) {
  //     setBookingError("Could not cancel booking.");
  //   }
  // };
  
  /* ---------- UI helpers ---------- */
  const renderStars = () =>
    Array.from({ length: 5 }, (_, i) => i + 1).map((star) => (
      <span
        key={star}
        className={`star ${star <= selectedRating ? "selected" : ""}`}
        onClick={() => setSelectedRating(star)}
        style={{ cursor: "pointer", fontSize: 24 }}
      >
        {star <= selectedRating ? "★" : "☆"}
      </span>
    ));

  if (loading) return <p>Loading…</p>;
  if (!restaurant) return <p>Restaurant not found.</p>;

  /* ---------- JSX ---------- */
  return (
    <>
      <Navbar />

      <div className="details-container">
        <div className="details-header">
          <h1>{restaurant.name}</h1>
        </div>

        {/* ---- Google Place vs local DB ---- */}
        {restaurant.source === "google" ? (
          <>
            <p className="details-text">
              Cuisine: {restaurant.cuisine_type || "N/A"}
            </p>
            <p className="details-text">
              Food: {restaurant.food_type || "N/A"}
            </p>
            <p className="details-text">
              Price: {restaurant.price_range}
            </p>
            <p className="details-text">
              Rating: ⭐ {restaurant.rating || "N/A"}
            </p>
            <p className="details-description">{restaurant.description}</p>
            <p className="details-address">Address: {restaurant.address}</p>
            <p className="details-hours">
              Hours: {restaurant.opening_hours}
            </p>
            <p className="details-contact">Tel: {restaurant.phone_number}</p>
            <p className="details-contact">
              Website:&nbsp;
              {restaurant.website !== "N/A" ? (
                <a
                  href={restaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {restaurant.website}
                </a>
              ) : (
                "N/A"
              )}
            </p>

            {/* photos */}
            <div className="form-group mb-3">
              <label>Photos</label>
              <div className="d-flex flex-wrap">
                {restaurant.photos?.length ? (
                  restaurant.photos.map((p, i) => (
                    <div key={i} className="m-2">
                      <ImageViewer
                        thumbnailUrl={p.thumbnail_url}
                        highResUrl={p.high_res_url}
                      />
                    </div>
                  ))
                ) : (
                  <p>No photos.</p>
                )}
              </div>
            </div>

            {/* Google reviews */}
            {restaurant.reviews?.length > 0 && (
              <div className="reviews-container">
                <h2>User Reviews</h2>
                {restaurant.reviews.map((rev, i) => (
                  <div key={i} className="review">
                    <p>
                      <strong>{rev.author_name}</strong> – ⭐ {rev.rating}
                    </p>
                    <p>{rev.text}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* ===== LOCAL RESTAURANT (DB) ===== */
          <>
            <p className="details-text">
              Cuisine: {restaurant.cuisine_type.join(", ")}
            </p>
            <p className="details-text">
              Food: {restaurant.food_type.join(", ")}
            </p>
            <p className="details-text">
              Price: {restaurant.price_range}
            </p>
            <p className="details-text">
              Rating: ⭐ {restaurant.rating}
            </p>
            <p className="details-text">
              Bookings Today: {restaurant.bookings_today ?? 0}
            </p>
            <p className="details-description">
              {restaurant.description || "N/A"}
            </p>

            {/* Google-Maps button */}
            <p className="details-address">
              {(() => {
                const addr = [
                  restaurant.address,
                  restaurant.city,
                  restaurant.state,
                  restaurant.zip_code,
                ]
                  .filter(Boolean)
                  .join(", ");
                const mapsUrl =
                  restaurant.latitude && restaurant.longitude
                    ? `https://www.google.com/maps/search/?api=1&query=${restaurant.latitude},${restaurant.longitude}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        addr
                      )}`;
                return (
                  <button
                    className="btn view-map-btn"
                    onClick={() => window.open(mapsUrl, "_blank")}
                  >
                    View on Google Maps
                  </button>
                );
              })()}
            </p>

            <p className="details-hours">
              Hours: {restaurant.hours_of_operation}
            </p>
            <p className="details-contact">
              Tel: {restaurant.phone_number}
            </p>
            <p className="details-contact">
              Website:&nbsp;
              {restaurant.website ? (
                <a
                  href={restaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {restaurant.website}
                </a>
              ) : (
                "N/A"
              )}
            </p>

            {/* -------------- Booking -------------- */}
            <div className="booking-form">
              <h2>Book a Table</h2>

              {tables.length ? (
                bookingTime            // ← was it pre‑selected?
                  ? (
                      <>
                        <p>
                          <strong>Selected time:</strong> {bookingTime}
                        </p>
                        <button className="time-btn" onClick={handleBookNow}>
                          Book now
                        </button>
                        {/* {bookingId && (
                          <button
                            className="cancel-btn"
                            onClick={handleCancelBooking}
                            style={{ marginTop: "10px", backgroundColor: "#dc3545", color: "white" }}
                          >
                            Cancel Booking
                          </button>
                        )} */}

                      </>
                    )
                  : (
                      /* existing code that builds & shows the list of buttons
                        so users who came directly can still pick a time */
                      <>
                        {(() => {
                          const filteredTimes = [
                            ...new Set(tables.flatMap(t => t.times)),
                          ]
                            .filter(t => isWithinWindow(t, bookingTimeFromSearch))
                            .sort();

                          if (!filteredTimes.length) {
                            return <p>No availability in this ±30‑minute window.</p>;
                          }
                          const isLoggedIn = !!sessionStorage.getItem("accessToken");
                          return filteredTimes.map(t => (
                            <button
                              key={t}
                              className="time-btn"
                              disabled={!isLoggedIn}
                              onClick={() => {
                                if (!isLoggedIn) {
                                  /* show banner & jump to /login */
                                  setBookingError("Please log in to reserve a table.");
                                  navigate("/login", {
                                    state: { from: location.pathname }
                                  });
                                  return;
                                }
                                const tbl = tables.find(tb =>
                                  tb.times.includes(t)
                                );
                                setSelectedTableId(tbl.id);
                                setBookingTime(t);
                              }}
                            >
                              {t}
                            </button>
                          ));
                        })()}
                      </>
                    )
              ) : (
                <p>No tables configured for online booking.</p>
              )}
              {bookingSuccess && <p className="success-message">{bookingSuccess}</p>}
              {bookingError   && <p className="error-message">{bookingError}</p>}
            </div>

            {/* <div className="booking-form">
              <h2>Book a Table</h2>

              {tables.length ? (
                (() => {
                  // merge + dedupe all times, then filter by ±30 of search time
                  const filteredTimes = [
                    ...new Set(tables.flatMap((t) => t.available_times)),
                  ]
                    .filter((t) => isWithinWindow(t, bookingTimeFromSearch)) // uses your passed-in search time
                    .sort();

                  if (!filteredTimes.length) {
                    return <p>No availability in this ±30-minute window.</p>;
                  }

                  return filteredTimes.map((t) => (
                    <button
                      key={t}
                      className="time-btn"
                      disabled               // ← made un-clickable per your request
                    >
                      {t}
                    </button>
                  ));
                })()
              ) : (
                <p>No tables configured for online booking.</p>
              )} */}

              {/* {bookingSuccess && <p className="success-message">{bookingSuccess}</p>}
              {bookingError   && <p className="error-message">{bookingError}</p>} */}
            {/* </div> */}

            {/* photos */}
            <div className="form-group mb-3">
              <label>Photos</label>
              <div className="d-flex flex-wrap">
                {restaurant.photos?.map((p, i) => (
                  <div key={i} className="m-2">
                    <ImageViewer
                      thumbnailUrl={p.thumbnail_url}
                      highResUrl={p.high_res_url}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* DB reviews */}
            <div className="reviews-container">
              <h2>User Reviews</h2>
              {reviews.length ? (
                reviews.map((r) => (
                  <div key={r.id} className="review">
                    <p>
                      <strong>{r.user}</strong> – ⭐ {r.rating}
                    </p>
                    
                    <p>{r.review_text}</p>
                  </div>
                ))
              ) : (
                <p>No reviews yet.</p>
              )}
            </div>

            {/* Review form */}
            <div className="review-form-container">
              <h2>Submit a Review</h2>
              {successMessage && (
                <p className="success-message">{successMessage}</p>
              )}
              {errorMessage && (
                <p className="error-message">{errorMessage}</p>
              )}

              <form onSubmit={handleSubmitReview}>
                <div className="form-group">
                  <label>Rating:</label>
                  <div className="stars">{renderStars()}</div>
                </div>

                <div className="form-group">
                  <label>Review Text:</label>
                  <textarea
                    rows="4"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary">
                  Submit Review
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      <Footer />
    </>
  );
};

export default RestaurantDetails;
