// src/app/api/signup/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return new NextResponse('Name, email, and password are required', { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });

    if (existingUser) {
      return new NextResponse('User with this email already exists', { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    // Insert new user into the database
    const newUser = await db.insert(users).values({
      name,
      email,
      hashedPassword: hashedPassword, // Use hashedPassword here
      role: 'user', // Default role
    }).returning();

    return NextResponse.json({ message: 'User registered successfully', user: newUser[0] }, { status: 201 });

  } catch (error) {
    console.error('Signup API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}