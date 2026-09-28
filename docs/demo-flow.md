# MemoryDesk Demonstration Flow

This walkthrough demonstrates the end-to-end intelligence of MemoryDesk across a 10-step adaptive support lifecycle.

---

## 10-Step Adaptive Support Lifecycle

### Step 1: Customer Reports Issue
- **Customer**: *"My application crashes when I launch it."*
- **State**: `problem: "crash on launch"`, `mode: "clarify"`.
- **System**: Recognizes lack of environment data without guessing.

### Step 2: Agent Gathers Necessary Information
- **Agent**: Asks for device model, operating system, and recent updates.
- **Customer**: *"iPhone 15, iOS 26, Instagram version 448.0.0, started after the recent update."*
- **System**: Updates Working Case State with known facts. Flags environment as fully known.

### Step 3: Agent Diagnoses
- **System**: Shifts from `clarify` mode to `diagnose`/`solve`.
- **Reasoning**: Analyzes crash patterns for Instagram on iOS 26 after recent patch.

### Step 4: Agent Suggests First Troubleshooting Action
- **Agent**: Recommends reinstalling the application.
- **Action Recorded**: `actionHistory` records *"Reinstall Instagram"* with status `in_progress`.

### Step 5: Customer Reports Failure
- **Customer**: *"I reinstalled it, but it still crashes immediately."*
- **Attribution**: System marks *"Reinstall Instagram"* as `failure` with evidence quote.
- **Retention**: Failed attempt retained in Hindsight Cloud.

### Step 6: Anti-Repetition Guardrail in Action
- **System**: Reasoning engine is forbidden from suggesting reinstallation again.
- **Agent**: Recommends an alternative method: *"Let's try offloading the app to clear corrupt cache configurations."*

### Step 7: Customer Reports Success
- **Customer**: *"Offloading the app and reinstalling worked! The crash is gone."*
- **Attribution**: System records *"Offload app"* as `success`.
- **Retention**: Solution retained in Hindsight as a verified resolution.

### Step 8: Issue Returns (Recurrence)
- **Customer** (3 days later): *"The app started crashing again when I opened it today."*
- **System**: Detects recurrence. Retrieves past success and failure history.

### Step 9: Agent Recalls Previous Experience
- **Recall Drawer**: `↳ Using 3 relevant memories`:
  - Reinstalling Instagram previously failed
  - Offloading the app previously worked temporarily
  - Crash recurred after update
- **Reasoning**: Identifies persistent cache corruption or background sync failure.

### Step 10: Agent Adapts Response & Escalates If Needed
- **Agent**: Acknowledges previous temporary fix and offers advanced troubleshooting or automatic Tier 2 escalation recommendation.
