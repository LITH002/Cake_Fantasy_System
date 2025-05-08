//import React from 'react'
import { useContext, useState } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../context/StoreContext";

const PlaceOrder = () => {
  const { getTotalCartAmount } = useContext(StoreContext);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    contactNumber1: "",
    contactNumber2: "",
    specialInstructions: ""
  });
  
  // Validation state
  const [errors, setErrors] = useState({
    contactNumber1: "",
    contactNumber2: ""
  });
  
  // Location state
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Validate phone numbers as they're entered
    if (name === "contactNumber1" || name === "contactNumber2") {
      validatePhoneNumber(name, value);
    }
  };
  
  // Phone number validation
  const validatePhoneNumber = (field, value) => {
    // Skip validation if field is empty and it's the secondary contact
    if (field === "contactNumber2" && value === "") {
      setErrors(prev => ({ ...prev, [field]: "" }));
      return;
    }
    
    // Sri Lanka phone number validation
    // Allows formats like: 0771234567, 071-123-4567, +94 77 123 4567
    const phoneRegex = /^(?:\+94|0)(?:7\d|11|25|26|31|32|33|34|35|36|37|38|41|45|47|51|52|54|55|57|63|65|66|67|81|91|94|)\d{7}$/;
    
    if (!phoneRegex.test(value.replace(/[\s-]/g, ''))) {
      setErrors(prev => ({ 
        ...prev, 
        [field]: "Please enter a valid Sri Lankan phone number"
      }));
    } else {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };
  
  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    let isValid = true;
    const newErrors = { ...errors };
    
    if (!formData.contactNumber1) {
      newErrors.contactNumber1 = "Primary contact number is required";
      isValid = false;
    }
    
    // If second number is provided, validate it
    if (formData.contactNumber2 && errors.contactNumber2) {
      isValid = false;
    }
    
    setErrors(newErrors);
    
    if (isValid) {
      // Process the order submission
      console.log("Order form data:", formData);
      // Proceed with payment logic here
    }
  };
  
  // Fetch location function (unchanged)
  const fetchLocation = () => {
    setLocationLoading(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLocationLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          
          if (!response.ok) {
            throw new Error("Failed to fetch address");
          }
          
          const data = await response.json();
          
          const addressComponents = data.address;
          const formattedAddress = `${addressComponents.road || ''} ${addressComponents.house_number || ''}, 
                                    ${addressComponents.suburb || addressComponents.neighbourhood || ''}, 
                                    ${addressComponents.city || addressComponents.town || addressComponents.village || ''}, 
                                    ${addressComponents.postcode || ''}`;
          
          setFormData(prev => ({
            ...prev,
            address: formattedAddress.trim()
          }));
          setLocationLoading(false);
        } catch (error) {
          console.error("Error fetching address:", error);
          setLocationError("Could not retrieve your address. Please enter manually.");
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationError(`Error getting location: ${error.message}`);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <form className="place-order" onSubmit={handleSubmit}>
      <div className="place-order-left">
        <p className="title">Delivery Information</p>
        
        <div className="multi-fields">
          <input 
            type="text" 
            placeholder="First Name" 
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            required
          />
          <input 
            type="text" 
            placeholder="Last Name" 
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="address-field">
          <input 
            type="text" 
            placeholder="Address" 
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            required
          />
          <button 
            type="button" 
            className="location-btn" 
            onClick={fetchLocation}
            disabled={locationLoading}
          >
            {locationLoading ? "Getting Location..." : "Get My Location"}
          </button>
        </div>
        
        {locationError && <p className="error-message">{locationError}</p>}
        
        <div className="input-group">
          <input 
            type="text" 
            placeholder="Contact Number 1" 
            name="contactNumber1"
            value={formData.contactNumber1}
            onChange={handleInputChange}
            required
            className={errors.contactNumber1 ? "input-error" : ""}
          />
          {errors.contactNumber1 && <p className="error-message">{errors.contactNumber1}</p>}
        </div>
        
        <div className="input-group">
          <input 
            type="text" 
            placeholder="Contact Number 2 (Optional)" 
            name="contactNumber2"
            value={formData.contactNumber2}
            onChange={handleInputChange}
            className={errors.contactNumber2 ? "input-error" : ""}
          />
          {errors.contactNumber2 && <p className="error-message">{errors.contactNumber2}</p>}
        </div>
        
        <div className="input-group">
          <textarea
            placeholder="Special Instructions (Optional)"
            name="specialInstructions"
            value={formData.specialInstructions}
            onChange={handleInputChange}
            rows="3"
            className="special-instructions"
          ></textarea>
        </div>
      </div>

      <div className="place-order-right">
        <div className="cart-total">
          <h2>Card Total</h2>
          <div>
            <div className="card-total-details">
              <p>Subtotal</p>
              <p>LKR {getTotalCartAmount()}</p>
            </div>
            <hr />
            <div className="card-total-details">
              <p>Delivery Fee</p>
              <p>LKR {getTotalCartAmount()===0?0:150}</p>
            </div>
            <hr />
            <div className="card-total-details">
              <b>Total</b>
              <b>LKR {getTotalCartAmount()===0?0:getTotalCartAmount()+150}</b>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={getTotalCartAmount() === 0 || Object.values(errors).some(error => error)}
          >
            PROCEED TO PAYMENT
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;