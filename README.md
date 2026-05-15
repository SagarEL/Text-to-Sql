# Natural Language SQL Query Generator

This application allows users to generate SQL queries using natural language input. It connects to a database (or uses a mock database) and provides an interface for users to ask questions in plain English, which are then converted into SQL queries and executed against the database.


![Screenshot](https://github.com/CubeStar1/text-to-sql/blob/master/public/easysql-landing.png)

![Screenshot](https://github.com/CubeStar1/text-to-sql/blob/master/public/easysql-chat.png)

![Screenshot](https://github.com/CubeStar1/text-to-sql/blob/master/public/easysql-visualization.png)


## Features

- Natural language to SQL query conversion (Gemini-powered)
- Database connection management
- Mock database option for testing
- Real-time query results display
- Intelligent query results visualization

## Architecture

- Frontend:
  - Next.js for server-side rendering and API routes
  - Tailwind CSS for styling
  - Shadcn/UI for components

- Backend:
  - FastAPI for handling database connections and text-to-SQL conversion
  - Python for backend logic
  - Google Gemini for text-to-SQL conversion

- API Routes:
  - `db-structure/route.ts`: Next.js API route for fetching database structure
  - `proxy/route.ts`: Next.js API route for communicating with FastAPI backend
  - FastAPI backend: Handles database connections and text-to-SQL conversion

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/CubeStar1/text-to-sql.git
   cd text-to-sql
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Set up frontend environment variables:
   Create a `.env.local` file in the root directory and add:
   ```bash
   API_URL=http://localhost:8000  # FastAPI backend URL
   ```

4. Install backend dependencies:
   ```bash
   cd N2SQL-API
   pip install -r requirements.txt
   ```

5. Set up backend environment variables:
   Edit the `.env` file in the `N2SQL-API` directory and add your Gemini API key:
   ```bash
   GEMINI_API_KEY=<your-gemini-api-key>
   ```
   You can get a Gemini API key from https://aistudio.google.com/app/apikey

## Usage

1. Start the FastAPI backend:
   ```bash
   cd N2SQL-API
   python main.py
   ```

2. In a new terminal, start the Next.js frontend:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

4. Choose to use a mock database or connect to your own database.

5. If using your own database, enter the connection details.

6. Click "Connect" to establish a database connection.

7. Enter a natural language query in the text area.

8. Click "Generate SQL" to convert your query to SQL and execute it.

9. View the results displayed below the query input.
