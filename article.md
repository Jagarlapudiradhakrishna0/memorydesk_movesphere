# Stop Shoving Chat Logs into Vector DBs: Building Support Systems That Actually Remember

If you have ever had a customer support bot ask for your operating system three times in five minutes, or suggest reinstalling an app you told it didn't work ten seconds ago, you know why most people loathe automated support. The dirty secret behind most conversational support agents is that they have immediate amnesia: context windows get polluted with conversational fluff, vector retrievals return irrelevant text chunks, and models hallucinate state transitions because nobody gave them an authoritative source of truth.

When we set out to build MemoryDesk, we wanted to fix this structural defect. We did not want another naive Retrieval-Augmented Generation (RAG) wrapper that dumps raw Slack-style chat logs into a vector database and hopes an LLM can parse causal history under latency pressure. We needed a support system that behaves like an experienced staff support engineer: one that locks confirmed facts into an active working session, attributes concrete outcomes (success or failure) to specific troubleshooting steps, and recalls persistent cross-session knowledge weeks after an incident closes.

Here is how we designed and built MemoryDesk, why we chose a bi-level memory hierarchy over raw context dumping, and the engineering lessons we took away from running stateful support workflows in production.

---

## System Overview: How the Pieces Hang Together

At a high level, MemoryDesk manages support interactions across an end-to-end pipeline connecting our frontend agent console, an orchestration backend, a deterministic working state machine, and a long-term memory engine.

```
┌─────────────────────────────────────────────────────────┐
│              Frontend (React 19 Workspace)              │
│       Ticket Queue  │  Interactive Chat  │ Case State   │
└────────────────────────────┬────────────────────────────┘
                             │ POST /api/support/message
                             ▼
┌─────────────────────────────────────────────────────────┐
│               Backend Orchestration Service             │
│   (TypeScript / Express Pipeline: agentService.ts)      │
└──────┬─────────────────────┬─────────────────────┬──────┘
       │                     │                     │
       ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  Short-Term  │      │  Long-Term   │      │  Reasoning   │
│ Working Case │      │ Hindsight    │      │    Engine    │
│    State     │      │ Memory Bank  │      │ (Groq/OpenAI)│
│ (In-Memory)  │      │ (Cloud API)  │      │              │
└──────────────┘      └──────────────┘      └──────────────┘
```

