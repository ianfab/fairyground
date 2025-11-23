import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ tableName: string }> }
) {
  try {
    const { tableName } = await context.params;

    const result = await query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `, [tableName]);

    return NextResponse.json({ columns: result.rows });
  } catch (e: unknown) {
    console.error('Error fetching table schema:', e);
    
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

