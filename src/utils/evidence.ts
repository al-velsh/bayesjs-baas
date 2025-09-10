import { ICombinations, IEvidence, INetwork } from '../types'

/**
 * Normalized soft evidence map per node.
 * - Keys: node IDs
 * - Values: a map from state -> normalized weight in [0, 1]
 * - For each node, the weights sum to 1 across all of its states
 */
export type SoftEvidenceMap = Record<string, Record<string, number>>

/**
 * Prepares the provided evidence by validating and normalizing it,
 * and returns split hard/soft maps used by the inference engines.
 *
 * Behavior:
 * - Hard evidence entries (string) are copied as-is into `hard` after validating
 *   that the node exists and the state is a valid state for the node.
 * - Soft evidence entries (object of state->weight) are validated and normalized:
 *   - Unknown states are ignored; missing states are assigned weight 0
 *   - All weights must be non-negative finite numbers
 *   - Total weight must be > 0; otherwise, an error is thrown
 *   - Weights are normalized to sum to 1 across the node's states
 *
 * @param network The Bayesian network (used to validate node IDs and states)
 * @param given   Hard and/or soft evidence for a subset of nodes
 * @returns       An object with:
 *                - hard: validated hard evidence (nodeId -> state)
 *                - soft: normalized soft evidence (nodeId -> state -> weight)
 * @throws Error  If a node ID is unknown, a hard-evidence state is invalid,
 *                or soft-evidence weights are invalid (negative/non-finite) or sum to zero
 */
export function prepareEvidence (network: INetwork, given?: IEvidence): { hard: ICombinations; soft: SoftEvidenceMap } {
  const hard: ICombinations = {}
  const soft: SoftEvidenceMap = {}

  if (!given) return { hard, soft }

  for (const nodeId of Object.keys(given)) {
    const ev = given[nodeId]
    const node = network[nodeId]

    if (!node) {
      throw new Error(`Evidence refers to unknown node '${nodeId}'.`)
    }

    if (typeof ev === 'string') {
      if (!node.states.includes(ev)) {
        throw new Error(`Hard evidence for '${nodeId}' has unknown state '${ev}'.`)
      }
      hard[nodeId] = ev
      continue
    }

    // Soft evidence validation and normalization
    const weights: Record<string, number> = {}
    let sum = 0

    for (const state of node.states) {
      const raw = ev[state]
      if (raw === undefined) {
        weights[state] = 0
      } else {
        if (!Number.isFinite(raw) || raw < 0) {
          throw new Error(`Soft evidence for '${nodeId}' state '${state}' must be a non-negative finite number.`)
        }
        weights[state] = raw
        sum += raw
      }
    }

    if (sum <= 0) {
      throw new Error(`Soft evidence for '${nodeId}' has zero total weight across states.`)
    }

    // Normalize to sum = 1
    const normalized: Record<string, number> = {}
    for (const state of node.states) {
      normalized[state] = weights[state] / sum
    }

    soft[nodeId] = normalized
  }

  return { hard, soft }
}
