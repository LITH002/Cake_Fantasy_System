import { useNavigate } from 'react-router-dom';
import './Footer.css';
import assets from '../../assets/assets';

const Footer = () => {
  const navigate = useNavigate();

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleNavigation = (path) => {
    navigate(path);
    scrollToTop();
  };

  return (
    <div className='footer' id='footer'>
      <div className="footer-content">
        <div className="footer-content-left">
          <img src={assets.font} alt="Cake Fantasy Logo"/>
          <p>Your one-stop shop for all your baking needs</p>
          <div className="footer-social-icons">
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
              <img src={assets.facebook} alt="Facebook" />
            </a>
            <a href="https://wa.me/+94774718672" target="_blank" rel="noopener noreferrer">
              <img src={assets.whatsapp} alt="WhatsApp" />
            </a>
            <a href="https://goo.gl/maps" target="_blank" rel="noopener noreferrer">
              <img src={assets.location} alt="Location" />
            </a>
          </div>
        </div>
        <div className="footer-content-center">
          <h2>COMPANY</h2>
          <ul>
            <li onClick={() => handleNavigation('/')}>Home</li>
            <li onClick={() => handleNavigation('/viewitems')}>View Items</li>
            <li onClick={() => handleNavigation('/aboutus')}>About Us</li>
            <li onClick={() => handleNavigation('/privacy')}>Privacy Policy</li>
          </ul>
        </div>
        <div className="footer-content-right">
          <h2>GET IN TOUCH</h2>
          <ul>
            <li>
              <a href="tel:+94774718672">+94 77 471 8672</a>
            </li>
            <li>
              <a href="tel:+94773047749">+94 77 304 7749</a>
            </li>
            <li>
              <a href="mailto:info@cakefantasy.com">info@cakefantasy.com</a>
            </li>
          </ul>
        </div>
      </div>
      <hr/>
      <div className="footer-bottom">
        <p className='footer-copyright'>Copyright 2025 ©️ CakeFantasy.com - All Rights Reserved.</p>
        <button className="back-to-top" onClick={scrollToTop}>↑ Back to Top</button>
      </div>
    </div>
  );
};

export default Footer;