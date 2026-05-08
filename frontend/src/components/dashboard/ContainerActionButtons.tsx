import React, { useState } from 'react';
import { Button, message, Modal, Space, Tooltip } from 'antd';
import { PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { restartContainer, startContainer } from '../../services/adminApi';
import { useAuth } from '../../auth/AuthContext';

interface ContainerActionButtonsProps {
  containerName: string;
  status: string | undefined;
}

const isRunning = (s: string | undefined) => s === 'running';

const ContainerActionButtons: React.FC<ContainerActionButtonsProps> = ({ containerName, status }) => {
  const { isAdmin } = useAuth();
  const [busy, setBusy] = useState<'start' | 'restart' | null>(null);

  if (!isAdmin) return null;

  const runAction = async (action: 'start' | 'restart') => {
    setBusy(action);
    try {
      const result = action === 'start'
        ? await startContainer(containerName)
        : await restartContainer(containerName);
      message.success(
        `${action === 'start' ? 'Started' : 'Restarted'} ${result.container} (${result.duration_ms}ms)`,
      );
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      message.error(detail || `${action} failed`);
    } finally {
      setBusy(null);
    }
  };

  const confirm = (action: 'start' | 'restart') => {
    Modal.confirm({
      title: action === 'start' ? 'Start Container?' : 'Restart Container?',
      content: (
        <div>
          <div>
            컨테이너 <code style={{ fontWeight: 600 }}>{containerName}</code>
            {action === 'start' ? '를 시작합니다.' : '를 재시작합니다.'}
          </div>
          {action === 'restart' && (
            <div style={{ marginTop: 8, color: '#fa8c16' }}>
              ⚠️ 재시작 중에는 서비스가 잠시 중단될 수 있습니다.
            </div>
          )}
        </div>
      ),
      okText: action === 'start' ? 'Start' : 'Restart',
      okButtonProps: { danger: action === 'restart' },
      cancelText: 'Cancel',
      onOk: () => runAction(action),
    });
  };

  return (
    <Space size={8}>
      {isRunning(status) ? (
        <Tooltip title="Restart this container">
          <Button
            danger
            size="small"
            icon={<ReloadOutlined />}
            loading={busy === 'restart'}
            disabled={busy !== null}
            onClick={() => confirm('restart')}
          >
            Restart
          </Button>
        </Tooltip>
      ) : (
        <Tooltip title="Start this container">
          <Button
            type="primary"
            size="small"
            icon={<PlayCircleOutlined />}
            loading={busy === 'start'}
            disabled={busy !== null}
            onClick={() => confirm('start')}
          >
            Start
          </Button>
        </Tooltip>
      )}
    </Space>
  );
};

export default ContainerActionButtons;
