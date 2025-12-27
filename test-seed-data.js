#!/usr/bin/env node

/**
 * Seed Data Test for Business Valuation Tool
 * Tests complete flow with realistic business scenarios
 */

const scenarios = [
  {
    name: "Retail Tech Distributor",
    sector: "retail",
    data: {
      businessName: "Tech Hub Kenya",
      businessDescription: "Leading IT hardware and software distributor across East Africa",
      sector: "retail",
      annualRevenue: 50000000,      // 50M KES
      ebitda: 7500000,               // 7.5M KES (15% margin)
      netIncome: 5000000,             // 5M KES (10% margin)
      freeCashFlow: 4000000,          // 4M KES
      totalAssets: 25000000,          // 25M KES
      totalLiabilities: 10000000,     // 10M KES (40% leverage)
      discountRate: 0.18,             // 18% WACC
      terminalGrowth: 0.04,
      projectionYears: 5,
    },
    expectedRange: { min: 55000000, max: 90000000 }
  },
  {
    name: "Hospitality - Safari Lodge",
    sector: "hospitality",
    data: {
      businessName: "Safari Lodge East Africa",
      businessDescription: "5-star eco-tourism lodge in Maasai Mara National Reserve",
      sector: "hospitality",
      annualRevenue: 25000000,        // 25M KES
      ebitda: 5000000,                // 5M KES (20% margin)
      netIncome: 3000000,             // 3M KES (12% margin)
      freeCashFlow: 2400000,          // 2.4M KES
      totalAssets: 80000000,          // 80M KES (high asset base)
      totalLiabilities: 40000000,     // 40M KES (50% leverage)
      discountRate: 0.20,             // 20% WACC (higher risk)
      terminalGrowth: 0.04,
      projectionYears: 5,
    },
    expectedRange: { min: 15000000, max: 35000000 }
  },
  {
    name: "Tech - FinTech Startup",
    sector: "technology",
    data: {
      businessName: "FinTech Solutions Kenya",
      businessDescription: "Mobile money and digital lending platform for underbanked Africans",
      sector: "technology",
      annualRevenue: 100000000,       // 100M KES
      ebitda: 25000000,               // 25M KES (25% margin - tech margins)
      netIncome: 18000000,            // 18M KES (18% margin)
      freeCashFlow: 14400000,         // 14.4M KES
      totalAssets: 35000000,          // 35M KES (low capital intensive)
      totalLiabilities: 5000000,      // 5M KES (14% leverage - healthy)
      discountRate: 0.16,             // 16% WACC (lower risk)
      terminalGrowth: 0.05,           // 5% terminal growth (higher for tech)
      projectionYears: 5,
    },
    expectedRange: { min: 120000000, max: 200000000 }
  },
  {
    name: "Agribusiness - Coffee Exporter",
    sector: "agribusiness",
    data: {
      businessName: "Kenya Premium Coffee Export Ltd",
      businessDescription: "Specialty Arabica coffee producer and exporter to Europe and Asia",
      sector: "agribusiness",
      annualRevenue: 30000000,        // 30M KES
      ebitda: 4200000,                // 4.2M KES (14% margin)
      netIncome: 2400000,             // 2.4M KES (8% margin)
      freeCashFlow: 1920000,          // 1.92M KES
      totalAssets: 20000000,          // 20M KES
      totalLiabilities: 8000000,      // 8M KES (40% leverage)
      discountRate: 0.19,             // 19% WACC (commodity risk)
      terminalGrowth: 0.04,
      projectionYears: 5,
    },
    expectedRange: { min: 12000000, max: 28000000 }
  },
  {
    name: "Manufacturing - Plastics Processor",
    sector: "manufacturing",
    data: {
      businessName: "Kenya Plastics Solutions Ltd",
      businessDescription: "Plastic bottle and film manufacturing for beverages and agriculture",
      sector: "manufacturing",
      annualRevenue: 45000000,        // 45M KES
      ebitda: 6300000,                // 6.3M KES (14% margin)
      netIncome: 3600000,             // 3.6M KES (8% margin)
      freeCashFlow: 2880000,          // 2.88M KES
      totalAssets: 45000000,          // 45M KES (capital intensive)
      totalLiabilities: 22500000,     // 22.5M KES (50% leverage)
      discountRate: 0.19,             // 19% WACC
      terminalGrowth: 0.04,
      projectionYears: 5,
    },
    expectedRange: { min: 25000000, max: 50000000 }
  },
];

