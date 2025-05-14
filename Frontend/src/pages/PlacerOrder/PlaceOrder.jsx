import { useContext, useEffect, useState } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const PlaceOrder = () => {
  const { getTotalCartAmount, token, item_list, cartItems, url } = useContext(StoreContext);
  
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

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  // Location state
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (name === "contactNumber1" || name === "contactNumber2") {
      validatePhoneNumber(name, value);
    }
  };
  
  // Phone number validation
  const validatePhoneNumber = (field, value) => {
    if (field === "contactNumber2" && value === "") {
      setErrors(prev => ({ ...prev, [field]: "" }));
      return;
    }
    
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

  // Validate form
  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };
    
    if (!formData.contactNumber1) {
      newErrors.contactNumber1 = "Primary contact number is required";
      isValid = false;
    }
    
    if (formData.contactNumber2 && errors.contactNumber2) {
      isValid = false;
    }
    
    if (!formData.firstName) {
      isValid = false;
    }
    
    if (!formData.lastName) {
      isValid = false;
    }
    
    if (!formData.address) {
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    
    // Validate before submission
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare order items
      const orderItems = item_list
        .filter(item => cartItems[item.id] > 0)
        .map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: cartItems[item.id]
        }));

        if (orderItems.length === 0) {
      setSubmitError("Your cart is empty");
      setIsSubmitting(false);
      return;
      }
    
      console.log("Order items to send:", orderItems);

      // Extract userId from token
      let userId = null;
      if (token) {
        try {
          // Parse JWT token to get user ID
          const tokenPayload = token.split('.')[1];
          const decodedPayload = JSON.parse(atob(tokenPayload));
          userId = decodedPayload.id;
          console.log("Extracted user ID from token:", userId);
        } catch (err) {
          console.error("Failed to extract user ID from token:", err);
        }
      }
      
      // Prepare order data
      const orderData = {
        userId: userId,
        items: orderItems,
        amount: getTotalCartAmount() + 150,
        address: formData.address,
        firstName: formData.firstName,
        lastName: formData.lastName,
        contactNumber1: formData.contactNumber1,
        contactNumber2: formData.contactNumber2 || null,
        specialInstructions: formData.specialInstructions || null
      };
      
      console.log("Order payload:", orderData);
      
      // Submit order
      const response = await axios.post(
        `${url}/api/order/place`,
        orderData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log("Order response:", response.data);
      
      if (response.data.success && response.data.url) {
        // Redirect to payment page
        window.location.href = response.data.url;
      } else {
        setSubmitError(response.data.message || "Error initiating payment");
      }
    } catch (error) {
      console.error("Order error:", error);
      setSubmitError(
        error.response?.data?.message || 
        "Failed to place order. Please try again later."
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Fetch location function
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
          
          if (!response.ok) throw new Error("Failed to fetch address");
          
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
        } catch {
          setLocationError("Could not retrieve your address. Please enter manually.");
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationError(`Error getting location: ${error.message}`);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/cart');
    } else if (getTotalCartAmount() === 0) {
      navigate('/cart');
    }
  },[token])

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
          />
        </div>
      </div>

      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Total</h2>
          <div>
            <div className="card-total-details">
              <p>Subtotal</p>
              <p>LKR {getTotalCartAmount()}</p>
            </div>
            <hr />
            <div className="card-total-details">
              <p>Delivery Fee</p>
              <p>LKR {getTotalCartAmount() === 0 ? 0 : 150}</p>
            </div>
            <hr />
            <div className="card-total-details">
              <b>Total</b>
              <b>LKR {getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 150}</b>
            </div>
          </div>
          
          {submitError && <p className="error-message">{submitError}</p>}
          
          <button 
            type="submit" 
            disabled={
              getTotalCartAmount() === 0 || 
              Object.values(errors).some(error => error) ||
              isSubmitting 
            }
          >
            {isSubmitting ? "Processing..." : "PROCEED TO PAYMENT"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;