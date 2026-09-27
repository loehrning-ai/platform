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
        'CAP applies once a network partition stops parts of a distributed system from communicating. For the affected operations, the system then cannot guarantee both **linearizable consistency** and **availability for every request to a non-failing node**.\n\nConsistency here does not mean "correct data", and availability is no uptime percentage. A design can reject or delay some operations, serve stale data for others, or treat records differently. Name the operation, failure model and client-visible behavior before you use a CAP label.',
    },
    {
      id: "s2",
      title: "Pick a trade",
      readTimeMinutes: 2,
      content:
        'The model puts three replicas behind a client, then cuts their communication. In the simplified **CP** branch, an isolated replica rejects operations its consistency rule no longer covers. In the **AP** branch, reachable replicas keep accepting operations and may diverge until reconciliation.\n\nIt simulates no real protocol or measured failure. A single-node database sits outside this scenario, with its own availability and durability risks; "CA" does not describe it usefully.',
    },
    {
      id: "s3",
      title: "PACELC",
      readTimeMinutes: 3,
      content:
        "PACELC adds normal operation to CAP: **if there is a partition, availability or consistency; else, coordination latency or consistency?**\n\nCoordinating across nodes costs work and at least one network round trip. Topology, quorum placement, workload, cache state and failures decide how much; a local replica is not a fixed number of milliseconds faster. Some products let you choose per request or transaction, others per table, session or deployment.\n\nPA/EL, PA/EC, PC/EL and PC/EC are shorthand for this choice. Configuration and operation type can move one deployment from one to another.",
    },
    {
      id: "s4",
      title: "Latency tax",
      readTimeMinutes: 2,
      content:
        "The frontier graphic is an **illustrative ordering**, not a benchmark. Stronger guarantees usually need more coordination or fewer replica choices; the implementation and deployment decide the cost.\n\n- **Best effort**, no freshness or ordering contract.\n- **Eventual consistency**, replicas converge after writes stop, with no time bound unless the system states one.\n- **Read-your-writes**, a session sees its own acknowledged writes; other clients may see older versions.\n- **Causal consistency**, defined causal relationships between operations are preserved.\n- **Linearizability**, each operation appears to take effect atomically between invocation and response.\n\nBenchmark the configured deployment under normal and degraded conditions. No consistency model name tells you its p99.",
    },
    {
      id: "s5",
      title: "Consistency staircase",
      readTimeMinutes: 3,
      content:
        '"Consistency" names several contracts. The staircase replays one synthetic race: writer A writes `x=1` then `x=2`; reader B reads `x`. Green means the result meets that step\'s contract; crimson means the simplified model allows the stale value.\n\nReplace "consistent" in a requirement with an observable rule, such as "a session reads its acknowledged writes" or "all clients see inventory decrements in one linearizable order". Then test the product and configuration against that rule under the stated failures.',
    },
    {
      id: "s6",
      title: "Quick check",
      readTimeMinutes: 1,
      content: "Three questions on CAP and PACELC.",
    },
    {
      id: "s7",
      title: "Vocab",
      readTimeMinutes: 1,
      content:
        "- **Quorum (N/R/W)**, replica count, read responses and write acknowledgements. `R + W > N` forces overlap under simplified assumptions.\n- **Sloppy quorum**, temporary replicas accept writes during a failure and hand them over later.\n- **Read repair**, a read that sees divergent replicas triggers reconciliation.\n- **Bounded staleness**, a contract that caps version or time lag.",
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
          "A replicated cart accepts divergence during a partition so reachable regions stay writable. Normally it requires coordinated cart state across devices. Which PACELC shorthand fits?",
        options: [
          "PA/EL, availability during partitions, latency otherwise.",
          "PC/EC, reject partitioned writes, coordinate otherwise.",
          "PA/EC, available during partitions, consistent otherwise.",
          "PC/EL, consistent during partitions, low latency otherwise.",
        ],
        correct: 2,
        explanation:
          "The cart stays available during the partition and coordinates normally, which is PA/EC. The label says nothing about merge behavior; that needs a conflict policy and tests.",
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
          '"How long does convergence take, and what do clients see meanwhile?"',
          '"What\'s your replication factor per region?"',
          '"Are you sure you don\'t mean strong consistency?"',
          '"Why not just use Postgres instead?"',
        ],
        correct: 0,
        explanation:
          "Eventual consistency promises convergence once writes stop, with no time bound. Measure convergence under load and failures, define what clients see meanwhile, and add session guarantees where needed.",
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
          "Consistency and availability conflict by definition.",
          "It leaves open what happens when healthy nodes cannot communicate.",
          "CAP doesn't apply to modern systems.",
          "CA systems only use slow networks.",
        ],
        correct: 1,
        explanation:
          'A replicated design must define what happens when nodes cannot communicate: reject operations, serve stale state, fail closed or something else. "CA" skips that decision.',
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
            a: "Replication factor (N), read responses (R), write acknowledgements (W). R + W > N forces overlap in a simplified model; conflict resolution, failed nodes and protocol rules decide the real guarantee.",
          },
          {
            term: "Sloppy quorum",
            q: 'What does "sloppy" mean?',
            a: "During a failure, temporary replicas accept writes and hand them over later. Configuration and conflict resolution decide the guarantees.",
          },
          {
            term: "Read repair",
            q: "How does eventual consistency converge?",
            a: "A read that sees divergent replicas triggers reconciliation, and background anti-entropy adds a second path. You still define version ordering and conflicts.",
          },
          {
            term: "Linearizable",
            q: "Why is it expensive?",
            a: "Each operation must appear atomic and respect real-time order, through leaders, leases, consensus or quorums. That coordination costs latency.",
          },
          {
            term: "Bounded staleness",
            q: "A useful middle ground",
            a: 'A contract that caps time or version lag. Specify where the bound is measured and what happens when it is breached.',
          },
        ],
      },
    },
  ],
};

export default lesson;
