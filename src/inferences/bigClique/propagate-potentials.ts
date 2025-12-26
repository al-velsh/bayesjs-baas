import {
  IClique,
  ICliquePotentialItem,
  ICliquePotentialMessages,
  ICliquePotentials,
  ICombinations,
  IGraph,
  INetwork,
  ISepSet,
} from '../../types'
import {
  anyPass,
  append,
  assoc,
  curry,
  divide,
  equals,
  find,
  keys,
  map,
  multiply,
  path,
  pick,
  pipe,
  prop,
  reduce,
  sum,
} from 'ramda'
import {
  buildCombinations,
  objectEqualsByFirstObjectKeys,
} from '../../utils'

const hasSepSetCliques: (cliqueIdA: string, cliqueIdB: string) => (sepSet: ISepSet) => boolean =
curry((cliqueIdA: string, cliqueIdB: string, sepSet: ISepSet) =>
  sepSet.ca === cliqueIdB && sepSet.cb === cliqueIdA)

export const findSepSetWithCliques = (cliqueIdA: string, cliqueIdB: string, sepSets: ISepSet[]): ISepSet | undefined =>
  find(
    anyPass([
      hasSepSetCliques(cliqueIdA, cliqueIdB),
      hasSepSetCliques(cliqueIdB, cliqueIdA),
    ]),
    sepSets,
  )

const getSepSetForCliques = (network: INetwork, sepSets: ISepSet[], id: string, neighborId: string) => {
  const sepSet = findSepSetWithCliques(id, neighborId, sepSets)
  if (sepSet) return sepSet.sharedNodes.sort()
  throw new Error(`SepSet not found for cliques with id: "${id}" and "${neighborId}"`)
}

const createEmptyCombinations: (combinations: ICombinations[]) => ICliquePotentialItem[] =
  map(x => ({ when: x, then: 0 }))

export const createMessagesByCliques: (cliques: IClique[]) => ICliquePotentialMessages = reduce(
  (acc, clique) => assoc(clique.id, new Map(), acc),
  {},
)

/** Marginalize the clique potentials modulo a separation set. */
export const marginalizePotentials = (network: INetwork, sepSet: string[], potentials: ICliquePotentialItem[]): ICliquePotentialItem[] =>
  reduce(
    (acc, cpt) => {
      const then = sum(
        potentials
          .filter(potential => objectEqualsByFirstObjectKeys(cpt.when, potential.when))
          .map(prop('then')),
      )
      const newCpt = assoc('then', then, cpt)

      return append(newCpt, acc)
    },
    [] as ICliquePotentialItem[],
    createEmptyCombinations(buildCombinations(network, sepSet)),
  )

const dividePotentials = (dividend: ICliquePotentialItem[], divisor: ICliquePotentialItem[]) =>
  map(
    row => {
      const { when, then } = row
      const currentMessageReceived = divisor.find(potential => objectEqualsByFirstObjectKeys(when, potential.when))

      if (currentMessageReceived) {
        return assoc('then', divide(then, currentMessageReceived.then || 1), row)
      }

      return row
    },
    dividend,
  )

const getFirstWhenKeys: (obj: ICliquePotentialItem[]) => string[] = pipe(path([0, 'when']), keys)

const isWhenEqualsByKeys = (keys: string[], row: ICliquePotentialItem, potential: ICliquePotentialItem) => {
  const pickKeys = pick(keys)

  return equals(pickKeys(row.when), pickKeys(potential.when))
}

const absorbMessageWithPotential = curry((messagePotentialsKeys: string[], messagePotential: ICliquePotentialItem, potential: ICliquePotentialItem) => {
  if (isWhenEqualsByKeys(messagePotentialsKeys, messagePotential, potential)) {
    return assoc('then', multiply(potential.then, messagePotential.then), potential)
  }
  return potential
})

const absorbMessage = (potentials: ICliquePotentialItem[], messagePotentials: ICliquePotentialItem[]): ICliquePotentialItem[] => {
  const messagePotentialsKeys = getFirstWhenKeys(messagePotentials)
  const updater = absorbMessageWithPotential(messagePotentialsKeys)

  return reduce(
    (acc, messagePotential) => map(updater(messagePotential), acc),
    potentials,
    messagePotentials,
  )
}

