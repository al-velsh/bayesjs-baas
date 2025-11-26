import { IEvidence, INetwork } from '../types'
import { ISplitEvidence } from '../types/ISplitEvidence'

/**
 * Prepares the provided evidence by splitting, validating and normalizing.
 *
 * @param network The Bayesian network (used to validate node IDs and states)
 * @param given   Hard and/or soft evidence for a subset of nodes
 * @returns       A split evidence object with hardEvidence and softEvidence
 * @throws Error  If a node ID is unknown, a hard-evidence state is invalid,
 *                or soft-evidence weights are invalid (negative/non-finite) or sum to zero
 */
export function prepareEvidence (network: INetwork, given: IEvidence): ISplitEvidence {
  const result: ISplitEvidence = {
    softEvidence: {},
    hardEvidence: {},
  }

  // Split evidence
  for (const nodeId of Object.keys(given)) {
    const evidence = given[nodeId]
    if (typeof evidence === 'string') {
      result.hardEvidence[nodeId] = evidence
    } else {
      result.softEvidence[nodeId] = evidence
    }
  }

  // Validate hardEvidence
  for (const nodeId of Object.keys(result.hardEvidence)) {
    const evidence = result.hardEvidence[nodeId]
    const node = network[nodeId]

    if (!node) {
      throw new Error(`Evidence refers to unknown node '${nodeId}'.`)
    }

    if (!node.states.includes(evidence)) {
      throw new Error(`Hard evidence for '${nodeId}' has unknown state '${evidence}'.`)
    }
  }

  // Normalize+Validate softEvidence
  for (const nodeId of Object.keys(result.softEvidence)) {
    const evidence = result.softEvidence[nodeId]
    const node = network[nodeId]

    let totalStateProbability = 0
    const weights: Record<string, number> = {}

    for (const state of node.states) {
      const stateEvidence = evidence[state]
      if (evidence === undefined) {
        throw new Error(`Soft evidence for '${nodeId}' state '${state}' must be define.`)
      }

      if (!Number.isFinite(stateEvidence) || stateEvidence < 0) {
        throw new Error(`Soft evidence for '${nodeId}' state '${state}' must be a non-negative finite number.`)
      }

      weights[state] = stateEvidence
      totalStateProbability += stateEvidence
    }

    if (totalStateProbability <= 0) {
      throw new Error(`Soft evidence for '${nodeId}' has zero total weight across states.`)
    }

    for (const state of node.states) {
      result.softEvidence[nodeId][state] = weights[state] / totalStateProbability
    }
  }

  return result
}
