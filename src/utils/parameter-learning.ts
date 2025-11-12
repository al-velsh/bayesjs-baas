import { rawInfer } from '../inferences/junctionTree'
import {
  IClique,
  ICliquePotentialItem,
  ICptWithoutParents,
  ICptWithParents,
  IEvidence,
  INetwork,
} from '../types'

function getCliqueIdContainingNodes (cliques: IClique[], nodes: string[]): string | undefined {
  for (const clique of cliques) {
    if (nodes.every(node => clique.nodeIds.includes(node))) return clique.id
  }
  return undefined
}

function getPotentialForFamily (potential: ICliquePotentialItem[], family: string[]): ICliquePotentialItem[] {
  const newPotentialsMap: Map<string, number> = new Map()

  // Marginalize
  for (const entry of potential) {
    const newWhen: Record<string, string> = {}
    for (const [inode, istate] of Object.entries(entry.when)) {
      if (family.includes(inode)) {
        newWhen[inode] = istate
      }
    }

    const entryValue = newPotentialsMap.get(JSON.stringify(newWhen)) || 0
    newPotentialsMap.set(JSON.stringify(newWhen), entryValue + entry.then)
  }

  const newPotentials: ICliquePotentialItem[] = []
  for (const [key, value] of newPotentialsMap) {
    newPotentials.push({
      when: JSON.parse(key),
      then: value,
    })
  }
  return newPotentials
}

function maximizationStep (network: INetwork, originalExpectedCounts: Record<string, ICliquePotentialItem[]>) {
  const newNetwork: INetwork = JSON.parse(JSON.stringify(network))
  const expectedCounts: Record<string, ICliquePotentialItem[]> = JSON.parse(JSON.stringify(originalExpectedCounts))

  for (const nodeId in newNetwork) {
    const node = newNetwork[nodeId]
    const potential = expectedCounts[nodeId]
    if (!potential) {
      throw new Error('Implementation error: no potential was found for the node')
    }

    if (node.parents.length === 0) {
      const newCpt: ICptWithoutParents = {}
      let totalValue = 0

      for (const entry of potential) {
        const nodeState = entry.when[nodeId]
        newCpt[nodeState] = entry.then
        totalValue += entry.then
      }
      for (const state in newCpt) {
        newCpt[state] /= totalValue
      }
      newNetwork[nodeId].cpt = newCpt
      continue
    }

    const newCpt: ICptWithParents = []

    for (const entry of potential) {
      const nodeState = entry.when[nodeId]
      delete entry.when[nodeId]
      const findIndex = newCpt.findIndex(x => Object.keys(x.when).every(key => entry.when[key] === x.when[key]))
      if (findIndex !== -1) {
        newCpt[findIndex].then[nodeState] = entry.then
      } else {
        newCpt.push({
          when: entry.when,
          then: { [nodeState]: entry.then },
        })
      }
    }

    // Normalization
    for (let i = 0; i < newCpt.length; i++) {
      let totalValue = 0
      for (const state in newCpt[i].then) {
        totalValue += newCpt[i].then[state]
      }
      for (const state in newCpt[i].then) {
        newCpt[i].then[state] /= totalValue
      }
    }
    newNetwork[nodeId].cpt = newCpt
  }

  return newNetwork
}

function computeCompleteDataLogLikelihood (network: INetwork, originalExpectedCounts: Record<string, ICliquePotentialItem[]>) {
  let logLikelihood = 0

  for (const nodeId in network) {
    const node = network[nodeId]
    const potentials = originalExpectedCounts[nodeId]
    for (const potential of potentials) {
      const countContext = potential.when
      let cptProbabiltyOfContext = 0
      if (node.parents.length === 0) {
        const cpt = node.cpt as ICptWithoutParents
        cptProbabiltyOfContext = cpt[countContext[nodeId]]
      } else {
        const cpt = node.cpt as ICptWithParents
        const entryOfContext = cpt.find(x => Object.keys(x.when).every(key => countContext[key] === x.when[key]))
        if (entryOfContext) {
          cptProbabiltyOfContext = entryOfContext.then[countContext[nodeId]]
        } else {
          throw Error('Implementation error: no entry of context was found')
        }
      }

      logLikelihood += potential.then * Math.log(cptProbabiltyOfContext)
    }
  }

  return logLikelihood
}

/**
 * For fully observed soft evidence (no hidden variables), compute counts directly.
 * CRITICAL: Must account for network dependencies when computing joint probabilities!
 */
