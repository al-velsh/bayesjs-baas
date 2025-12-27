import { ICliquePotentialItem } from '../../types';
import { ISoftEvidence } from '../../types/ISoftEvidence';
/**
 *
 * Extract the probability of the states of a variable independent of the rest of the clique potentials (Marginal distribution).
 *
 * @returns {Record<string, number>} Returns a map of states with their probabilities.
 * @param cliquePotential The big clique in which the soft evidence is applied (Do not modify the original big clique potential, create a copy instead).
 * @param variable The variable use for the marginal distribution.
 */
export declare function getVariableMarginalDistribution(cliquePotential: ICliquePotentialItem[], variable: string): Record<string, number>;
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
export declare function IPFP(bigCliquePotential: ICliquePotentialItem[], softEvidence: ISoftEvidence, epsilon?: number): ICliquePotentialItem[];
