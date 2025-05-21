// Login fix script

// Import the CSS globally - Corrected path (assuming CSS is in src/Components/LoadingStates/)
import '../Components/LoadingStates/LoadingStates.css';

// Function to test login
async function testLogin() {
  console.log('Testing login with test credentials...');
  
  try {
    const response = await fetch('http://localhost:4000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'test123'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Login successful:', data.user);
      
      // Save auth data
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      
      console.log('Auth data saved. Reloading page...');
      window.location.reload();
    } else {
      console.error('Login failed:', data.message);
    }
  } catch (error) {
    console.error('Login request failed:', error);
  }
}

// Function to clear auth data
function clearAuth() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  console.log('Auth data cleared. Reloading page...');
  window.location.reload();
}

// Add to window for easy access from browser console
window.testLogin = testLogin;
window.clearAuth = clearAuth;

console.log('Login helper functions loaded.');
console.log('To test login: call testLogin()');
console.log('To clear auth data: call clearAuth()');

export { testLogin, clearAuth };