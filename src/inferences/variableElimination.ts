import {
  ICombinations,
  ICptWithParents,
  ICptWithoutParents,
  IFactor,
  IInfer,
  INetwork,
  INode,
  IEvidence,
} from '../types'
import { prepareEvidence } from '../utils/evidence'

function buildFactor (node: INode): IFactor {
  const factor: IFactor = []

  if (node.parents.length === 0) {
    const cpt = node.cpt as ICptWithoutParents

    for (let i = 0; i < node.states.length; i++) {
      const state = node.states[i]

      factor.push({
        states: { [node.id]: state },
        value: cpt[state],
      })
    }
  } else {
    const cpt = node.cpt as ICptWithParents

    for (let i = 0; i < cpt.length; i++) {
      for (let j = 0; j < node.states.length; j++) {
        const state = node.states[j]

        factor.push({
          states: { ...cpt[i].when, [node.id]: state },
          value: cpt[i].then[state],
        })
      }
    }
  }

  return factor
}

function joinFactors (f1: IFactor, f2: IFactor): IFactor {
  const newFactor: IFactor = []

  for (let i = 0; i < f1.length; i++) {
    for (let j = 0; j < f2.length; j++) {
      const states = {
        ...f1[i].states,
        ...f2[j].states,
      }

      const nodeIds = Object.keys(states)

      const alreadyExists = newFactor.some(x => nodeIds.every(nodeId => x.states[nodeId] === states[nodeId]))

      if (!alreadyExists) {
        newFactor.push({ states, value: 0 })
      }
    }
  }

  const nodeIdsF1 = Object.keys(f1[0].states)
  const nodeIdsF2 = Object.keys(f2[0].states)

  for (let i = 0; i < newFactor.length; i++) {
    const rowNewFactor = newFactor[i]

    const rowF1 = f1.find(x => nodeIdsF1.every(nodeId => x.states[nodeId] === rowNewFactor.states[nodeId]))

    const rowF2 = f2.find(x => nodeIdsF2.every(nodeId => x.states[nodeId] === rowNewFactor.states[nodeId]))

    if (rowF1 === undefined || rowF2 === undefined) {
      throw new Error('Fatal error')
    }

    rowNewFactor.value = rowF1.value * rowF2.value
  }

  return newFactor
}

function eliminateVariable (factor: IFactor, variable: string): IFactor {
  const newFactor = []

  for (let i = 0; i < factor.length; i++) {
    const states = { ...factor[i].states }

    delete states[variable]

    const nodeIds = Object.keys(states)

    const existingRow = newFactor.find(x => nodeIds.every(nodeId => x.states[nodeId] === states[nodeId]))

    if (existingRow === undefined) {
      newFactor.push({
        states,
        value: factor[i].value,
      })
    } else {
      existingRow.value += factor[i].value
    }
  }

  return newFactor
}

function normalizeFactor (factor: IFactor): IFactor {
  const total = factor.reduce((acc, row) => acc + row.value, 0)

  if (total === 0) {
    return factor
  }

  return factor
    .map(row => ({
      states: { ...row.states },
      value: row.value / total,
    }))
}

export const infer: IInfer = (network: INetwork, nodes: ICombinations = {}, giving?: IEvidence): number => {
  const variables = Object.keys(network)
  const variablesToInfer = Object.keys(nodes)
  const softEvidence = prepareEvidence(network, giving)

  // Build CPT-derived factors
  const factors: IFactor[] = variables.map(nodeId => buildFactor(network[nodeId]))

  // Add one additional factor per soft-evidence variable (likelihood weighting)
  const softIds = Object.keys(softEvidence)
  for (const nodeId of softIds) {
    const weights = softEvidence[nodeId]
    const node = network[nodeId]
    const factor: IFactor = []
    for (const state of node.states) {
      const w = weights[state] || 0
      factor.push({ states: { [nodeId]: state }, value: w })
    }
    factors.push(factor)
  }

  // Variables to eliminate: all except query variables
  const variablesToEliminate = variables
    .filter(x => !variablesToInfer.some(y => y === x))

  while (variablesToEliminate.length > 0) {
    const varToEliminate = variablesToEliminate.shift()
    if (!varToEliminate) {
      break
    }

    const factorsToJoin = factors.filter(factor => Object.keys(factor[0].states).some(nodeId => nodeId === varToEliminate))

    if (factorsToJoin.length === 0) {
      continue
    }

    const resultFactor = eliminateVariable(
      factorsToJoin.reduce((f1, f2) => joinFactors(f1, f2)),
      varToEliminate,
    )

    for (let i = 0; i < factorsToJoin.length; i++) {
      factors.splice(factors.indexOf(factorsToJoin[i]), 1)
    }

    factors.push(resultFactor)
  }

  const joinedFactor = factors
    .filter(factor => Object.keys(factor[0].states).length > 0)
    .sort((f1, f2) => f1.length - f2.length)
    .reduce((f1, f2) => joinFactors(f1, f2))

  const normalizedFactor = normalizeFactor(joinedFactor)

  const inferenceRow = normalizedFactor.find(row => variablesToInfer.every(v => row.states[v] === nodes[v]))

  if (inferenceRow === undefined) {
    return 0
  }

  return inferenceRow.value
}
