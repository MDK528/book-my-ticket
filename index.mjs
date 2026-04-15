//  CREATE TABLE seats (
//      id SERIAL PRIMARY KEY,
//      name VARCHAR(255),
//      isbooked INT DEFAULT 0
//  );
// INSERT INTO seats (isbooked)
// SELECT 0 FROM generate_series(1, 20);

import "dotenv/config" ;
import express from "express";
import pg from "pg";
import { dirname } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import authenticate from "./middleware/auth.middleware.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const port = process.env.PORT || 8080;

// Equivalent to mongoose connection
// Pool is nothing but group of connections
// If you pick one connection out of the pool and release it
// the pooler will keep that connection open for sometime to other clients to reuse
const pool = new pg.Pool({
  host: "localhost",
  port: 5433,
  user: "postgres",
  password: "postgres",
  database: "sql_class_2_db",
  max: 20,
  connectionTimeoutMillis: 0,
  idleTimeoutMillis: 0,
});

const app = new express();
app.use(cors());

app.use(express.json())

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/register", async(req, res)=>{
  const {name, email, password} = req.body

  if (!name || !email || !password) {
    return res.status(400).send({ error: "All fields are required" })
  }

  const conn = await pool.connect()

  try {
    const existingUser = await conn.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    )

    if (existingUser.rowCount > 0) {
      return res.status(400).send({ error: "Email already exist" })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await conn.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, hashedPassword]
    );

    res.status(201).send({data: user.rows[0]})

  } catch (err) {
    console.log(err)
    res.send(500).send({error: "Something went wron while registering"})
  }
  conn.release()
})

app.post("/login", async(req, res)=>{
  const {email, password} = req.body

  if (!email || !password) {
    return res.status(400).send({ error: "All fields are required" })
  }

  const conn = await pool.connect()

  try{
    const user = await conn.query('SELECT email, password FROM users WHERE email =  $1', [email])

    if (user.rowCount === 0) {
      return res.status(401).send({ error: "Invalid Email or Password" })
    }

    const isPasswordMatch = await bcrypt.compare(password, user.rows[0].password)

    if (!isPasswordMatch) {
      return res.status(401).send({ error: "Invalid Email or Password" })
    }

    const token = jwt.sign(
      { id: user.rows[0].id },

      process.env.JWT_TOKEN_SECRET,

      { expiresIn: process.env.JWT_TOKEN_EXPIRY }
    )

    res.send({ token })
  }catch(err){
    console.log(err)
    res.status(500).send({ error: "Something went wrong while logging in" })
  }

  conn.release()
})

//get all seats
app.get("/seats", async (req, res) => {
  const result = await pool.query("select * from seats"); // equivalent to Seats.find() in mongoose
  res.send(result.rows);
});

//book a seat give the seatId and your name

app.put("/:id/:name", authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    const name = req.params.name;
    // payment integration should be here
    // verify payment
    const conn = await pool.connect(); // pick a connection from the pool
    //begin transaction
    // KEEP THE TRANSACTION AS SMALL AS POSSIBLE
    await conn.query("BEGIN");
    //getting the row to make sure it is not booked
    /// $1 is a variable which we are passing in the array as the second parameter of query function,
    // Why do we use $1? -> this is to avoid SQL INJECTION
    // (If you do ${id} directly in the query string,
    // then it can be manipulated by the user to execute malicious SQL code)
    const sql = "SELECT * FROM seats where id = $1 and isbooked = 0 FOR UPDATE";
    const result = await conn.query(sql, [id]);

    //if no rows found then the operation should fail can't book
    // This shows we Do not have the current seat available for booking
    if (result.rowCount === 0) {
      res.send({ error: "Seat already booked" });
      return;
    }
    //if we get the row, we are safe to update
    const sqlU = "update seats set isbooked = 1, name = $2 where id = $1";
    const updateResult = await conn.query(sqlU, [id, name]); // Again to avoid SQL INJECTION we are using $1 and $2 as placeholders

    //end transaction by committing
    await conn.query("COMMIT");
    conn.release(); // release the connection back to the pool (so we do not keep the connection open unnecessarily)
    res.send(updateResult);
  } catch (ex) {
    console.log(ex);
    res.send(500);
  }
});

app.listen(port, () => console.log("Server starting on port: " + port));
