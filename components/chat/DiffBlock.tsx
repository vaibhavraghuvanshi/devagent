"use client";

interface DiffBlockProps {
  path: string;
  before: string;
  after: string;
}

export function DiffBlock({ path, before, after }: DiffBlockProps) {
  return (
    <div className="mb-4 border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
        <p className="font-mono text-sm font-semibold text-gray-900">{path}</p>
      </div>

      {/* Diff View */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-mono">
          <tbody>
            {/* Before */}
            <tr>
              <td colSpan={2} className="px-4 py-2 bg-red-50 border-b border-gray-200">
                <p className="text-xs font-semibold text-red-700">Before:</p>
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 bg-red-50 border-r border-gray-200 w-12 text-right text-gray-500 select-none">
                -
              </td>
              <td className="px-4 py-2 bg-red-50 text-red-700 whitespace-pre-wrap break-words">
                {before}
              </td>
            </tr>

            {/* After */}
            <tr>
              <td colSpan={2} className="px-4 py-2 bg-green-50 border-b border-gray-200">
                <p className="text-xs font-semibold text-green-700">After:</p>
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 bg-green-50 border-r border-gray-200 w-12 text-right text-gray-500 select-none">
                +
              </td>
              <td className="px-4 py-2 bg-green-50 text-green-700 whitespace-pre-wrap break-words">
                {after}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
