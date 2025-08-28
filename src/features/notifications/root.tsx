
import { Outlet } from 'react-router-dom';
import NotificationsPage from './notifications';

export default function NotificationsRoot() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">
      <Outlet />
    </div>
  );
}

// Export the main notifications page as default
export { NotificationsPage };
