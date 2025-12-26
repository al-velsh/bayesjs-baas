import {
  IClique,
  ICliqueGraph,
  IGraph,
  INetwork,
  ISepSet,
} from '../../types'
import { isNil } from 'ramda'

import { createCliqueGraph } from '../../graphs/clique'
import { createGraphBuilder } from '../../graphs/builder'
import { createMoralGraph } from '../../graphs/moral'
import { createSepSets } from '../../utils'
import { createTriangulatedGraph } from '../../graphs/triangulated'

interface ICreateCliquesResult {
  cliques: IClique[];
  sepSets: ISepSet[];
  junctionTree: IGraph;
}

const createCliquesWeakMap = new WeakMap<INetwork, ICreateCliquesResult>()

/**
 *
 * This function insert edges between all selected nodes to force triangulation (Next step) to form a clique contacting all of these nodes.
 *
 * @returns {IGraph} Returns a graph with the clique inserted.
 * @param moralGraph
 * @param bigCliqueNodes List of nodes that form a clique.
 */
function insertBigCliqueIntoMoralGraph (moralGraph: IGraph, bigCliqueNodes: string[]): IGraph {
  for (const node of bigCliqueNodes) {
    if (!moralGraph.hasNodeId(node)) throw new Error(`[Node "${node}"]: This node is not in the network.`)
  }

  for (let i = 0; i < bigCliqueNodes.length; i++) {
    const nodeA = bigCliqueNodes[i]
    for (let j = i + 1; j < bigCliqueNodes.length; j++) {
      const nodeB = bigCliqueNodes[j]
      if (moralGraph.hasEdge(nodeA, nodeB)) continue
      moralGraph.addEdge(nodeA, nodeB)
    }
  }
  return moralGraph
}

function createCliquesGraph (graph: IGraph, bigCliqueNodes: string[]): ICliqueGraph {
  const moralGraph = createMoralGraph(graph)
  const moralGraphWithBigClique = insertBigCliqueIntoMoralGraph(moralGraph, bigCliqueNodes)
  const triangulatedGraph = createTriangulatedGraph(moralGraphWithBigClique)
  return createCliqueGraph(triangulatedGraph)
}

export default (network: INetwork, bigCliqueNodes?: string[]): ICreateCliquesResult => {
  const cached = createCliquesWeakMap.get(network)

  if (isNil(cached)) {
    const { graph, cliques } = createCliquesGraph(createGraphBuilder(network), bigCliqueNodes !== undefined ? bigCliqueNodes : [])
    const sepSets = createSepSets(cliques, graph.removeEdge)
    const result = { cliques, sepSets, junctionTree: graph }

    createCliquesWeakMap.set(network, result)

    return result
  }

  return cached
}
