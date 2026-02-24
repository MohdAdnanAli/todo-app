import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../services/api';
import type { AdminDashboardData, AdminUsersResponse, AdminTodosResponse, SystemHealth } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

type TabType = 'dashboard' | 'users' | 'todos' | 'system';

interface AdminDashboardProps {
  onClose: () => void;
}

export function AdminDashboard({ onClose }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dashboard state
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  
  // Users state
  const [usersData, setUsersData] = useState<AdminUsersResponse | null>(null);
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  
  // Todos state
  const [todosData, setTodosData] = useState<AdminTodosResponse | null>(null);
  const [todosPage, setTodosPage] = useState(1);
  const [todosSearch, setTodosSearch] = useState('');
  const [todosFilter, setTodosFilter] = useState<'all' | 'true' | 'false'>('all');
  
  // System state
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getDashboard();
      setDashboardData(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUsers({
        page: usersPage,
        limit: 20,
        search: usersSearch,
      });
      setUsersData(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [usersPage, usersSearch]);

  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getTodos({
        page: todosPage,
        limit: 50,
        search: todosSearch,
        completed: todosFilter,
      });
      setTodosData(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch todos');
    } finally {
      setLoading(false);
    }
  }, [todosPage, todosSearch, todosFilter]);

  const fetchSystemHealth = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getSystemHealth();
      setSystemHealth(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch system health');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    switch (activeTab) {
      case 'dashboard':
        fetchDashboard();
        break;
      case 'users':
        fetchUsers();
        break;
      case 'todos':
        fetchTodos();
        break;
      case 'system':
        fetchSystemHealth();
        break;
    }
  }, [activeTab, fetchDashboard, fetchUsers, fetchTodos, fetchSystemHealth, usersPage, todosPage]);

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user and all their data? This action cannot be undone.')) {
      return;
    }
    try {
      await adminApi.deleteUser(userId);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    if (!window.confirm('Are you sure you want to delete this todo?')) {
      return;
    }
    try {
      await adminApi.deleteTodo(todoId);
      fetchTodos();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete todo');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tabs = [
    { id: 'dashboard' as TabType, label: '📊 Dashboard' },
    { id: 'users' as TabType, label: '👥 Users' },
    { id: 'todos' as TabType, label: '✅ Todos' },
    { id: 'system' as TabType, label: '🔧 System' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-[90vw] mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Manage your application backend</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium bg-gray-700 hover:bg-gray-600 transition-all"
          >
            ✕ Close
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
            {error}
            <button onClick={() => setError(null)} className="ml-4 text-red-200 underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}

        {/* Dashboard Tab */}
        {!loading && activeTab === 'dashboard' && dashboardData && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="p-4 bg-gray-800">
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-white">{dashboardData.stats.totalUsers}</p>
              </Card>
              <Card className="p-4 bg-gray-800">
                <p className="text-gray-400 text-sm">Total Todos</p>
                <p className="text-3xl font-bold text-white">{dashboardData.stats.totalTodos}</p>
              </Card>
              <Card className="p-4 bg-gray-800">
                <p className="text-gray-400 text-sm">Completed</p>
                <p className="text-3xl font-bold text-green-400">{dashboardData.stats.completedTodos}</p>
              </Card>
              <Card className="p-4 bg-gray-800">
                <p className="text-gray-400 text-sm">Pending</p>
                <p className="text-3xl font-bold text-yellow-400">{dashboardData.stats.pendingTodos}</p>
              </Card>
              <Card className="p-4 bg-gray-800">
                <p className="text-gray-400 text-sm">Active (7d)</p>
                <p className="text-3xl font-bold text-blue-400">{dashboardData.stats.activeUsers}</p>
              </Card>
            </div>

            {/* Completion Rate */}
            <Card className="p-6 bg-gray-800">
              <h3 className="text-lg font-semibold mb-4">Todo Completion Rate</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all"
                    style={{ width: `${dashboardData.stats.completionRate}%` }}
                  ></div>
                </div>
                <span className="text-2xl font-bold">{dashboardData.stats.completionRate}%</span>
              </div>
            </Card>

            {/* Recent Users */}
            <Card className="p-6 bg-gray-800">
              <h3 className="text-lg font-semibold mb-4">Recent Users</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-700">
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Display Name</th>
                      <th className="pb-3">Joined</th>
                      <th className="pb-3">Last Login</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.recentUsers.map((user, idx) => (
                      <tr key={idx} className="border-b border-gray-700/50">
                        <td className="py-3">{user.email}</td>
                        <td className="py-3">{user.displayName || '-'}</td>
                        <td className="py-3">{formatDate(user.createdAt)}</td>
                        <td className="py-3">{user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {!loading && activeTab === 'users' && usersData && (
          <div className="space-y-6">
            {/* Search */}
            <div className="flex gap-4">
              <Input
                type="text"
                placeholder="Search by email or name..."
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                className="flex-1 bg-gray-800 border-gray-700 text-white"
              />
              <Button onClick={fetchUsers} className="bg-indigo-600 hover:bg-indigo-700">
                Search
              </Button>
            </div>

            {/* Users Table */}
            <Card className="p-6 bg-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-700">
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Verified</th>
                      <th className="pb-3">Todos</th>
                      <th className="pb-3">Completion</th>
                      <th className="pb-3">Joined</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersData.users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-700/50">
                        <td className="py-3">{user.email}</td>
                        <td className="py-3">{user.displayName || '-'}</td>
                        <td className="py-3">
                          {user.emailVerified ? (
                            <span className="text-green-400">✓</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="py-3">{user.todoCount}</td>
                        <td className="py-3">{user.completionRate || 0}%</td>
                        <td className="py-3">{formatDate(user.createdAt)}</td>
                        <td className="py-3">
                          <Button
                            onClick={() => handleDeleteUser(user.id)}
                            className="bg-red-600 hover:bg-red-700 text-sm py-1 px-3"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                <p className="text-gray-400">
                  Page {usersData.pagination.page} of {usersData.pagination.pages}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                    disabled={usersData.pagination.page === 1}
                    className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setUsersPage(p => Math.min(usersData.pagination.pages, p + 1))}
                    disabled={usersData.pagination.page === usersData.pagination.pages}
                    className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Todos Tab */}
        {!loading && activeTab === 'todos' && todosData && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
              <Input
                type="text"
                placeholder="Search todos..."
                value={todosSearch}
                onChange={(e) => setTodosSearch(e.target.value)}
                className="flex-1 min-w-[200px] bg-gray-800 border-gray-700 text-white"
              />
              <select
                value={todosFilter}
                onChange={(e) => setTodosFilter(e.target.value as 'all' | 'true' | 'false')}
                className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2"
              >
                <option value="all">All</option>
                <option value="true">Completed</option>
                <option value="false">Pending</option>
              </select>
              <Button onClick={fetchTodos} className="bg-indigo-600 hover:bg-indigo-700">
                Filter
              </Button>
            </div>

            {/* Todos Table */}
            <Card className="p-6 bg-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-700">
                      <th className="pb-3">Todo</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Priority</th>
                      <th className="pb-3">User</th>
                      <th className="pb-3">Created</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todosData.todos.map((todo) => (
                      <tr key={todo._id} className="border-b border-gray-700/50">
                        <td className="py-3 max-w-xs truncate">{todo.text}</td>
                        <td className="py-3">
                          {todo.completed ? (
                            <span className="text-green-400">✓ Done</span>
                          ) : (
                            <span className="text-yellow-400">⏳ Pending</span>
                          )}
                        </td>
                        <td className="py-3">{todo.category || '-'}</td>
                        <td className="py-3">
                          {todo.priority && (
                            <span className={`px-2 py-1 rounded text-xs ${
                              todo.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                              todo.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {todo.priority}
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          {todo.user ? (
                            <div className="text-sm">
                              <div>{todo.user.displayName || todo.user.email}</div>
                              <div className="text-gray-500 text-xs">{todo.user.email}</div>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="py-3">{formatDate(todo.createdAt)}</td>
                        <td className="py-3">
                          <Button
                            onClick={() => handleDeleteTodo(todo._id)}
                            className="bg-red-600 hover:bg-red-700 text-sm py-1 px-3"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                <p className="text-gray-400">
                  Page {todosData.pagination.page} of {todosData.pagination.pages}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setTodosPage(p => Math.max(1, p - 1))}
                    disabled={todosData.pagination.page === 1}
                    className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setTodosPage(p => Math.min(todosData.pagination.pages, p + 1))}
                    disabled={todosData.pagination.page === todosData.pagination.pages}
                    className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* System Tab */}
        {!loading && activeTab === 'system' && systemHealth && (
          <div className="space-y-6">
            <Card className="p-6 bg-gray-800">
              <h3 className="text-lg font-semibold mb-4">System Health</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-700 rounded-lg">
                  <p className="text-gray-400 text-sm">Status</p>
                  <p className={`text-xl font-bold ${
                    systemHealth.status === 'healthy' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {systemHealth.status}
                  </p>
                </div>
                <div className="p-4 bg-gray-700 rounded-lg">
                  <p className="text-gray-400 text-sm">Database</p>
                  <p className={`text-xl font-bold ${
                    systemHealth.database.state === 'connected' ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {systemHealth.database.state}
                  </p>
                </div>
                <div className="p-4 bg-gray-700 rounded-lg">
                  <p className="text-gray-400 text-sm">Environment</p>
                  <p className="text-xl font-bold text-white">{systemHealth.environment}</p>
                </div>
                <div className="p-4 bg-gray-700 rounded-lg">
                  <p className="text-gray-400 text-sm">Uptime</p>
                  <p className="text-xl font-bold text-white">{systemHealth.uptime}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-gray-400 text-sm">
                  Last checked: {formatDate(systemHealth.timestamp)}
                </p>
              </div>
            </Card>

            {/* Refresh Button */}
            <Button onClick={fetchSystemHealth} className="bg-indigo-600 hover:bg-indigo-700">
              🔄 Refresh System Status
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

