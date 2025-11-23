import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { sql } = await request.json();

    if (!sql || typeof sql !== 'string') {
      return NextResponse.json(
        { error: 'SQL query is required' },
        { status: 400 }
      );
    }

    // Basic validation to prevent certain dangerous operations
    const lowerSql = sql.toLowerCase().trim();
    const dangerousKeywords = ['drop database', 'drop schema'];
    
    for (const keyword of dangerousKeywords) {
      if (lowerSql.includes(keyword)) {
        return NextResponse.json(
          { error: `Dangerous operation detected: ${keyword}` },
          { status: 403 }
        );
      }
    }

    const startTime = Date.now();
    const result = await query(sql);
    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      rows: result.rows,
      rowCount: result.rows.length,
      executionTime,
    });
  } catch (e: unknown) {
    console.error('Query error:', e);
    
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

