import {
  IClique,
  ICliquePotentials,
  IEvidence, ICombinations,
} from '../../types'
import { isNotNil, normalizeCliquePotentials } from '../../utils'

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

export function finishPropagation (cliques: IClique[], given: ICombinations, finalCliquesPotentials: ICliquePotentials): ICliquePotentials {
  const result = normalizeCliquePotentials(finalCliquesPotentials)
  //setCachedValues(cliques, given, result) TODO:Temp

  return result
}
