/**
 * Test script to verify valuation API with realistic business data
 */

const API_URL = 'http://localhost:3000/api/valuations';

// Realistic test data for a retail business
const testData = {
  businessName: 'TechRetail Kenya Ltd',
  businessDescription: 'Electronics retail shop in Nairobi with online presence',
  sector: 'retail',
  annualRevenue: 5000000, // 5M KES
  ebitda: 750000, // 750K KES (15% margin)
  netIncome: 500000, // 500K KES (10% margin)
  freeCashFlow: 400000, // 400K KES (conservative FCF)
  totalAssets: 2000000, // 2M KES
  totalLiabilities: 800000, // 800K KES (40% debt)
  discountRate: 0.28, // 28% WACC for retail
  terminalGrowthRate: 0.04, // 4% terminal growth
  projectionYears: 5,
  // Scenario weights
  conservativeWeight: 0.3,
  baseWeight: 0.5,
  upSideWeight: 0.2,
};

async function testValuation() {
  console.log('Testing Valuation API...\n');
  console.log('Input Data:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('\n' + '='.repeat(60));

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log(`\nResponse Status: ${response.status}`);
    const result = await response.json();

    if (response.ok) {
      console.log('\n✅ SUCCESS! Valuation calculated:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.id) {
        console.log(`\n📊 Valuation ID: ${result.id}`);
        console.log(`🔗 View at: http://localhost:3000/valuation/${result.id}`);
      }
    } else {
      console.log('\n❌ ERROR:');
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('\n❌ Connection Error:', error.message);
    console.log('\nMake sure the server is running: npm run dev');
  }
}

testValuation();
