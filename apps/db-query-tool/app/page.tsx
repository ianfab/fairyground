'use client';

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

interface SavedQuery {
  id: string;
  sql: string;
  timestamp: number;
}

interface TableInfo {
  tablename: string;
  schemaname: string;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

export default function Home() {
  const [sql, setSql] = useState('SELECT * FROM games LIMIT 10;');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableSchema, setTableSchema] = useState<ColumnInfo[]>([]);

  // Load saved queries from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedQueries');
    if (saved) {
      try {
        setSavedQueries(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved queries', e);
      }
    }
  }, []);

  // Load tables on mount
  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/tables');
      if (!response.ok) throw new Error('Failed to fetch tables');
      const data = await response.json();
      setTables(data.tables);
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error('Error fetching tables:', e.message);
      }
    }
  };

  const fetchTableSchema = async (tableName: string) => {
    try {
      const response = await fetch(`/api/tables/${tableName}`);
      if (!response.ok) throw new Error('Failed to fetch schema');
      const data = await response.json();
      setTableSchema(data.columns);
      setSelectedTable(tableName);
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error('Error fetching schema:', e.message);
      }
    }
  };

  const saveQuery = (queryText: string) => {
    const newQuery: SavedQuery = {
      id: Date.now().toString(),
      sql: queryText,
      timestamp: Date.now(),
    };

    const updated = [newQuery, ...savedQueries];
    setSavedQueries(updated);
    localStorage.setItem('savedQueries', JSON.stringify(updated));
    setSelectedQueryId(newQuery.id);
  };

  const updateQuery = (id: string, queryText: string) => {
    const updated = savedQueries.map(q =>
      q.id === id ? { ...q, sql: queryText, timestamp: Date.now() } : q
    );
    setSavedQueries(updated);
    localStorage.setItem('savedQueries', JSON.stringify(updated));
  };

  const deleteQuery = (id: string) => {
    const updated = savedQueries.filter(q => q.id !== id);
    setSavedQueries(updated);
    localStorage.setItem('savedQueries', JSON.stringify(updated));
    if (selectedQueryId === id) {
      setSelectedQueryId(null);
    }
  };

  const loadQuery = (query: SavedQuery) => {
    setSql(query.sql);
    setSelectedQueryId(query.id);
  };

  const executeQuery = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Query failed');
      }

      setResult(data);

      // Auto-save query after successful execution
      if (selectedQueryId) {
        updateQuery(selectedQueryId, sql);
      } else {
        saveQuery(sql);
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const createNewQuery = () => {
    setSql('');
    setSelectedQueryId(null);
    setError('');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h1 className="text-xl font-bold">Database Query Tool</h1>
          </div>

          {/* Tables List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                Tables
              </h2>
              <div className="space-y-1">
                {tables.map((table) => (
                  <button
                    key={`${table.schemaname}.${table.tablename}`}
                    onClick={() => fetchTableSchema(table.tablename)}
                    className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors ${
                      selectedTable === table.tablename
                        ? 'bg-gray-700 text-blue-400'
                        : 'text-gray-300'
                    }`}
                  >
                    {table.tablename}
                  </button>
                ))}
              </div>
            </div>

            {/* Schema View */}
            {tableSchema.length > 0 && (
              <div className="p-4 border-t border-gray-700">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">
                  {selectedTable} Schema
                </h3>
                <div className="space-y-2 text-xs">
                  {tableSchema.map((col) => (
                    <div key={col.column_name} className="text-gray-400">
                      <div className="font-mono text-blue-400">{col.column_name}</div>
                      <div className="text-gray-500 ml-2">
                        {col.data_type}
                        {col.is_nullable === 'NO' && ' NOT NULL'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Saved Queries */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Saved Queries
                </h2>
                <button
                  onClick={createNewQuery}
                  className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition-colors"
                >
                  New
                </button>
              </div>
              <div className="space-y-1">
                {savedQueries.map((query) => (
                  <div
                    key={query.id}
                    className={`group flex items-center justify-between px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors ${
                      selectedQueryId === query.id
                        ? 'bg-gray-700 text-blue-400'
                        : 'text-gray-300'
                    }`}
                  >
                    <button
                      onClick={() => loadQuery(query)}
                      className="flex-1 text-left truncate"
                    >
                      {query.sql.substring(0, 50)}...
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteQuery(query.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {savedQueries.length === 0 && (
                  <div className="text-gray-500 text-xs text-center py-4">
                    No saved queries yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Query Editor */}
          <div className="h-64 border-b border-gray-700">
            <Editor
              height="100%"
              defaultLanguage="sql"
              theme="vs-dark"
              value={sql}
              onChange={(value) => setSql(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>

          {/* Controls */}
          <div className="p-4 bg-gray-800 border-b border-gray-700 flex items-center gap-4">
            <button
              onClick={executeQuery}
              disabled={loading || !sql.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-medium transition-colors"
            >
              {loading ? 'Executing...' : 'Execute Query'}
            </button>
            {selectedQueryId && (
              <button
                onClick={() => updateQuery(selectedQueryId, sql)}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded font-medium transition-colors"
              >
                Save Changes
              </button>
            )}
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-auto p-4">
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
                <div className="font-semibold mb-1">Query Error</div>
                <div className="text-sm font-mono">{error}</div>
              </div>
            )}

            {result && (
              <div>
                <div className="mb-4 text-sm text-gray-400">
                  {result.rows.length} row{result.rows.length !== 1 ? 's' : ''} returned
                  {result.executionTime && ` in ${result.executionTime}ms`}
                </div>

                {result.rows.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-gray-800 border border-gray-700 rounded">
                      <thead className="bg-gray-700">
                        <tr>
                          {Object.keys(result.rows[0]).map((key) => (
                            <th
                              key={key}
                              className="px-4 py-2 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider border-b border-gray-600"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {result.rows.map((row: Record<string, unknown>, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-750">
                            {Object.values(row).map((value, i) => (
                              <td
                                key={i}
                                className="px-4 py-2 text-sm text-gray-300 font-mono"
                              >
                                {value === null
                                  ? <span className="text-gray-500 italic">null</span>
                                  : typeof value === 'object'
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    Query executed successfully with no results
                  </div>
                )}
              </div>
            )}

            {!result && !error && !loading && (
              <div className="text-gray-500 text-center py-8">
                Write a query and click &quot;Execute Query&quot; to see results
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

