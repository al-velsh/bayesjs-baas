import { ICliquePotentialItem, IEvidence, INetwork } from '../types';
/**
 *
 * Given a clique potentials and a node family, returns clique potentials that contain only the nodes in the family.
 *
 * @param potential - The clique potentials to be filtered
 * @param family - The node family to filter the potentials by
 * @returns A new clique potentials array containing only the nodes in the family
 */
export declare function getPotentialForFamily(potential: ICliquePotentialItem[], family: string[]): ICliquePotentialItem[];
/**
 *
 * Performs the maximization step of the EM algorithm, that is equivalent to the maximization likelihood algorithm.
 * This step is used to update the parameters of the nodes in the network, using the counts provided by the expectation step.
 *
 * @param network - The Bayesian network to update
 * @param originalExpectedCounts - A map of counts of how much times a given configuration has been seen, for each node in the network.
 * @returns A new network with the updated parameters, after the maximization step.
 */
export declare function maximizationStep(network: INetwork, originalExpectedCounts: Record<string, ICliquePotentialItem[]>): INetwork;
/**
 *
 * Returns the log likelihood of the network, compare with the evidence scenarios already process as counts.
 * This metric is used to evaluate how close is the current network to the evidence scenarios, which is usually a negative number,.
 *
 * @param network - The Bayesian network to analyze the log likelihood of
 * @param originalExpectedCounts - A map of counts of how much times a given configuration has been seen, for each node in the network.
 * @returns A number representing the log likelihood of the network, compare with the evidence scenarios already process as counts.
 */
export declare function computeCompleteDataLogLikelihood(network: INetwork, originalExpectedCounts: Record<string, ICliquePotentialItem[]>): number;
/**
 * Performs the expectation step of the EM algorithm.
 * This step is used to compute the marginal probabilities of the nodes in the network,
 * for each given evidence, given as a result a count of how much time a configuration has been seen.
 *
 * @param network - The Bayesian network to be performance the expectation
 * @param given - Array of evidence instances for training
 * @returns A map of counts of how much time a given configuration has been seen, for each node in the network.
 */
export declare function expectationStep(network: INetwork, given?: IEvidence[]): Record<string, ICliquePotentialItem[]>;
/**
 * Performs iterative learning from evidence using the EM algorithm.
 *
 * @param network - The initial Bayesian network to be trained
 * @param given - Array of evidence instances for training
 * @param stopRatio - The ratio of difference between the log likelihood of the current network and the previous one to stop the training
 * @returns Updated network after training with the specified parameters
 */
export declare function learningFromEvidence(network: INetwork, given?: IEvidence[], stopRatio?: number): INetwork;
