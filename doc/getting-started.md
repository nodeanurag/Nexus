# Getting Started Guide

This guide describes how to set up, build, and run the Nexus Project Management SaaS application locally.

## Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18.x or higher)
- [npm](https://www.npmjs.com/) (v10.x or higher)
- A running PostgreSQL database instance

---

## 1. Installation

Clone the repository and install the dependencies:
```bash
npm install
```

---

## 2. Environment Configuration

Create a `.env` file at the root of the project. You can copy the contents of `.env.example` as a template:
```bash
cp .env.example .env
```

Ensure the following variables are correctly configured:
- `DATABASE_URL`: Connection string for PostgreSQL (e.g. `postgresql://user:password@localhost:5432/nexus?schema=public`)
- `DIRECT_URL`: Direct connection string for migrations (typically identical to `DATABASE_URL` unless using a connection pooler like Prisma Accelerate)
- `NEXTAUTH_SECRET`: A secure random string used to sign NextAuth cookies (generate one via `openssl rand -base64 32`)

---

## 3. Database Initialization & Setup

Deploy the migrations and generate the Prisma Client schemas:
```bash
# Apply database migrations
npx prisma migrate dev

# Generate client code inside src/generated/prisma
npx prisma generate
```

---

## 4. Launching the Application

### Development Server
Run the local Next.js development server:
```bash
npm run dev
```
The application will be accessible at [http://localhost:3000](http://localhost:3000).

### Production Build & Launch
Verify typescript type-checking and generate the production bundle:
```bash
# Build the optimized production application
npm run build

# Start the application in production mode
npm start
```
