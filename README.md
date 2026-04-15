# BookMyTicket — ChaiCode Hackathon

A simplified movie seat booking backend system. Extended with a full authentication layer and protected booking flow.


## Tech Stack

- Node.js + Express
- PostgreSQL
- JWT Authentication
- bcrypt password hashing

## Project Structure

```

bookmyticket/
│
├── middleware/          # Auth middleware (JWT verification)
│
├── .env                 # Environment variables
├── index.html           # (Optional frontend entry)
├── index.mjs            # Main server file
├── docker-compose.yml   # Docker setup
├── package.json         # Dependencies & scripts
├── package-lock.json
└── README.md            # Project documentation
```


----
## Setup & Installation

### Prerequisites
- Node.js
- Docker (for PostgreSQL)

### Steps

1. Clone the repository
```bash
   git clone <your-repo-url>
   cd <project-folder>
```

2. Install dependencies
```bash
   npm install
```

3. Start PostgreSQL via Docker
```bash
   docker compose up -d
```

4. Create tables in the database
```bash
   docker exec -it book-my-ticket-postgresdb-1 psql -U postgres -d sql_class_2_db
```
   Then run:
```sql
   CREATE TABLE users (
     id SERIAL PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     email VARCHAR(255) UNIQUE NOT NULL,
     password VARCHAR(255) NOT NULL
   );

   ALTER TABLE seats ADD COLUMN user_id INT REFERENCES users(id);

   INSERT INTO seats (isbooked)
   SELECT 0 FROM generate_series(1, 20);
```

5. Create `.env` file

```
   PORT=8080
   JWT_TOKEN_SECRET=
   JWT_TOKEN_EXPIRY=

```

6. Start the server
```bash
   node index.mjs
```

Server runs on `http://localhost:8080`

## API Endpoints

### Public Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/register` | Register a new user |
| POST | `/login` | Login and receive JWT token |
| GET | `/` | Serve frontend HTML |

### Protected Routes (Requires Bearer Token)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/seats` | Get all seats |
| PUT | `/:id/:name` | Book a seat by ID |

## Authentication Flow

1. Register via `POST /register` with `name`, `email`, `password`
2. Login via `POST /login` — returns a JWT token
3. Use token in `Authorization` header for protected routes:

## Booking Flow

1. Login to get JWT token
2. Call `GET /seats` to see available seats
3. Call `PUT /:id/:name` with your seat ID and name
4. Duplicate bookings are prevented at DB level using `FOR UPDATE` lock
5. Already booked seats return `{ error: "Seat already booked" }`

## What Was Extended (vs Starter Code)

- Added `POST /register` — user registration with bcrypt hashing
- Added `POST /login` — JWT token generation
- Added `middleware/auth.js` — JWT verification middleware
- Protected `GET /seats` and `PUT /:id/:name` with auth middleware
- Added `users` table to DB
- Added `user_id` column to `seats` table