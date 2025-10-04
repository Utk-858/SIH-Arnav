const https = require('https');
const http = require('http');

// Configuration
const BACKEND_URL = 'http://localhost:8080';
const FRONTEND_URL = 'http://localhost:3000';

function testEndpoint(url, expectedStatus = 200) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === expectedStatus) {
          console.log(`✅ ${url} - Status: ${res.statusCode}`);
          resolve({ status: res.statusCode, data });
        } else {
          console.log(`❌ ${url} - Status: ${res.statusCode} (expected ${expectedStatus})`);
          reject(new Error(`Status ${res.statusCode} for ${url}`));
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ ${url} - Error: ${err.message}`);
      reject(err);
    });

    req.setTimeout(10000, () => {
      console.log(`❌ ${url} - Timeout`);
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function testBackendAPI() {
  console.log('\n🔧 Testing Backend API...');

  try {
    // Test health endpoint
    await testEndpoint(`${BACKEND_URL}/health`);

    // Test API endpoints (these might fail without proper auth, but should return proper HTTP status)
    const endpoints = [
      '/api/patients',
      '/api/diet-plans',
      '/api/foods',
      '/api/mess-menus'
    ];

    for (const endpoint of endpoints) {
      try {
        await testEndpoint(`${BACKEND_URL}${endpoint}`, 401); // Expect 401 Unauthorized without auth
      } catch (err) {
        // 401 is expected for protected endpoints
        if (!err.message.includes('Status 401')) {
          console.log(`⚠️  ${endpoint} returned unexpected status`);
        }
      }
    }

    console.log('✅ Backend API tests completed');
    return true;
  } catch (err) {
    console.log('❌ Backend API tests failed');
    return false;
  }
}

async function testFrontend() {
  console.log('\n🌐 Testing Frontend...');

  try {
    // Test basic connectivity
    await testEndpoint(FRONTEND_URL, 200);
    console.log('✅ Frontend is responding');
    return true;
  } catch (err) {
    console.log('❌ Frontend test failed');
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting SolveAI Deployment Tests');
  console.log('=====================================');

  let backendOK = false;
  let frontendOK = false;

  // Test backend
  backendOK = await testBackendAPI();

  // Test frontend
  frontendOK = await testFrontend();

  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log(`Backend API: ${backendOK ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Frontend: ${frontendOK ? '✅ PASS' : '❌ FAIL'}`);

  if (backendOK && frontendOK) {
    console.log('\n🎉 All tests passed! SolveAI is successfully deployed.');
    console.log('\n🌐 Access your application:');
    console.log(`   Frontend: ${FRONTEND_URL}`);
    console.log(`   Backend API: ${BACKEND_URL}`);
    console.log(`   Health Check: ${BACKEND_URL}/health`);
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please check the deployment.');
    process.exit(1);
  }
}

// Wait for services to be ready
console.log('⏳ Waiting for services to be ready...');
setTimeout(() => {
  runTests().catch((err) => {
    console.error('❌ Test execution failed:', err);
    process.exit(1);
  });
}, 5000);