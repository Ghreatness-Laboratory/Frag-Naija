'use client';

import { Trash2, Pencil } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  render?: (row: Record<string, unknown>) => React.ReactNode;
}

interface Props {
  columns: Column[];
  rows: Record<string, unknown>[];
  onDelete?: (row: Record<string, unknown>) => void;
  onEdit?: (row: Record<string, unknown>) => void;
  extraActions?: (row: Record<string, unknown>) => React.ReactNode;
  loading?: boolean;
  emptyText?: string;
}

export default function AdminTable({ columns, rows, onDelete, onEdit, extraActions, loading, emptyText }: Props) {
  if (loading) {
    return (
      <div className="border border-fn-gborder rounded-lg overflow-hidden">
        <div className="p-8 text-center text-fn-muted text-sm">Loading...</div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="border border-fn-gborder rounded-lg overflow-hidden">
        <div className="p-8 text-center text-fn-muted text-sm">{emptyText || 'No records yet'}</div>
      </div>
    );
  }

  return (
    <div className="border border-fn-gborder rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-fn-gborder bg-fn-dark">
            {columns.map(c => (
              <th key={c.key} className="px-4 py-3 text-left text-xs text-fn-muted uppercase tracking-widest font-normal">
                {c.label}
              </th>
            ))}
            {(onDelete || onEdit || extraActions) && (
              <th className="px-4 py-3 text-right text-xs text-fn-muted uppercase tracking-widest font-normal">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={String(row.id ?? i)} className="border-b border-fn-gborder/50 hover:bg-fn-card2 transition-colors">
              {columns.map(c => (
                <td key={c.key} className="px-4 py-3 text-fn-text">
                  {c.render ? c.render(row) : String(row[c.key] ?? '—')}
                </td>
              ))}
              {(onDelete || onEdit || extraActions) && (
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {extraActions && extraActions(row)}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        className="p-1.5 rounded text-fn-muted hover:text-fn-green hover:bg-fn-green/10 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(row)}
                        className="p-1.5 rounded text-fn-muted hover:text-fn-red hover:bg-fn-red/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
