/**
 * caseService.ts
 *
 * Short-term working memory & current case state management across conversation turns.
 * Merges three sources of truth:
 *   1. Current explicit customer information (highest priority)
 *   2. Active conversation case state
 *   3. Relevant Hindsight long-term memories
 */

import { CurrentCaseState, InteractionOutcome, AgentMode, ActionAttempt } from '../types';

// In-memory conversation case store keyed by customerId
const caseStore = new Map<string, CurrentCaseState>();

export function getOrCreateCaseState(customerId: string): CurrentCaseState {
  const existing = caseStore.get(customerId);
  if (existing) {
    return existing;
  }

  const newState: CurrentCaseState = {
    customerId,
    symptoms: [],
    environment: [],
    knownFacts: [],
    historicalFacts: [],
    missingCriticalInformation: [],
    askedQuestions: [],
    actionHistory: [],
    attemptedActions: [],
    successfulActions: [],
    failedActions: [],
    currentOutcome: 'in_progress',
    suggestedActions: [],
    mode: 'clarify',
    informationSufficient: false,
    turnCount: 0,
    recurrenceDetected: false,
    lastUpdated: Date.now(),
  };

  caseStore.set(customerId, newState);
  return newState;
}

export function resetCaseState(customerId: string): void {
  caseStore.delete(customerId);
}

/**
 * Format a compact, token-efficient Current Case Summary block to inject into the LLM prompt.
 * Zero duplication: compact key=value serialization of facts and actions.
 */
export function buildCaseSummaryForPrompt(state: CurrentCaseState): string {
  const caseLines: string[] = ['CASE:'];
  if (state.problem) caseLines.push(`problem=${state.problem}`);
  if (state.application) caseLines.push(`app=${state.application}`);
  if (state.applicationVersion) caseLines.push(`version=${state.applicationVersion}`);
  if (state.device) caseLines.push(`device=${state.device}`);
  if (state.operatingSystem) caseLines.push(`os=${state.operatingSystem}`);
  if (state.trigger) caseLines.push(`trigger=${state.trigger}`);
  if (state.symptoms.length > 0) caseLines.push(`symptoms=${state.symptoms.join(', ')}`);
  if (state.historicalFacts && state.historicalFacts.length > 0) {
    caseLines.push(`prior_overridden=${state.historicalFacts.join('; ')}`);
  }
  caseLines.push(`mode=${state.mode}`);
  caseLines.push(`sufficient=${state.informationSufficient}`);
  caseLines.push(`outcome=${state.currentOutcome}`);

  const actionLines: string[] = ['\nACTIONS:'];
  if (state.actionHistory && state.actionHistory.length > 0) {
    state.actionHistory.forEach((attempt) => {
      const rec = attempt.recurrence ? ' (recurred)' : '';
      const evid = attempt.evidence ? ` [evidence: "${attempt.evidence}"]` : '';
      actionLines.push(`${attempt.action}=${attempt.status}${rec}${evid}`);
    });
  } else {
    actionLines.push('none_confirmed');
  }

  return `${caseLines.join('\n')}\n${actionLines.join('\n')}`;
}

/**
 * Update the case state with newly extracted facts, preserving prior knowledge and recording action events.
 */
