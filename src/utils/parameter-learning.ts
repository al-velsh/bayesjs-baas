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

/**
 *
 * Performs the maximization step of the EM algorithm, that is equivalent to the maximization likelihood algorithm.
 * This step is used to update the parameters of the nodes in the network, using the counts provided by the expectation step.
 *
 * @param network - The Bayesian network to update
 * @param originalExpectedCounts - A map of counts of how much times a given configuration has been seen, for each node in the network.
 * @returns A new network with the updated parameters, after the maximization step.
 */
function maximizationStep (network: INetwork, originalExpectedCounts: Record<string, ICliquePotentialItem[]>): INetwork {
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

/**
 *
 * Returns the log likelihood of the network, compare with the evidence scenarios already process as counts.
 * This metric is used to evaluate how close is the current network to the evidence scenarios, which is usually a negative number,.
 *
 * @param network - The Bayesian network to analyze the log likelihood of
 * @param originalExpectedCounts - A map of counts of how much times a given configuration has been seen, for each node in the network.
 * @returns A number representing the log likelihood of the network, compare with the evidence scenarios already process as counts.
 */
function computeCompleteDataLogLikelihood (network: INetwork, originalExpectedCounts: Record<string, ICliquePotentialItem[]>) {
  let logLikelihood = 0

  for (const nodeId in network) {
    const node = network[nodeId]
    const potentials = originalExpectedCounts[nodeId]
    for (const potential of potentials) {
      const countContext = potential.when
      let cptProbabilityOfContext = 0
      if (node.parents.length === 0) {
        const cpt = node.cpt as ICptWithoutParents
        cptProbabilityOfContext = cpt[countContext[nodeId]]
      } else {
        const cpt = node.cpt as ICptWithParents
        const entryOfContext = cpt.find(x => Object.keys(x.when).every(key => countContext[key] === x.when[key]))
        if (entryOfContext) {
          cptProbabilityOfContext = entryOfContext.then[countContext[nodeId]]
        } else {
          throw Error('Implementation error: no entry of context was found')
        }
      }

      logLikelihood += potential.then * Math.log(cptProbabilityOfContext)
    }
  }

  return logLikelihood
}

/**
 * Performs the expectation step of the EM algorithm.
 * This step is used to compute the marginal probabilities of the nodes in the network,
 * for each given evidence, given as a result a count of how much time a configuration has been seen.
 *
 * @param network - The Bayesian network to be performance the expectation
 * @param given - Array of evidence instances for training
 * @returns A map of counts of how much time a given configuration has been seen, for each node in the network.
 */
function expectationStep (network: INetwork, given: IEvidence[] = []): Record<string, ICliquePotentialItem[]> {
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

/**
 * Performs iterative learning from evidence using the EM algorithm.
 *
 * @param network - The initial Bayesian network to be trained
 * @param given - Array of evidence instances for training
 * @param stopRatio - The ratio of difference between the log likelihood of the current network and the previous one to stop the training
 * @returns Updated network after training with the specified parameters
 */
export function learningFromEvidence (network: INetwork, given: IEvidence[] = [], stopRatio = 0.00001): INetwork {
  const MAX_ITERATIONS_SAFETY_LIMIT = 100

  let newNetwork: INetwork = JSON.parse(JSON.stringify(network))
  let previousLogLikelihood = -Infinity
  let logLikelihoodDif = Infinity
  let ratioChange = Infinity

  let iterations = 0
  console.log('Learning from evidence started')
  while (logLikelihoodDif > 0 && ratioChange >= stopRatio && iterations < MAX_ITERATIONS_SAFETY_LIMIT) {
    iterations++

    const expectedCounts = expectationStep(newNetwork, given)
    newNetwork = maximizationStep(newNetwork, expectedCounts)
    const logLikelihood = computeCompleteDataLogLikelihood(newNetwork, expectedCounts)
    logLikelihoodDif = logLikelihood - previousLogLikelihood
    ratioChange = Math.abs(logLikelihoodDif / previousLogLikelihood) || Infinity
    console.log('Log likelihood: ' + logLikelihood + ' Difference: ' + logLikelihoodDif + ' Ratio change: ' + ratioChange)
    previousLogLikelihood = logLikelihood
  }
  console.log('Learning from evidence finished')
  return newNetwork
}
