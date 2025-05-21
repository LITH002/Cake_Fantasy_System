// Login reset script
localStorage.removeItem('adminToken');
localStorage.removeItem('adminUser');
console.log('Admin auth data cleared');
console.log('Please refresh the page and try logging in again with:');
console.log('Email: test@test.com');
console.log('Password: test123');
