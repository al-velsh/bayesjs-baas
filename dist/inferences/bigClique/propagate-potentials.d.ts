import { IClique, ICliquePotentialItem, ICliquePotentialMessages, ICliquePotentials, IGraph, INetwork, ISepSet } from '../../types';
export declare const findSepSetWithCliques: (cliqueIdA: string, cliqueIdB: string, sepSets: ISepSet[]) => ISepSet | undefined;
export declare const createMessagesByCliques: (cliques: IClique[]) => ICliquePotentialMessages;
/** Marginalize the clique potentials modulo a separation set. */
export declare const marginalizePotentials: (network: INetwork, sepSet: string[], potentials: ICliquePotentialItem[]) => ICliquePotentialItem[];
export declare function collectNetworkEvidence(network: INetwork, junctionTree: IGraph, sepSets: ISepSet[], cliquesPotentials: ICliquePotentials, messages: ICliquePotentialMessages, ccs: string[][], rootId?: string): ICliquePotentials;
export declare function distributeNetworkEvidence(network: INetwork, junctionTree: IGraph, sepSets: ISepSet[], cliquesPotentials: ICliquePotentials, messages: ICliquePotentialMessages, ccs: string[][], rootId?: string): ICliquePotentials;
declare const _default: (network: INetwork, junctionTree: IGraph, cliques: IClique[], sepSets: ISepSet[], cliquesPotentials: ICliquePotentials) => ICliquePotentials;
export default _default;
