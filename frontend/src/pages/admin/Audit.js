import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { auditAPI } from '../../lib/api';
import { formatDate } from '../../lib/utils';

const AdminAudit = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [entityType, setEntityType] = useState('');
  const limit = 50;

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params = { page, limit };
        if (entityType) params.entity_type = entityType;
        const response = await auditAPI.list(params);
        setLogs(response.data.logs || []);
        setTotal(response.data.total || 0);
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page, entityType]);

  const entityTypes = ['user', 'project', 'proposal', 'competition', 'submission', 'cms', 'settings', 'notification'];
  const totalPages = Math.ceil(total / limit);

  const getActionColor = (action) => {
    const colors = {
      create: 'bg-green-100 text-green-700',
      update: 'bg-blue-100 text-blue-700',
      delete: 'bg-red-100 text-red-700',
      approve: 'bg-green-100 text-green-700',
      reject: 'bg-red-100 text-red-700',
      block: 'bg-red-100 text-red-700',
      unblock: 'bg-green-100 text-green-700',
      feature: 'bg-amber-100 text-amber-700',
      winner: 'bg-purple-100 text-purple-700',
    };
    return colors[action] || 'bg-slate-100 text-slate-700';
  };

  return (
    <DashboardLayout>
      <div data-testid="admin-audit">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Audit Logs</h1>
          <p className="text-slate-600">Track all admin actions on the platform</p>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select
            value={entityType}
            onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
            className="input w-48"
          >
            <option value="">All Entity Types</option>
            {entityTypes.map(type => (
              <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Logs Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-12 rounded-lg" />)}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left p-4 font-semibold text-slate-600">Action</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Entity</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Description</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Admin</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-slate-100"
                    >
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action_type)}`}>
                          {log.action_type}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                          {log.entity_type}
                        </span>
                      </td>
                      <td className="p-4 text-slate-900 max-w-md truncate">{log.description}</td>
                      <td className="p-4 text-slate-600">{log.admin_name}</td>
                      <td className="p-4 text-slate-500 text-sm">{formatDate(log.created_at)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-4 py-2 disabled:opacity-50">
              Previous
            </button>
            <span className="text-slate-600">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary px-4 py-2 disabled:opacity-50">
              Next
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminAudit;
