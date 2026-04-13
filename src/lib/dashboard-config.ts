export type DashboardMode = 'mat' | 'sarah';

export type DashboardCardId =
  | 'hero'
  | 'quickStats'
  | 'todayBoard'
  | 'reliability'
  | 'systemStatus'
  | 'agentFleet'
  | 'sessionTree'
  | 'smartRecommendations'
  | 'weekendPlanner'
  | 'homeAssistant'
  | 'dateNight'
  | 'travelPrep'
  | 'errands'
  | 'movies'
  | 'yoga'
  | 'calendar'
  | 'email'
  | 'pipeline'
  | 'lucraCommission'
  | 'lucraRoi'
  | 'tasks'
  | 'amexBenefits'
  | 'collectorRadar'
  | 'firstTimeCollector';

export interface DashboardConfig {
  mode: DashboardMode;
  title: string;
  subtitle: string;
  leftCards: DashboardCardId[];
  centerCards: DashboardCardId[];
  rightCards: DashboardCardId[];
}

export const DASHBOARD_CONFIG: Record<DashboardMode, DashboardConfig> = {
  mat: {
    mode: 'mat',
    title: 'Mat Mission Control',
    subtitle: 'Operator dashboard for work, life, agents, and infrastructure',
    leftCards: ['agentFleet'],
    centerCards: ['sessionTree', 'homeAssistant', 'dateNight', 'travelPrep', 'errands', 'movies', 'yoga'],
    rightCards: ['calendar', 'email', 'pipeline', 'lucraCommission', 'lucraRoi', 'tasks', 'amexBenefits'],
  },
  sarah: {
    mode: 'sarah',
    title: 'Sarah Dashboard',
    subtitle: 'Art business dashboard for collector relationships, launches, and approvals',
    leftCards: ['agentFleet'],
    centerCards: ['homeAssistant'],
    rightCards: ['email', 'tasks', 'collectorRadar', 'firstTimeCollector'],
  },
};

export function getDashboardMode(value: unknown): DashboardMode {
  return value === 'sarah' ? 'sarah' : 'mat';
}
