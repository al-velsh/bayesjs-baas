import { ICliquePotentialItem } from '../../types'
import { ISoftEvidence } from '../../types/ISoftEvidence'

/**
 *
 * Extract the probability of the states of a variable independent of the rest of the clique potentials (Marginal distribution).
 *
 * @returns {Record<string, number>} Returns a map of states with their probabilities.
 * @param cliquePotential The big clique in which the soft evidence is applied (Do not modify the original big clique potential, create a copy instead).
 * @param variable The variable use for the marginal distribution.
 */
export function getVariableMarginalDistribution (cliquePotential: ICliquePotentialItem[], variable: string): Record<string, number> {
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

/**
 *
 * IPFP (Iterative Proportional Fitting Procedure) modifies the probability table to satisfy 'Soft Evidence'
 * It iteratively adjusts the table so that the marginal probabilities match the desired target distributions,
 * while preserving the original correlations between variables as much as possible.
 *
 * For more information about IPFP, please refer to the following paper:
 * "Soft evidential update for probabilistic multiagent systems"
 * by Marco Valtorta, Young-Gyun Kim, Jiri Vomlel (2000)
 *
 * DOI: https://www.sciencedirect.com/science/article/pii/S0888613X01000561
 *
 * @returns {ICliquePotentialItem[]} Returns the big clique potential after applying the soft evidence.
 * @param bigCliquePotential The big clique in which the soft evidence is applied (Do not modify the original big clique potential, create a copy instead).
 * @param softEvidence Soft evidence to be inserted on the clique.
 * @param epsilon The convergence threshold. Default: 0.0001
 */
export function IPFP (bigCliquePotential: ICliquePotentialItem[], softEvidence: ISoftEvidence, epsilon = 0.0001): ICliquePotentialItem[] {
  const MAX_ITERATIONS_SAFETY_LIMIT = 100 // This number is an approximation of the maximum number of iterations that can be performed without taking an excessive amount of time.

  const newCliquePotential: ICliquePotentialItem[] = JSON.parse(JSON.stringify(bigCliquePotential))

  /**
   * Calculates the maximum difference between two potentials.
   */
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
        factorPerState[state] = evidence[state] / variableMarginalDistribution[state]
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
