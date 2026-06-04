export interface KpiSummaryDto {
  value: number;
  change: number;
  trend: 'UP' | 'DOWN' | 'FLAT';
}

export interface KpiAlertDto {
  id: string;
  tenantId?: string;
  kpiCode: string;
  severity: 'WARNING' | 'CRITICAL';
  value: number;
  threshold: number;
  message: string;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface KpiRankingItem {
  id: string;
  name: string;
  activeCount: number;
  completedCount: number;
  rate: number;
}

export interface KpiDashboardDto {
  tenantId: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  summary: Record<string, KpiSummaryDto>;
  topWorkflows: KpiRankingItem[];
  topDepartments: KpiRankingItem[];
  alerts: KpiAlertDto[];
}
