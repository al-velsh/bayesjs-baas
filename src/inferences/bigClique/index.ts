import {
  IClique,
  ICliquePotentialMessages,
  ICliquePotentials,
  ICombinations,
  IEvidence,
  IInfer,
  INetwork,
  IRawInfer,
} from '../../types'
import {
  filterCliquePotentialsByNodeCombinations,
  filterCliquesByNodeCombinations,
  getCliqueWithLessNodes,
  mapPotentialsThen, normalizeCliquePotentials,
} from '../../utils'

import createCliques from './create-cliques'
import { getCachedValues, setCachedValues } from './cache'
import { sum } from 'ramda'
import { prepareEvidence } from '../../utils/evidence'
import createInitialPotentials from './create-initial-potentials'
import {
  collectNetworkEvidence,
  createMessagesByCliques,
  distributeNetworkEvidence,
} from './propagate-potentials'
import { IPFP } from './IPFP'
import { getConnectedComponents } from '../../utils/connected-components'

const getResult = (cliques: IClique[], cliquesPotentials: ICliquePotentials, nodes: ICombinations) => {
  const cliquesNode = filterCliquesByNodeCombinations(cliques, nodes)
  const clique = getCliqueWithLessNodes(cliquesNode)
  const potentials = cliquesPotentials[clique.id]
  const potentialsFiltered = filterCliquePotentialsByNodeCombinations(potentials, nodes)
  const thens = mapPotentialsThen(potentialsFiltered)

  return sum(thens)
}

/**
 *
 * This function returns the clique id that contains all the given soft evidence nodes (The big clique).
 *
 * @returns {string | undefined} Big clique id or undefined if no big clique exists.
 * @param cliques Cliques of the network.
 * @param softEvidenceNodes Nodes that contain soft evidence.
 */
function getBigCliqueId (cliques: IClique[], softEvidenceNodes: string[]): string | undefined {
  for (const clique of cliques) {
    if (softEvidenceNodes.every((nodeId) => clique.nodeIds.includes(nodeId))) {
      return clique.id
    }
  }
  return undefined
}

/**
 *
 * Returns the clique potentials after the inference of a network
 * This function is intended to be used by other algorithms that need to have more details results of the inference (e.g., Parameter learning).
 *
 * Implementation: This function performance the Big Clique algorithm based on the paper:
 *
 * "Soft evidential update for probabilistic multiagent systems"
 * by Marco Valtorta, Young-Gyun Kim, Jiri Vomlel (2000)
 *
 * DOI: https://www.sciencedirect.com/science/article/pii/S0888613X01000561
 *
 * @returns {IRawInfer} Cliques and their potentials.
 * @param network Network to perform inference.
 * @param given Optional Soft/Hard evidence for the inference.
 */
export const rawInfer = (network: INetwork, given: IEvidence = {}): IRawInfer => {
  const splitEvidence = prepareEvidence(network, given)
  const bigCliqueNodes = Object.keys(splitEvidence.softEvidence)
  const { cliques, sepSets, junctionTree } = createCliques(network, bigCliqueNodes)

  const cached = getCachedValues(cliques, given)
  if (cached) return { cliques, cliquesPotentials: cached }

  const cliquesPotentials = createInitialPotentials(cliques, network, splitEvidence.hardEvidence)
  const messages: ICliquePotentialMessages = createMessagesByCliques(cliques)
  const ccs: string[][] = getConnectedComponents(junctionTree)

  let bigCliqueId: string|undefined
  if (bigCliqueNodes.length > 0) {
    bigCliqueId = getBigCliqueId(cliques, bigCliqueNodes)
    if (bigCliqueId === undefined) {
      throw new Error(
        'Implementation error: Big clique do not exist',
      )
    }
  }

  // First collected the all evidence in the Big Clique (if exists)
  const collectedPotentials = collectNetworkEvidence(network, junctionTree, sepSets, cliquesPotentials, messages, ccs, bigCliqueId)

  // If the Big Clique exists, we apply the IPFP algorithm to it, inserting the soft evidence in to the big clique.
  if (bigCliqueId !== undefined) {
    const bigCliquePotential = collectedPotentials[bigCliqueId]
    collectedPotentials[bigCliqueId] = IPFP(bigCliquePotential, splitEvidence.softEvidence)
  }

  // Now propagate this new evidence to the other cliques,
  // if we have inserted soft evidence into the big clique, this will result in the other cliques also having soft evidence after the distribution step.
  const distributePotentials = distributeNetworkEvidence(network, junctionTree, sepSets, collectedPotentials, messages, ccs, bigCliqueId)
  const resultCliquePotentials = normalizeCliquePotentials(distributePotentials)

  setCachedValues(cliques, given, resultCliquePotentials)

  return { cliques, cliquesPotentials: resultCliquePotentials }
}

/**
 *
 * Returns the inference result for the given node:state combinations.
 *
 * @returns {number} Probability of the given node:state.
 * @param network Network to perform inference.
 * @param nodes The requested node:state combinations.
 * @param given Optional Soft/Hard evidence for the inference.
 */
export const infer: IInfer = (network: INetwork, nodes: ICombinations, given: IEvidence = {}): number => {
  const rawInferResult = rawInfer(network, given)

  return getResult(rawInferResult.cliques, rawInferResult.cliquesPotentials, nodes)
}