function computeDirectCountsForFullyObservedSoftEvidence (network: INetwork, evidence: IEvidence): Record<string, ICliquePotentialItem[]> {
  const counts: Record<string, ICliquePotentialItem[]> = {}

  // Generate all state combinations for each node family
  function generateCombinations (familyNodes: string[], index: number, current: Record<string, string>, result: Record<string, string>[]) {
    if (index === familyNodes.length) {
      result.push({ ...current })
      return
    }

    const currentNode = familyNodes[index]
    const { states } = network[currentNode]

    for (const state of states) {
      current[currentNode] = state
      generateCombinations(familyNodes, index + 1, current, result)
    }
  }

  for (const nodeId in network) {
    const node = network[nodeId]
    const nodeFamily = [nodeId, ...node.parents]
    const combinations: Record<string, string>[] = []
    generateCombinations(nodeFamily, 0, {}, combinations)

    const potentials: ICliquePotentialItem[] = []

    for (const combination of combinations) {
      // Compute weight as product of soft evidence values
      // This is correct because soft evidence represents MARGINAL probabilities,
      // and we're computing the weight for this specific joint configuration
      let weight = 1.0
      for (const familyNodeId of nodeFamily) {
        const state = combination[familyNodeId]
        const nodeEvidence = evidence[familyNodeId]
        if (typeof nodeEvidence !== 'string') {
          weight *= nodeEvidence[state] || 0
        }
      }

      potentials.push({
        when: combination,
        then: weight,
      })
    }

    counts[nodeId] = potentials
  }

  return counts
}

/**
 * Performs iterative learning from evidence using the EM algorithm.
 *
 * @param network - The current Bayesian network (may be learned from previous iterations)
 * @param originalNetwork - The original/initial network structure (for fully observed soft evidence)
 * @param given - Array of evidence instances for training
 * @returns Updated network after training with the specified parameters
 */
