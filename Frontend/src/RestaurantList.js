import React from 'react';
import { useNavigate } from 'react-router-dom';

function RestaurantList({ restaurants }) {
    const navigate = useNavigate();

    if (restaurants.length === 0) return <p>No restaurants found.</p>;

    return (
        <div>
          {restaurants.length === 0 ? (
            <p>No restaurants match that query.</p>
          ) : (
            restaurants.map((r) => (
              <div key={r.id} className="restaurant-card">
                <h3>
                  {r.name} <small>⭐ {Number(r.rating).toFixed(1)}</small>
                </h3>
                <p>{r.address}</p>
      
                {/* tables & time‑buttons */}
                {r.tables && r.tables.map((t) => (
                  <div key={t.id} className="table-row">
                    <span className="table-size">Seats {t.size}:</span>
      
                    {t.times.map((tm) => (
                      <button
                        key={tm}
                        className="time-btn"
                        onClick={() =>
                          navigate(`/restaurants/${r.id}`, {
                            state: {
                              tableId: t.id,
                              time: tm,
                              requestedTime: r.requested_time || null, // pass if available
                            },
                          })
                        }
                      >
                        {tm}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      );
      
}

export default RestaurantList;
