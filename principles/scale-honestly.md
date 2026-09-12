# Scale Honestly: Load, Tail Latency, and Overload

**Describe the load before you scale it. Most systems die of the load shape nobody measured.**

## The principle

Scalability is not a property — it is an answer to "what happens when load X grows by Y?"
(DDIA ch.2, ~pp.49–52). You cannot reason about scale without a load model: requests/sec,
read/write ratio, fan-out per request, hot keys, payload sizes, growth rate. Designing for a
load you don't have is waste; ignoring a load you do have is an outage.

## What to check in code / design

- **Fan-out**: how many downstream operations does one user action trigger? The expensive
  systems are the high fan-out ones (a post that writes to 10k follower timelines; a
  mutator that fans out to every connected client). Fan-out is where write-vs-read cost
  trade-offs live (DDIA ch.2 case study, ~pp.34–37).
- **Hot spots / skew**: load is never uniform. A hot partition, artifact, tenant, or key
  range defeats even generous total capacity. Mitigations in order of complexity: better
  key design, hot-key splitting, per-key load shedding, rebalancing (DDIA ch.7, skew
  ~pp.254–260, rebalancing ~pp.266–274).
- **Tail latency**: users experience percentiles, not averages. A p99 slow dependency times
  the whole fan-out; tail latency at scale is dominated by the slowest sub-call
  (percentiles ~pp.40–43). Measure p95/p99; a good average with a terrible tail is a bad
  product.
- **Overload behavior**: what happens past capacity? Options: queue with backpressure,
  load-shed, degrade gracefully. The wrong default is unbounded queueing — queues hide the
  overload until latency is unbounded too (backpressure ~p.38).
- **Retry amplification**: retries multiply load on an already-struggling dependency —
  exponential backoff + jitter + budget (see `retry-safety.md`).
- **Scaling axis**: scale reads (replicas/cache), writes (sharding), or the hot path
  (simplify it). Each is a different cost.

## Diagnostic questions

- What is the actual load today (numbers), the growth driver, and the first resource to
  saturate?
- Which single entity could plausibly become 100× hotter than average? (One viral artifact,
  one whale tenant, one hot thread.)
- What is the p99 of the user-visible path, and which dependency dominates it?
- Under 10× load, which queue fills first and what does the system do about it?
- Is this optimization solving a measured problem or a hypothetical one? If hypothetical —
  what observable metric would tell us it's time?

## Rules of thumb

- One machine is the best architecture that can do the job. Scale-out is purchased with
  correctness and operational complexity — spend it on measured need.
- Caching helps read-heavy paths but adds invalidation, staleness, and a second source of
  truth (see `source-of-truth.md`). Reach for it after the load model says reads are the
  problem.
- Capacity that materializes slowly (new replicas, resharding) can't absorb a spike —
  spikes are absorbed by headroom, queueing, or shedding. Pick which one before the spike.

## Bottom line

Write the load model down — numbers, shape, growth. If a design can't name its first
saturation point and its overload response, it isn't a scalability design; it's a hope.
