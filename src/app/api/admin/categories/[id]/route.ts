import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

// Removed RouteContext interface

export async function PUT(
  request: NextRequest,
  context: any // Using 'any' as a workaround for stubborn type inference issues
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const idParam = context.params.id;
    if (typeof idParam !== 'string') {
      return NextResponse.json({ message: "Invalid category ID format." }, { status: 400 });
    }
    const categoryId = Number(idParam);
    if (isNaN(categoryId)) {
      return NextResponse.json({ message: "Invalid category ID." }, { status: 400 });
    }

    const { name, isSequential, order } = await request.json();

    if (!name) {
      return NextResponse.json({ message: "Category name is required." }, { status: 400 });
    }

    const updatedCategory = await db
      .update(categories)
      .set({ 
        name,
        isSequential: isSequential,
        order: order,
      })
      .where(eq(categories.id, categoryId))
      .returning();

    if (updatedCategory.length === 0) {
      return NextResponse.json({ message: "Category not found." }, { status: 404 });
    }

    return NextResponse.json(updatedCategory[0], { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while updating the category." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: any // Using 'any' as a workaround for stubborn type inference issues
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const idParam = context.params.id;
    if (typeof idParam !== 'string') {
      return NextResponse.json({ message: "Invalid category ID format." }, { status: 400 });
    }
    const categoryId = Number(idParam);
    if (isNaN(categoryId)) {
      return NextResponse.json({ message: "Invalid category ID." }, { status: 400 });
    }

    const deletedCategory = await db
      .delete(categories)
      .where(eq(categories.id, categoryId))
      .returning();

    if (deletedCategory.length === 0) {
      return NextResponse.json({ message: "Category not found." }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Category deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while deleting the category." },
      { status: 500 }
    );
  }
}