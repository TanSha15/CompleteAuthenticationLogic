# Complete Authentication Backend

## Overview

This project is a Node.js + Express authentication backend that provides a full authentication flow including:

* User registration
* Password hashing
* Email verification using OTP
* JWT authentication using HTTP-only cookies
* Protected routes middleware
* Email sending using Mailtrap

The system is designed to be used with any frontend (React, mobile app, etc.) and focuses on secure authentication practices rather than UI.

---

## Tech Stack

* Node.js
* Express.js
* MongoDB + Mongoose
* JWT (jsonwebtoken)
* bcryptjs (password hashing)
* Mailtrap (email testing service)
* Cookies based authentication
* Environment variables using dotenv

---

## Folder Structure

backend/
│
├── controller/
│   └── authController.js
│
├── db/
│   └── connectDB.js
│
├── middleware/
│   └── verifyToken.js
│
├── models/
│   └── userModel.js
│
├── routes/
│   └── authRoutes.js
│
├── utils/
│   └── generateTokenAndSetCookie.js
│
├── mailTrap/
│   ├── emailTemplates.js
│   ├── emails.js
│   └── mailtrapConfig.js
│
├── index.js
└── .env

---

## Environment Variables (.env)

Create a .env file inside backend folder:

PORT=2000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
MAILTRAP_TOKEN=your_mailtrap_token
MAILTRAP_ENDPOINT=[https://send.api.mailtrap.io/](https://send.api.mailtrap.io/)
MAIL_SENDER_EMAIL=[example@domain.com](mailto:example@domain.com)
MAIL_SENDER_NAME=Auth App

---

## Authentication Flow

### 1. User Signup

User sends:
POST /api/auth/signup

Body:
{
name,
email,
password
}

Server Actions:

1. Validate fields
2. Check if user already exists
3. Hash password using bcrypt
4. Generate 6 digit verification token
5. Save user in database (unverified)
6. Send verification email with OTP
7. Create JWT and set HTTP-only cookie

User is created but NOT verified yet.

---

### 2. Email Verification

User sends:
POST /api/auth/verify-email

Body:
{
code
}

Server Actions:

1. Find user using verification token
2. Check expiration time
3. Mark user as verified
4. Remove verification token

Now the account becomes active.

---

### 3. Login

User sends:
POST /api/auth/login

Server Actions:

1. Check email exists
2. Compare password using bcrypt
3. If verified -> allow login
4. Generate JWT cookie

---

### 4. Protected Routes

Any protected route uses middleware:

verifyToken.js

Flow:

1. Read token from cookies
2. Verify JWT
3. Extract userId
4. Attach to request
5. Allow access

If invalid -> 401 Unauthorized

---

## JWT Cookie Authentication

The backend uses HTTP-only cookies instead of localStorage tokens.

Benefits:

* Prevents XSS attacks
* More secure authentication
* Automatically sent with requests

Cookie contains:
JWT(userId)

---

## Email System

Email is sent using Mailtrap.

During signup:

* 6 digit OTP is generated
* Email template injects OTP
* Mailtrap sends email

Verification token expires in 24 hours.

---

## API Endpoints

### Auth Routes

POST /api/auth/signup
Create new user and send verification email

POST /api/auth/verify-email
Verify OTP code

POST /api/auth/login
Login user

POST /api/auth/logout
Clear authentication cookie

GET /api/auth/check-auth
Protected route example

---

## Security Measures

* Password hashing using bcrypt
* HTTP-only cookies
* JWT verification middleware
* Token expiration
* Email verification required before login
* No password returned in API responses

---

## How To Run Locally

1. Install dependencies
   npm install

2. Setup environment variables
   Create .env file

3. Start server
   npm run dev

Server runs on:
[http://localhost:2000](http://localhost:2000)

---

## Purpose of Project

This project demonstrates a production style authentication architecture including:

* Secure login system
* Email verification workflow
* Cookie based authentication
* Middleware protection
* Modular backend structure

It can be directly integrated into any MERN or frontend project requiring authentication.

## Password Reset Flow (Forgot Password)

This backend also implements a secure password recovery mechanism using a time‑limited reset token sent via email.

### Step 1: Request Password Reset

**Endpoint:** `POST /api/auth/forgot-password`

User provides their registered email.

Server actions:

1. Finds the user by email
2. Generates a secure random reset token
3. Stores a hashed version of the token in database
4. Sets expiry time (typically 1 hour)
5. Sends reset email containing reset link with token

Security notes:

* Raw token is NEVER stored in DB
* Only hashed token is saved
* Prevents token leakage if DB is compromised

---

### Step 2: Reset Password

**Endpoint:** `POST /api/auth/reset-password`

Client sends:

* token
* new password

Server verifies:

1. Token exists
2. Token not expired
3. Token matches hashed DB value

Then server:

* Hashes new password using bcrypt
* Updates user password
* Deletes reset token fields
* Sends success confirmation email

---

### Flow Diagram

User → Forgot Password → Email Sent → Click Reset Link → Enter New Password → Password Updated

---

### Email Templates Used

* Password Reset Request Email
* Password Reset Success Confirmation

---

### Security Protections

* Expiring reset tokens
* Hashed tokens in DB
* Single‑use tokens
* No user enumeration (same response even if email not registered)