async function testScenario(scenario) {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`📊 Testing: ${scenario.name}`);
  console.log(`Sector: ${scenario.sector}`);
  console.log(`${"=".repeat(80)}`);

  try {
    const response = await fetch("http://localhost:3000/api/valuations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(scenario.data),
    });

    if (!response.ok) {
      console.error(`❌ Failed: ${response.status}`);
      const error = await response.json();
      console.error("Error:", error);
      return false;
    }

    const result = await response.json();
    const base = result.scenarios?.base?.weightedValue || 0;
    const conservative = result.scenarios?.conservative?.weightedValue || 0;
    const upside = result.scenarios?.upside?.weightedValue || 0;

    console.log(`\n✅ Valuation Calculated:`);
    console.log(`   Conservative: KES ${conservative.toLocaleString()}`);
    console.log(`   Base:         KES ${base.toLocaleString()}`);
    console.log(`   Upside:       KES ${upside.toLocaleString()}`);

    // Verify ordering
    const correct = conservative <= base && base <= upside;
    console.log(`   Ordering:     ${correct ? "✅ CORRECT" : "❌ WRONG"}`);

    // Check expected range
    const inRange = base >= scenario.expectedRange.min && base <= scenario.expectedRange.max;
    console.log(`   Expected:     KES ${scenario.expectedRange.min.toLocaleString()} - ${scenario.expectedRange.max.toLocaleString()}`);
    console.log(`   In Range:     ${inRange ? "✅ YES" : "⚠️ OUTSIDE RANGE"}`);

    // Check WACC values
    const consWACC = result.scenarios?.conservative?.assumptions?.wacc || 0;
    const baseWACC = result.scenarios?.base?.assumptions?.wacc || 0;
    const upWACC = result.scenarios?.upside?.assumptions?.wacc || 0;

    console.log(`\n📈 WACC Values:`);
    console.log(`   Conservative: ${(consWACC * 100).toFixed(1)}%`);
    console.log(`   Base:         ${(baseWACC * 100).toFixed(1)}%`);
    console.log(`   Upside:       ${(upWACC * 100).toFixed(1)}%`);

    // Check value drivers
    const drivers = result.valueDrivers || [];
    console.log(`\n🎯 Value Drivers: ${drivers.length} identified`);
    if (drivers.length > 0) {
      drivers.slice(0, 2).forEach(d => {
        console.log(`   • ${d.action} (+${d.impact}%)`);
      });
    }

    return correct && inRange;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log(`\n${"#".repeat(80)}`);
  console.log(`# Business Valuation Tool - Seed Data Test`);
  console.log(`# Testing ${scenarios.length} scenarios`);
  console.log(`${"#".repeat(80)}`);

  let passed = 0;
  let failed = 0;

  for (const scenario of scenarios) {
    const success = await testScenario(scenario);
    if (success) {
      passed++;
    } else {
      failed++;
    }
    // Small delay between requests
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log(`📋 Test Summary:`);
  console.log(`   Passed: ${passed}/${scenarios.length} ✅`);
  console.log(`   Failed: ${failed}/${scenarios.length} ${failed > 0 ? "❌" : ""}`);
  console.log(`${"=".repeat(80)}`);

  if (failed === 0) {
    console.log(`\n✨ All tests passed! Application is working correctly.`);
    console.log(`\nReady to commit changes.`);
  } else {
    console.log(`\n⚠️ Some tests failed. Review the errors above.`);
  }
}

// Wait for server to be ready
setTimeout(runTests, 2000);
