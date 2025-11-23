# Database Query Tool

A simple, fully functioning database query tool for PostgreSQL databases.

## Features

- **Table Browser**: View all tables in your database
- **Schema Inspector**: See column names, types, and constraints for each table
- **Query Editor**: SQL editor with syntax highlighting
- **Query History**: Auto-saves executed queries
- **Error Display**: Clear error messages when queries fail
- **Results Table**: View query results in a clean, formatted table

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set your database URL in a `.env` file in the project root:
```
DATABASE_URL=postgresql://username:password@localhost:5432/dbname
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3002](http://localhost:3002) in your browser

## Usage

### Browsing Tables
Click on any table name in the sidebar to view its schema.

### Running Queries
1. Type your SQL query in the editor
2. Click "Execute Query" or press Cmd/Ctrl + Enter
3. View results or errors below

### Managing Queries
- Queries are automatically saved after successful execution
- Click on a saved query to load it into the editor
- Edit and save changes with the "Save Changes" button
- Delete queries with the ✕ button
- Create a new query with the "New" button

## Security

The tool includes basic protection against dangerous operations like `DROP DATABASE`. However, this is a development tool and should NOT be exposed to the public internet or untrusted users.

## Development

```bash
# Development server
npm run dev

# Production build
npm run build
npm start

# Linting
npm run lint
```

## Never deploy this tool to production.