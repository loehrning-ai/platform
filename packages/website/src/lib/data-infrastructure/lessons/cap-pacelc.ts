// Ported from data-infrastructure/lessons/02-cap-pacelc.html.
import type { DataInfraLesson } from "../types";
import { checkpointLessonId } from "../types";
import {
  DATA_INFRA_QUIZ_COPY,
  DATA_INFRA_FLASHCARDS_COPY,
} from "../widget-copy";

const LID = checkpointLessonId("cap-pacelc");

const lesson: DataInfraLesson = {
  id: "cap-pacelc",
  number: 2,
  title: "CAP, PACELC & Coordination Cost",
  subtitle: "Partition behavior and normal-operation trade-offs",
  durationMinutes: 14,
  trackId: "foundations",
  hook: "State the failure model first, then choose consistency and availability behavior per operation.",
  keyConcepts: [
    "CAP theorem",
    "PACELC",
    "Quorum",
    "Linearizability",
    "Eventual consistency",
  ],
  quiz: [],
  sections: [
    {
      id: "s1",
      title: "CAP, restated",
      readTimeMinutes: 3,
      content:
        'CAP applies when a network partition prevents parts of a distributed system from communicating. Under the theorem\'s model, the system cannot simultaneously guarantee **linearizable consistency** and **availability for every request to a non-failing node** for the affected operations.\n\nThat definition is narrower than the labels often used in product diagrams. Consistency here is not simply "correct data," and availability is not an uptime percentage. A design can reject or delay selected operations, serve stale data for others, or use different policies for different records. State the operation, failure model, and client-visible behavior before attaching a CAP label.',
      keyTakeaway:
        "CAP describes behavior during a communication partition; it does not rank databases or replace an operation-level failure policy.",
    },
    {
      id: "s2",
      title: "Pick a trade",
      readTimeMinutes: 2,
      content:
        'The interactive model places three replicas behind a client and then removes communication between them. In its simplified **CP** branch, an isolated replica rejects operations that cannot satisfy the selected consistency rule. In its simplified **AP** branch, reachable replicas accept operations and may diverge until reconciliation.\n\nThe model does not simulate a database protocol or measured failure behavior. A single-node database falls outside the replicated partition scenario; it has different availability and durability risks rather than a useful "CA" classification.',
    },
    {
      id: "s3",
      title: "PACELC",
      readTimeMinutes: 3,
      content:
        "PACELC adds a normal-operation question to the partition case: **if there is a partition, which availability or consistency behavior is chosen; else, how does the system trade coordination latency against consistency?**\n\nCross-node coordination adds work and at least one communication path. The actual cost depends on topology, quorum placement, workload, cache state, and failure conditions; a local replica is not inherently a fixed number of milliseconds faster. Some products expose consistency choices per request or transaction, while others bind them at a table, session, or deployment level.\n\nThe PA/EL, PA/EC, PC/EL, and PC/EC labels are shorthand for discussing those choices. They are not permanent vendor classifications: configuration and operation type can move one deployment between behaviors.",
    },
    {
      id: "s4",
      title: "Latency tax",
      readTimeMinutes: 2,
      content:
        "The frontier graphic is an **illustrative ordering**, not a latency benchmark. Stronger guarantees often require more coordination or restricted replica choices, but measured latency depends on the implementation and deployment.\n\n- **Best effort**, no stated freshness or ordering contract.\n- **Eventual consistency**, replicas are expected to converge after writes stop, without a bound unless the system specifies one.\n- **Read-your-writes**, a client session observes its acknowledged writes; other clients can still observe older versions.\n- **Causal consistency**, observations preserve defined causal relationships between operations.\n- **Linearizability**, each operation appears to take effect atomically between invocation and response. Implementations may coordinate reads, writes, leases, or leaders differently.\n\nBenchmark the configured deployment under normal and degraded conditions. Do not infer a p99 value from the name of a consistency model.",
    },
    {
      id: "s5",
      title: "Consistency staircase",
      readTimeMinutes: 3,
      content:
        '"Consistency" names several distinct contracts. The staircase model replays one synthetic race: writer A writes `x=1` then `x=2`; reader B reads `x`. Green means the displayed result satisfies the contract defined for that step; crimson means the simplified model permits the displayed stale value.\n\nWhen a requirement says "consistent," replace it with an observable rule: for example, "a session must read its acknowledged writes" or "all clients must observe inventory decrements in one linearizable order." Then test whether the selected product and configuration provide that rule under the stated failures.',
      keyTakeaway:
        'Name the client-visible consistency rule and its scope; the word "consistent" alone is not an acceptance criterion.',
    },
    {
      id: "s6",
      title: "Quick check",
      readTimeMinutes: 1,
      content: "Three questions on what you just read.",
    },
    {
      id: "s7",
      title: "Vocab",
      readTimeMinutes: 1,
      content:
        "- **Quorum (N/R/W)**, a shorthand for replica count, read responses, and write acknowledgements. `R + W > N` creates overlap under simplified assumptions; conflict resolution, failed nodes, sloppy quorums, and acknowledgement rules still determine what a read can guarantee.\n- **Sloppy quorum**, writes may be accepted by temporary non-home replicas during a failure and transferred later. Exact behavior is product- and configuration-specific.\n- **Read repair**, a read that observes divergent replicas can trigger reconciliation. It is one repair mechanism, not a complete convergence proof.\n- **Linearizability**, each operation appears atomic and respects real-time ordering. Implementations can use leaders, leases, consensus, quorums, or other mechanisms.\n- **Bounded staleness**, a contract that limits version or time lag. The bound, enforcement point, and behavior when the bound cannot be met must be specified.",
    },
  ],
  widgets: [
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q1",
        title: "A real interview question",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          "You are designing a replicated checkout cart. During a partition, the product accepts temporary cart divergence to keep reachable regions writable. In normal operation, it requires coordinated cart state across devices. Which PACELC shorthand describes that stated policy?",
        options: [
          "PA/EL, prioritize availability during partitions and latency otherwise.",
          "PC/EC, reject partitioned writes and coordinate in normal operation.",
          "PA/EC, strong consistency in the normal case, but stay available during partitions.",
          "PC/EL, strong consistency under partition, low latency otherwise.",
        ],
        correct: 2,
        explanation:
          "PA/EC matches the policy as stated: remain available during the partition and coordinate for consistency in normal operation. The label does not select a product or prove the cart's merge behavior; those require an explicit conflict policy and tests.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q2",
        title: '"Eventual" needs a bound',
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          'A design says only: "the replicas are eventually consistent." What question is still unanswered?',
        options: [
          '"What convergence distribution and failure behavior can clients observe?" Eventual consistency alone gives no time bound.',
          '"What\'s your replication factor?"',
          '"Are you sure you don\'t mean strong consistency?"',
          '"Why not Postgres?"',
        ],
        correct: 0,
        explanation:
          "Eventual consistency states convergence under assumptions such as writes stopping; it does not provide a time bound. Measure convergence under expected load and failures, define the client behavior while replicas differ, and add a stronger session guarantee only if the product requires it.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q3",
        title: "The trick question",
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          'Why is "CA" usually unhelpful shorthand for a replicated system whose nodes can lose communication?',
        options: [
          "Because consistency and availability conflict by definition.",
          "Because it does not specify what the replicated system does when communication between non-failing nodes is unavailable.",
          "Because the CAP theorem doesn't apply to modern systems.",
          "Because CA systems use only slow networks.",
        ],
        correct: 1,
        explanation:
          'A replicated design needs defined behavior when nodes cannot communicate. It may reject selected operations, serve stale state, fail closed, or use another policy. Labeling it "CA" omits that behavior instead of designing it.',
      },
    },
    {
      kind: "flashcards",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "flash",
        title: "Flashcards",
        copy: DATA_INFRA_FLASHCARDS_COPY,
        cards: [
          {
            term: "Quorum",
            q: "What is N/R/W?",
            a: "Replication factor (N), read responses (R), and write acknowledgements (W). R + W > N creates overlap in a simplified model; other protocol and failure assumptions determine the actual guarantee.",
          },
          {
            term: "Sloppy quorum",
            q: 'What does "sloppy" mean?',
            a: "During a failure, a system may accept writes on temporary non-home replicas and transfer them later. Product configuration and conflict resolution determine the resulting guarantees.",
          },
          {
            term: "Read repair",
            q: "How does eventual consistency converge?",
            a: "A read that observes divergent replicas can trigger reconciliation. Background anti-entropy can provide an additional repair path; neither removes the need to define version ordering and conflicts.",
          },
          {
            term: "Linearizable",
            q: "Why is it expensive?",
            a: "Each operation must appear atomic and respect real-time ordering. Implementations may use leaders, leases, consensus, or quorums; the coordination path and measured cost depend on the design.",
          },
          {
            term: "Bounded staleness",
            q: "A useful middle ground",
            a: 'A contract such as "no more than a defined time or version lag." Specify where the bound is measured and what happens when the system cannot satisfy it.',
          },
        ],
      },
    },
  ],
};

export default lesson;