function expectationStep (network: INetwork, originalNetwork: INetwork, given: IEvidence[] = []): Record<string, ICliquePotentialItem[]> {
  const newGiven = JSON.parse(JSON.stringify(given))

  const expectedCounts: Record<string, ICliquePotentialItem[]> = {}

  for (const evidence of newGiven) {
    let nodeCounts: Record<string, ICliquePotentialItem[]>

    // Separate nodes by whether they have evidence and parents
    const observedRootNodes: string[] = [] // Nodes with soft evidence but no parents
    const observedDescendants: string[] = [] // Nodes with soft evidence and parents
    const hiddenNodes: string[] = [] // Nodes without evidence

    for (const nodeId in network) {
      const hasEvidence = nodeId in evidence && typeof evidence[nodeId] !== 'string'
      const hasParents = network[nodeId].parents.length > 0

      if (hasEvidence && !hasParents) {
        observedRootNodes.push(nodeId)
      } else if (hasEvidence && hasParents) {
        observedDescendants.push(nodeId)
      } else if (!hasEvidence) {
        hiddenNodes.push(nodeId)
      }
    }

    const fullyObserved = hiddenNodes.length === 0
    const allIndependent = Object.values(network).every(node => node.parents.length === 0)

    if (fullyObserved && allIndependent) {
      // All nodes independent, use direct counts
      nodeCounts = computeDirectCountsForFullyObservedSoftEvidence(network, evidence)
    } else if (fullyObserved && !allIndependent) {
      // Fully observed with dependencies
      // CRITICAL FIX: Use argmax interpretation for correlated soft evidence
      // to infer the joint distribution from marginals
      nodeCounts = {}

      // For root nodes: CPT = soft evidence directly
      for (const nodeId of observedRootNodes) {
        const nodeEvidence = evidence[nodeId] as Record<string, number>
        const potentials: ICliquePotentialItem[] = []
        for (const state in nodeEvidence) {
          potentials.push({
            when: { [nodeId]: state },
            then: nodeEvidence[state],
          })
        }
        nodeCounts[nodeId] = potentials
      }

      // For descendants: infer joint using maximum correlation assumption
      // Find the most likely joint state (argmax) and weight by the product of marginals
      const rawResults = rawInfer(originalNetwork, {})

      for (const nodeId of observedDescendants) {
        const node = network[nodeId]
        const nodeFamily = [nodeId, ...node.parents]
        const familyCliqueId = getCliqueIdContainingNodes(rawResults.cliques, nodeFamily)
        if (!familyCliqueId) {
          throw new Error('Implementation error: no clique containing the node family was found')
        }
        const rawFamilyCliquePotential = rawResults.cliquesPotentials[familyCliqueId]
        const familyCliquePotential = getPotentialForFamily(rawFamilyCliquePotential, nodeFamily)

        // Find argmax for each node in family
        const argmaxStates: Record<string, string> = {}
        for (const familyNodeId of nodeFamily) {
          const nodeEvidence = evidence[familyNodeId]
          if (typeof nodeEvidence !== 'string' && nodeEvidence) {
            // Find state with maximum probability
            let maxProb = -1
            let maxState = ''
            for (const state in nodeEvidence) {
              if (nodeEvidence[state] > maxProb) {
                maxProb = nodeEvidence[state]
                maxState = state
              }
            }
            argmaxStates[familyNodeId] = maxState
          }
        }

        // Weight entries: high weight for argmax combination, low for others
        const weightedPotential = familyCliquePotential.map(entry => {
          // Check if this combination matches argmax states
          let matchScore = 0
          for (const familyNodeId of nodeFamily) {
            if (argmaxStates[familyNodeId]) {
              if (entry.when[familyNodeId] === argmaxStates[familyNodeId]) {
                matchScore++
              }
            }
          }

          // If all match argmax, use high weight; otherwise use product of marginals
          let weight = 1.0
          if (matchScore === Object.keys(argmaxStates).length) {
            // Argmax combination - use maximum weight
            for (const familyNodeId of nodeFamily) {
              const nodeEvidence = evidence[familyNodeId]
              if (typeof nodeEvidence !== 'string') {
                const state = entry.when[familyNodeId]
                weight *= nodeEvidence[state] || 0
              }
            }
            // Boost weight to emphasize correlation
            weight *= 10.0
          } else {
            // Non-argmax combination - use small weight
            for (const familyNodeId of nodeFamily) {
              const nodeEvidence = evidence[familyNodeId]
              if (typeof nodeEvidence !== 'string') {
                const state = entry.when[familyNodeId]
                weight *= (nodeEvidence[state] || 0) * 0.1
              }
            }
          }

          return {
            when: entry.when,
            then: entry.then * weight,
          }
        })

        nodeCounts[nodeId] = weightedPotential
      }
    } else {
      // Has hidden variables - use EM with inference
      // CRITICAL: Pass ALL evidence to inference for proper hidden variable estimation
      // But extract direct counts for root nodes instead of using posteriors
      const rawResults = rawInfer(network, evidence)

      nodeCounts = {}

      // For observed root nodes: extract direct counts from soft evidence
      // (not from posteriors, to avoid EM feedback loop)
      for (const nodeId of observedRootNodes) {
        const nodeEvidence = evidence[nodeId] as Record<string, number>
        const potentials: ICliquePotentialItem[] = []
        for (const state in nodeEvidence) {
          potentials.push({
            when: { [nodeId]: state },
            then: nodeEvidence[state],
          })
        }
        nodeCounts[nodeId] = potentials
      }

      // For other nodes: use posteriors from inference
      for (const nodeId in network) {
        if (observedRootNodes.includes(nodeId)) continue

        const node = network[nodeId]
        const nodeFamily = [nodeId, ...node.parents]
        const familyCliqueId = getCliqueIdContainingNodes(rawResults.cliques, nodeFamily)
        if (!familyCliqueId) {
          throw new Error('Implementation error: no clique containing the node family was found')
        }
        const rawFamilyCliquePotential = rawResults.cliquesPotentials[familyCliqueId]
        const familyCliquePotential = getPotentialForFamily(rawFamilyCliquePotential, nodeFamily)

        nodeCounts[nodeId] = familyCliquePotential
      }
    }

    // Accumulate counts
    for (const nodeId in nodeCounts) {
      if (expectedCounts[nodeId]) {
        for (const counted of nodeCounts[nodeId]) {
          const whenKey = JSON.stringify(counted.when)
          const existing = expectedCounts[nodeId].find(e => JSON.stringify(e.when) === whenKey)
          if (existing) {
            existing.then += counted.then
          } else {
            expectedCounts[nodeId].push({ ...counted })
          }
        }
      } else {
        expectedCounts[nodeId] = nodeCounts[nodeId]
      }
    }
  }

  return expectedCounts
}

export function learningFromEvidence (network: INetwork, given: IEvidence[] = [], stopRatio = 0.07): INetwork {
  const originalNetwork: INetwork = JSON.parse(JSON.stringify(network)) // Preserve original
  let newNetwork: INetwork = JSON.parse(JSON.stringify(network))
  let previousLogLikelihood = -Infinity

  for (let i = 0; i < 20; i++) {
    const expectedCounts = expectationStep(newNetwork, originalNetwork, given)
    newNetwork = maximizationStep(newNetwork, expectedCounts)
    const logLikelihood = computeCompleteDataLogLikelihood(newNetwork, expectedCounts)
    const logLikelihoodDif = logLikelihood - previousLogLikelihood
    const ratioChange = Math.abs(logLikelihoodDif / previousLogLikelihood)
    console.log('Log likelihood: ' + logLikelihood + ' Difference: ' + logLikelihoodDif + ' Ratio change: ' + ratioChange)
    if (logLikelihoodDif < 0 || ratioChange <= stopRatio) {
      break
    }
    previousLogLikelihood = logLikelihood
  }
  console.log('Learning from evidence finished')
  return newNetwork
}
