import { NextResponse } from "next/server";
import { getMarketplaceStatus } from "@/lib/marketplace";

export async function GET() {
  return NextResponse.json(await getMarketplaceStatus());
}
