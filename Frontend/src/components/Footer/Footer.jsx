// import React from 'react'
import './Footer.css'
import assets from '../../assets/assets'

const Footer = () => {
return (
    <div className='footer' id='footer'>
            <div className="footer-content">
                    <div className="footer-content-left">
                            <img src={assets.font} alt=""/>
                            <p>Dummy text</p>
                            <div className="footer-social-icons">
                                    <img src={assets.facebook} alt="" />
                                    <img src={assets.whatsapp} alt="" />
                                    <img src={assets.location} alt="" />
                            </div>
                    </div>
                    <div className="footer-content-center">
                            <h2>COMPANY</h2>
                            <ul>
                                    <li>Home</li>
                                    <li>About Us</li>
                                    <li>Delivery</li>
                                    <li>Privacy Policy</li>
                            </ul>
                    </div>
                    <div className="footer-content-right">
                            <h2>GET IN TOUCH</h2>
                            <ul>
                                    <li>+94 77 471 8672</li>
                                    <li>+94 77 304 7749</li>
                            </ul>
                    </div>
            </div>
            <hr/>
            <p className='footer-copyright'>Copyright 2025 ©️ CakeFantasy.com - All Rights Reserved.</p>
    </div>
)
}

export default Footer