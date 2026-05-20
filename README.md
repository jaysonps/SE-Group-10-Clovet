# Clovet - Premium Fashion Marketplace

Clovet is a digital fashion marketplace integrating secure transactions between buyers and sellers with a focus on premium categories. It features AI-powered product categorization, escrow protection, and a professional verification workflow.

## Local Development Setup

To run Clovet locally, follow these steps:

### 1. Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Python (v3.9 or higher) for NLP classification

### 2. Environment Variables
Create a `.env` file in the root directory (copy from `.env.example`) and set the following:

- `DATABASE_URL`: Your PostgreSQL connection string (e.g., `postgres://user:password@localhost:5432/clovet`).
- `PYTHON_PATH`: Path to your python executable (defaults to `python3`).
- `NODE_ENV`: Set to `development` for local testing.

### 3. Installation
**IMPORTANT:** You must install dependencies before running the app.
```bash
npm install
```

### 4. Running the App
```bash
# Start both Backend (Express) and Frontend (Vite)
npm run dev
```

The app will be available at `http://localhost:3000`.

## Test Accounts
The following accounts are pre-registered for testing different roles:

| Role | Username | Email | Password |
| :--- | :--- | :--- | :--- |
| **Customer** | customer | customer@gmail.com | `@Customer123` |
| **Seller** | seller | seller@gmail.com | `@seller123` |
| **Verifier** | verifier | verifier@gmail.com | `@verifier123` |

## Architecture
The project is modularized for better maintainability:
- `/front-end`: React + Vite + Tailwind UI (located in `front-end/src`)
- `/backend`: Express API routes and logic
- `/database`: Database connection and pooling
- `/ai`: NLP Classification logic (Python script + Node.js bridge)

## AI Features (NLP)
Clovet uses a custom Natural Language Processing (NLP) classifier built with Python to automatically analyze product titles and descriptions to suggest the most relevant categories during the listing process. Predicted categories are strictly limited to:
- Tops
- Outerwears
- Bottoms
- Knitwears & Fleeces
- Dresses & Suits
