import OpenAI from 'openai';
import {
  StructuredInteractionState,
  DiagnosisConfidence,
  CurrentCaseState,
  AgentMode,
  ActionAttempt,
  LLMProviderStatus,
} from '../types';
import { buildCaseSummaryForPrompt } from './caseService';

export type LLMProvider = 'groq' | 'openai';

export interface ProviderConfig {
  provider: LLMProvider;
  model: string;
  fallbackModel?: string | null;
  apiKey?: string;
  baseURL?: string;
  configured: boolean;
}

export interface LLMReasoningOutput {
  mode: 'live' | 'degraded';
  provider?: string;
  model?: string;
  reason?: string;
  response: string;
  suggestedActions: string[];
  needsMoreInformation: boolean;
  interactionState: StructuredInteractionState;
  updatedCase: Partial<CurrentCaseState>;
  llmStatus?: LLMProviderStatus;
  retryAfterSeconds?: number;
}

// ─── Provider Status & Health Tracking ────────────────────────────────────────
let currentLLMStatus: {
  status: LLMProviderStatus;
  retryAfterSeconds?: number;
  rateLimitedUntil?: number;
} = {
  status: 'available',
};

export function setLLMStatus(
  status: LLMProviderStatus,
  retryAfterSeconds?: number
): void {
  currentLLMStatus = {
    status,
    retryAfterSeconds,
    rateLimitedUntil: retryAfterSeconds ? Date.now() + retryAfterSeconds * 1000 : undefined,
  };
}

export function getLLMHealthStatus(): {
  provider: 'groq' | 'openai';
  model: string;
  configured: boolean;
  status: LLMProviderStatus;
  retryAfterSeconds?: number;
} {
  const config = getProviderConfig();
  if (!config.configured) {
    return {
      provider: config.provider,
      model: config.model,
      configured: false,
      status: 'unavailable',
    };
  }

  if (currentLLMStatus.status === 'rate_limited') {
    const remainingMs = (currentLLMStatus.rateLimitedUntil || 0) - Date.now();
    if (remainingMs > 0) {
      return {
        provider: config.provider,
        model: config.model,
        configured: true,
        status: 'rate_limited',
        retryAfterSeconds: Math.ceil(remainingMs / 1000),
      };
    } else {
      currentLLMStatus = { status: 'available' };
    }
  }

  return {
    provider: config.provider,
    model: config.model,
    configured: true,
    status: currentLLMStatus.status,
  };
}

// ─── Explicit 429 Retry-After Parser ──────────────────────────────────────────
export function parseRetryAfter(err: any): number | null {
  const headerVal = err?.headers?.['retry-after'] || err?.response?.headers?.get?.('retry-after');
  if (headerVal) {
    const parsed = parseFloat(headerVal);
    if (!isNaN(parsed) && parsed > 0) return Math.ceil(parsed);
  }

  const msg = err?.message || String(err);
  const minSecMatch = msg.match(/try again in\s+(\d+(?:\.\d+)?)\s*m\s*(\d+(?:\.\d+)?)\s*s/i);
  if (minSecMatch) {
    const mins = parseFloat(minSecMatch[1]);
    const secs = parseFloat(minSecMatch[2]);
    return Math.ceil(mins * 60 + secs);
  }

  const secMatch = msg.match(/try again in\s+(\d+(?:\.\d+)?)\s*s/i);
  if (secMatch) {
    return Math.ceil(parseFloat(secMatch[1]));
  }

  const msMatch = msg.match(/try again in\s+(\d+(?:\.\d+)?)\s*ms/i);
  if (msMatch) {
    return Math.ceil(parseFloat(msMatch[1]) / 1000);
  }

  return null;
}

// ─── Provider Configuration & Client Factory ──────────────────────────────────
export function getProviderConfig(): ProviderConfig {
  const rawProvider = (process.env.LLM_PROVIDER || '').trim().toLowerCase();
  const provider: LLMProvider = rawProvider === 'openai' ? 'openai' : 'groq';

  if (provider === 'groq') {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    const model = process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-120b';
    const fallbackModel = process.env.GROQ_FALLBACK_MODEL?.trim() || null;
    return {
      provider: 'groq',
      model,
      fallbackModel,
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
      configured: Boolean(apiKey && apiKey.length > 0),
    };
  } else {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    const model = process.env.OPENAI_MODEL?.trim() || 'gpt-5.6-luna';
    return {
      provider: 'openai',
      model,
      fallbackModel: null,
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL?.trim(),
      configured: Boolean(apiKey && apiKey.length > 0),
    };
  }
}

