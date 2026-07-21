// Ported from data-infrastructure/lessons/02-cap-pacelc.html.
import type { DataInfraLesson } from "../types";
import { checkpointLessonId } from "../types";
import { DATA_INFRA_QUIZ_COPY, DATA_INFRA_FLASHCARDS_COPY } from "../widget-copy";

const LID = checkpointLessonId("cap-pacelc");

const lesson: DataInfraLesson = {
  id: "cap-pacelc",
  number: 2,
  title: "CAP, PACELC & The Latency Tax",
  subtitle: "The two impossibility theorems",
  durationMinutes: 14,
  trackId: "foundations",
  hook: "You can't have all three. What you trade for what — and the question CAP forgot to ask.",
  keyConcepts: ["CAP theorem", "PACELC", "Quorum", "Linearizability", "Eventual consistency"],
  quiz: [],
  sections: [
    {
      id: "s1",
      title: "CAP, restated",
      readTimeMinutes: 3,
      content:
        "Three nodes. A network split. You must choose: *do reads stay correct, or do reads stay possible?* CAP says you can't have both. Real designs make this choice **per-table, per-API, per-millisecond.**\n\nThe CAP theorem was published by Eric Brewer in 2000 and proved by Gilbert and Lynch in 2002. In a distributed system, when a network **partition** happens — two nodes can't talk to each other — you must choose between **consistency** (every read sees the latest write) and **availability** (every request gets a non-error response). You cannot have both, simultaneously, during a partition. There is no design that beats this.\n\nThe version interviewers actually want is sharper: *\"CA\" is not a real choice.* Real networks partition. Cables fail, switches reboot, regions get hurricane'd. P is not a knob; it's a fact. So the real question CAP asks is: **when (not if) we partition, which do you give up — C or A?**",
      keyTakeaway:
        "CAP forces a choice only during a partition — and partitions are a fact of real networks, not an option you can design away.",
    },
    {
      id: "s2",
      title: "Pick a trade",
      readTimeMinutes: 2,
      content:
        "The simulator ('the partition theatre') puts three replicas in front of a client. Cut the cable between them and pick the trade: **CP** refuses writes it can't replicate safely, so reads stay truthful but some requests fail. **AP** accepts writes anywhere, so every request succeeds but replicas can diverge until they're reconciled.\n\n**\"CA\" is not a real choice.** Single-node Postgres is \"CA\" because there's no network between replicas to partition. Add a replica and you're back to choosing CP or AP.",
    },
    {
      id: "s3",
      title: "PACELC",
      readTimeMinutes: 3,
      content:
        "CAP only describes the bad day. PACELC describes *both*: **if** partition, choose A or C; **else**, choose Latency or Consistency. The \"else\" is where your bill lives.\n\nTo give a read strong consistency on a multi-region cluster, you have to coordinate across regions — a network round-trip, often 50-150ms. Or you can answer from the local replica in 1ms and risk staleness. Every distributed DB sits somewhere on this 2D plane, and the choice is usually *configurable per-query*.\n\nThe four PACELC quadrants: **PA/EL** (available during a partition, low latency otherwise — fast and loose, always), **PA/EC** (available during a partition, strongly consistent otherwise — the popular default for user-state stores, e.g. MongoDB/Couchbase), **PC/EL** (consistent during a partition, low latency otherwise), and **PC/EC** (strongly consistent everywhere, e.g. Spanner — pays the coordination cost on every read).",
    },
    {
      id: "s4",
      title: "Latency tax",
      readTimeMinutes: 2,
      content:
        "Every step toward stronger consistency has a price tag in milliseconds. The frontier simulator plots typical p99 read latency for a 3-region active-active cluster against five freshness guarantees, from cheapest to most expensive:\n\n- **None** — best-effort, effectively free.\n- **Eventual** — cheap; replicas converge in the background with no ordering guarantee on when.\n- **Read-your-writes** (~8ms) — a client always sees its own most recent write; other clients may see staler data. Implemented with sticky sessions or version pinning. A cheap local-replica read with a session token check, staying inside one region's failure domain.\n- **Causal** — reads respect the order writes were made, even across clients, without paying for a full global lock.\n- **Linearizable** (highest cost) — a wide-area quorum on every read, i.e. the full round-trip.\n\nThe flat plateau in the middle of the curve — around read-your-writes — is where most production systems actually live.",
    },
    {
      id: "s5",
      title: "Consistency staircase",
      readTimeMinutes: 3,
      content:
        "\"Consistency\" is one word for at least five guarantees. The staircase simulator replays the same race under each rule: writer A writes `x=1` then `x=2`; reader B reads `x`. A blue dot is a write; green means the read returned a value at-least-as-fresh as that level's contract requires; crimson means the read returned a value the level explicitly allows to be stale.\n\n**The interview move.** When a question requires \"consistency,\" ask *which kind*. *\"Read-your-writes for the user's own session, eventual for everyone else's view\"* is a perfectly normal design — and a much cheaper one than going linearizable everywhere.",
      keyTakeaway:
        "Consistency is a spectrum of five distinct guarantees, not a single on/off property — and you're usually free to mix levels per use case.",
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
        "- **Quorum (N/R/W)** — replication factor (N), read quorum (R), write quorum (W). To guarantee a read sees the latest write you need `R + W > N`, e.g. N=3, R=2, W=2.\n- **Sloppy quorum** — under a partition, accept writes on *any* N nodes, not just the canonical replicas, to keep availability. Reconcile later via hinted handoff. Cassandra/Dynamo do this.\n- **Read repair** — when a read hits multiple replicas with different versions, the coordinator returns the latest value *and* writes it to the stale replicas. Background \"anti-entropy\" repair handles the rest.\n- **Linearizable** — requires that every read returns a value at-least-as-fresh as any acknowledged write, globally. Implementing it across regions means coordinating with a quorum on every read — a wide-area round-trip per read.\n- **Bounded staleness** — \"you can be at most 5 seconds behind, or at most 10 versions behind.\" Cosmos DB exposes this as a first-class consistency level. Cheaper than strong, more useful than eventual.",
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
          'You\'re designing a global checkout cart. The team wants "low latency in every region" and "the cart shows the same items if the user opens it on a different device 30 seconds later." Which PACELC quadrant fits?',
        options: [
          "PA/EL — fast and loose, always.",
          "PC/EC — strong consistency always; users will tolerate the latency.",
          "PA/EC — strong consistency in the normal case, but stay available during partitions.",
          "PC/EL — strong consistency under partition, low latency otherwise.",
        ],
        correct: 2,
        explanation:
          "PA/EC is the sweet spot for this kind of user-state workload. You want consistency in the 99.9% case (so the cart matches across devices) — but if a region temporarily splits from the rest, you'd rather let the user keep shopping (and reconcile later) than throw an error. PC/EC would force the user to wait for cross-region coordination on every cart edit. PA/EL would let stale carts stick around forever. MongoDB and Couchbase are tuned roughly here.",
      },
    },
    {
      kind: "quiz",
      placement: "end",
      props: {
        lessonId: LID,
        cpId: "q2",
        title: '"Eventual" is a trap',
        copy: DATA_INFRA_QUIZ_COPY,
        question:
          'A junior engineer says: "We picked Cassandra because we need eventual consistency." What\'s the actual question you should ask back?',
        options: [
          '"How long is eventual?" — eventual is a guarantee about the limit, not the timeline.',
          '"What\'s your replication factor?"',
          '"Are you sure you don\'t mean strong consistency?"',
          '"Why not Postgres?"',
        ],
        correct: 0,
        explanation:
          "Eventual consistency means \"if writes stop, replicas converge eventually.\" It says nothing about when. In practice, eventual is usually milliseconds. But under load, partitions, or hot keys, it can stretch to seconds or even minutes — long enough to ruin a UX. The right question is always: what's the tail latency of convergence, and what does the UI do during that window? \"Read-your-writes\" via sticky sessions is the usual fix.",
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
          'Why is "CA" — consistency + availability without partition tolerance — usually called a non-choice for distributed systems?',
        options: [
          "Because consistency and availability conflict by definition.",
          "Because partitions are inevitable in real networks; assuming them away means you don't have a distributed system, you have a single point of failure.",
          "Because the CAP theorem doesn't apply to modern systems.",
          "Because CA systems are always slow.",
        ],
        correct: 1,
        explanation:
          'P is not a design choice — it\'s a property of the physical world. Switches reboot, links flap, regions go offline. A "CA" system is one that fails entirely when those things happen, because it can\'t make progress without all nodes reachable. That\'s a fragility property, not a strength. The interview move is to refuse the C-vs-A framing as binary: "During a partition I\'d pick X. In normal operation, the trade is L vs C, and I\'d pick Y."',
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
            a: "Replication factor (N), read quorum (R), write quorum (W). To guarantee a read sees the latest write you need R + W > N. e.g. N=3, R=2, W=2.",
          },
          {
            term: "Sloppy quorum",
            q: 'What does "sloppy" mean?',
            a: "Under a partition, accept writes on any N nodes — not just the canonical replicas — to keep availability. Reconcile later via hinted handoff. Cassandra/Dynamo do this.",
          },
          {
            term: "Read repair",
            q: "How does eventual consistency converge?",
            a: "When a read hits multiple replicas with different versions, the coordinator returns the latest and writes the newer value to the stale replicas. Background \"anti-entropy\" repair handles the rest.",
          },
          {
            term: "Linearizable",
            q: "Why is it expensive?",
            a: "It requires that every read returns a value at-least-as-fresh as any acknowledged write, globally. Implementing it across regions means coordinating with a quorum every time. That's a wide-area RTT per read.",
          },
          {
            term: "Bounded staleness",
            q: "A useful middle ground",
            a: '"You can be at most 5 seconds behind, or at most 10 versions behind." Cosmos DB exposes this as a first-class consistency level. Cheaper than strong, more useful than eventual.',
          },
        ],
      },
    },
  ],
};

export default lesson;
