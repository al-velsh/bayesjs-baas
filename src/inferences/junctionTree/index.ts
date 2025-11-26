import { IClique, ICliquePotentials, ICombinations, IEvidence, IInfer, INetwork, IRawInfer } from '../../types'
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
  const splitEvidence = prepareEvidence(network, given)
  const softEvidenceNodes = Object.keys(splitEvidence.softEvidence)
  const { cliques, sepSets, junctionTree } = createCliques(network, softEvidenceNodes)
  const cliquesPotentials = getCliquesPotentials(cliques, network, junctionTree, sepSets, splitEvidence.hardEvidence)

  return getResult(cliques, cliquesPotentials, nodes)
}

export const rawInfer = (network: INetwork, given: IEvidence = {}): IRawInfer => {
  const { cliques, sepSets, junctionTree } = createCliques(network)
  const splitEvidence = prepareEvidence(network, given)
  const cliquesPotentials = getCliquesPotentials(cliques, network, junctionTree, sepSets, splitEvidence.hardEvidence)

  return { cliques, cliquesPotentials }
}

export const getPreNormalizedPotentials = (network: INetwork, given: IEvidence = {}): IRawInfer => {
  const { cliques, sepSets, junctionTree } = createCliques(network)
  const splitEvidence = prepareEvidence(network, given)
  const prePropagatedCliquesPotentials = createInitialPotentials(cliques, network, splitEvidence.hardEvidence)
  const cliquesPotentials = propagatePotential(network, junctionTree, cliques, sepSets, prePropagatedCliquesPotentials)

  return { cliques, cliquesPotentials }
}