function createClient(config: ProviderConfig): OpenAI {
  if (!config.apiKey) {
    throw new Error(
      `API key for provider "${config.provider}" is missing. Set ${
        config.provider === 'groq' ? 'GROQ_API_KEY' : 'OPENAI_API_KEY'
      } in your .env file.`
    );
  }

  return new OpenAI({
    apiKey: config.apiKey,
    ...(config.baseURL ? { baseURL: config.baseURL } : {}),
  });
}

// ─── System Prompt Builder (Compact & Token-Efficient) ─────────────────────────
function buildSystemPrompt(
  currentCaseSummary: string,
  recalledMemoriesSummary: string
): string {
  const parts: string[] = [
    'You are MemoryDesk, an adaptive technical support reasoning agent.',
    '',
    'RULES:',
    '1. ANTI-REPETITION: NEVER ask for information already present in CASE or historical MEMORY (OS, device, app, version, symptoms). If known or sufficient=true, acknowledge known facts and suggest the next actionable troubleshooting step with question=null, mode="solve" or "diagnose".',
    '2. OUTCOME ATTRIBUTION: When customer reports "That fixed it", attribute SUCCESS only to recent suggested action(s) that have NOT previously failed. Never mark a failed action as success without explicit retry evidence.',
    '3. RETRIES: If customer retried a failed action and reports success, record a new success attempt while preserving the failure attempt in history.',
    '4. RECURRENCE: If an issue recurs after success, retain historical success and set outcome="in_progress". Do NOT fabricate failure. Use historical solutions from MEMORY to recommend the next step.',
    '5. CONCISE TROUBLESHOOTING: Recommend 1-2 concrete, safe troubleshooting steps without generic repetition.',
    '',
    currentCaseSummary,
  ];

  if (recalledMemoriesSummary && recalledMemoriesSummary.trim().length > 0) {
    parts.push('\nMEMORY:\n' + recalledMemoriesSummary.trim());
  }

  parts.push(
    '',
    'OUTPUT JSON FORMAT (STRICT):',
    '{"mode":"clarify"|"diagnose"|"solve"|"follow_up"|"escalate","intent":"new_problem"|"troubleshooting"|"clarification"|"follow_up"|"success"|"failure"|"escalation","problem":string,"application":string|null,"applicationVersion":string|null,"device":string|null,"operatingSystem":string|null,"trigger":string|null,"symptoms":string[],"environment":string[],"knownFacts":string[],"missingCriticalInformation":string[],"suggestedActions":string[],"question":string|null,"informationSufficient":boolean,"outcome":"success"|"failure"|"in_progress"|"unknown","diagnosisConfidence":"low"|"medium"|"high","escalationRecommended":boolean,"escalationReason":string|null,"response":string}'
  );

  return parts.join('\n');
}

// ─── JSON Parser & Recovery ──────────────────────────────────────────────────
function parseAndValidateLLMJson(rawContent: string): any {
  let cleaned = rawContent.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed === 'object' && parsed !== null && typeof parsed.response === 'string') {
      return parsed;
    }
  } catch (initialErr) {
    try {
      const repaired = cleaned.replace(/,\s*$/, '').replace(/"\s*$/, '') + '"}';
      const parsed = JSON.parse(repaired);
      if (typeof parsed === 'object' && parsed !== null && typeof parsed.response === 'string') {
        return parsed;
      }
    } catch {}
    throw new Error(`LLM output could not be parsed as valid JSON: ${(initialErr as Error).message}`);
  }

  throw new Error('LLM response missing required "response" string field.');
}

// ─── Deterministic Question Validator ─────────────────────────────────────────
export function checkRepetitiveQuestion(
  responseText: string,
  questionText: string | null,
  currentCase: CurrentCaseState
): string | null {
  const combined = `${responseText} ${questionText || ''}`.toLowerCase();

  if (currentCase.operatingSystem) {
    const osKnown = currentCase.operatingSystem.toLowerCase();
    if (
      !combined.includes(osKnown) &&
      /\b(what|which|confirm|provide|using)\b.*(operating system|os version|what os|which os)\b/i.test(combined)
    ) {
      return `Operating System (${currentCase.operatingSystem})`;
    }
  }

  if (currentCase.device) {
    const devKnown = currentCase.device.toLowerCase();
    if (
      !combined.includes(devKnown) &&
      /\b(what|which|confirm|provide|using)\b.*(device model|phone model|hardware model|what device|which device|what model)\b/i.test(combined)
    ) {
      return `Device (${currentCase.device})`;
    }
  }

  if (currentCase.application) {
    const appKnown = currentCase.application.toLowerCase();
    if (
      !combined.includes(appKnown) &&
      /\b(which application|what application|which app|what app is crashing)\b/i.test(combined)
    ) {
      return `Application (${currentCase.application})`;
    }
  }

  if (currentCase.applicationVersion) {
    const verKnown = currentCase.applicationVersion.toLowerCase();
    if (
      !combined.includes(verKnown) &&
      /\b(what version|which version|app version|application version)\b/i.test(combined)
    ) {
      return `Application Version (${currentCase.applicationVersion})`;
    }
  }

  if (currentCase.trigger) {
    if (
      /\b(did you (recently )?update|have you updated recently|any recent updates)\b/i.test(combined)
    ) {
      return `Trigger / Recent Updates (${currentCase.trigger})`;
    }
  }

  return null;
}

