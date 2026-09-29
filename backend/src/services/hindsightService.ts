import {
  HindsightClient,
  HindsightError,
} from '@vectorize-io/hindsight-client';
import { RecalledMemoryItem, StructuredInteractionState, CurrentCaseState } from '../types';

// ─── Singleton client ─────────────────────────────────────────────────────────
const rawHindsightBaseUrl = process.env.HINDSIGHT_BASE_URL ?? 'https://api.hindsight.vectorize.io';
const hindsightClient = new HindsightClient({
  baseUrl: rawHindsightBaseUrl.replace(/\/+$/, ''),
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

export interface CustomerMemoryDetails {
  customerId: string;
  memories: RecalledMemoryItem[];
  totalCount: number;
  status: 'available' | 'unavailable';
}

// ─── Dynamic Recall Query Builder ─────────────────────────────────────────────
/**
 * Builds a dynamic, compact recall query from the customer message AND active case context.
 * Satisfies Phase 5: Uses customer ID, current problem, app, device, OS, version, symptoms, and message keywords.
 */
export function buildDynamicRecallQuery(
  customerId: string,
  message: string,
  currentCase?: CurrentCaseState
): string {
  const queryParts: string[] = [];

  // 1. Current case problem / application
  if (currentCase?.problem && currentCase.problem.trim().length > 0) {
    queryParts.push(currentCase.problem.trim());
  } else if (currentCase?.application && currentCase.application.trim().length > 0) {
    queryParts.push(currentCase.application.trim());
  }

  // 2. Environment details (device, OS, version, trigger)
  if (currentCase?.device) {
    queryParts.push(currentCase.device);
  }
  if (currentCase?.operatingSystem) {
    queryParts.push(currentCase.operatingSystem);
  }
  if (currentCase?.applicationVersion) {
    queryParts.push(`v${currentCase.applicationVersion}`);
  }
  if (currentCase?.trigger) {
    queryParts.push(currentCase.trigger);
  }
  if (currentCase?.symptoms && currentCase.symptoms.length > 0) {
    queryParts.push(currentCase.symptoms.slice(0, 2).join(' '));
  }

  // 3. Relevant content words from the current message
  const words = message
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const stopWords = new Set([
    'the', 'and', 'for', 'that', 'this', 'with', 'from', 'have',
    'what', 'should', 'can', 'are', 'was', 'you', 'your', 'yes', 'not',
    'hello', 'hey', 'please', 'help', 'there'
  ]);
  const contentWords = words.filter((w) => !stopWords.has(w)).slice(0, 6);

  if (contentWords.length > 0) {
    queryParts.push(contentWords.join(' '));
  }

  // 4. Intent & recurrence detection
  const isRecurrence = /\b(again|still|back|reoccur|persisting|same)\b/i.test(message);
  const isOutcome = /\b(worked|fixed|solved|failed|didn't|tried|reinstalled|reset)\b/i.test(message);

  let querySuffix = 'troubleshooting solutions history';
  if (isRecurrence || isOutcome) {
    querySuffix = 'previous attempts successful solutions failed actions recurrence';
  }
  queryParts.push(querySuffix);

  return queryParts.join(' ').replace(/\s+/g, ' ').trim();
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
  message: string,
  currentCase?: CurrentCaseState
): Promise<RecallResult> {
  const bankId = toBankId(customerId);
  const dynamicQuery = buildDynamicRecallQuery(customerId, message, currentCase);

  console.log(`[Hindsight] recall  → bank="${bankId}"  query="${dynamicQuery}"`);

  try {
    let result = await hindsightClient.recall(bankId, dynamicQuery, {
      types: ['world', 'experience', 'observation'],
      preferObservations: true,
    });

    if ((!result.results || result.results.length === 0) && !dynamicQuery.includes('troubleshooting')) {
      try {
        const fallback = await hindsightClient.recall(bankId, 'troubleshooting solutions');
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
 * Retrieve active memories and exact count stored for a customer.
 * Uses Hindsight listMemories for exact real storage verification and count.
 */
export async function getCustomerMemoryDetails(
  customerId: string
): Promise<CustomerMemoryDetails> {
  const bankId = toBankId(customerId);
  try {
    // 1. Primary path: listMemories retrieves stored persistent facts & exact total count
    const listRes = await hindsightClient.listMemories(bankId, { limit: 50 });
    const rawItems: RecalledMemoryItem[] = (listRes.items || []).map((item) => ({
      type: (item.fact_type as any) || 'fact',
      text: item.text || '',
      context: item.context,
      occurred_start: item.occurred_start || item.date || undefined,
      mentioned_at: item.mentioned_at || undefined,
    }));

    const deduplicated = deduplicateMemories(rawItems);
    return {
      customerId,
      memories: deduplicated.slice(0, 25),
      totalCount: listRes.total ?? deduplicated.length,
      status: 'available',
    };
  } catch (err: unknown) {
    if (err instanceof HindsightError && err.statusCode === 404) {
      // Bank not initialized yet (fresh customer with 0 memories)
      return {
        customerId,
        memories: [],
        totalCount: 0,
        status: 'available',
      };
    }

    // 2. Fallback path: semantic recall query
    try {
      const recallRes = await hindsightClient.recall(bankId, 'customer history facts troubleshooting outcomes');
      const rawItems: RecalledMemoryItem[] = (recallRes.results || []).map((r: any) => ({
        type: r.type || 'fact',
        text: r.text || '',
        score: r.score,
        context: r.context,
        occurred_start: r.occurred_start,
        mentioned_at: r.mentioned_at,
      }));
      const deduplicated = deduplicateMemories(rawItems);
      return {
        customerId,
        memories: deduplicated.slice(0, 15),
        totalCount: deduplicated.length,
        status: 'available',
      };
    } catch (fallbackErr: any) {
      if (fallbackErr instanceof HindsightError && fallbackErr.statusCode === 404) {
        return {
          customerId,
          memories: [],
          totalCount: 0,
          status: 'available',
        };
      }
      console.warn(`[Hindsight] Memory retrieval unavailable for ${bankId}:`, (err as any)?.message || err);
      return {
        customerId,
        memories: [],
        totalCount: 0,
        status: 'unavailable',
      };
    }
  }
}

/**
 * Retrieve active memories stored for a given customer (capped and deduplicated).
 */
export async function getCustomerMemories(
  customerId: string
): Promise<RecalledMemoryItem[]> {
  const details = await getCustomerMemoryDetails(customerId);
  return details.memories;
}

// ─── Structured Retain ────────────────────────────────────────────────────────
/**
 * Retain a structured interaction experience in Hindsight memory with explicit outcome attribution & recurrence evidence.
 * Satisfies Phase 3: Conceptual memory records ([CUSTOMER_FACT], [SUPPORT_ISSUE], [ACTION_EVENT], [OUTCOME]).
 * Satisfies Phase 4: Action outcome attribution and historical success/failure preservation.
 */
export async function retainMemory(
  customerId: string,
  customerMessage: string,
  agentResponse: string,
  state?: Partial<StructuredInteractionState>
): Promise<void> {
  const bankId = toBankId(customerId);

  // Skip pure conversational greetings/acknowledgements with no new case information
  const isGreetingNoise = /^(hi|hello|hey|thanks|thank you|ok|okay|bye|goodbye)[!.?]*$/i.test(customerMessage.trim());
  const hasNoCaseInfo = !state?.problem && (!state?.actionHistory || state.actionHistory.length === 0) && !state?.application;
  if (isGreetingNoise && hasNoCaseInfo) {
    console.log(`[Hindsight] Skipping retain for non-substantive greeting: "${customerMessage}"`);
    return;
  }

  const sections: string[] = [
    `Customer: ${customerId}`,
    `Date: ${new Date().toISOString().split('T')[0]}`,
  ];

  // 1. [CUSTOMER_FACT]
  const factParts: string[] = [];
  if (state?.device) factParts.push(`device=${state.device}`);
  if (state?.operatingSystem) factParts.push(`os=${state.operatingSystem}`);
  if (state?.application) factParts.push(`application=${state.application}`);
  if (state?.applicationVersion) factParts.push(`version=${state.applicationVersion}`);
  if (factParts.length > 0) {
    sections.push(`[CUSTOMER_FACT]\ncustomer_id=${customerId}\n${factParts.join('\n')}`);
  }

  // 2. [SUPPORT_ISSUE]
  if (state?.problem && state.problem.trim().length > 0) {
    const issueLines: string[] = [
      `customer_id=${customerId}`,
      `problem=${state.problem.trim()}`,
    ];
    if (state.trigger) issueLines.push(`trigger=${state.trigger.trim()}`);
    if (state.symptoms && state.symptoms.length > 0) issueLines.push(`symptoms=${state.symptoms.join(', ')}`);
    sections.push(`[SUPPORT_ISSUE]\n${issueLines.join('\n')}`);
  }

  // 3. [ACTION_EVENT]
  if (state?.actionHistory && state.actionHistory.length > 0) {
    for (const attempt of state.actionHistory) {
      const actLines: string[] = [
        `customer_id=${customerId}`,
        `action=${attempt.action}`,
        `status=${attempt.status}`,
      ];
      if (attempt.evidence) actLines.push(`evidence=${attempt.evidence}`);
      if (attempt.recurrence) actLines.push(`recurrence=true`);
      actLines.push(`turn=${attempt.turn}`);
      sections.push(`[ACTION_EVENT]\n${actLines.join('\n')}`);
    }
  }

  // 4. [OUTCOME]
  if (state?.recurrenceDetected) {
    sections.push(
      `[OUTCOME]\ncustomer_id=${customerId}\nstatus=recurrence\nevidence=Problem recurred after prior resolution`
    );
    if (state.successfulActions && state.successfulActions.length > 0) {
      sections.push(`[HISTORICAL_SUCCESS]\n${state.successfulActions.join(', ')} previously resolved the issue.`);
    }
  } else if (state?.outcome === 'success') {
    sections.push(
      `[OUTCOME]\ncustomer_id=${customerId}\nstatus=success\nevidence=${state.successfulActions?.join(', ') || 'Customer explicitly confirmed resolution'}`
    );
  } else if (state?.outcome === 'failure') {
    sections.push(
      `[OUTCOME]\ncustomer_id=${customerId}\nstatus=failure\nevidence=${state.failedActions?.join(', ') || 'Troubleshooting action did not resolve the problem'}`
    );
  } else if (state?.outcome) {
    sections.push(`[OUTCOME]\ncustomer_id=${customerId}\nstatus=${state.outcome}`);
  }

  // 5. [INTERACTION_SUMMARY]
  sections.push(
    `[INTERACTION_SUMMARY]\nCustomer statement: "${customerMessage}"\nAgent recommendation: "${agentResponse}"`
  );

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

