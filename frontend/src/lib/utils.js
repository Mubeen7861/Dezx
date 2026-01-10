import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatCurrency(amount) {
  if (!amount) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function getStatusColor(status) {
  const colors = {
    open: 'status-open',
    active: 'status-active',
    in_progress: 'status-in-progress',
    completed: 'status-completed',
    upcoming: 'status-upcoming',
    pending: 'badge-warning',
    approved: 'badge-success',
    rejected: 'badge-error',
  };
  return colors[status] || 'badge-primary';
}

export function truncate(str, length = 100) {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function getCategoryLabel(category) {
  const labels = {
    'ui-ux': 'UI/UX Design',
    'graphic-design': 'Graphic Design',
    'branding': 'Branding',
    'illustration': 'Illustration',
    'logo': 'Logo Design',
    'web-design': 'Web Design',
    'mobile-app': 'Mobile App',
    'other': 'Other',
  };
  return labels[category] || category;
}
