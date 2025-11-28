import { IEvidence, INetwork } from '../types'
import { ISplitEvidence } from '../types/ISplitEvidence'

/**
 * Prepares the provided evidence by splitting, validating and normalizing.
 *
 * @param network The Bayesian network (used to validate node IDs and states)
 * @param preGiven   Hard and/or soft evidence for a subset of nodes
 * @returns       A split evidence object with hardEvidence and softEvidence
 * @throws Error  If a node ID is unknown, a hard-evidence state is invalid,
 *                or soft-evidence weights are invalid (negative/non-finite) or sum to zero
 */
export function prepareEvidence (network: INetwork, preGiven: IEvidence): ISplitEvidence {
  const given: IEvidence = JSON.parse(JSON.stringify(preGiven))

  const result: ISplitEvidence = {
    softEvidence: {},
    hardEvidence: {},
  }

  // Split evidence
  for (const nodeId of Object.keys(given)) {
    const evidence = given[nodeId]
    if (typeof evidence === 'string') {
      result.hardEvidence[nodeId] = evidence
      continue
    }

    result.softEvidence[nodeId] = evidence
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
      const normalizedEvidence = weights[state] / totalStateProbability
      result.softEvidence[nodeId][state] = normalizedEvidence
      if (normalizedEvidence >= 0.99) {
        delete result.softEvidence[nodeId]
        result.hardEvidence[nodeId] = state
        break
      }
    }
  }

  return result
}
