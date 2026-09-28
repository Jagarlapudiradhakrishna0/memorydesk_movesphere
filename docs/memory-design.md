# Memory Design: Short-Term vs. Long-Term Memory

MemoryDesk utilizes a bi-level memory hierarchy that cleanly separates **in-flight conversational state** from **cross-session historical intelligence**.

---

## Memory Hierarchy Overview

| Feature | Short-Term Working Case State | Long-Term Hindsight Cloud Memory |
| :--- | :--- | :--- |
| **Scope** | Active problem session | Cross-session / Lifetime |
| **Storage** | In-memory server state machine | Vectorized knowledge bank |
| **Purpose** | Prevents repeating questions and tracks active turn progression | Remembers past fixes, recurrences, and permanent preferences |
| **Key Entities** | `symptoms`, `environment`, `missingCriticalInformation`, `askedQuestions`, `actionHistory` | `experience`, `world`, `observation` memories |
| **Persistence** | Resets on ticket closure or explicit reset | Persisted across weeks, months, or devices |
| **Access Time** | $O(1)$ fast lookup | Low-latency semantic recall |

---

## 1. Short-Term Working Case State

The Working Case State tracks the immediate conversation in progress. It solves the classic customer support failure mode where an agent asks the same question multiple times across turns.

### Core Properties
- **`knownFacts` & `environment`**: Once a customer confirms their device is an iPhone 15 running iOS 26, this fact is locked and never asked again.
- **`missingCriticalInformation`**: Tracks what the agent truly needs before offering a diagnosis.
- **`askedQuestions`**: Exact set of questions posed by the agent to prevent redundant querying.
- **`actionHistory`**: Authoritative chronological log of every action attempted (`status: 'success' | 'failure' | 'in_progress'`).

---

## 2. Long-Term Hindsight Memory

Long-term memory ensures that if a customer returns days or weeks later with the same or related problem, MemoryDesk does not start from zero.

### Memory Types
1. **`experience`**: Interaction history detailing actions recommended, what failed, and what resolved the issue.
2. **`world`**: Environment and factual changes (e.g., *"Customer updated to iOS 26 on Sep 28"*).
3. **`observation`**: Synthesis of complex diagnostic patterns discovered over multi-turn conversations.

### Adaptive Recall Workflow
When a new message arrives, MemoryDesk queries Hindsight using a targeted query combining the current problem, application, and symptoms. The retrieved memories are injected into Groq's reasoning prompt as proven historical precedent.