const passMessage = (network: INetwork, sepSets: ISepSet[], cliquesPotentials: ICliquePotentials, separatorPotentials: ICliquePotentialMessages, src: string, trg: string) => {
  const i = (src < trg) ? src : trg
  const j = (src < trg) ? trg : src
  const priorSeparatorPotential = separatorPotentials[i].get(j)
  const sepSet = getSepSetForCliques(network, sepSets, src, trg)
  const marginalizedSeparatorPotential = marginalizePotentials(network, sepSet, cliquesPotentials[src])
  const message = priorSeparatorPotential
    ? dividePotentials(marginalizedSeparatorPotential, priorSeparatorPotential)
    : marginalizedSeparatorPotential

  cliquesPotentials[trg] = absorbMessage(cliquesPotentials[trg], message)
  separatorPotentials[i].set(j, marginalizedSeparatorPotential)
}

const collectCliquesEvidence = (network: INetwork, junctionTree: IGraph, sepSets: ISepSet[], separatorPotentials: ICliquePotentialMessages, cliquesPotentials: ICliquePotentials, rootId: string) => {
  // Determine the traversal order starting from the given node, recursively visiting
  // the neighbors of the given node.
  const process = (id: string, parentId?: string) => {
    const neighbors = junctionTree.getNodeEdges(id)
    for (const neighbor of neighbors) {
      if (parentId && neighbor === parentId) continue
      process(neighbor, id)
    }

    if (!parentId) return
    passMessage(network, sepSets, cliquesPotentials, separatorPotentials, id, parentId)
  }

  // start processing from the best root node.
  process(rootId)
  return cliquesPotentials
}

/**
 *
 * Update the potentials in the JT from the leaves to the root.
 *
 * @returns {ICliquePotentials} The updated clique potentials.
 * @param network Network to perform inference.
 * @param junctionTree The junction tree of the network.
 * @param sepSets The list of separation sets.
 * @param cliquesPotentials The initial clique potentials.
 * @param messages The messages between the cliques.
 * @param ccs The connected components of the junction tree.
 * @param rootId The root node of the junction tree or first node of the connected component if not provided.
 */
export function collectNetworkEvidence (network: INetwork, junctionTree: IGraph, sepSets: ISepSet[], cliquesPotentials: ICliquePotentials, messages: ICliquePotentialMessages, ccs: string[][], rootId?: string): ICliquePotentials {
  return reduce(
    (potentials, cliqueConnectedComponent) => {
      let rootConnectedComponent = rootId

      if (rootConnectedComponent === undefined || !cliqueConnectedComponent.includes(rootConnectedComponent)) {
        const [firstClique] = cliqueConnectedComponent
        rootConnectedComponent = firstClique
      }
      // Update the potentials starting at the leaf nodes and moving to the roots
      return collectCliquesEvidence(network, junctionTree, sepSets, messages, potentials, rootConnectedComponent)
    },
    cliquesPotentials,
    ccs,
  )
}

const distributeCliquesEvidence = (network: INetwork, junctionTree: IGraph, sepSets: ISepSet[], separatorPotentials: ICliquePotentialMessages, cliquesPotentials: ICliquePotentials, rootId: string) => {
  // Determine the traversal order starting from the given node, recursively visiting
  // the neighbors of the given node.
  const process = (id: string, parentId?: string) => {
    const neighbors = junctionTree.getNodeEdges(id)

    for (const neighbor of neighbors) {
      if (parentId && neighbor === parentId) continue
      passMessage(network, sepSets, cliquesPotentials, separatorPotentials, id, neighbor)
      process(neighbor, id)
    }
  }

  // start processing from the best root node.
  process(rootId)
  return cliquesPotentials
}

/**
 *
 * Update the potentials in the JT from the root to the leaves.
 * You usually want to call this function after calling `collectNetworkEvidence` to distribute the evidence from the root to the leaves.
 *
 * @returns {ICliquePotentials} The updated clique potentials.
 * @param network Network to perform inference.
 * @param junctionTree The junction tree of the network.
 * @param sepSets The list of separation sets.
 * @param cliquesPotentials The clique potentials usually from `collectNetworkEvidence`.
 * @param messages The messages between the cliques.
 * @param ccs The connected components of the junction tree.
 * @param rootId The root node of the junction tree or first node of the connected component if not provided.
 */
export function distributeNetworkEvidence (network: INetwork, junctionTree: IGraph, sepSets: ISepSet[], cliquesPotentials: ICliquePotentials, messages: ICliquePotentialMessages, ccs: string[][], rootId = ''): ICliquePotentials {
  return reduce(
    (potentials, cliqueConnectedComponent) => {
      let rootConnectedComponent = rootId

      if (!cliqueConnectedComponent.includes(rootId)) {
        const [firstClique] = cliqueConnectedComponent
        rootConnectedComponent = firstClique
      }
      // Update the potentials starting at the leaf nodes and moving to the roots
      return distributeCliquesEvidence(network, junctionTree, sepSets, messages, cliquesPotentials, rootConnectedComponent)
    },
    cliquesPotentials,
    ccs,
  )
}
