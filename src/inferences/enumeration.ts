import { ICombinations, ICptWithParents, ICptWithoutParents, IInfer, INetwork, IEvidence } from '../types'

import { buildCombinations } from '../utils'
import { equals } from 'ramda'
import { prepareEvidence } from '../utils/evidence'

const combinationsCache = new WeakMap()

const filterCombinations = (combinations: ICombinations[], nodesToFilter: ICombinations): ICombinations[] => {
  const idsToFilter = Object.keys(nodesToFilter)

  return combinations.filter(row => {
    for (let i = 0; i < idsToFilter.length; i++) {
      const idToFilter = idsToFilter[i]

      if (row[idToFilter] !== nodesToFilter[idToFilter]) {
        return false
      }
    }

    return true
  })
}

const calculateProbabilities = (network: INetwork, combinations: ICombinations[], softEvidence: Record<string, Record<string, number>>): number => {
  const rowsProducts: number[] = []

  for (let i = 0; i < combinations.length; i++) {
    let rowProduct = 1

    const row = combinations[i]
    const ids = Object.keys(row)

    for (let j = 0; j < ids.length; j++) {
      const nodeId = ids[j]
      const node = network[nodeId]

      if (node.parents.length === 0) {
        const cpt = node.cpt as ICptWithoutParents

        rowProduct *= cpt[row[nodeId]]
      } else {
        const cpt = node.cpt as ICptWithParents
        const when: { [key: string]: string } = {}

        for (let k = 0; k < node.parents.length; k++) {
          const parent = node.parents[k]
          when[parent] = row[parent]
        }

        for (let k = 0; k < cpt.length; k++) {
          const cptRow = cpt[k]
          if (equals(cptRow.when, when)) {
            rowProduct *= cptRow.then[row[nodeId]]
            break
          }
        }
      }
    }

    // Multiply by soft evidence (weights are normalized)
    const softIds = Object.keys(softEvidence)
    for (const nodeId of softIds) {
      const weights = softEvidence[nodeId]
      const state = row[nodeId]
      if (state !== undefined) {
        rowProduct *= weights[state] || 0
      }
    }

    rowsProducts.push(rowProduct)
  }

  let probability = 0

  for (let i = 0; i < rowsProducts.length; i++) {
    probability += rowsProducts[i]
  }

  return probability
}

export const infer: IInfer = (network: INetwork, nodes: ICombinations, giving?: IEvidence): number => {
  let combinations: ICombinations[] = combinationsCache.get(network)

  if (combinations === undefined) {
    combinations = buildCombinations(network)
    combinationsCache.set(network, combinations)
  }

  const softEvidence = prepareEvidence(network, giving)

  const filteredForQuery = filterCombinations(combinations, nodes)
  const probQueryAndSoft = calculateProbabilities(network, filteredForQuery, softEvidence)
  const probSoft = calculateProbabilities(network, combinations, softEvidence)

  if (probSoft === 0) return 0

  return probQueryAndSoft / probSoft
}
