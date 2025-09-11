import { IEvidence, INetwork } from '../types'

/**
 * Normalized soft evidence map per node.
 * - Keys: node IDs
 * - Values: a map from state -> normalized weight in [0, 1]
 * - For each node, the weights sum to 1 across all of its states
 */
export type SoftEvidenceMap = Record<string, Record<string, number>>

/**
 * Prepares the provided evidence by validating and normalizing it into a single soft map.
 *
 * Behavior:
 * - Hard evidence entries (string) are converted to soft evidence with weight 1 for the chosen
 *   state and 0 for other states.
 * - Soft evidence entries (object of state->weight) are validated and normalized:
 *   - Unknown states are ignored; missing states are assigned weight 0
 *   - All weights must be non-negative finite numbers
 *   - Total weight must be > 0; otherwise, an error is thrown
 *   - Weights are normalized to sum to 1 across the node's states
 *
 * @param network The Bayesian network (used to validate node IDs and states)
 * @param given   Hard and/or soft evidence for a subset of nodes
 * @returns       A normalized soft evidence map (nodeId -> state -> weight)
 * @throws Error  If a node ID is unknown, a hard-evidence state is invalid,
 *                or soft-evidence weights are invalid (negative/non-finite) or sum to zero
 */
export function prepareEvidence (network: INetwork, given?: IEvidence): SoftEvidenceMap {
  const soft: SoftEvidenceMap = {}

  if (!given) return soft

  for (const nodeId of Object.keys(given)) {
    const ev = given[nodeId]
    const node = network[nodeId]

    if (!node) {
      throw new Error(`Evidence refers to unknown node '${nodeId}'.`)
    }

    // Start with zero weights for all states
    const weights: Record<string, number> = {}
    for (const state of node.states) {
      weights[state] = 0
    }

    if (typeof ev === 'string') {
      if (!node.states.includes(ev)) {
        throw new Error(`Hard evidence for '${nodeId}' has unknown state '${ev}'.`)
      }
      weights[ev] = 1
    } else {
      let sum = 0
      for (const state of node.states) {
        const raw = ev[state]
        if (raw === undefined) continue
        if (!Number.isFinite(raw) || raw < 0) {
          throw new Error(`Soft evidence for '${nodeId}' state '${state}' must be a non-negative finite number.`)
        }
        weights[state] = raw
        sum += raw
      }
      if (sum <= 0) {
        throw new Error(`Soft evidence for '${nodeId}' has zero total weight across states.`)
      }
      // Normalize to sum = 1
      for (const state of node.states) {
        weights[state] = weights[state] / sum
      }
    }

    soft[nodeId] = weights
  }

  return soft
}

/**
 * Memoized variant of prepareEvidence.
 *
 * Caching strategy:
 * - Uses a two-level WeakMap cache keyed by the identities of `network` and `given`.
 * - If the same `network` object and the same `given` object are reused between calls,
 *   the exact same SoftEvidenceMap instance is returned. This improves cache hit rates
 *   downstream (e.g., Junction Tree WeakMap caches) and avoids repeated normalization.
 *
 * Notes and caveats:
 * - The cache is identity-based. If you mutate `given` in place, its identity is the same
 *   but its contents change, which can lead to stale cached results. Prefer creating a new
 *   evidence object instead of mutating in place (or use JT's `force` option via inferAll).
 * - WeakMap ensures entries are eligible for GC when `network` or `given` go out of scope.
 *
 * @param network The Bayesian network used for validation/context; also the first-level cache key
 * @param given   The original user-provided evidence (hard/soft mix); second-level cache key
 * @returns       A normalized SoftEvidenceMap corresponding to (network, given)
 */
const memoByNetwork = new WeakMap<INetwork, WeakMap<object, SoftEvidenceMap>>()

/**
 * Returns a normalized SoftEvidenceMap for the given (network, evidence) pair, reusing a cached
 * result when the same object identities are provided.
 *
 * See the memoization strategy description above for details and caveats.
 */
export function prepareEvidenceMemoized (network: INetwork, given?: IEvidence): SoftEvidenceMap {
  if (!given) return {}

  let inner = memoByNetwork.get(network)
  if (!inner) {
    inner = new WeakMap<object, SoftEvidenceMap>()
    memoByNetwork.set(network, inner)
  }

  const existing = inner.get(given as object)
  if (existing) return existing

  const prepared = prepareEvidence(network, given)
  inner.set(given as object, prepared)
  return prepared
}