// ─── Extract Entities from Customer Message ─────────────────────────────────
export function extractCaseEntities(
  message: string,
  currentCase: CurrentCaseState
): Partial<CurrentCaseState> {
  const updates: Partial<CurrentCaseState> = {};
  const msgLower = message.toLowerCase();

  const osMatch = message.match(/\b(iOS\s*\d+|Android\s*\d+|Windows\s*\d+|macOS\s*[\w\d]+|Ubuntu\s*[\d.]+)\b/i);
  if (osMatch) {
    updates.operatingSystem = osMatch[1].trim();
  }

  const deviceMatch = message.match(/\b(iPhone\s*\d+(\s*pro|\s*max|\s*mini)?|iPad\s*[\w\d]+|Galaxy\s*S\d+|Pixel\s*\d+|MacBook\s*[\w\d]+|Dell\s*XPS|ThinkPad\s*[\w\d]+)\b/i);
  if (deviceMatch) {
    updates.device = deviceMatch[1].trim();
  }

  const verMatch = message.match(/\b(?:version|v\.?)\s*(\d+(?:\.\d+)+)\b/i);
  if (verMatch) {
    updates.applicationVersion = verMatch[1].trim();
  }

  const appMatch = message.match(/\b(instagram|chrome|firefox|safari|whatsapp|spotify|slack|netflix|facebook|twitter|teams|zoom|outlook)\b/i);
  if (appMatch) {
    updates.application = appMatch[1].charAt(0).toUpperCase() + appMatch[1].slice(1).toLowerCase();
  }

  if (/\b(recent(ly)? update|after update|updated|latest update)\b/i.test(msgLower) && !currentCase.trigger) {
    updates.trigger = 'recent update';
  }

  const symptoms: string[] = [];
  if (/\bcrashes|crashing|crash on launch|closes immediately|freezes\b/i.test(msgLower)) {
    symptoms.push('crashes on launch');
  }
  if (/\btimes out|timeout|unable to load|won't load|cannot connect\b/i.test(msgLower)) {
    symptoms.push('connection times out');
  }
  if (symptoms.length > 0) {
    updates.symptoms = symptoms;
  }

  return updates;
}

// ─── Domain-Agnostic Action Attribution Helpers ──────────────────────────────
const ACTION_STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'to', 'in', 'on', 'at', 'it', 'its', 'my', 'your',
  'with', 'for', 'of', 'is', 'was', 'did', 'tried', 'that', 'this', 'app', 'application',
  'again', 'now', 'still', "didn't", 'did not', 'fixed', 'works', 'failed', 'crashes'
]);

/**
 * Checks whether two action strings belong to the same action family using token overlap.
 * 100% domain-agnostic without hardcoding specific action names.
 */
