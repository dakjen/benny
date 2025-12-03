import { db } from ".";
import { users, games, teams } from "./schema";
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

  // Seed a default game
  const [newGame] = await db.insert(games).values({
    name: "Benjamin's 25th Birthday Hunt",
  }).returning({ id: games.id });

  if (newGame) {
    console.log(`Game '${newGame.id}' created successfully!`);

    // Seed some teams for the game
    await db.insert(teams).values([
      { name: "Team Alpha", gameId: newGame.id },
      { name: "Team Beta", gameId: newGame.id },
    ]);
    console.log("Teams 'Team Alpha' and 'Team Beta' created successfully!");
  }
}

seed();
