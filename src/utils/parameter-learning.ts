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
 * Performs iterative learning from evidence using the EM algorithm.
 *
 * @param network - The initial Bayesian network to be trained
 * @param given - Array of evidence instances for training
 * @returns Updated network after training with the specified parameters
 */
export function expectationStep (network: INetwork, given: IEvidence[] = []): Record<string, ICliquePotentialItem[]> {
  const newGiven = JSON.parse(JSON.stringify(given))

  const expectedCounts: Record<string, ICliquePotentialItem[]> = {}

  for (const evidence of newGiven) {
    const rawResults = rawInfer(network, evidence)

    for (const nodeId in network) {
      const node = network[nodeId]
      const nodeFamily = [nodeId, ...node.parents]
      const familyCliqueId = getCliqueIdContainingNodes(rawResults.cliques, nodeFamily)
      if (!familyCliqueId) {
        throw new Error('Implementation error: no clique containing the node family was found')
      }
      const rawFamilyCliquePotential = rawResults.cliquesPotentials[familyCliqueId]
      const familyCliquePotential = getPotentialForFamily(rawFamilyCliquePotential, nodeFamily)
      if (expectedCounts[nodeId]) {
        for (let i = 0; i < expectedCounts[nodeId].length; i++) {
          expectedCounts[nodeId][i].then += familyCliquePotential[i].then
        }
      } else {
        expectedCounts[nodeId] = familyCliquePotential
      }
    }
  }

  return expectedCounts
}

export function learningFromEvidence (network: INetwork, given: IEvidence[] = [], stopRatio = 0.07): INetwork {
  let newNetwork: INetwork = JSON.parse(JSON.stringify(network))
  let previousLogLikelihood = -Infinity

  for (let i = 0; i < 20; i++) {
    const expectedCounts = expectationStep(newNetwork, given)
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