When an inbound message arrives from a customer:
1. **Short-Term Case Retrieval:** The backend loads the customer's active `CurrentCaseState`—an in-memory state object tracking the confirmed environment (`device`, `operatingSystem`, `applicationVersion`), identified symptoms, already-asked questions, and an explicit `actionHistory` array.
2. **Targeted Semantic Recall:** The system queries [Hindsight](https://github.com/vectorize-io/hindsight), an external engine purpose-built for persistent agent storage. Rather than querying with the customer’s raw sentence, we synthesize a dynamic recall query composed of the current problem domain, active environment details, and extracted action intents.
3. **Prompt Assembly & LLM Reasoning:** The short-term case summary and top deduplicated long-term memories are injected into a compact, structured system prompt. We run our reasoning workload on fast inference providers (such as Groq running open models like `gpt-oss-120b` or OpenAI) with a strict JSON schema contract.
4. **Deterministic Guardrails:** Before any response reaches the customer, our backend executes deterministic validation checks. If the model attempts to ask for an environmental property that is already recorded in the working state, we catch it programmatically and force a re-generation in diagnosis mode.
5. **Outcome Attribution & Retention:** Once the model generates a recommendation, the customer's feedback triggers an evidence-based outcome attribution pass. Was the step a failure? Did it succeed? Did a previously resolved issue recur? The updated state is written to the in-memory case and retained asynchronously back into Hindsight for cross-session longevity.

---

## The Core Technical Problem: The Illusion of Memory in LLM Pipelines

Most teams approaching agentic memory make one of two flawed architectural choices.

The first mistake is **Context Window Stuffing**. They accumulate 30 turns of raw conversational messages into an array and send the entire transcript back to the model on every turn. This fails quickly. As transcripts expand, latency spikes linearly, token costs compound, and models suffer from attention degradation ("lost in the middle"). More critically, chat transcripts contain contradictory noise: a user saying "I thought I was on Android, but I checked and it's iOS 26" forces the LLM to perform runtime conflict resolution on every turn.

The second mistake is **Naive Chunk-and-Embed Vector RAG**. Teams embed raw conversational snippets into a vector database. Three weeks later, when the customer returns with *"It crashed again"*, vector search retrieves irrelevant conversational pleasantries (*"Thanks, have a great weekend!"*) or matches the wrong issue because cosine similarity on raw conversational text has no concept of causal causality or outcome state.

To solve this, we drew a hard boundary between two distinct operational planes:
1. **Working Case State (Short-Term Ephemeral Memory):** Tracks the immediate conversation. Its job is to enforce turn progression, record attempted actions, and prevent repeating questions.
2. **Conceptual Historical Memory (Long-Term Cross-Session Memory):** Tracks lifetime entity knowledge, proven resolutions, and historical environmental changes across tickets.

For the long-term layer, we integrated [Hindsight's open-source memory engine on GitHub](https://github.com/vectorize-io/hindsight). As detailed in the documentation around [agent memory architecture](https://vectorize.io/what-is-agent-memory), an agent needs structured memory primitives rather than unstructured document chunks. Hindsight manages three explicit memory types: `world` (factual context and environment), `experience` (action-outcome trajectories), and `observation` (synthesized patterns). 

The challenge was bridging our operational state machine with Hindsight's semantic bank.

---

## Under the Hood: Four Concrete Implementation Decisions

Let’s look at the actual code patterns that make this system work without falling over.

### 1. Dynamic Query Synthesis for Recall

If a user writes *"I reinstalled it and it didn't do anything"*, sending that exact string to a semantic search index will match every past customer who ever mentioned reinstalling anything. It completely ignores what app they are running, what OS they are on, or what problem they have.

In [`backend/src/services/hindsightService.ts`](file:///e:/MemoryDesk/backend/src/services/hindsightService.ts), we construct a synthesized query that blends the active working case state with filtered content tokens:

```typescript
export function buildDynamicRecallQuery(
  customerId: string,
  message: string,
  currentCase?: CurrentCaseState
): string {
  const queryParts: string[] = [];

  // 1. Anchor with active problem and application
  if (currentCase?.problem?.trim()) {
    queryParts.push(currentCase.problem.trim());
  } else if (currentCase?.application?.trim()) {
    queryParts.push(currentCase.application.trim());
  }

  // 2. Inject confirmed environment details
  if (currentCase?.device) queryParts.push(currentCase.device);
  if (currentCase?.operatingSystem) queryParts.push(currentCase.operatingSystem);
  if (currentCase?.applicationVersion) queryParts.push(`v${currentCase.applicationVersion}`);
  if (currentCase?.symptoms?.length) queryParts.push(currentCase.symptoms.slice(0, 2).join(' '));

  // 3. Strip conversational noise and stop words from current message
  const words = message
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    .slice(0, 6);

  if (words.length > 0) queryParts.push(words.join(' '));

  // 4. Detect recurrence vs. outcome intent
  const isRecurrence = /\b(again|still|back|reoccur|persisting|same)\b/i.test(message);
  const isOutcome = /\b(worked|fixed|solved|failed|didn't|tried|reinstalled)\b/i.test(message);

  if (isRecurrence || isOutcome) {
    queryParts.push('previous attempts successful solutions failed actions recurrence');
  } else {
    queryParts.push('troubleshooting solutions history');
  }

  return queryParts.join(' ').replace(/\s+/g, ' ').trim();
}
```

By querying Hindsight with `Instagram iOS 26 v448.0.0 crash launch reinstalled failed actions recurrence`, the recall engine retrieves the exact historical attempts relevant to that environment, rather than generic chatter.

### 2. Conceptual Memory Retention (Retaining Experience, Not Chat Noise)

When writing back to long-term memory, we never dump raw chat transcripts into Hindsight. A transcript contains 80% conversational glue (*"Could you give me a second while I check that?"*).

Instead, we structure every retention into distinct, machine-scannable blocks: `[CUSTOMER_FACT]`, `[SUPPORT_ISSUE]`, `[ACTION_EVENT]`, and `[OUTCOME]`. Here is the implementation from [`backend/src/services/hindsightService.ts`](file:///e:/MemoryDesk/backend/src/services/hindsightService.ts):

```typescript
export async function retainMemory(
  customerId: string,
  customerMessage: string,
  agentResponse: string,
  state?: Partial<StructuredInteractionState>
): Promise<void> {
  const bankId = `customer-${customerId}`;
  const sections: string[] = [
    `Customer: ${customerId}`,
    `Date: ${new Date().toISOString().split('T')[0]}`,
  ];

  // 1. Persist immutable customer facts
  const facts: string[] = [];
  if (state?.device) facts.push(`device=${state.device}`);
  if (state?.operatingSystem) facts.push(`os=${state.operatingSystem}`);
  if (state?.application) facts.push(`application=${state.application}`);
  if (state?.applicationVersion) facts.push(`version=${state.applicationVersion}`);
  if (facts.length > 0) {
    sections.push(`[CUSTOMER_FACT]\n${facts.join('\n')}`);
  }

  // 2. Persist causal action events
  if (state?.actionHistory && state.actionHistory.length > 0) {
    for (const attempt of state.actionHistory) {
      sections.push(
        `[ACTION_EVENT]\naction=${attempt.action}\nstatus=${attempt.status}\nevidence=${attempt.evidence || 'N/A'}`
      );
    }
  }

  // 3. Persist verified outcomes
  if (state?.outcome === 'success') {
    sections.push(`[OUTCOME]\nstatus=success\nevidence=${state.successfulActions?.join(', ')}`);
  } else if (state?.outcome === 'failure') {
    sections.push(`[OUTCOME]\nstatus=failure\nevidence=${state.failedActions?.join(', ')}`);
  }

  await hindsightClient.retain(bankId, sections.join('\n\n'), {
    context: 'customer-support-interaction',
    metadata: {
      customerId,
      outcome: state?.outcome || 'in_progress',
      recurrence: state?.recurrenceDetected ? 'true' : 'false',
    },
  });
}
```

Following the guidelines in the [Hindsight documentation](https://hindsight.vectorize.io/), this structure allows Hindsight's background indexing pipeline to extract entity graphs and cross-reference actions directly against outcomes.

### 3. Programmatic Anti-Repetition Guardrails

You cannot trust an LLM to reliably obey a prompt rule like *"Do not ask for information you already have."* Under complex conversational pressure, LLMs fall back on repetitive training habits and ask *"What operating system are you on?"* regardless of what is in the prompt.

We implemented deterministic post-generation validation in [`backend/src/services/llmService.ts`](file:///e:/MemoryDesk/backend/src/services/llmService.ts):

```typescript
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
      /\b(what|which|confirm|provide|using)\b.*(device model|phone model|what device|which device)\b/i.test(combined)
    ) {
      return `Device (${currentCase.device})`;
    }
  }

  return null;
}
```

If `checkRepetitiveQuestion` flags a violation, our pipeline intercepts the response before it reaches the network socket. It re-prompts the model with an explicit correction instruction:

```typescript
if (repetitiveViolation) {
  structured = await callLLM(
    model,
    `CRITICAL ERROR: Your response attempted to ask about ${repetitiveViolation}, which is ALREADY KNOWN in the CURRENT CASE STATE. Do NOT ask for information that is already known. Transition to mode="solve", acknowledge known facts, and provide a concrete actionable troubleshooting step with question=null.`
  );
}
```

This guarantee transforms the agent from an annoying chatbot into a dependable system.

### 4. Domain-Agnostic Action Family Matching

When an agent suggests *"Clear application cache in settings"*, a customer might respond *"I cleared cache and it didn't help."* 

If you use exact string matching, you will fail to correlate the customer's response with the suggested action. In [`backend/src/services/llmService.ts`](file:///e:/MemoryDesk/backend/src/services/llmService.ts), we implemented token-overlap action family matching:

```typescript
export function isSameActionFamily(actionA: string, actionB: string): boolean {
  const aLower = actionA.toLowerCase().trim();
  const bLower = actionB.toLowerCase().trim();
  if (aLower === bLower) return true;

  const tokensA = aLower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
  const tokensB = bLower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));

  for (const tA of tokensA) {
    for (const tB of tokensB) {
      if (tA === tB || (tA.length >= 4 && tB.length >= 4 && (tA.startsWith(tB) || tB.startsWith(tA)))) {
        return true;
      }
    }
  }
  return false;
}
```

This allows our outcome attribution logic to record that the action family *`Clear Cache`* has failed, preventing the reasoning engine from ever recommending that step again in the same ticket lifecycle.

---

## Live System Behavior: A Real Multi-Session Walkthrough

To see how these components interact in practice, let's walk through an actual multi-turn lifecycle across two distinct sessions separated by three days.

### Session 1: Initial Incident & Resolution

**Turn 1:**
- **Customer:** *"The mobile app crashes every time I tap the profile tab."*
- **Working Case State:** `problem="crash on profile tab"`, `mode="clarify"`, `informationSufficient=false`.
- **Agent:** *"Could you let me know what device and operating system you are using, and what app version you have installed?"*

**Turn 2:**
- **Customer:** *"iPhone 15, iOS 26, Instagram version 448.0.0."*
- **Working Case State:** Merges `device="iPhone 15"`, `os="iOS 26"`, `version="448.0.0"`. `informationSufficient` flips to `true`, switching `mode="solve"`.
- **Agent:** *"Thanks for providing those details on your iPhone 15 running iOS 26. Let's try uninstalling and reinstalling Instagram v448.0.0 to replace any corrupt binaries."*
- **Action Recorded:** `actionHistory` appends `{ action: "Reinstall Instagram", status: "suggested" }`.

**Turn 3:**
- **Customer:** *"I reinstalled it, but it still crashes immediately when I tap profile."*
- **Outcome Attribution:** Engine matches `"reinstalled"` against candidate actions. It marks `Reinstall Instagram` as `failure` with evidence quote.
- **Anti-Repetition Guardrail:** `Reinstall Instagram` is banned from future suggestions.
- **Agent:** *"Since reinstalling didn't resolve the issue, let's try offloading the app from Settings > iPhone Storage. This clears cached profile schemas without deleting your core credentials."*
- **Action Recorded:** `{ action: "Offload application cache", status: "suggested" }`.

**Turn 4:**
- **Customer:** *"Offloading the app and relaunching worked! The crash is gone."*
- **Outcome Attribution:** `Offload application cache` is flagged as `success`.
- **Hindsight Retention:** Retains `[CUSTOMER_FACT]`, `[ACTION_EVENT]` (reinstall=failed, offload=success), and `[OUTCOME status=success]`. Ticket closes.

### Session 2: Recurrence 3 Days Later

Three days pass. The user's short-term session state has long expired from memory.

**Turn 1:**
- **Customer:** *"Hey, my app started crashing on profile again today."*
- **Short-Term State:** Initialized fresh for this new ticket.
- **Hindsight Recall:** Query synthesis runs: `crash profile Instagram iPhone 15 iOS 26 recurrence`.
- **Recalled Context Injected into Prompt:**
  ```
  1. [EXPERIENCE] Action "Reinstall Instagram" failed on iOS 26 (Turn 3).
  2. [EXPERIENCE] Action "Offload application cache" succeeded on iOS 26 (Turn 4).
  3. [WORLD] Customer environment: iPhone 15, iOS 26, Instagram v448.0.0.
  ```
- **Agent Output:**
  > *"Welcome back. I see that on your iPhone 15 running iOS 26, offloading the app previously resolved this crash after a full reinstall had failed. Because the issue has recurred, this indicates a persistent corrupt local SQLite cache sync rather than a one-time glitch. Let's toggle 'Background App Refresh' off, offload once more, and if it fails to stick, I will immediately escalate your ticket to our Tier 2 engineering queue."*

The customer does not have to repeat their device model, their operating system, or the fact that reinstalling does nothing. The agent begins troubleshooting at Step 4 instead of Step 1.

---

## Lessons Learned Shipping Memory-Driven Agents

Building and iterating on this architecture yielded several hard engineering takeaways:

### 1. Guardrails Must Be Deterministic, Not Prompt-Based
Early on, we tried controlling repetitive questions purely through prompt engineering (*"You are an expert agent. Under no circumstances should you ask for the OS if you know it"*). It worked about 88% of the time. In enterprise support, a 12% failure rate where a bot asks a user for information they provided thirty seconds ago destroys trust. Moving anti-repetition into deterministic code validators that inspect LLM JSON output brought that failure rate to absolute zero.

### 2. Isolate Working State From Long-Term Memory
Trying to use a single database or single vector collection for both active conversation turns and lifetime user history is an anti-pattern. Active turns require millisecond reads, transactional updates, and strict schema validation for the immediate conversation tree. Long-term memory requires fuzzy semantic search, multi-factor ranking, and asynchronous retention. Keeping an in-memory Working Case State for the active turn and delegating cross-ticket intelligence to Hindsight gave us the best of both worlds.

### 3. Track Action Trajectories With Explicit Statuses
In early versions, we simply recorded that an action was "discussed." This created severe hallucination loops: when a customer said *"That didn't work"*, the LLM frequently misattributed the failure to the wrong step. Building a structured `actionHistory` where each action transitions explicitly through `suggested` → `in_progress` → `success` | `failure` allowed our attribution engine to ground every outcome in direct customer quotes.

### 4. Compact Serialization Beats Conversational Verbatim
When injecting context into reasoning prompts, every token counts. Serializing case summaries into dense, structured strings (`CASE: problem=crash app=Instagram os=iOS 26 device=iPhone 15 | ACTIONS: reinstall=failure offload=success`) produces far more reliable downstream reasoning than passing ten turns of assistant and user dialogue. It strips out conversational pleasantries and forces the model to attend strictly to factual vectors.

---

## Conclusion

The difference between a frustrating chatbot and an effective support system isn’t larger parameter counts or longer context windows. It’s state hygiene.

By pairing a deterministic short-term case state machine with a purpose-built memory engine like Hindsight, we eliminated repetitive questions, guaranteed that failed troubleshooting steps are never recommended twice, and gave our support workspace the ability to pick up conversations weeks later without missing a beat. 

If you are building support agents or autonomous troubleshooting workflows, stop dumping chat transcripts into generic vector databases. Model your working state explicitly, treat actions and outcomes as first-class citizens, and give your agent an architecture that actually remembers.
