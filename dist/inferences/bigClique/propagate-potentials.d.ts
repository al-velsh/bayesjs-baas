import { IClique, ICliquePotentialItem, ICliquePotentialMessages, ICliquePotentials, IGraph, INetwork, ISepSet } from '../../types';
export declare const findSepSetWithCliques: (cliqueIdA: string, cliqueIdB: string, sepSets: ISepSet[]) => ISepSet | undefined;
export declare const createMessagesByCliques: (cliques: IClique[]) => ICliquePotentialMessages;
/** Marginalize the clique potentials modulo a separation set. */
export declare const marginalizePotentials: (network: INetwork, sepSet: string[], potentials: ICliquePotentialItem[]) => ICliquePotentialItem[];
/**
 *
 * Update the potentials in the JT from the leaves to the root.
 *
 * @returns {ICliquePotentials} The updated clique potentials.
 * @param network Network to perform inference.
 * @param junctionTree The junction tree of the network.
 * @param sepSets The list of separation sets.
 * @param cliquesPotentials The initial clique potentials.
 * @param messages The messages between the cliques.
 * @param ccs The connected components of the junction tree.
 * @param rootId The root node of the junction tree or first node of the connected component if not provided.
 */
export declare function collectNetworkEvidence(network: INetwork, junctionTree: IGraph, sepSets: ISepSet[], cliquesPotentials: ICliquePotentials, messages: ICliquePotentialMessages, ccs: string[][], rootId?: string): ICliquePotentials;
/**
 *
 * Update the potentials in the JT from the root to the leaves.
 * You usually want to call this function after calling `collectNetworkEvidence` to distribute the evidence from the root to the leaves.
 *
 * @returns {ICliquePotentials} The updated clique potentials.
 * @param network Network to perform inference.
 * @param junctionTree The junction tree of the network.
 * @param sepSets The list of separation sets.
 * @param cliquesPotentials The clique potentials usually from `collectNetworkEvidence`.
 * @param messages The messages between the cliques.
 * @param ccs The connected components of the junction tree.
 * @param rootId The root node of the junction tree or first node of the connected component if not provided.
 */
export declare function distributeNetworkEvidence(network: INetwork, junctionTree: IGraph, sepSets: ISepSet[], cliquesPotentials: ICliquePotentials, messages: ICliquePotentialMessages, ccs: string[][], rootId?: string): ICliquePotentials;
