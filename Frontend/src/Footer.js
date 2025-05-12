import React from 'react';
import './Footer.css';

function Footer() {
    return (
        <footer className="footer-container">
            <div className="footer-content">
                <div className="footer-section">
                    <h4>Discover</h4>
                    <ul>
                        {/* <li><a href="/about">About Us</a></li> */}
                        <li><a href="/blog">Blog</a></li>
                        <li><a href="/contact">Contact Us</a></li>
                        <li><a href="/careers">Careers</a></li>
                    </ul>
                </div>
                
                <div className="footer-section">
                    <h4>Business</h4>
                    <ul>
                        <li><a href="/business">Claim Your Business</a></li>
                        <li><a href="/advertise">Advertise with Us</a></li>
                        <li><a href="/support">Support</a></li>
                        <li><a href="/guidelines">Community Guidelines</a></li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h4>Privacy & Terms</h4>
                    <ul>
                        <li><a href="/privacy">Privacy Policy</a></li>
                        <li><a href="/terms">Terms of Service</a></li>
                        <li><a href="/security">Security</a></li>
                    </ul>
                </div>

                <div className="footer-section social-media">
                    <h4>Follow Us</h4>
                    <div className="social-icons">
                        <a href="https://www.facebook.com" target="_blank" rel="noreferrer">Facebook<i className="fab fa-facebook-f"></i></a><br></br>
                        <a href="https://www.twitter.com" target="_blank" rel="noreferrer">Twitter<i className="fab fa-twitter"></i></a><br></br>
                        <a href="https://www.instagram.com" target="_blank" rel="noreferrer">Instagram<i className="fab fa-instagram"></i></a><br></br>
                        <a href="https://www.linkedin.com" target="_blank" rel="noreferrer">LinkedIn<i className="fab fa-linkedin-in"></i></a>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; 2024 Restaurant Finder. All Rights Reserved.</p>
            </div>
        </footer>
    );
}

export default Footer;
