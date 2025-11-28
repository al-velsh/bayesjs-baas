import {
  IClique,
  ICliquePotentials,
  IEvidence,
} from '../../types'
import { isNotNil } from '../../utils'

const getCliquesPotentialsWeekMap = new WeakMap<IClique[], ICliquePotentials>()
const getGivensWeekMap = new WeakMap<IEvidence, boolean>()

export const getCachedValues = (cliques: IClique[], given: IEvidence) => {
  const cachedByCliques = getCliquesPotentialsWeekMap.get(cliques)
  const cachedByGiven = getGivensWeekMap.get(given)

  if (isNotNil(cachedByCliques) && isNotNil(cachedByGiven)) {
    return cachedByCliques
  }

  return null
}

export const setCachedValues = (cliques: IClique[], given: IEvidence, result: ICliquePotentials) => {
  getCliquesPotentialsWeekMap.set(cliques, result)
  getGivensWeekMap.set(given, true)
}