export function isSameActionFamily(actionA: string, actionB: string): boolean {
  const aLower = actionA.toLowerCase().trim();
  const bLower = actionB.toLowerCase().trim();
  if (aLower === bLower) return true;

  const tokensA = aLower
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !ACTION_STOP_WORDS.has(w));
  const tokensB = bLower
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !ACTION_STOP_WORDS.has(w));

  for (const tA of tokensA) {
    for (const tB of tokensB) {
      if (tA === tB || (tA.length >= 4 && tB.length >= 4 && (tA.startsWith(tB) || tB.startsWith(tA)))) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Dynamically matches or extracts the referenced action from customer feedback.
 * 100% domain-agnostic: matches against candidate actions or extracts the clause.
 */
export function findActionFromMessageOrCandidates(
  message: string,
  candidates: string[],
  actionHistory: ActionAttempt[]
): string | null {
  const msgClean = message.toLowerCase();

  // 1. Try matching against known candidates (suggested actions or history actions)
  const allCandidates = [...new Set([...candidates, ...actionHistory.map((a) => a.action)])];
  let bestCandidate: string | null = null;
  let bestOverlapCount = 0;

  for (const cand of allCandidates) {
    const candTokens = cand
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !ACTION_STOP_WORDS.has(w));

    let matchCount = 0;
    for (const token of candTokens) {
      if (msgClean.includes(token)) {
        matchCount++;
      }
    }

    if (matchCount > bestOverlapCount) {
      bestOverlapCount = matchCount;
      bestCandidate = cand;
    }
  }

  if (bestCandidate && bestOverlapCount > 0) {
    return bestCandidate;
  }

  // 2. Dynamically extract action phrase if explicitly stated in the message
  const phraseMatch =
    message.match(/(?:tried|attempted|did)\s+([^,.]+?)(?:\s+and|\s+but|\s+didn't|\s+still|\s+failed|$)/i) ||
    message.match(/^(.+?)\s+(?:and that fixed it|and that worked|fixed it|fixed the|resolved it|solved it|didn't fix|didn't work|failed|not working|did not fix|didn't help|still crashes|still times out)/i);

  if (phraseMatch && phraseMatch[1]) {
    let extracted = phraseMatch[1].trim();
    extracted = extracted.replace(/^(?:I|We|I've|We've)\s+/i, '').trim();
    const extractedTokens = extracted.toLowerCase().split(/\s+/).filter((w) => !ACTION_STOP_WORDS.has(w));
    if (extractedTokens.length > 0 && extracted.length > 2) {
      return extracted.charAt(0).toUpperCase() + extracted.slice(1);
    }
  }

  return null;
}

// ─── Evidence-Based Outcome Attribution Engine ──────────────────────────────
/**
 * Accurately updates actionHistory based on customer feedback and previous suggestions.
 */
function updateActionHistoryOnFeedback(
  message: string,
  currentCase: CurrentCaseState,
  newTurn: number
): {
  history: ActionAttempt[];
  outcome: 'success' | 'failure' | 'in_progress' | 'unknown';
  recurrence: boolean;
} {
  const history: ActionAttempt[] = [...currentCase.actionHistory];
  const isRetrySuccess =
    /\b(reinstalled it again|reinstalled again|tried again and now|works now|retried.*worked|installed again.*works|again and now it works)\b/i.test(message) &&
    /\b(works|fixed|resolved)\b/i.test(message);

  const isRecurrence =
    !isRetrySuccess &&
    /\b(started crashing again|crashing again|returned|reoccur|happening again|failed again|crashed again)\b/i.test(message);
  const isExplicitSuccess =
    !isRetrySuccess &&
    /\b(that fixed it|that worked|it worked|fixed it|fixed the|resolved it|resolved the|solved it|works now|problem solved|everything is working now)\b/i.test(message);
  const isExplicitFailure =
    /\b(didn't fix|didn't work|failed|not working|not resolved|still broken|nothing works|still crashes|still times out|doesn't work|did not fix|didn't help)\b/i.test(message);

  let computedOutcome: 'success' | 'failure' | 'in_progress' | 'unknown' = 'in_progress';
  let recurrence = false;

  // Case A: Explicit Retry Success (e.g. "I reinstalled it again and now it works.")
  if (isRetrySuccess) {
    computedOutcome = 'success';
    const retriedFromHistory = history
      .filter((a) => a.status === 'failure')
      .find((a) => isSameActionFamily(a.action, message) || message.toLowerCase().includes(a.action.toLowerCase().split(' ')[0]));

    const retriedAction =
      retriedFromHistory?.action ||
      findActionFromMessageOrCandidates(message, currentCase.suggestedActions, history) ||
      (currentCase.suggestedActions[0] || 'Troubleshooting retry');

    history.push({
      action: retriedAction,
      status: 'success',
      turn: newTurn,
      evidence: message,
      timestamp: new Date().toISOString(),
    });

    return { history, outcome: computedOutcome, recurrence: false };
  }

  // Case B: Recurrence ("It started crashing again.")
  if (isRecurrence) {
    computedOutcome = 'in_progress';
    recurrence = true;
    for (const attempt of history) {
      if (attempt.status === 'success') {
        attempt.recurrence = true;
        attempt.evidence = `Customer reported issue recurred: "${message}"`;
      }
    }
    return { history, outcome: computedOutcome, recurrence };
  }

  // Case C: Explicit Success ("That fixed it.", "Flushing DNS and renewing IP fixed it.")
  if (isExplicitSuccess) {
    computedOutcome = 'success';

    const explicitActionFromMsg = findActionFromMessageOrCandidates(message, currentCase.suggestedActions, history);
    const latestSuggested = currentCase.suggestedActions.length > 0 ? currentCase.suggestedActions : [];
    const failedAttempts = history.filter((a) => a.status === 'failure');

    if (explicitActionFromMsg) {
      const previouslyFailed = failedAttempts.some((f) => isSameActionFamily(f.action, explicitActionFromMsg));
      if (!previouslyFailed) {
        history.push({
          action: explicitActionFromMsg,
          status: 'success',
          turn: newTurn,
          evidence: message,
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      const validSuccessCandidates = latestSuggested.filter(
        (action) => !failedAttempts.some((failed) => isSameActionFamily(failed.action, action))
      );

      if (validSuccessCandidates.length > 0) {
        for (const action of validSuccessCandidates) {
          history.push({
            action,
            status: 'success',
            turn: newTurn,
            evidence: message,
            timestamp: new Date().toISOString(),
          });
        }
      } else if (history.length > 0) {
        const lastUnresolved = [...history].reverse().find((a) => a.status === 'suggested');
        if (lastUnresolved && !failedAttempts.some((f) => isSameActionFamily(f.action, lastUnresolved.action))) {
          lastUnresolved.status = 'success';
          lastUnresolved.evidence = message;
        }
      }
    }

    return { history, outcome: computedOutcome, recurrence };
  }

  // Case D: Explicit Failure ("That didn't work", "Reinstalling it didn't fix it")
  if (isExplicitFailure) {
    computedOutcome = 'failure';

    const detectedAction = findActionFromMessageOrCandidates(message, currentCase.suggestedActions, history);
    const actionFailed = detectedAction || currentCase.suggestedActions[0] || 'Suggested troubleshooting action';

    history.push({
      action: actionFailed,
      status: 'failure',
      turn: newTurn,
      evidence: message,
      timestamp: new Date().toISOString(),
    });

    return { history, outcome: computedOutcome, recurrence };
  }

  return { history, outcome: computedOutcome, recurrence };
}

// ─── Generate Support Response with LLM Reasoning ────────────────────────────
export async function generateSupportResponse(
  message: string,
  customerContext: string,
  currentCase: CurrentCaseState
): Promise<LLMReasoningOutput> {
  const config = getProviderConfig();
  const interactionId = `int-${Date.now()}`;
  const turnCount = (currentCase.turnCount || 0) + 1;

  // 1. Augment working case with explicit facts from customer message
  const extracted = extractCaseEntities(message, currentCase);

  // 1b. Phase 27 Merge Hierarchy:
  // (1) Explicit customer info -> (2) Current working case -> (3) Relevant Hindsight long-term memory
  const historicalEntities = customerContext ? extractCaseEntities(customerContext, {
    customerId: currentCase.customerId,
    symptoms: [],
    environment: [],
    knownFacts: [],
    missingCriticalInformation: [],
    askedQuestions: [],
    actionHistory: [],
    attemptedActions: [],
    successfulActions: [],
    failedActions: [],
    suggestedActions: [],
    mode: 'clarify',
    informationSufficient: false,
    currentOutcome: 'in_progress',
    turnCount: 0,
    lastUpdated: 0,
  }) : {};

  const mergedDevice = extracted.device || currentCase.device || historicalEntities.device;
  const mergedOS = extracted.operatingSystem || currentCase.operatingSystem || historicalEntities.operatingSystem;
  const mergedApp = extracted.application || currentCase.application || historicalEntities.application;
  const mergedVersion = extracted.applicationVersion || currentCase.applicationVersion || historicalEntities.applicationVersion;
  const mergedTrigger = extracted.trigger || currentCase.trigger || historicalEntities.trigger;

  // 2. Perform evidence-based outcome attribution on action history
  const outcomeAttribution = updateActionHistoryOnFeedback(message, currentCase, turnCount);

  // 3. Assemble working case
  const workingCase: CurrentCaseState = {
    ...currentCase,
    ...extracted,
    device: mergedDevice,
    operatingSystem: mergedOS,
    application: mergedApp,
    applicationVersion: mergedVersion,
    trigger: mergedTrigger,
    turnCount,
    actionHistory: outcomeAttribution.history,
    currentOutcome: outcomeAttribution.outcome,
    recurrenceDetected: outcomeAttribution.recurrence,
    symptoms: [...new Set([...currentCase.symptoms, ...(extracted.symptoms || [])])],
    environment: [...new Set([...currentCase.environment, ...(extracted.environment || [])])],
  };

  // Derive successful, failed, attempted sets
  const successSet = new Set<string>();
  const failedSet = new Set<string>();
  const attemptedSet = new Set<string>();

  for (const attempt of workingCase.actionHistory) {
    attemptedSet.add(attempt.action);
    if (attempt.status === 'success') {
      successSet.add(attempt.action);
    } else if (attempt.status === 'failure') {
      failedSet.add(attempt.action);
    }
  }

  workingCase.successfulActions = Array.from(successSet);
  workingCase.failedActions = Array.from(failedSet);
  workingCase.attemptedActions = Array.from(attemptedSet);

  if (workingCase.operatingSystem && !workingCase.environment.includes(workingCase.operatingSystem)) {
    workingCase.environment.push(workingCase.operatingSystem);
  }
  if (workingCase.device && !workingCase.environment.includes(workingCase.device)) {
    workingCase.environment.push(workingCase.device);
  }
  if (workingCase.application && workingCase.applicationVersion) {
    const appStr = `${workingCase.application} ${workingCase.applicationVersion}`;
    if (!workingCase.environment.includes(appStr)) workingCase.environment.push(appStr);
  }

  // Determine if information is already sufficient
  const hasAppOrProblem = Boolean(workingCase.problem || workingCase.application);
  const hasEnvOrTrigger = Boolean(workingCase.operatingSystem || workingCase.device || workingCase.trigger || workingCase.environment.length > 0);
  const hasSymptom = workingCase.symptoms.length > 0 || /crash|fail|error|load|broken|connect/i.test(message);

  if (hasAppOrProblem && hasEnvOrTrigger && hasSymptom) {
    workingCase.informationSufficient = true;
  }

  const caseSummary = buildCaseSummaryForPrompt(workingCase);

  console.log(`[LLM] Reasoning via provider="${config.provider}", model="${config.model}"...`);
  console.log(`[LLM] Turn: ${turnCount} | Outcome: ${workingCase.currentOutcome} | Recurrence: ${workingCase.recurrenceDetected}`);

  if (!config.configured) {
    console.warn(`[LLM] Provider "${config.provider}" is not configured. Missing API key.`);
    return {
      mode: 'degraded',
      provider: config.provider,
      model: config.model,
      reason: `LLM service unavailable (${config.provider.toUpperCase()} API key missing)`,
      response: `Reasoning engine unavailable. Please configure ${
        config.provider === 'groq' ? 'GROQ_API_KEY' : 'OPENAI_API_KEY'
      } in your .env file.`,
      suggestedActions: [`Configure ${config.provider.toUpperCase()} in .env`, 'Retry interaction'],
      needsMoreInformation: false,
      interactionState: {
        interactionId,
        intent: 'clarification',
        problem: message,
        outcome: 'unknown',
        diagnosisConfidence: 'low',
        escalationRecommended: false,
        escalationReason: '',
        knownFacts: [],
        missingInformation: [],
        needsMoreInformation: false,
        suggestedActions: [],
        attemptedActions: [],
        successfulActions: [],
        failedActions: [],
        environment: [],
      },
      updatedCase: {},
    };
  }

  const client = createClient(config);

  async function callLLM(modelToUse: string, promptAddition?: string): Promise<any> {
    const systemPrompt = buildSystemPrompt(caseSummary, customerContext);
    const userContent = promptAddition ? `${message}\n\n[INSTRUCTION]: ${promptAddition}` : message;

    const completion = await client.chat.completions.create({
      model: modelToUse,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.2,
      max_tokens: 1024,
      ...(config.provider === 'groq' ? { reasoning_effort: 'low' as any } : {}),
      ...(config.provider === 'openai' ? { response_format: { type: 'json_object' } } : {}),
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error(`${config.provider.toUpperCase()} returned empty response.`);
    return parseAndValidateLLMJson(raw);
  }

  try {
    let structured: any;
    let effectiveModel = config.model;

    try {
      structured = await callLLM(config.model);
    } catch (primaryErr: any) {
      const is429 = primaryErr?.status === 429 || /429|rate limit/i.test(primaryErr?.message || '');
      const retrySecs = parseRetryAfter(primaryErr);

      // Optional controlled retry: only if short retry timing (<= 2 seconds)
      if (is429 && retrySecs !== null && retrySecs <= 2) {
        console.log(`[LLM] Short rate limit wait detected (${retrySecs}s). Performing 1 controlled retry...`);
        await new Promise((r) => setTimeout(r, retrySecs * 1000));
        structured = await callLLM(config.model);
      } else if (is429 && config.fallbackModel) {
        // Fallback model only if explicitly configured
        console.log(`[LLM] Primary model "${config.model}" rate-limited. Trying configured fallback: "${config.fallbackModel}"`);
        structured = await callLLM(config.fallbackModel);
        effectiveModel = config.fallbackModel;
      } else {
        throw primaryErr;
      }
    }

    // Mark provider available upon successful response
    setLLMStatus('available');

    const repetitiveViolation = checkRepetitiveQuestion(structured.response, structured.question, workingCase);
    if (repetitiveViolation) {
      console.warn(`[LLM] Repetitive question detected for: ${repetitiveViolation}. Prompting LLM to correct.`);
      structured = await callLLM(
        effectiveModel,
        `CRITICAL ERROR: Your response attempted to ask about ${repetitiveViolation}, which is ALREADY KNOWN in the CURRENT CASE STATE. Do NOT ask for information that is already known. Transition to mode="solve" or mode="diagnose", acknowledge known facts, and provide a concrete actionable troubleshooting step with question=null.`
      );
    }

    if (workingCase.informationSufficient || structured.informationSufficient) {
      structured.informationSufficient = true;
      structured.question = null;
      if (structured.mode === 'clarify') {
        structured.mode = 'solve';
      }
      structured.needsMoreInformation = false;
    }

    // Synchronize action lists from authoritative actionHistory
    const successful = workingCase.successfulActions;
    const failed = workingCase.failedActions;
    const attempted = workingCase.attemptedActions;

    // Determine mode
    let mode: AgentMode = structured.mode || (structured.needsMoreInformation ? 'clarify' : 'solve');
    if (workingCase.currentOutcome === 'success' || workingCase.currentOutcome === 'failure' || workingCase.recurrenceDetected) {
      mode = 'follow_up';
    }

    let diagnosisConfidence: DiagnosisConfidence = 'medium';
    if (['low', 'medium', 'high'].includes(structured.diagnosisConfidence)) {
      diagnosisConfidence = structured.diagnosisConfidence;
    } else if (structured.informationSufficient) {
      diagnosisConfidence = 'high';
    } else if (workingCase.informationSufficient) {
      diagnosisConfidence = 'medium';
    } else {
      diagnosisConfidence = 'low';
    }

    // Escalation detection
    let escalationRecommended = Boolean(structured.escalationRecommended);
    if (!escalationRecommended && (failed.length >= 3 || /nothing works|tried everything|really need this fixed/i.test(message))) {
      escalationRecommended = true;
    }
    const escalationReason = structured.escalationReason || structured.escalation || (escalationRecommended ? 'Persistent issue after multiple troubleshooting attempts; escalation recommended' : undefined);

    const knownFacts = Array.isArray(structured.knownFacts) ? structured.knownFacts : [];
    const missingCritical = Array.isArray(structured.missingCriticalInformation)
      ? structured.missingCriticalInformation
      : Array.isArray(structured.missingInformation)
      ? structured.missingInformation
      : [];

    const suggestedActions = Array.isArray(structured.suggestedActions) ? structured.suggestedActions : [];

    // Record new suggested action in actionHistory as "suggested"
    if (suggestedActions.length > 0 && workingCase.currentOutcome !== 'success') {
      for (const act of suggestedActions) {
        if (!workingCase.actionHistory.some((a) => a.action.toLowerCase() === act.toLowerCase())) {
          workingCase.actionHistory.push({
            action: act,
            status: 'suggested',
            turn: turnCount,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    const askedQuestions = [...workingCase.askedQuestions];
    if (structured.question && !workingCase.informationSufficient) {
      askedQuestions.push(structured.question);
    }

    const updatedCase: Partial<CurrentCaseState> = {
      problem: structured.problem || workingCase.problem,
      application: structured.application || workingCase.application,
      applicationVersion: structured.applicationVersion || workingCase.applicationVersion,
      device: structured.device || workingCase.device,
      operatingSystem: structured.operatingSystem || workingCase.operatingSystem,
      trigger: structured.trigger || workingCase.trigger,
      diagnosis: structured.diagnosis || workingCase.diagnosis,
      mode,
      informationSufficient: workingCase.informationSufficient || Boolean(structured.informationSufficient),
      currentOutcome: workingCase.currentOutcome,
      recurrenceDetected: workingCase.recurrenceDetected,
      turnCount,
      symptoms: Array.isArray(structured.symptoms) ? structured.symptoms : workingCase.symptoms,
      environment: Array.isArray(structured.environment) ? structured.environment : workingCase.environment,
      knownFacts: knownFacts.length > 0 ? knownFacts : workingCase.knownFacts,
      missingCriticalInformation: workingCase.informationSufficient ? [] : missingCritical,
      askedQuestions,
      actionHistory: workingCase.actionHistory,
      attemptedActions: attempted,
      successfulActions: successful,
      failedActions: failed,
      suggestedActions,
      escalationRecommended,
      escalationReason,
    };

    return {
      mode: 'live',
      provider: config.provider,
      model: effectiveModel,
      response: structured.response,
      suggestedActions,
      needsMoreInformation: !workingCase.informationSufficient && Boolean(structured.needsMoreInformation),
      llmStatus: 'available',
      interactionState: {
        interactionId,
        mode,
        intent: structured.intent || (workingCase.informationSufficient ? 'troubleshooting' : 'clarification'),
        problem: updatedCase.problem || message,
        application: updatedCase.application,
        applicationVersion: updatedCase.applicationVersion,
        device: updatedCase.device,
        operatingSystem: updatedCase.operatingSystem,
        trigger: updatedCase.trigger,
        symptoms: updatedCase.symptoms,
        environment: updatedCase.environment,
        knownFacts: updatedCase.knownFacts,
        missingInformation: updatedCase.missingCriticalInformation,
        missingCriticalInformation: updatedCase.missingCriticalInformation,
        askedQuestions: updatedCase.askedQuestions,
        actionHistory: updatedCase.actionHistory,
        attemptedActions: successful.concat(failed),
        successfulActions: successful,
        failedActions: failed,
        outcome: workingCase.currentOutcome,
        currentOutcome: workingCase.currentOutcome,
        recurrenceDetected: workingCase.recurrenceDetected,
        diagnosisConfidence,
        informationSufficient: updatedCase.informationSufficient,
        diagnosis: updatedCase.diagnosis,
        question: workingCase.informationSufficient ? null : structured.question,
        escalationRecommended,
        escalationReason,
        escalation: escalationReason,
        needsMoreInformation: !workingCase.informationSufficient && Boolean(structured.needsMoreInformation),
        suggestedActions,
      },
      updatedCase,
    };
  } catch (err: any) {
    const is429 = err?.status === 429 || /429|rate limit/i.test(err?.message || '');
    const retrySecs = parseRetryAfter(err);

    if (is429) {
      setLLMStatus('rate_limited', retrySecs || 60);
      console.warn(`[LLM] 429 Rate limited. retryAfterSeconds=${retrySecs}. Entering clean degraded mode.`);
    } else {
      setLLMStatus('unavailable');
      console.warn(`[LLM] Error during reasoning: ${err?.message || err}. Entering degraded mode.`);
    }

    // Customer-facing notice: clean, concise, ZERO organization IDs, ZERO Groq billing URLs
    const customerNotice = is429
      ? (retrySecs
          ? `Reasoning engine is temporarily rate-limited. Please retry in approximately ${retrySecs} seconds.`
          : 'Reasoning engine is temporarily rate-limited. Please try again shortly.')
      : 'Reasoning engine is temporarily unavailable. Please try again shortly.';

    return {
      mode: 'degraded',
      provider: config.provider,
      model: config.model,
      reason: is429 ? 'Groq API rate-limited (HTTP 429)' : `LLM service unavailable (${err?.message || 'Provider execution error'})`,
      response: customerNotice,
      suggestedActions: is429 ? ['Retry interaction in a few moments'] : ['Check provider configuration', 'Retry interaction'],
      needsMoreInformation: false,
      llmStatus: is429 ? 'rate_limited' : 'unavailable',
      retryAfterSeconds: retrySecs || (is429 ? 60 : undefined),
      interactionState: {
        interactionId,
        mode: workingCase.mode || 'clarify',
        intent: 'clarification',
        problem: workingCase.problem || message,
        application: workingCase.application,
        applicationVersion: workingCase.applicationVersion,
        device: workingCase.device,
        operatingSystem: workingCase.operatingSystem,
        trigger: workingCase.trigger,
        symptoms: workingCase.symptoms,
        environment: workingCase.environment,
        knownFacts: workingCase.knownFacts,
        missingInformation: workingCase.missingCriticalInformation,
        missingCriticalInformation: workingCase.missingCriticalInformation,
        askedQuestions: workingCase.askedQuestions,
        actionHistory: workingCase.actionHistory,
        attemptedActions: workingCase.attemptedActions,
        successfulActions: workingCase.successfulActions,
        failedActions: workingCase.failedActions,
        outcome: workingCase.currentOutcome,
        currentOutcome: workingCase.currentOutcome,
        recurrenceDetected: workingCase.recurrenceDetected,
        diagnosisConfidence: 'low',
        needsMoreInformation: false,
        suggestedActions: [],
      },
      updatedCase: workingCase,
    };
  }
}
