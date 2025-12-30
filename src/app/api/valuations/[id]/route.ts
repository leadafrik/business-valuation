import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  // TEMPORARY: Bypass auth for testing - will re-enable later
  // const session = await auth();
  // if (!session?.user?.email) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  try {
    // For now, skip user validation and fetch any valuation by ID
    // const user = await prisma.user.findUnique({
    //   where: { email: session.user.email },
    // });
    // if (!user) {
    //   return NextResponse.json({ error: "User not found" }, { status: 404 });
    // }

    const valuation = await prisma.valuation.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!valuation) {
      return NextResponse.json({ error: "Valuation not found" }, { status: 404 });
    }

    // Parse JSON fields with error handling
    let scenarios = {};
    let valueDrivers: any[] = [];
    
    try {
      if (valuation.scenariosData) {
        // Handle both JSON string and object formats
        scenarios = typeof valuation.scenariosData === 'string'
          ? JSON.parse(valuation.scenariosData)
          : valuation.scenariosData;
      }
    } catch (parseError) {
      console.error('Failed to parse scenariosData:', parseError);
      scenarios = {};
    }
    
    try {
      if (valuation.valueDriversData) {
        // Handle both JSON string and object formats
        valueDrivers = typeof valuation.valueDriversData === 'string'
          ? JSON.parse(valuation.valueDriversData)
          : valuation.valueDriversData;
      }
    } catch (parseError) {
      console.error('Failed to parse valueDriversData:', parseError);
      valueDrivers = [];
    }

    return NextResponse.json({
      id: valuation.id,
      businessName: valuation.businessName,
      sector: valuation.sector,
      finalValuation: valuation.valuationValue,
      scenarios,
      valueDrivers,
      createdAt: valuation.createdAt,
    });
  } catch (error) {
    console.error("Error fetching valuation:", error);
    return NextResponse.json(
      { error: "Failed to fetch valuation" },
      { status: 500 }
    );
  }
}
