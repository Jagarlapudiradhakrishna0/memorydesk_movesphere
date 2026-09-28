// Shared TypeScript interfaces for MemoryDesk

export interface SupportRequest {
  customerId: string;
  message: string;
}

export interface RecalledMemoryItem {
  type: string;
  text: string;
  score?: number;
  context?: string;
  occurred_start?: string;
  mentioned_at?: string;
}

export type InteractionIntent =
  | 'new_problem'
  | 'follow_up'
  | 'success'
  | 'failure'
  | 'clarification'
  | 'troubleshooting'
  | 'resolution_confirmation'
  | 'escalation'
  | 'informational';

export type InteractionOutcome =
  | 'success'
  | 'failure'
  | 'in_progress'
  | 'unknown';

export type DiagnosisConfidence = 'low' | 'medium' | 'high';

export type AgentMode = 'clarify' | 'diagnose' | 'solve' | 'follow_up' | 'escalate';

export type ActionStatus = 'suggested' | 'in_progress' | 'success' | 'failure';

export interface ActionAttempt {
  action: string;
  status: ActionStatus;
  turn: number;
  evidence?: string;
  timestamp: string;
  recurrence?: boolean;
}

export interface CurrentCaseState {
  customerId: string;
  problem?: string;
  application?: string;
  applicationVersion?: string;
  device?: string;
  operatingSystem?: string;
  trigger?: string;
  symptoms: string[];
  environment: string[];
  knownFacts: string[];
  historicalFacts?: string[]; // for overridden contradictions
  missingCriticalInformation: string[];
  askedQuestions: string[];
  actionHistory: ActionAttempt[];
  attemptedActions: string[];
  successfulActions: string[];
  failedActions: string[];
  currentOutcome: InteractionOutcome;
  diagnosis?: string;
  suggestedActions: string[];
  mode: AgentMode;
  informationSufficient: boolean;
  escalationRecommended?: boolean;
  escalationReason?: string;
  turnCount: number;
  recurrenceDetected?: boolean;
  lastUpdated: number;
}

export interface StructuredInteractionState {
  interactionId: string;
  mode?: AgentMode;
  intent: InteractionIntent;
  problem?: string;
  application?: string;
  applicationVersion?: string;
  device?: string;
  operatingSystem?: string;
  trigger?: string;
  symptoms?: string[];
  category?: string;
  environment?: string[];
  knownFacts?: string[];
  missingInformation?: string[];
  missingCriticalInformation?: string[];
  askedQuestions?: string[];
  actionHistory?: ActionAttempt[];
  attemptedActions?: string[];
  successfulActions?: string[];
  failedActions?: string[];
  outcome: InteractionOutcome;
  currentOutcome?: InteractionOutcome;
  diagnosisConfidence: DiagnosisConfidence;
  informationSufficient?: boolean;
  diagnosis?: string;
  question?: string | null;
  escalationRecommended?: boolean;
  escalationReason?: string;
  escalation?: string;
  recurrenceDetected?: boolean;
  needsMoreInformation: boolean;
  suggestedActions: string[];
  currentCase?: CurrentCaseState;
}

export interface SupportResponse {
  customerId: string;
  interactionId: string;
  response: string;
  mode: 'live' | 'degraded';
  provider?: string;
  model?: string;
  reason?: string;
  memorySaved: boolean;
  recalledMemories: RecalledMemoryItem[];
  suggestedActions: string[];
  needsMoreInformation: boolean;
  interactionState?: StructuredInteractionState;
  rawContext?: string;
  llmStatus?: LLMProviderStatus;
  retryAfterSeconds?: number;
}

export type LLMProviderStatus = 'available' | 'rate_limited' | 'unavailable';

export interface HealthStatus {
  status: string;
  service: string;
  timestamp?: string;
  llm: {
    provider: 'groq' | 'openai';
    model: string;
    configured: boolean;
    status: LLMProviderStatus;
    retryAfterSeconds?: number;
  };
  hindsight: {
    configured: boolean;
  };
}
