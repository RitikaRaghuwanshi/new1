require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  console.log('🔍 Testing MongoDB Atlas Connection...\n');
  
  // Hide password in logs
  const maskedURI = process.env.MONGO_URI.replace(/\/\/[^:]+:([^@]+)@/, '//***:***@');
  console.log('Connection URI:', maskedURI);
  
  const options = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
  };
  
  try {
    console.log('\n📡 Attempting to connect...');
    await mongoose.connect(process.env.MONGO_URI, options);
    
    console.log('✅ Connected successfully!');
    console.log('📊 Database name:', mongoose.connection.name);
    console.log('🔄 Connection state:', mongoose.connection.readyState);
    
    await mongoose.disconnect();
    console.log('\n✅ Test completed successfully');
    process.exit(0);
    
  } catch (err) {
    console.error('\n❌ Connection failed:');
    console.error('Error type:', err.name);
    console.error('Error message:', err.message);
    
    if (err.code) console.error('Error code:', err.code);
    if (err.reason) console.error('Reason:', err.reason);
    
    // Specific error guidance
    if (err.message.includes('ECONNREFUSED')) {
      console.error('\n💡 This usually means:');
      console.error('   - The cluster is paused (check Atlas dashboard)');
      console.error('   - Network firewall blocking port 27017');
      console.error('   - DNS resolution issue');
    }
    
    if (err.message.includes('Authentication failed')) {
      console.error('\n💡 Authentication failed: Check username/password');
    }
    
    process.exit(1);
  }
}

testConnection();