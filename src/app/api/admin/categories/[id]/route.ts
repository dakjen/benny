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
    console.log("PUT /api/admin/categories/[id] called. context.params:", context.params);
    const idParam = context.params.id;
    console.log("idParam:", idParam);

    if (typeof idParam !== 'string') {
      console.error("Invalid category ID format: idParam is not a string.", idParam);
      return NextResponse.json({ message: "Invalid category ID format." }, { status: 400 });
    }
    const categoryId = Number(idParam);
    console.log("categoryId after Number(idParam):", categoryId);

    if (isNaN(categoryId)) {
      console.error("Invalid category ID: categoryId is NaN.", idParam);
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
    console.error("Error updating category in /api/admin/categories/[id]:", error);
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
    console.log("DELETE /api/admin/categories/[id] called. context.params:", context.params);
    const idParam = context.params.id;
    console.log("idParam:", idParam);

    if (typeof idParam !== 'string') {
      console.error("Invalid category ID format: idParam is not a string.", idParam);
      return NextResponse.json({ message: "Invalid category ID format." }, { status: 400 });
    }
    const categoryId = Number(idParam);
    console.log("categoryId after Number(idParam):", categoryId);

    if (isNaN(categoryId)) {
      console.error("Invalid category ID: categoryId is NaN.", idParam);
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
    console.error("Error deleting category in /api/admin/categories/[id]:", error);
    return NextResponse.json(
      { message: "An error occurred while deleting the category." },
      { status: 500 }
    );
  }
}