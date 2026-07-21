import Avatar from '../ui/Avatar';

export default function TypingIndicator({ avatarUrl, name }) {
  return (
    <div className="flex items-end gap-3 max-w-[80%] anim-msg-stagger-in">
      {/* Avatar */}
      <Avatar
        src={avatarUrl}
        name={name}
        size="sm"
        showBorder
      />

      {/* Bubble with gradient dots */}
      <div className="bubble-inbound bg-white border border-[#E8EDF5] px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-[5px]">
          {[0, 160, 320].map((delay, i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #2563EB, #4F46E5)',
                animation: 'typingWave 1.2s ease-in-out infinite',
                animationDelay: `${delay}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
