import React, { useContext, useEffect, useState, useCallback } from 'react'
import './Verify.css'
import { useSearchParams } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'
import axios from 'axios'

const Verify = () => {
    const [searchParams] = useSearchParams();
    const success = searchParams.get("success");
    const orderId = searchParams.get("orderId");
    const {url} = useContext(StoreContext);
    const [loading, setLoading] = useState(true);
    const [verificationStatus, setVerificationStatus] = useState({
        isVerified: false,
        message: ''
    });

    const verifyPayment = useCallback(async () => {
        try {
            const response = await axios.post(url + "/api/order/verify", {success, orderId});
            if (response.data.success) {
                setVerificationStatus({
                    isVerified: true,
                    message: 'Payment successful! Your order has been placed.'
                });
            } else {
                setVerificationStatus({
                    isVerified: false,
                    message: response.data.message || 'Payment verification failed. Please contact support.'
                });
            }
        } catch (error) {
            console.error("Payment verification error:", error);
            setVerificationStatus({
                isVerified: false,
                message: 'An error occurred during payment verification. Please contact support.'
            });
        } finally {
            setLoading(false);
        }
    }, [url, success, orderId]);

    useEffect(() => {
        if (orderId && success !== null) {
            verifyPayment();
        } else {
            setLoading(false);
            setVerificationStatus({
                isVerified: false,
                message: 'Invalid payment information. Please contact support.'
            });
        }
    }, [orderId, success, verifyPayment]);

    const handleViewOrders = () => {
        // Ensure we stay in the customer frontend by using fully qualified URL
        window.location.href = "http://localhost:5173/myorders";
    };

    const handleGoHome = () => {
        // Navigate to customer's home page with absolute URL
        window.location.href = "http://localhost:5173/";
    };

    const handleShopMore = () => {
        // Navigate to customer's product listing page with absolute URL
        window.location.href = "http://localhost:5173/viewitems";
    };

    return (
        <div className='verify'>
            {loading ? (
                <div className="verify-container">
                    <div className="spinner"></div>
                    <p className="loading-text">Verifying your payment...</p>
                </div>
            ) : (
                <div className="payment-status">
                    <div className={`status-icon ${verificationStatus.isVerified ? 'success' : 'failure'}`}>
                        {verificationStatus.isVerified ? '✓' : '✗'}
                    </div>
                    <h2>{verificationStatus.isVerified ? 'Payment Successful!' : 'Payment Issue'}</h2>
                    <p>{verificationStatus.message}</p>
                    <div className="action-buttons">
                        {verificationStatus.isVerified ? (
                            <>
                                <button className="view-orders-btn" onClick={handleViewOrders}>View My Orders</button>
                                <button className="shop-more-btn" onClick={handleShopMore}>Continue Shopping</button>
                            </>
                        ) : (
                            <button className="go-home-btn" onClick={handleGoHome}>Return to Home</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Verify