export function updateCaseState(
  customerId: string,
  updates: Partial<CurrentCaseState>
): CurrentCaseState {
  const current = getOrCreateCaseState(customerId);

  // Contradiction handling: if explicit customer statement changes device, OS, app, or browser,
  // preserve old fact in historicalFacts and update current fact
  if (updates.operatingSystem && current.operatingSystem && updates.operatingSystem.toLowerCase() !== current.operatingSystem.toLowerCase()) {
    if (!current.historicalFacts) current.historicalFacts = [];
    current.historicalFacts.push(`Previous OS: ${current.operatingSystem}`);
    current.operatingSystem = updates.operatingSystem;
  } else if (updates.operatingSystem) {
    current.operatingSystem = updates.operatingSystem;
  }

  if (updates.device && current.device && updates.device.toLowerCase() !== current.device.toLowerCase()) {
    if (!current.historicalFacts) current.historicalFacts = [];
    current.historicalFacts.push(`Previous Device: ${current.device}`);
    current.device = updates.device;
  } else if (updates.device) {
    current.device = updates.device;
  }

  if (updates.application && current.application && updates.application.toLowerCase() !== current.application.toLowerCase()) {
    if (!current.historicalFacts) current.historicalFacts = [];
    current.historicalFacts.push(`Previous Application: ${current.application}`);
    current.application = updates.application;
  } else if (updates.application) {
    current.application = updates.application;
  }

  if (updates.applicationVersion) {
    current.applicationVersion = updates.applicationVersion;
  }

  if (updates.problem && (!current.problem || updates.problem.length > current.problem.length)) {
    current.problem = updates.problem;
  }
  if (updates.trigger) {
    current.trigger = updates.trigger;
  }
  if (updates.diagnosis) {
    current.diagnosis = updates.diagnosis;
  }
  if (updates.mode) {
    current.mode = updates.mode;
  }
  if (typeof updates.informationSufficient === 'boolean') {
    current.informationSufficient = updates.informationSufficient;
  }
  if (updates.currentOutcome) {
    current.currentOutcome = updates.currentOutcome;
  }
  if (typeof updates.recurrenceDetected === 'boolean') {
    current.recurrenceDetected = updates.recurrenceDetected;
  }

  // Update Action History
  if (updates.actionHistory) {
    current.actionHistory = updates.actionHistory;
  }

  // Synchronize attemptedActions, successfulActions, failedActions from actionHistory
  if (current.actionHistory.length > 0) {
    const attemptedSet = new Set<string>();
    const successSet = new Set<string>();
    const failedSet = new Set<string>();

    for (const attempt of current.actionHistory) {
      attemptedSet.add(attempt.action);
      if (attempt.status === 'success') {
        successSet.add(attempt.action);
      } else if (attempt.status === 'failure') {
        failedSet.add(attempt.action);
      }
    }

    current.attemptedActions = Array.from(attemptedSet);
    current.successfulActions = Array.from(successSet);
    current.failedActions = Array.from(failedSet);
  } else {
    if (updates.attemptedActions) current.attemptedActions = updates.attemptedActions;
    if (updates.successfulActions) current.successfulActions = updates.successfulActions;
    if (updates.failedActions) current.failedActions = updates.failedActions;
  }

  // Merge & deduplicate string arrays
  const mergeArrays = (existing: string[], incoming?: string[]): string[] => {
    if (!incoming || incoming.length === 0) return existing;
    const set = new Map<string, string>();
    for (const item of existing) {
      if (item && item.trim()) set.set(item.trim().toLowerCase(), item.trim());
    }
    for (const item of incoming) {
      if (item && item.trim()) set.set(item.trim().toLowerCase(), item.trim());
    }
    return Array.from(set.values());
  };

  current.symptoms = mergeArrays(current.symptoms, updates.symptoms);
  current.environment = mergeArrays(current.environment, updates.environment);
  current.knownFacts = mergeArrays(current.knownFacts, updates.knownFacts);
  current.askedQuestions = mergeArrays(current.askedQuestions, updates.askedQuestions);

  if (updates.missingCriticalInformation) {
    current.missingCriticalInformation = updates.missingCriticalInformation;
  }
  if (updates.suggestedActions) {
    current.suggestedActions = updates.suggestedActions;
  }
  if (typeof updates.escalationRecommended === 'boolean') {
    current.escalationRecommended = updates.escalationRecommended;
  }
  if (updates.escalationReason) {
    current.escalationReason = updates.escalationReason;
  }

  current.lastUpdated = Date.now();
  return current;
}
