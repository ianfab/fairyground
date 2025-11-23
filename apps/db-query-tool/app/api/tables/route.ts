import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`
      SELECT tablename, schemaname
      FROM pg_catalog.pg_tables
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY tablename;
    `);

    return NextResponse.json({ tables: result.rows });
  } catch (e: unknown) {
    console.error('Error fetching tables:', e);
    
    if (e instanceof Error) {
      return NextResponse.json(
        { error: e.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

