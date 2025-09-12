import { IEvidence, INetwork } from '../types'

/**
 * Creates a new network with nodes in `given` clamped to the provided distributions.
 * - Hard evidence (string) becomes a 1/0 distribution
 * - Soft evidence maps are normalized and assigned as the node's CPT
 * - Parents are removed (node becomes a root) so the provided distribution is authoritative
 */
export function clampNetwork (network: INetwork, given: IEvidence): INetwork {
  const result: INetwork = { ...network }

  for (const nodeId of Object.keys(given)) {
    const node = network[nodeId]
    if (!node) continue

    const weights: Record<string, number> = {}

    if (typeof given[nodeId] === 'string') {
      for (const s of node.states) weights[s] = 0
      weights[given[nodeId] as string] = 1
    } else {
      // normalize soft
      let sum = 0
      for (const s of node.states) {
        const w = (given[nodeId] as Record<string, number>)[s]
        if (w !== undefined) {
          weights[s] = w
          sum += w
        } else {
          weights[s] = 0
        }
      }
      const denom = sum > 0 ? sum : 1
      for (const s of node.states) weights[s] = weights[s] / denom
    }

    result[nodeId] = {
      id: node.id,
      states: [...node.states],
      parents: [],
      cpt: { ...weights },
    }
  }

  return result
}
