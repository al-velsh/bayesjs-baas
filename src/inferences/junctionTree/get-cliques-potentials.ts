import {
  IClique,
  ICliquePotentials,
  IGraph,
  INetwork,
  ISepSet,
  IEvidence, ICombinations,
} from '../../types'
import { isNotNil, normalizeCliquePotentials } from '../../utils'

import createInitialPotentials from './create-initial-potentials'
import { isNil } from 'ramda'
import propagatePotential from './propagate-potentials'

const getCliquesPotentialsWeekMap = new WeakMap<IClique[], ICliquePotentials>()
const getGivensWeekMap = new WeakMap<IEvidence, boolean>()

const getCachedValues = (cliques: IClique[], given: IEvidence) => {
  const cachedByCliques = getCliquesPotentialsWeekMap.get(cliques)
  const cachedByGiven = getGivensWeekMap.get(given)

  if (isNotNil(cachedByCliques) && isNotNil(cachedByGiven)) {
    return cachedByCliques
  }

  return null
}

const setCachedValues = (cliques: IClique[], given: IEvidence, result: ICliquePotentials) => {
  getCliquesPotentialsWeekMap.set(cliques, result)
  getGivensWeekMap.set(given, true)
}

export default (cliques: IClique[], network: INetwork, junctionTree: IGraph, sepSets: ISepSet[], given: ICombinations) => {
  const cached = getCachedValues(cliques, given)

  if (isNil(cached)) {
    const cliquesPotentials = createInitialPotentials(cliques, network, given)
    const finalCliquesPotentials = propagatePotential(network, junctionTree, cliques, sepSets, cliquesPotentials)
    const result = normalizeCliquePotentials(finalCliquesPotentials)

    setCachedValues(cliques, given, result)

    return result
  }

  return cached
}
