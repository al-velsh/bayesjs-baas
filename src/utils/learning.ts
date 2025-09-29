import { getPrenNormalizePotentials, rawInfer } from '../inferences/junctionTree'
import {
  IClique,
  ICliquePotentialItem,
  ICptWithoutParents,
  ICptWithParents,
  IEvidence,
  INetwork,
} from '../types'

function getCliqueContaining (cliques: IClique[], nodes: string[]): string | undefined {
  for (const clique of cliques) {
    if (nodes.every(node => clique.nodeIds.includes(node))) return clique.id
  }
  return undefined
}

function getPotentialForFamily (potential: ICliquePotentialItem[], family: string[]): ICliquePotentialItem[] {
  const newPotentialsMap: Map<string, number> = new Map()

  // Marginalize
  let totalValue = 0
  for (const entry of potential) {
    totalValue += (entry.then)
    const newWhen: Record<string, string> = {}
    for (const [inode, istate] of Object.entries(entry.when)) {
      if (family.includes(inode)) {
        newWhen[inode] = istate
      }
    }

    const entryValue = newPotentialsMap.get(JSON.stringify(newWhen))
    if (entryValue) {
      newPotentialsMap.set(JSON.stringify(newWhen), entryValue + entry.then)
    } else {
      newPotentialsMap.set(JSON.stringify(newWhen), entry.then)
    }
  }

  // Normalize
  const newPotentials: ICliquePotentialItem[] = []
  for (const [key, value] of newPotentialsMap) {
    newPotentials.push({
      when: JSON.parse(key),
      then: value / totalValue,
    })
  }
  return newPotentials
}

/**
 * Performs one epoch of the EM (Expectation-Maximization) algorithm for learning from evidence.
 * This function implements both the expectation step (calculating expected counts) and the
 * maximization step (updating network parameters).
 * @param network - The Bayesian network to update
 * @param given - Array of evidence instances to learn from
 * @returns Updated network with new parameters learned from the evidence
 */

export function learningFromEvidenceEpoch (network: INetwork, given: IEvidence[] = []): INetwork {
  if (given.length === 0) {
    return network
  }

  // Expectation Step
  const expectedCounts: Record<string, ICliquePotentialItem[]> = {}

  for (const evidence of given) {
    const rawResults = rawInfer(network, evidence)

    for (const nodeId in network) {
      const node = network[nodeId]
      const nodeFamily = [nodeId, ...node.parents]
      const bestCliqueId = getCliqueContaining(rawResults.cliques, nodeFamily)
      if (!bestCliqueId) {
        throw new Error('Implementation error: no clique containing the node family was found')
      }
      const rawCliquePotential = rawResults.cliquesPotentials[bestCliqueId]
      const cliquePotential = getPotentialForFamily(rawCliquePotential, nodeFamily)
      if (expectedCounts[nodeId]) {
        for (let i = 0; i < expectedCounts[nodeId].length; i++) {
          expectedCounts[nodeId][i].then += cliquePotential[i].then
        }
      } else {
        expectedCounts[nodeId] = cliquePotential
      }
    }
  }

  // Maximization Step

  const newNetwork: INetwork = JSON.parse(JSON.stringify(network))

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
      if (findIndex === -1) {
        newCpt.push({
          when: entry.when,
          then: { [nodeState]: entry.then },
        })
      } else {
        newCpt[findIndex].then[nodeState] = entry.then
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

function getEvidenceProbability (network: INetwork, given: IEvidence[]) {
  let resValue = 0

  for (const evidence of given) {
    const potential = getPrenNormalizePotentials(network, evidence).cliquesPotentials['0']

    for (const entry of potential) {
      resValue += entry.then
    }
  }

  resValue /= given.length

  return resValue
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function loglikelihood (network: INetwork, given: IEvidence[]) {
  let resValue = 0
  for (const evidence of given) {
    const probability = getEvidenceProbability(network, [evidence])
    resValue += Math.log(probability)
  }

  return resValue
}

/**
 * Performs iterative learning from evidence using the EM algorithm.
 *
 * @param network - The initial Bayesian network to be trained
 * @param given - Array of evidence instances for training
 * @param nEpochs - Number of training epochs to perform (default: 50)
 * @param dataPercentageEpoch - Percentage of available data to use per epoch (default: 0.5)
 * @param validationDataPercentage - Percentage of available data to use for validation exclusive (default: 0)
 * @returns Updated network after training with the specified parameters
 */

export function learningFromEvidence (network: INetwork, given: IEvidence[] = [], nEpochs = 50, dataPercentageEpoch = 0.75, validationDataPercentage = 0): INetwork {
  let newNetwork = JSON.parse(JSON.stringify(network))

  const nDataEpoch = Math.floor(given.length * dataPercentageEpoch)
  const nValidation = Math.floor(given.length * validationDataPercentage)

  const randomGiven = given.sort(() => Math.random() - 0.5)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const validationData = randomGiven.slice(0, nValidation)
  const trainingData = randomGiven.slice(nValidation)

  for (let iteration = 0; iteration < nEpochs; iteration++) {
    const randomIndices = Array.from({ length: trainingData.length }, (_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, nDataEpoch)
    const combinations = randomIndices.map(index => ({ ...trainingData[index] }))
    newNetwork = learningFromEvidenceEpoch(newNetwork, combinations)
    // console.log(`Epoch ${iteration + 1} - Evidence Probability: ${getEvidenceProbability(newNetwork, validationData)}`)
    // console.log(`Epoch ${iteration + 1} - Loglikelihood: ${loglikelihood(newNetwork, validationData)}`)
  }
  return newNetwork
}
