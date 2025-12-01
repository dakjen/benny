import { db } from ".";
import { users } from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  const hashedPassword = await bcrypt.hash("adminpassword", 10);

  await db.insert(users).values({
    name: "dakjen",
    email: "dakjen@example.com",
    password: hashedPassword,
    role: "admin",
  });

  console.log("Admin user 'dakjen' created successfully!");
}

seed();
