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
import { getCachedValues, setCachedValues } from './get-cliques-potentials'
import { sum } from 'ramda'
import { prepareEvidence } from '../../utils/evidence'
import createInitialPotentials from './create-initial-potentials'
import propagatePotential, {
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
    for (const clique of cliques) {
      if (bigCliqueNodes.every((nodeId) => clique.nodeIds.includes(nodeId))) {
        bigCliqueId = clique.id
        break
      }
    }
    if (bigCliqueId === undefined) {
      throw new Error(
        'Implementation error: Big clique do not exist',
      )
    }
  }

  const collectedPotentials = collectNetworkEvidence(network, junctionTree, sepSets, cliquesPotentials, messages, ccs, bigCliqueId)

  if (bigCliqueId !== undefined) {
    const bigCliquePotential = collectedPotentials[bigCliqueId]
    collectedPotentials[bigCliqueId] = IPFP(bigCliquePotential, splitEvidence.softEvidence)
  }

  const distributePotentials = distributeNetworkEvidence(network, junctionTree, sepSets, collectedPotentials, messages, ccs, bigCliqueId)
  const resultCliquePotentials = normalizeCliquePotentials(distributePotentials)

  setCachedValues(cliques, given, resultCliquePotentials)

  return { cliques, cliquesPotentials: resultCliquePotentials }
}

export const infer: IInfer = (network: INetwork, nodes: ICombinations, given: IEvidence = {}): number => {
  const rawInferResult = rawInfer(network, given)

  return getResult(rawInferResult.cliques, rawInferResult.cliquesPotentials, nodes)
}

export const getPreNormalizedPotentials = (network: INetwork, given: IEvidence = {}): IRawInfer => {
  const { cliques, sepSets, junctionTree } = createCliques(network)
  const splitEvidence = prepareEvidence(network, given)
  const prePropagatedCliquesPotentials = createInitialPotentials(cliques, network, splitEvidence.hardEvidence)
  const cliquesPotentials = propagatePotential(network, junctionTree, cliques, sepSets, prePropagatedCliquesPotentials)

  return { cliques, cliquesPotentials }
}
