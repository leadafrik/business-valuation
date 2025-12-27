import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const valuation = await prisma.valuation.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!valuation) {
      return NextResponse.json({ error: "Valuation not found" }, { status: 404 });
    }

    // Parse JSON fields
    const scenarios = valuation.scenariosData
      ? JSON.parse(valuation.scenariosData as string)
      : {};
    const valueDrivers = valuation.valueDriversData
      ? JSON.parse(valuation.valueDriversData as string)
      : [];

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
