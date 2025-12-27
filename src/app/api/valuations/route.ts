import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateDCF, estimateFCF } from "@/lib/valuation/dcf";
import {
  calculateComparableValuation,
  getSectorMultiples,
} from "@/lib/valuation/comparable";
import { calculateAssetBasedValuation } from "@/lib/valuation/assetBased";
import {
  getWACC,
  KENYAN_SECTOR_PROFILES,
} from "@/lib/valuation/sectorData";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      businessName,
      businessDescription,
      sector,
      annualRevenue,
      ebitda,
      netIncome,
      freeCashFlow,
      totalAssets,
      totalLiabilities,
      discountRate,
      terminalGrowth = 0.04,
      projectionYears = 5,
    } = body;

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prepare assumptions
    const assumptions: Record<string, any> = {
      annualRevenue,
      ebitda,
      netIncome,
      freeCashFlow,
      totalAssets,
      totalLiabilities,
      discountRate: discountRate || getWACC(sector),
      terminalGrowth,
      projectionYears,
    };

    // Calculate valuations
    const sectorProfile = KENYAN_SECTOR_PROFILES[sector];
    const wacc = discountRate || getWACC(sector);

    const results: any[] = [];

    // 1. DCF Valuation (if FCF or EBITDA available)
    if (freeCashFlow || ebitda) {
      const fcf =
        freeCashFlow || estimateFCF(ebitda!, 0, netIncome ? ebitda! * 0.3 : 0);
      const growthRate = 0.1; // 10% default

      try {
        const dcfResult = calculateDCF({
          freeCashFlow: fcf,
          growthRate,
          discountRate: wacc,
          projectionYears,
          terminalGrowth,
        });

        results.push({
          type: "dcf",
          value: dcfResult.enterpriseValue,
          assumptions: {
            freeCashFlow: fcf,
            growthRate,
            discountRate: wacc,
            projectionYears,
            terminalGrowth,
          },
        });
      } catch (error) {
        console.log("DCF calculation error:", error);
      }
    }

    // 2. Comparable Valuation - Revenue Multiple
    if (annualRevenue) {
      const revenueMultiples = getSectorMultiples(
        sector as any,
        "revenue"
      );
      if (revenueMultiples) {
        const avgMultiple = (revenueMultiples.min + revenueMultiples.max) / 2;
        const comparableResult = calculateComparableValuation({
          annualRevenue,
          multiple: avgMultiple,
          multipleType: "revenue",
        });

        results.push({
          type: "comparable_revenue",
          value: comparableResult.valuationValue,
          multiple: avgMultiple,
          assumptions: {
            annualRevenue,
            multiple: avgMultiple,
            multipleRange: revenueMultiples,
          },
        });
      }
    }

    // 3. Comparable Valuation - EBITDA Multiple
    if (ebitda) {
      const ebitdaMultiples = getSectorMultiples(sector as any, "ebitda");
      if (ebitdaMultiples) {
        const avgMultiple = (ebitdaMultiples.min + ebitdaMultiples.max) / 2;
        const comparableResult = calculateComparableValuation({
          annualRevenue,
          ebitda,
          multiple: avgMultiple,
          multipleType: "ebitda",
        });

        results.push({
          type: "comparable_ebitda",
          value: comparableResult.valuationValue,
          multiple: avgMultiple,
          assumptions: {
            ebitda,
            multiple: avgMultiple,
            multipleRange: ebitdaMultiples,
          },
        });
      }
    }

    // 4. Asset-Based Valuation
    if (totalAssets && totalLiabilities !== undefined) {
      const assetResult = calculateAssetBasedValuation({
        totalAssets,
        totalLiabilities,
      });

      results.push({
        type: "asset_based",
        value: assetResult.adjustedNetAssetValue,
        assumptions: {
          totalAssets,
          totalLiabilities,
          netAssetValue: assetResult.netAssetValue,
        },
      });
    }

    // Calculate weighted average valuation
    let weightedValue = 0;
    let totalWeight = 0;

    results.forEach((result) => {
      let weight = 0.25; // Default equal weighting
      if (result.type === "dcf") weight = 0.4; // Higher weight for DCF
      if (result.type === "asset_based") weight = 0.2; // Lower weight for asset

      weightedValue += result.value * weight;
      totalWeight += weight;
    });

    const finalValuation =
      weightedValue > 0 ? weightedValue / totalWeight : 0;

    // Save valuation to database
    const savedValuation = await prisma.valuation.create({
      data: {
        userId: user.id,
        businessName,
        businessDescription,
        sector,
        annualRevenue,
        ebitda,
        netIncome,
        freeCashFlow,
        totalAssets,
        totalLiabilities,
        discountRate: wacc,
        terminalGrowth,
        projectionYears,
        valuationType: "multiple",
        valuationValue: finalValuation,
        assumptions,
      },
    });

    return NextResponse.json({
      id: savedValuation.id,
      valuations: results,
      finalValuation,
      sector: sectorProfile,
      savedAt: savedValuation.createdAt,
    });
  } catch (error) {
    console.error("Valuation calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate valuation" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        valuations: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user.valuations);
  } catch (error) {
    console.error("Error fetching valuations:", error);
    return NextResponse.json(
      { error: "Failed to fetch valuations" },
      { status: 500 }
    );
  }
}
