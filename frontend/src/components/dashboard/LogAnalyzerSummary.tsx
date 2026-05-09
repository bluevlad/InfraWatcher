import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Modal,
  Row,
  Skeleton,
  Statistic,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  GithubOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import {
  fetchIntegrationSummary,
  pushQaDashboard,
  reportStandup,
  type IntegrationSummary,
} from '../../services/loganalyzerApi';
import { useAuth } from '../../auth/AuthContext';
import { useAdminAction } from '../../auth/useAdminAction';

const { Text } = Typography;

const LogAnalyzerSummary: React.FC = () => {
  const { isAdmin } = useAuth();
  const adminAction = useAdminAction();
  const [data, setData] = useState<IntegrationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [busy, setBusy] = useState<'qa' | 'standup' | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchIntegrationSummary();
      setData(res);
      setUnavailable(false);
    } catch {
      setUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  const confirmAndRun = (
    title: string,
    body: string,
    run: () => Promise<void>,
  ) => {
    Modal.confirm({
      title,
      content: body,
      okText: '실행',
      cancelText: '취소',
      onOk: run,
    });
  };

  const handleQa = () =>
    adminAction(() =>
      confirmAndRun(
        'QA Dashboard에 수동 전송할까요?',
        `미해결 오류 그룹 ${data?.qa_dashboard.pending_open_count ?? 0}건을 전송합니다.`,
        async () => {
          setBusy('qa');
          try {
            const r = await pushQaDashboard();
            if (r.status === 'sent') message.success(`${r.groups_count}건 전송 완료`);
            else if (r.status === 'no_data') message.info('전송할 그룹이 없습니다');
            else message.warning('전송 실패 — LogAnalyzer 측 API 키 확인');
          } catch {
            message.error('LogAnalyzer 호출 실패');
          } finally {
            setBusy(null);
            load();
          }
        },
      ),
    );

  const handleStandup = () =>
    adminAction(() =>
      confirmAndRun(
        'StandUp에 수동 보고할까요?',
        `해결된 오류 그룹 ${data?.standup.pending_resolved_count ?? 0}건을 보고합니다.`,
        async () => {
          setBusy('standup');
          try {
            const r = await reportStandup();
            if (r.status === 'sent') message.success(`${r.groups_count}건 보고 완료`);
            else if (r.status === 'no_data') message.info('보고할 그룹이 없습니다');
            else message.warning('보고 실패 — LogAnalyzer 측 API 키 확인');
          } catch {
            message.error('LogAnalyzer 호출 실패');
          } finally {
            setBusy(null);
            load();
          }
        },
      ),
    );

  if (unavailable) {
    return (
      <Alert
        type="warning"
        showIcon
        message="LogAnalyzer 연결 실패"
        description="LogAnalyzer 백엔드(9092) 응답이 없어 통합 요약을 표시할 수 없습니다. 잠시 후 자동 재시도합니다."
      />
    );
  }

  if (loading || !data) {
    return (
      <Row gutter={[16, 16]}>
        {[0, 1, 2].map((i) => (
          <Col key={i} xs={24} md={8}>
            <Card size="small">
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  const adminTooltip = isAdmin ? undefined : '관리자 로그인 후 사용 가능';

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}>
        <Card
          size="small"
          title={
            <span>
              <GithubOutlined /> GitHub Issue
            </span>
          }
          extra={<Tag color="default">자동</Tag>}
        >
          <Statistic
            title="자동 생성된 이슈"
            value={data.github.issued_count}
            suffix="건"
            prefix={<ExclamationCircleOutlined />}
          />
          <Descriptions column={1} size="small" style={{ marginTop: 8 }}>
            <Descriptions.Item label="트리거">{data.github.auto_trigger}</Descriptions.Item>
          </Descriptions>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {data.github.note}
          </Text>
        </Card>
      </Col>

      <Col xs={24} md={8}>
        <Card
          size="small"
          title={
            <span>
              <SendOutlined /> QA Dashboard
            </span>
          }
          extra={<Tag color={isAdmin ? 'blue' : 'default'}>{isAdmin ? '관리자' : '읽기 전용'}</Tag>}
          actions={[
            <Tooltip key="qa-tip" title={adminTooltip}>
              <Button
                type="primary"
                size="small"
                icon={<SyncOutlined spin={busy === 'qa'} />}
                loading={busy === 'qa'}
                disabled={!isAdmin && false /* let useAdminAction trigger login */}
                onClick={handleQa}
              >
                수동 전송
              </Button>
            </Tooltip>,
          ]}
        >
          <Statistic
            title="미해결(open) 그룹"
            value={data.qa_dashboard.pending_open_count}
            suffix="건"
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            CRITICAL: {data.totals.critical} · HIGH: {data.totals.high}
          </Text>
        </Card>
      </Col>

      <Col xs={24} md={8}>
        <Card
          size="small"
          title={
            <span>
              <CheckCircleOutlined /> StandUp
            </span>
          }
          extra={<Tag color={isAdmin ? 'green' : 'default'}>{isAdmin ? '관리자' : '읽기 전용'}</Tag>}
          actions={[
            <Tooltip key="su-tip" title={adminTooltip}>
              <Button
                type="primary"
                size="small"
                icon={<SyncOutlined spin={busy === 'standup'} />}
                loading={busy === 'standup'}
                onClick={handleStandup}
              >
                수동 보고
              </Button>
            </Tooltip>,
          ]}
        >
          <Statistic
            title="해결(resolved) 그룹"
            value={data.standup.pending_resolved_count}
            suffix="건"
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            전체 에러: {data.totals.total_errors}건 (24h)
          </Text>
        </Card>
      </Col>
    </Row>
  );
};

export default LogAnalyzerSummary;
