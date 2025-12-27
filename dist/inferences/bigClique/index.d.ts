import { IEvidence, IInfer, INetwork, IRawInfer } from '../../types';
/**
 *
 * Returns the clique potentials after the inference of a network
 * This function is intended to be used by other algorithms that need to have more details results of the inference (e.g., Parameter learning).
 *
 * Implementation: This function performance the Big Clique algorithm based on the paper:
 *
 * "Soft evidential update for probabilistic multiagent systems"
 * by Marco Valtorta, Young-Gyun Kim, Jiri Vomlel (2000)
 *
 * DOI: https://www.sciencedirect.com/science/article/pii/S0888613X01000561
 *
 * @returns {IRawInfer} Cliques and their potentials.
 * @param network Network to perform inference.
 * @param given Optional Soft/Hard evidence for the inference.
 */
export declare const rawInfer: (network: INetwork, given?: IEvidence) => IRawInfer;
/**
 *
 * Returns the inference result for the given node:state combinations.
 *
 * @returns {number} Probability of the given node:state.
 * @param network Network to perform inference.
 * @param nodes The requested node:state combinations.
 * @param given Optional Soft/Hard evidence for the inference.
 */
export declare const infer: IInfer;
