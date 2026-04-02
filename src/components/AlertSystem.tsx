import React, { useEffect } from 'react';
import { useSocket, AlertData } from '../contexts/SocketContext';
import { AlertTriangle, Info, Bell, X, Trash2 } from 'lucide-react';

const severityConfig = {
  high: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', color: '#fca5a5', icon: AlertTriangle },
  medium: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', color: '#fde68a', icon: Bell },
  low: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', color: '#93c5fd', icon: Info },
};

const AlertToast: React.FC<{ alert: AlertData; onDismiss: (id: string) => void }> = ({ alert, onDismiss }) => {
  const cfg = severityConfig[alert.severity] || severityConfig.low;
  const Icon = cfg.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (alert.id) onDismiss(alert.id);
    }, 8000);
    return () => clearTimeout(timer);
  }, [alert.id, onDismiss]);

  return (
    <div style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 10,
      padding: '10px 14px', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 10,
      backdropFilter: 'blur(12px)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      animation: 'alertSlideIn 0.3s ease-out',
      fontFamily: "'Inter', sans-serif", maxWidth: 340,
    }}>
      <Icon size={14} color={cfg.color} style={{ marginTop: 2, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: cfg.color, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>
          {alert.type}
        </div>
        <div style={{ fontSize: 11, color: '#e2e8f0', lineHeight: 1.4 }}>{alert.message}</div>
        <div style={{ fontSize: 8, color: '#64748b', marginTop: 3 }}>
          {new Date(alert.timestamp).toLocaleTimeString('en-IN')}
        </div>
      </div>
      <button onClick={() => alert.id && onDismiss(alert.id)} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 2,
        color: '#64748b', flexShrink: 0,
      }}>
        <X size={12} />
      </button>
    </div>
  );
};

const AlertSystem: React.FC = () => {
  const { alerts, clearAlerts } = useSocket();
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());
  const [showLog, setShowLog] = React.useState(false);

  const visibleAlerts = alerts.filter(a => a.id && !dismissed.has(a.id)).slice(0, 5);

  const handleDismiss = React.useCallback((id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  }, []);

  return (
    <>
      {/* Toast stack */}
      <div style={{
        position: 'fixed', top: 44, right: 16, zIndex: 9997,
        display: 'flex', flexDirection: 'column',
      }}>
        {visibleAlerts.map(alert => (
          <AlertToast key={alert.id} alert={alert} onDismiss={handleDismiss} />
        ))}
      </div>

      {/* Alert log toggle */}
      {alerts.length > 0 && (
        <button onClick={() => setShowLog(!showLog)} style={{
          position: 'fixed', top: 44, right: showLog ? 320 : 16, zIndex: 9996,
          background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, color: '#e2e8f0', cursor: 'pointer', padding: '6px 10px',
          fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
          transition: 'right 0.3s ease',
        }}>
          <Bell size={11} />
          {alerts.length}
        </button>
      )}

      {/* Alert log sidebar */}
      {showLog && (
        <div style={{
          position: 'fixed', top: 32, right: 0, bottom: 0, width: 310, zIndex: 9995,
          background: 'rgba(15,23,42,0.97)', backdropFilter: 'blur(12px)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          overflowY: 'auto', padding: 16,
          animation: 'alertLogSlideIn 0.2s ease-out',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>Alert Log ({alerts.length})</span>
            <button onClick={clearAlerts} style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 6, color: '#fca5a5', cursor: 'pointer', padding: '3px 8px',
              fontSize: 9, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <Trash2 size={10} /> Clear
            </button>
          </div>
          {alerts.map(alert => {
            const cfg = severityConfig[alert.severity] || severityConfig.low;
            return (
              <div key={alert.id} style={{
                padding: '8px 10px', marginBottom: 6, borderRadius: 8,
                background: cfg.bg, border: `1px solid ${cfg.border}`,
                fontSize: 10, color: '#e2e8f0',
              }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: cfg.color, letterSpacing: 1, marginBottom: 2 }}>{alert.type}</div>
                <div style={{ fontSize: 10, lineHeight: 1.3 }}>{alert.message}</div>
                <div style={{ fontSize: 8, color: '#64748b', marginTop: 3 }}>{new Date(alert.timestamp).toLocaleTimeString('en-IN')}</div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes alertSlideIn {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes alertLogSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
};

export default React.memo(AlertSystem);
