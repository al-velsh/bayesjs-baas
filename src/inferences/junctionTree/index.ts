import { IClique, ICliquePotentials, ICombinations, IEvidence, IInfer, INetwork, IrawInfer } from '../../types'
import {
  filterCliquePotentialsByNodeCombinations,
  filterCliquesByNodeCombinations,
  getCliqueWithLessNodes,
  mapPotentialsThen,
} from '../../utils'

import createCliques from './create-cliques'
import getCliquesPotentials from './get-cliques-potentials'
import { sum } from 'ramda'
import { prepareEvidence } from '../../utils/evidence'
import createInitialPotentials from './create-initial-potentials'
import propagatePotential from './propagate-potentials'

const getResult = (cliques: IClique[], cliquesPotentials: ICliquePotentials, nodes: ICombinations) => {
  const cliquesNode = filterCliquesByNodeCombinations(cliques, nodes)
  const clique = getCliqueWithLessNodes(cliquesNode)
  const potentials = cliquesPotentials[clique.id]
  const potentialsFiltered = filterCliquePotentialsByNodeCombinations(potentials, nodes)
  const thens = mapPotentialsThen(potentialsFiltered)

  return sum(thens)
}

export const infer: IInfer = (network: INetwork, nodes: ICombinations, given: IEvidence = {}): number => {
  const { cliques, sepSets, junctionTree } = createCliques(network)
  const softEvidence = prepareEvidence(network, given)
  const cliquesPotentials = getCliquesPotentials(cliques, network, junctionTree, sepSets, given, softEvidence)

  return getResult(cliques, cliquesPotentials, nodes)
}

export const rawInfer = (network: INetwork, given: IEvidence = {}): IrawInfer => {
  const { cliques, sepSets, junctionTree } = createCliques(network)
  const softEvidence = prepareEvidence(network, given)
  const cliquesPotentials = getCliquesPotentials(cliques, network, junctionTree, sepSets, given, softEvidence)

  return {
    cliques: cliques,
    cliquesPotentials: cliquesPotentials,
  }
}

export const getPrenNormalizePotentials = (network: INetwork, given: IEvidence = {}): IrawInfer => {
  const { cliques, sepSets, junctionTree } = createCliques(network)
  const softEvidence = prepareEvidence(network, given)
  const cliquesPotentials = createInitialPotentials(cliques, network, softEvidence || {})
  const finalCliquesPotentials = propagatePotential(network, junctionTree, cliques, sepSets, cliquesPotentials)

  return {
    cliques: cliques,
    cliquesPotentials: finalCliquesPotentials,
  }
}
