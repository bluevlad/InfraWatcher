import React, { useEffect, useState, useMemo } from 'react';
import { Typography, Spin } from 'antd';
import { fetchContainers } from '../services/api';
import { groupColors, groupOrder } from '../constants/colors';
import type { ContainerInfo, DashboardSnapshot } from '../types';

const { Text } = Typography;

interface WidgetPageProps {
  snapshot: DashboardSnapshot | null;
  connected: boolean;
}

const statusDot: Record<string, string> = {
  running: '#52c41a',
  exited: '#ff4d4f',
  stopped: '#ff4d4f',
  paused: '#faad14',
  restarting: '#1890ff',
};

const valColor = (v: number) =>
  v > 80 ? '#ff4d4f' : v > 50 ? '#faad14' : 'inherit';

const WidgetPage: React.FC<WidgetPageProps> = ({ snapshot, connected }) => {
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => {
    fetchContainers()
      .then((c) => {
        setContainers(c);
        setLastUpdate(new Date().toLocaleTimeString());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (snapshot) {
      setContainers(snapshot.containers);
      setLastUpdate(new Date().toLocaleTimeString());
      setLoading(false);
    }
  }, [snapshot]);

  // Sort: unhealthy/stopped first, then by group order, then name
  const grouped = useMemo(() => {
    const abnormal = containers
      .filter((c) => c.status !== 'running')
      .sort((a, b) => a.name.localeCompare(b.name));

    const normal = containers
      .filter((c) => c.status === 'running')
      .sort((a, b) => {
        const gi = groupOrder.indexOf(a.group) - groupOrder.indexOf(b.group);
        return gi !== 0 ? gi : a.name.localeCompare(b.name);
      });

    const groups: { name: string; items: ContainerInfo[] }[] = [];

    if (abnormal.length > 0) {
      groups.push({ name: '!! Abnormal', items: abnormal });
    }

    const byGroup = new Map<string, ContainerInfo[]>();
    for (const c of normal) {
      const arr = byGroup.get(c.group) || [];
      arr.push(c);
      byGroup.set(c.group, arr);
    }
    for (const g of groupOrder) {
      const items = byGroup.get(g);
      if (items) groups.push({ name: g, items });
    }

    return groups;
  }, [containers]);

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (name: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#141414' }}>
        <Spin size="large" />
      </div>
    );
  }

  const running = containers.filter((c) => c.status === 'running').length;

  return (
    <div
      style={{
        background: '#141414',
        color: '#e0e0e0',
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: 12,
        userSelect: 'none',
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: '#1a1a1a',
          borderBottom: '1px solid #333',
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>InfraWatcher</span>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: connected ? '#52c41a' : '#ff4d4f',
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: 10, color: connected ? '#52c41a' : '#ff4d4f' }}>
            {connected ? 'Live' : 'Disconnected'}
          </span>
        </div>
        <div style={{ fontSize: 10, color: '#888' }}>
          {running}/{containers.length} running · {lastUpdate}
        </div>
      </div>

      {/* Container List */}
      <div style={{ padding: '4px 0' }}>
        {grouped.map((group) => {
          const isAbnormal = group.name === '!! Abnormal';
          const collapsed = collapsedGroups.has(group.name);
          const gColor = isAbnormal ? '#ff4d4f' : groupColors[group.name] || '#888';

          return (
            <div key={group.name}>
              {/* Group Header */}
              <div
                onClick={() => toggleGroup(group.name)}
                style={{
                  padding: '5px 12px',
                  background: '#1f1f1f',
                  borderLeft: `3px solid ${gColor}`,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 2,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 11, color: gColor }}>
                  {collapsed ? '▸' : '▾'} {group.name}
                </span>
                <span style={{ fontSize: 10, color: '#666' }}>
                  {group.items.length}
                </span>
              </div>

              {/* Container Rows */}
              {!collapsed &&
                group.items.map((c) => (
                  <a
                    key={c.name}
                    href={`/container/${c.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div
                      style={{
                        padding: '6px 12px',
                        borderBottom: '1px solid #222',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#1f1f1f')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Status Dot */}
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: statusDot[c.status] || '#666',
                          flexShrink: 0,
                        }}
                      />

                      {/* Container Name */}
                      <span
                        style={{
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: 12,
                          color: c.status !== 'running' ? '#ff4d4f' : '#e0e0e0',
                        }}
                      >
                        {c.name}
                      </span>

                      {/* CPU */}
                      <span style={{ width: 52, textAlign: 'right', fontSize: 11, color: valColor(c.cpu_percent), flexShrink: 0 }}>
                        <Text style={{ fontSize: 9, color: '#666' }}>CPU </Text>
                        {c.status === 'running' ? `${c.cpu_percent.toFixed(1)}%` : '--'}
                      </span>

                      {/* MEM */}
                      <span style={{ width: 52, textAlign: 'right', fontSize: 11, color: valColor(c.memory_percent), flexShrink: 0 }}>
                        <Text style={{ fontSize: 9, color: '#666' }}>MEM </Text>
                        {c.status === 'running' ? `${c.memory_percent.toFixed(1)}%` : '--'}
                      </span>

                      {/* Status Badge */}
                      <span
                        style={{
                          fontSize: 9,
                          padding: '1px 5px',
                          borderRadius: 3,
                          background: c.status === 'running' ? '#1a3a1a' : '#3a1a1a',
                          color: statusDot[c.status] || '#888',
                          flexShrink: 0,
                          minWidth: 42,
                          textAlign: 'center',
                        }}
                      >
                        {c.status}
                      </span>
                    </div>
                  </a>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WidgetPage;
