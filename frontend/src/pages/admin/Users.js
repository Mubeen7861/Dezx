import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, ShieldOff, Star, StarOff, Search } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { usersAPI } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { toast } from 'sonner';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await usersAPI.list();
        setUsers(response.data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleBlock = async (userId) => {
    try {
      const response = await usersAPI.block(userId);
      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_blocked: response.data.is_blocked } : u
      ));
      toast.success(response.data.message);
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleFeature = async (userId) => {
    try {
      const response = await usersAPI.feature(userId);
      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_featured: response.data.is_featured } : u
      ));
      toast.success(response.data.message);
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) ||
                          user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <DashboardLayout>
      <div data-testid="admin-users">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">User Management</h1>
          <p className="text-slate-600">Manage all platform users</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="input pl-12"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input w-full md:w-48"
          >
            <option value="">All Roles</option>
            <option value="designer">Designers</option>
            <option value="client">Clients</option>
            <option value="superadmin">Admins</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton h-16 rounded-lg" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left p-4 font-semibold text-slate-600">User</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Role</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Joined</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Status</th>
                    <th className="text-right p-4 font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, i) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                            {user.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{user.name}</p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'designer' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">{formatDate(user.created_at)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {user.is_blocked && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Blocked</span>
                          )}
                          {user.is_featured && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">Featured</span>
                          )}
                          {!user.is_blocked && !user.is_featured && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Active</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {user.role !== 'superadmin' && (
                            <>
                              <button
                                onClick={() => handleFeature(user.id)}
                                className={`p-2 rounded-lg ${
                                  user.is_featured 
                                    ? 'bg-amber-100 text-amber-600' 
                                    : 'hover:bg-slate-100 text-slate-500'
                                }`}
                                title={user.is_featured ? 'Remove featured' : 'Feature user'}
                              >
                                {user.is_featured ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleBlock(user.id)}
                                className={`p-2 rounded-lg ${
                                  user.is_blocked 
                                    ? 'bg-red-100 text-red-600' 
                                    : 'hover:bg-slate-100 text-slate-500'
                                }`}
                                title={user.is_blocked ? 'Unblock user' : 'Block user'}
                              >
                                {user.is_blocked ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsers;
