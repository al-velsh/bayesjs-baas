import { IClique, ICliquePotentials, IGraph, INetwork, ISepSet } from '../../types';
declare const _default: (cliques: IClique[], network: INetwork, junctionTree: IGraph, sepSets: ISepSet[], given: Record<string, string | Record<string, number>>, softEvidence?: Record<string, Record<string, number>> | undefined) => ICliquePotentials;
export default _default;
