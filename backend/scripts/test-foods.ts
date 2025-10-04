// Test script for food API routes

import express from 'express';
import foodRoutes from '../src/routes/foods';

const app = express();
app.use(express.json());
app.use('/api/foods', foodRoutes);

const PORT = 3002;

// Start test server
const server = app.listen(PORT, () => {
  console.log(`🧪 Test server running on port ${PORT}`);
});

// Test functions
async function testFoodSearch() {
  console.log('\n=== Testing Food Search ===');

  try {
    const response = await fetch(`http://localhost:${PORT}/api/foods/search?query=apple&limit=5`);
    const data: any = await response.json();

    if (data.success) {
      console.log(`✅ Found ${data.count} foods for "apple"`);
      console.log('Sample result:', data.data[0]?.name);
    } else {
      console.log('❌ Search failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Search error:', error);
  }
}

async function testNutrientQuery() {
  console.log('\n=== Testing Nutrient Query ===');

  try {
    const response = await fetch(`http://localhost:${PORT}/api/foods/nutrient?nutrient=protcnt&min=10&max=15&limit=5`);
    const data: any = await response.json();

    if (data.success) {
      console.log(`✅ Found ${data.count} foods with protein 10-15g`);
      console.log('Sample result:', data.data[0]?.name);
    } else {
      console.log('❌ Nutrient query failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Nutrient query error:', error);
  }
}

async function testFoodByCode() {
  console.log('\n=== Testing Food by Code ===');

  try {
    // First get a food code from search
    const searchResponse = await fetch(`http://localhost:${PORT}/api/foods/search?query=apple&limit=1`);
    const searchData: any = await searchResponse.json();

    console.log('Search response:', JSON.stringify(searchData, null, 2));
    if (searchData.success && searchData.data.length > 0) {
      const foodCode = searchData.data[0]['\ufeffcode'] || searchData.data[0].code;
      console.log(`Looking up food with code: ${foodCode}`);
      const response = await fetch(`http://localhost:${PORT}/api/foods/${foodCode}`);
      const data: any = await response.json();

      if (data.success) {
        console.log(`✅ Found food by code ${foodCode}:`, data.data.name);
      } else {
        console.log('❌ Food by code failed:', data.error);
      }
    } else {
      console.log('❌ No search results found for apple');
    }
  } catch (error) {
    console.log('❌ Food by code error:', error);
  }
}

// Run tests
async function runTests() {
  await testFoodSearch();
  await testNutrientQuery();
  await testFoodByCode();

  console.log('\n🎉 All tests completed!');
  server.close();
}

// Start tests after a short delay to ensure server is ready
setTimeout(runTests, 1000);