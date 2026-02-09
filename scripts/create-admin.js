require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("../src/db");

const run = async () => {
  const cardId = process.argv[2];
  const pin = process.argv[3];
  const fullName = process.argv[4] || "System Admin";

  if (!cardId || !pin) {
    console.log("Usage: node scripts/create-admin.js <cardId> <pin> [fullName]");
    process.exit(1);
  }

  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    const pinHash = await bcrypt.hash(pin, 10);
    const userResult = await client.query(
      `INSERT INTO users (card_id, pin_hash, role)
       VALUES ($1, $2, 'admin')
       RETURNING id, card_id, role, created_at`,
      [cardId, pinHash]
    );
    const employeeResult = await client.query(
      `INSERT INTO employees (user_id, full_name)
       VALUES ($1, $2)
       RETURNING id, full_name, created_at`,
      [userResult.rows[0].id, fullName]
    );
    await client.query("COMMIT");
    console.log("Created admin:", {
      id: employeeResult.rows[0].id,
      card_id: userResult.rows[0].card_id,
      role: userResult.rows[0].role,
      full_name: employeeResult.rows[0].full_name,
      created_at: employeeResult.rows[0].created_at,
    });
    process.exit(0);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
