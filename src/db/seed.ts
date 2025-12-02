import { db } from ".";
import { users } from "./schema";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

async function seed() {
  const hashedPassword = await bcrypt.hash("adminpassword", 10);

  await db.insert(users).values({
    id: uuidv4(),
    name: "dakjen",
    email: "dakjen@example.com",
    hashedPassword: hashedPassword,
    role: "admin",
  });

  console.log("Admin user 'dakjen' created successfully!");
}

seed();
