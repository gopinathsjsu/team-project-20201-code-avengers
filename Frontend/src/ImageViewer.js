import React, { useState } from 'react';

const ImageViewer = ({ thumbnailUrl, highResUrl }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleThumbnailClick = () => {
        setIsModalOpen(true); // Open modal to show high-res image
    };

    const handleCloseModal = () => {
        setIsModalOpen(false); // Close modal
    };

    return (
        <div>
            {/* Thumbnail with rounded thick border */}
            <div
                style={{
                    width: '100px',
                    height: '100px',
                    border: '4px solid #f8f1e6', // Off-white thick border
                    borderRadius: '12px', // Rounded corners
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Optional shadow for better visibility
                }}
                onClick={handleThumbnailClick}
            >
                <img
                    src={thumbnailUrl}
                    alt="Thumbnail"
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'cover',
                    }}
                />
            </div>

            {/* Modal to show high-res image */}
            {isModalOpen && (
                <div
                    className="modal"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                    }}
                    onClick={handleCloseModal}
                >
                    <div
                        className="modal-content"
                        style={{
                            width: '80%', // Max width of the modal relative to the viewport
                            maxWidth: '700px', // Prevent the modal from being too wide
                            height: 'auto', // Maintain aspect ratio
                            backgroundColor: 'white',
                            padding: '10px',
                            borderRadius: '8px', // Rounded corners for the modal
                            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)', // Shadow for the modal
                        }}
                    >
                        <img
                            src={highResUrl}
                            alt="High Resolution"
                            style={{
                                width: '100%', // Scale image to modal size
                                height: 'auto', // Maintain aspect ratio
                                borderRadius: '4px', // Optional: slightly rounded image corners
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageViewer;
