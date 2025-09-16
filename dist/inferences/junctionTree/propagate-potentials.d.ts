import { IClique, ICliquePotentialItem, ICliquePotentials, IGraph, INetwork, ISepSet } from '../../types';
export declare const findSepSetWithCliques: (cliqueIdA: string, cliqueIdB: string, sepSets: ISepSet[]) => ISepSet | undefined;
/** Marginalize the clique potentials modulo a separation set. */
export declare const marginalizePotentials: (network: INetwork, sepSet: string[], potentials: ICliquePotentialItem[]) => ICliquePotentialItem[];
declare const _default: (network: INetwork, junctionTree: IGraph, cliques: IClique[], sepSets: ISepSet[], cliquesPotentials: ICliquePotentials) => ICliquePotentials;
export default _default;
