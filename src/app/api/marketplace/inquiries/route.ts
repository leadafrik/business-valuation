import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const inquiries = await prisma.listingInquiry.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        {
          tenantProfile: {
            is: {
              userId: session.user.id,
            },
          },
        },
      ],
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          monthlyRent: true,
          status: true,
          property: {
            select: {
              name: true,
              city: true,
            },
          },
        },
      },
      messages: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return NextResponse.json({ inquiries });
}
