import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck, ArrowLeft } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { notificationsAPI } from '../lib/api';
import { formatDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const NotificationsPage = () => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isAuthenticated) return;
      try {
        const response = await notificationsAPI.list({ page, limit });
        setNotifications(response.data.notifications || []);
        setTotal(response.data.total || 0);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [isAuthenticated, page]);

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="notifications-page">
      <Header />

      <section className="pt-32 pb-24">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <Link 
              to="/"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-violet-600 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>

            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Notifications</h1>
                <p className="text-slate-600">{total} total notifications</p>
              </div>
              <button
                onClick={handleMarkAllRead}
                className="btn-secondary flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All Read
              </button>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="card p-4">
                    <div className="skeleton h-4 w-3/4 mb-2" />
                    <div className="skeleton h-3 w-1/4" />
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="card p-12 text-center">
                <Bell className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No notifications</h3>
                <p className="text-slate-600">You're all caught up!</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {notifications.map((notif, i) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`card p-4 ${!notif.is_read ? 'border-l-4 border-l-violet-500' : ''}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${!notif.is_read ? 'bg-violet-500' : 'bg-slate-300'}`} />
                        <div className="flex-1">
                          <p className="text-slate-900">{notif.message}</p>
                          <p className="text-sm text-slate-500 mt-1">{formatDate(notif.created_at)}</p>
                          <div className="flex items-center gap-4 mt-2">
                            {notif.link && (
                              <Link to={notif.link} className="text-sm text-violet-600 font-medium hover:underline">
                                View Details
                              </Link>
                            )}
                            {!notif.is_read && (
                              <button 
                                onClick={() => handleMarkRead(notif.id)}
                                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                              >
                                <Check className="w-4 h-4" />
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn-secondary px-4 py-2 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-slate-600">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="btn-secondary px-4 py-2 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default NotificationsPage;
