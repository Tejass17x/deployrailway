import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Users,
} from 'lucide-react';

const EASE_OUT = [0.22, 1, 0.36, 1];

// ── Section card wrapper ──────────────────────────────────────────────────────
const SidebarCard = ({ children, delay = 0 }) => (
  <motion.div
    className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden"
    style={{ boxShadow: '0 2px 12px rgba(15,23,42,0.05)' }}
    initial={{ opacity: 0, x: 16 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay, ease: EASE_OUT }}
  >
    {children}
  </motion.div>
);

const SidebarHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#F1F5F9]">
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(79,70,229,0.08))' }}
    >
      <Icon className="w-3.5 h-3.5 text-[#2563EB]" />
    </div>
    <span className="text-[12px] font-bold text-[#0F172A] uppercase tracking-wider">
      {title}
    </span>
  </div>
);

// ── NotificationRightSidebar ──────────────────────────────────────────────────
const NotificationRightSidebar = ({
  notifications = [],
  stats = {},
  onMarkAllRead,
  isMarkingAllRead = false,
}) => {
  const navigate = useNavigate();

  // Compute recent activity (last 5)
  const recent = notifications.slice(0, 5);

  // Most active collaborators (unique actors)
  const collaborators = React.useMemo(() => {
    const seen = new Map();
    notifications.forEach((n) => {
      const actor = n.actorId;
      if (!actor) return;
      const id = actor._id || actor;
      const name = `${actor.firstName || ''} ${actor.lastName || ''}`.trim();
      if (!name) return;
      if (seen.has(id)) {
        seen.get(id).count++;
      } else {
        const rawImg = actor.avatar || actor.profileImage;
        const avatarUrl = typeof rawImg === 'string' ? rawImg : rawImg?.url || null;
        seen.set(id, {
          id, name,
          avatar: avatarUrl,
          initials: name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase(),
          count: 1,
        });
      }
    });
    return Array.from(seen.values()).sort((a, b) => b.count - a.count).slice(0, 4);
  }, [notifications]);


  return (
    <div className="sticky top-6 space-y-4">

      {/* 1. Recent Activity */}
      <SidebarCard delay={0.35}>
        <SidebarHeader icon={Zap} title="Recent Activity" />
        <div className="p-4 space-y-0">
          {recent.length === 0 ? (
            <p className="text-[12px] text-[#94A3B8] text-center py-4">No recent activity</p>
          ) : (
            recent.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.06 }}
                className="flex items-start gap-3 py-2.5 border-b border-[#F8FAFC] last:border-0 group cursor-pointer"
                onClick={() => navigate(n.targetUrl || '#')}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                  style={{
                    background: 'linear-gradient(135deg, #EFF6FF, #EDE9FE)',
                    color: '#2563EB',
                  }}
                >
                  {n.title?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[#0F172A] truncate group-hover:text-[#2563EB] transition-colors">
                    {n.title}
                  </p>
                  <p className="text-[11px] text-[#94A3B8]">{n.time}</p>
                </div>
                {!n.isRead && (
                  <div className="w-2 h-2 rounded-full bg-[#2563EB] flex-shrink-0 mt-1.5" />
                )}
              </motion.div>
            ))
          )}
        </div>
      </SidebarCard>


      {/* 3. Most Active Collaborators */}
      {collaborators.length > 0 && (
        <SidebarCard delay={0.48}>
          <SidebarHeader icon={Users} title="Active Collaborators" />
          <div className="p-4 space-y-0">
            {collaborators.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.06 }}
                className="flex items-center gap-3 py-2.5 border-b border-[#F8FAFC] last:border-0 cursor-pointer group"
                onClick={() => navigate(`/profile/${c.id}`)}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #2563EB, #4F46E5)', color: '#fff' }}
                >
                  {c.avatar ? (
                    <img src={c.avatar} alt={c.name} className="w-full h-full rounded-full object-cover" />
                  ) : c.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[#0F172A] truncate group-hover:text-[#2563EB] transition-colors">
                    {c.name}
                  </p>
                  <p className="text-[11px] text-[#94A3B8]">{c.count} interaction{c.count !== 1 ? 's' : ''}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </SidebarCard>
      )}



    </div>
  );
};

export default NotificationRightSidebar;
