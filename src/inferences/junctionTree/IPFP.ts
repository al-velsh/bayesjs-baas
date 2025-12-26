import { ICliquePotentialItem } from '../../types'
import { ISoftEvidence } from '../../types/ISoftEvidence'

function getVariableMarginalDistribution (cliquePotential: ICliquePotentialItem[], variable: string): Record<string, number> {
  const marginalDistribution: Record<string, number> = {}
  for (const entry of cliquePotential) {
    const variableState = entry.when[variable]
    if (variableState in marginalDistribution) {
      marginalDistribution[variableState] += entry.then
    } else {
      marginalDistribution[variableState] = entry.then
    }
  }
  return marginalDistribution
}

export function IPFP (bigCliquePotential: ICliquePotentialItem[], softEvidence: ISoftEvidence, epsilon = 0.0001): ICliquePotentialItem[] {
  const MAX_ITERATIONS_SAFETY_LIMIT = 100

  const newCliquePotential: ICliquePotentialItem[] = JSON.parse(JSON.stringify(bigCliquePotential))
  const potentialsMaxDifference = (oldPotential: ICliquePotentialItem[], newPotential: ICliquePotentialItem[]): number => {
    let maxDiff = 0
    for (let i = 0; i < oldPotential.length; i++) {
      const diff = Math.abs(oldPotential[i].then - newPotential[i].then)
      maxDiff = Math.max(maxDiff, diff)
    }
    return maxDiff
  }

  // Performance IPFP Steps until convergence
  let iterations = 0
  let maxDifference = 1

  while (maxDifference > epsilon && iterations < MAX_ITERATIONS_SAFETY_LIMIT) {
    iterations++
    const previousCliquePotential: ICliquePotentialItem[] = JSON.parse(JSON.stringify(newCliquePotential))

    for (const nodeId in softEvidence) {
      const evidence = softEvidence[nodeId]
      const variableMarginalDistribution = getVariableMarginalDistribution(newCliquePotential, nodeId)
      const factorPerState: Record<string, number> = {}
      for (const state in evidence) {
        factorPerState[state] = (evidence[state] / variableMarginalDistribution[state])
        if (factorPerState[state] === Infinity) {
          console.warn('The provided evidence for node ' + nodeId + ' is imposible.')
          factorPerState[state] = 0
        }
      }
      for (let i = 0; i < newCliquePotential.length; i++) {
        const variableState = newCliquePotential[i].when[nodeId]
        newCliquePotential[i].then *= factorPerState[variableState]
      }
    }
    maxDifference = potentialsMaxDifference(previousCliquePotential, newCliquePotential)
  }

  return newCliquePotential
}
