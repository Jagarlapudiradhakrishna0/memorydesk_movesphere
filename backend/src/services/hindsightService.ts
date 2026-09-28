import {
  HindsightClient,
  HindsightError,
} from '@vectorize-io/hindsight-client';
import { RecalledMemoryItem, StructuredInteractionState } from '../types';

// ─── Singleton client ─────────────────────────────────────────────────────────
const hindsightClient = new HindsightClient({
  baseUrl: process.env.HINDSIGHT_BASE_URL ?? 'https://api.hindsight.vectorize.io',
  ...(process.env.HINDSIGHT_API_KEY ? { apiKey: process.env.HINDSIGHT_API_KEY } : {}),
});

// Configurable recall limit (default: 5 for token efficiency)
const HINDSIGHT_RECALL_LIMIT = parseInt(process.env.HINDSIGHT_RECALL_LIMIT || '5', 10);

// ─── Bank ID derivation ───────────────────────────────────────────────────────
function toBankId(customerId: string): string {
  return `customer-${customerId}`;
}

export interface RecallResult {
  contextString: string;
  items: RecalledMemoryItem[];
}

// ─── Dynamic Recall Query Builder ─────────────────────────────────────────────
function buildDynamicRecallQuery(message: string): string {
  const words = message
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const stopWords = new Set([
    'the', 'and', 'for', 'that', 'this', 'with', 'from', 'have',
    'what', 'should', 'can', 'are', 'was', 'you', 'your', 'yes', 'not'
  ]);
  const contentWords = words.filter((w) => !stopWords.has(w));

  const baseQuery = contentWords.slice(0, 8).join(' ');

  const isRecurrence = /\b(again|still|back|reoccur|persisting)\b/i.test(message);
  const isOutcome = /\b(worked|fixed|solved|failed|didn't|tried)\b/i.test(message);

  let querySuffix = 'troubleshooting history environment';
  if (isRecurrence || isOutcome) {
    querySuffix = 'previous attempts successful solutions failed actions outcomes environment';
  }

  return baseQuery ? `${baseQuery} ${querySuffix}` : querySuffix;
}

/**
 * Deduplicate memory items based on normalized text content.
 */
function deduplicateMemories(items: RecalledMemoryItem[]): RecalledMemoryItem[] {
  const seen = new Set<string>();
  const unique: RecalledMemoryItem[] = [];

  for (const item of items) {
    const normalized = (item.text || '')
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim()
      .replace(/\s+/g, ' ');

    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    unique.push(item);
  }

  return unique;
}

// ─── Recall ───────────────────────────────────────────────────────────────────
export async function recallMemories(
  customerId: string,
  message: string
): Promise<RecallResult> {
  const bankId = toBankId(customerId);
  const dynamicQuery = buildDynamicRecallQuery(message);

  console.log(`[Hindsight] recall  → bank="${bankId}"  query="${dynamicQuery}"`);

  try {
    let result = await hindsightClient.recall(bankId, dynamicQuery);

    if ((!result.results || result.results.length === 0) && dynamicQuery !== 'troubleshooting') {
      try {
        const fallback = await hindsightClient.recall(bankId, 'troubleshooting');
        if (fallback.results && fallback.results.length > 0) {
          result = fallback;
          console.log(`[Hindsight] fallback query 'troubleshooting' retrieved ${fallback.results.length} memories for bank="${bankId}"`);
        }
      } catch {
        // Keep original 0 results
      }
    }

    const rawList = result.results ?? [];
    console.log(`[Hindsight] recall  ← ${rawList.length} raw memories retrieved for bank="${bankId}"`);

    const rawItems: RecalledMemoryItem[] = rawList.map((r: any) => ({
      type: r.type ?? 'fact',
      text: r.text ?? '',
      score: r.score,
      context: r.context,
      occurred_start: r.occurred_start,
      mentioned_at: r.mentioned_at,
    }));

    const deduplicated = deduplicateMemories(rawItems);
    const topItems = deduplicated.slice(0, HINDSIGHT_RECALL_LIMIT);

    const contextString = topItems.length > 0
      ? topItems.map((item, idx) => `${idx + 1}. [${item.type.toUpperCase()}] ${item.text}`).join('\n')
      : '';

    if (contextString.trim()) {
      console.log(`[Hindsight] targeted recalled context (${topItems.length} items):\n` + '─'.repeat(50));
      console.log(contextString);
      console.log('─'.repeat(50));
    }

    return { contextString, items: topItems };
  } catch (err: unknown) {
    if (err instanceof HindsightError && err.statusCode === 404) {
      console.log(`[Hindsight] recall  ← bank="${bankId}" not found (first interaction) — no context`);
      return { contextString: '', items: [] };
    }
    console.warn(`[Hindsight] recall warning for bank="${bankId}": ${(err as any)?.message || err}. Continuing with fresh context.`);
    return { contextString: '', items: [] };
  }
}

/**
 * Retrieve active memories stored for a given customer (capped and deduplicated).
 */
export async function getCustomerMemories(
  customerId: string
): Promise<RecalledMemoryItem[]> {
  const bankId = toBankId(customerId);
  try {
    const result = await hindsightClient.recall(bankId, 'customer interactions history troubleshooting solutions outcomes');
    const rawItems = (result.results ?? []).map((r: any) => ({
      type: r.type ?? 'fact',
      text: r.text ?? '',
      score: r.score,
      context: r.context,
      occurred_start: r.occurred_start,
      mentioned_at: r.mentioned_at,
    }));
    return deduplicateMemories(rawItems).slice(0, 15);
  } catch (err: unknown) {
    if (err instanceof HindsightError && err.statusCode === 404) {
      return [];
    }
    return [];
  }
}

// ─── Structured Retain ────────────────────────────────────────────────────────
/**
 * Retain a structured interaction experience in Hindsight memory with explicit outcome attribution & recurrence evidence.
 */
export async function retainMemory(
  customerId: string,
  customerMessage: string,
  agentResponse: string,
  state?: Partial<StructuredInteractionState>
): Promise<void> {
  const bankId = toBankId(customerId);

  const sections: string[] = [
    `Customer ID: ${customerId}`,
    `Timestamp: ${new Date().toISOString()}`,
    `Customer message: "${customerMessage}"`,
    `Support response: "${agentResponse}"`,
  ];

  if (state?.problem && state.problem.trim().length > 0) {
    sections.push(`[PROBLEM]\n${state.problem.trim()}`);
  }

  if (state?.application || state?.device || state?.operatingSystem) {
    const envParts: string[] = [];
    if (state.application) envParts.push(`App: ${state.application}`);
    if (state.applicationVersion) envParts.push(`Version: ${state.applicationVersion}`);
    if (state.device) envParts.push(`Device: ${state.device}`);
    if (state.operatingSystem) envParts.push(`OS: ${state.operatingSystem}`);
    sections.push(`[ENVIRONMENT]\n${envParts.join(', ')}`);
  } else if (state?.environment && state.environment.length > 0) {
    sections.push(`[ENVIRONMENT]\n${state.environment.join(', ')}`);
  }

  // Structured Action History logging in Hindsight retain
  if (state?.actionHistory && state.actionHistory.length > 0) {
    for (const attempt of state.actionHistory) {
      const recTag = attempt.recurrence ? ' (RECURRED LATER)' : '';
      sections.push(
        `[ACTION_EVENT]\nAction: "${attempt.action}" | Status: ${attempt.status.toUpperCase()}${recTag} | Turn: ${attempt.turn}${attempt.evidence ? ` | Evidence: "${attempt.evidence}"` : ''}`
      );
    }
  } else if (state?.attemptedActions && state.attemptedActions.length > 0) {
    for (const action of state.attemptedActions) {
      sections.push(`[TRIED_ACTION]\n${action}`);
    }
  }

  // Explicit Outcome Attribution Block
  if (state?.recurrenceDetected) {
    sections.push(
      `[OUTCOME: RECURRENCE]\nProblem recurred after previous troubleshooting. Historical successful actions preserved as evidence without fabricating new failure.`
    );
    if (state?.successfulActions && state.successfulActions.length > 0) {
      sections.push(`[HISTORICAL_SUCCESS]\n${state.successfulActions.join(', ')} previously resolved the issue.`);
    }
  } else if (state?.outcome === 'success') {
    if (state?.successfulActions && state.successfulActions.length > 0) {
      for (const success of state.successfulActions) {
        sections.push(`[OUTCOME: SUCCESS]\nCustomer verified that action "${success}" resolved the problem.`);
      }
    } else {
      sections.push(`[OUTCOME: SUCCESS]\nProblem was reported resolved.`);
    }
  } else if (state?.outcome === 'failure') {
    if (state?.failedActions && state.failedActions.length > 0) {
      for (const failed of state.failedActions) {
        sections.push(`[OUTCOME: FAILURE]\nAction "${failed}" did not resolve the problem.`);
      }
    } else {
      sections.push(`[OUTCOME: FAILURE]\nTroubleshooting action did not resolve the problem.`);
    }
  } else {
    sections.push(`[OUTCOME: ${state?.outcome ? state.outcome.toUpperCase() : 'IN_PROGRESS'}]`);
    if (state?.successfulActions && state.successfulActions.length > 0) {
      sections.push(`[HISTORICAL_SUCCESS]\n${state.successfulActions.join(', ')} previously resolved the issue.`);
    }
    if (state?.failedActions && state.failedActions.length > 0) {
      sections.push(`[HISTORICAL_FAILURE]\n${state.failedActions.join(', ')} previously did not resolve the issue.`);
    }
  }

  if (state?.knownFacts && state.knownFacts.length > 0) {
    sections.push(`[KNOWN_FACTS]\n${state.knownFacts.join('; ')}`);
  }

  const escalationText = state?.escalationReason || state?.escalation;
  if (escalationText) {
    sections.push(`[ESCALATION]\n${escalationText}`);
  }

  const structuredSummary = sections.join('\n\n');

  console.log(`[Hindsight] retain  → bank="${bankId}"`);

  await hindsightClient.retain(bankId, structuredSummary, {
    context: 'customer-support-interaction',
    metadata: {
      customerId,
      date: new Date().toISOString().split('T')[0],
      source: 'memorydesk',
      outcome: state?.outcome || 'in_progress',
      intent: state?.intent || 'troubleshooting',
      confidence: state?.diagnosisConfidence || 'medium',
      recurrence: state?.recurrenceDetected ? 'true' : 'false',
      escalated: state?.escalationRecommended ? 'true' : 'false',
    },
  });

  console.log(`[Hindsight] retain  ← structured interaction stored in bank="${bankId}"`);
}
