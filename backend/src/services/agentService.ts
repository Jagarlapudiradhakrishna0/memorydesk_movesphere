/**
 * agentService.ts
 *
 * The Customer Support Agent.
 *
 * Coordinates the full Hindsight memory & reasoning pipeline:
 *   1. Retrieve current working case state (short-term conversation memory)
 *   2. Recall relevant customer memories & past outcomes from Hindsight (long-term memory)
 *   3. Feed case summary + recalled context into the LLM Reasoning Engine
 *   4. Update working case state with newly extracted facts & attempts
 *   5. Retain the interaction outcome & state back into Hindsight
 */

import { recallMemories, retainMemory } from './hindsightService';
import { generateSupportResponse } from './llmService';
import { getOrCreateCaseState, updateCaseState } from './caseService';
import { SupportResponse } from '../types';

export interface AgentRunResult {
  response: SupportResponse;
  recalledContext: string;
  memoryRetained: boolean;
}

/**
 * Run the full MemoryDesk support pipeline for a single customer message.
 */
export async function runSupportAgent(
  customerId: string,
  message: string
): Promise<AgentRunResult> {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`[Agent] Customer: ${customerId}`);
  console.log(`[Agent] Message:  "${message}"`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // ── Step 1: Short-Term Case State Retrieval ────────────────────────────────
  const currentCase = getOrCreateCaseState(customerId);

  // ── Step 2: Hindsight Memory Recall (Long-term) ─────────────────────────────
  const { contextString, items } = await recallMemories(customerId, message);

  if (contextString) {
    console.log(`\n[Agent] ✓ Recalled ${items.length} relevant memories from bank:`);
    console.log('─'.repeat(45));
    console.log(contextString);
    console.log('─'.repeat(45));
  } else {
    console.log('[Agent] No prior memories — treating as fresh customer.');
  }

  // ── Step 3: Dynamic LLM Reasoning with Working Case Memory ──────────────────
  const agentResult = await generateSupportResponse(message, contextString, currentCase);

  console.log('\n[Agent] ✓ Response generated:');
  console.log('─'.repeat(45));
  console.log(agentResult.response);
  console.log('─'.repeat(45));

  // ── Step 4: Update Short-Term Working Case State ───────────────────────────
  const updatedCase = updateCaseState(customerId, {
    ...agentResult.updatedCase,
    lastUpdated: Date.now(),
  });

  if (agentResult.interactionState) {
    agentResult.interactionState.currentCase = updatedCase;
  }

  console.log(`[Agent] Mode: ${updatedCase.mode} | Info Sufficient: ${updatedCase.informationSufficient} | Outcome: ${updatedCase.currentOutcome}`);

  // ── Step 5: Hindsight Memory Retain (Long-term persistence) ────────────────
  let memoryRetained = false;
  try {
    await retainMemory(customerId, message, agentResult.response, agentResult.interactionState);
    console.log('[Agent] ✓ Interaction state & outcome retained in Hindsight memory.');
    memoryRetained = true;
  } catch (err: any) {
    console.error('[Agent] ✗ Memory retain failed (non-fatal):', err?.message ?? err);
  }

  return {
    response: {
      customerId,
      interactionId: agentResult.interactionState?.interactionId || `int-${Date.now()}`,
      response: agentResult.response,
      mode: agentResult.mode,
      provider: agentResult.provider,
      model: agentResult.model,
      reason: agentResult.reason,
      memorySaved: memoryRetained,
      recalledMemories: items,
      suggestedActions: agentResult.suggestedActions,
      needsMoreInformation: agentResult.needsMoreInformation,
      interactionState: agentResult.interactionState,
      rawContext: contextString,
      llmStatus: agentResult.llmStatus,
      retryAfterSeconds: agentResult.retryAfterSeconds,
    },
    recalledContext: contextString,
    memoryRetained,
  };
}
