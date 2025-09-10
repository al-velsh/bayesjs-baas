import {
  IClique,
  ICliqueFactors,
  ICliquePotentialItem,
  ICliquePotentials,
  ICombinations,
  ICptWithoutParents,
  ICptWithParents,
  IEvidence,
  INetwork,
  INode,
} from '../../types'
import { append, assoc, equals, find, map, multiply, pipe, prop, reduce } from 'ramda'
import {
  buildCombinations,
  getNodesFromNetwork,
  hasNodeIdAndParentsInClique,
  hasNodeParents,
  objectEqualsByIntersectionKeys,
} from '../../utils'
import { prepareEvidence } from '../../utils/evidence'

/** * Return a list of factors that care included in the given clique.   Each factor can
 * be assigned to exactly one clique, and that clique must include all of it's parents.
 */
const createFactorForClique = (network: INetwork, clique: IClique, visited: Set<string>): string[] =>
  getNodesFromNetwork(network).reduce((acc, node) => {
    if (hasNodeIdAndParentsInClique(clique, node) && !visited.has(node.id)) {
      visited.add(node.id)
      return append(node.id, acc)
    }
    return acc
  }, [] as string[])

/** Return an object that associates each clique with the factors which it contains.
 * Each factor can be assigned to exactly one clique, that that clique must include
 * all of it's parents.   Note that for some network topologies, this may result in
 * a choice for which clique to assign the factor
 *
 * Example, the network having the graph below:
 *
 *     A
 *   / | \
 *  V  V  V
 * B-->C<--D
 *
 * has two cliques: {A,B,C} and {A,C,D}.   The factors A and C can be assigned to either
 * clique, but not both.  To make inference easier, whenever possible we assign a factor to a clique
 * with the fewer number of nodes.
 * */
const createICliqueFactors = (cliques: IClique[], network: INetwork): ICliqueFactors => {
  const visited: Set<string> = new Set()

  return reduce((acc, clique) => assoc(clique.id, createFactorForClique(network, clique, visited), acc)
    , {}, cliques.sort((a, b) => a.nodeIds.length - b.nodeIds.length))
}

const mergeParentsAndCombination = (node: INode, combination: ICombinations) => reduce((acc, nodeId) => assoc(nodeId, combination[nodeId], acc), {}, node.parents)

const getPotentialValueForNodeWithParents = (combination: ICombinations, node: INode) => {
  const cpt = (node.cpt as ICptWithParents)
  const when = mergeParentsAndCombination(node, combination)
  const cptRow = find(pipe(prop('when'), equals(when)), cpt)

  if (cptRow) {
    return cptRow.then[combination[node.id]]
  }

  throw new Error('Not found combination in node')
}

const getPotentialValueForNodeWithoutParents = (combination: ICombinations, node: INode) => {
  const cpt = (node.cpt as ICptWithoutParents)
  const combinationValue = combination[node.id]

  return cpt[combinationValue]
}

const getPotentialValueForNode = (combination: ICombinations) => (node: INode): number => {
  if (hasNodeParents(node)) {
    return getPotentialValueForNodeWithParents(combination, node)
  }

  return getPotentialValueForNodeWithoutParents(combination, node)
}

const getPotentialValueForNodeIds = (network: INetwork, combination: ICombinations, nodeIds: string[]) => {
  const nodes = map(item => network[item], nodeIds)
  const nodesPotentialValues = map(getPotentialValueForNode(combination), nodes)

  return reduce<number, number>(multiply, 1, nodesPotentialValues)
}

const getPotentialValue = (combination: ICombinations, network: INetwork, given: IEvidence, factors: string[]) => {
  const { hard: hardEvidence, soft: softEvidence } = prepareEvidence(network, given)

  if (objectEqualsByIntersectionKeys(hardEvidence, combination)) {
    let value = getPotentialValueForNodeIds(network, combination, factors)

    for (const nodeId of Object.keys(softEvidence)) {
      const evidence = softEvidence[nodeId]
      const state = combination[nodeId]
      if (state !== undefined) {
        value *= evidence[state] || 0
      }
    }

    return value
  }

  return 0
}

const createCliquePotential = (clique: IClique, network: INetwork, given: IEvidence, cliqueFactors: ICliqueFactors) => (combination: ICombinations): ICliquePotentialItem => ({
  when: combination,
  then: getPotentialValue(combination, network, given, cliqueFactors[clique.id]),
})

const createCliquePotentials = (clique: IClique, network: INetwork, given: IEvidence, cliqueFactors: ICliqueFactors) => {
  const combinations = buildCombinations(network, clique.nodeIds)

  return map(createCliquePotential(clique, network, given, cliqueFactors), combinations)
}

export default (cliques: IClique[], network: INetwork, given: IEvidence): ICliquePotentials => {
  const cliqueFactors = createICliqueFactors(cliques, network)

  const cliquePotentials: ICliquePotentials = {}

  for (const clique of cliques) {
    cliquePotentials[clique.id] = createCliquePotentials(clique, network, given, cliqueFactors)
  }

  return cliquePotentials
}
