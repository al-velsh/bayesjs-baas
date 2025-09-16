import { IClique, ICliquePotentials, IGraph, INetwork, ISepSet, IEvidence } from '../../types';
declare const _default: (cliques: IClique[], network: INetwork, junctionTree: IGraph, sepSets: ISepSet[], given: IEvidence, softEvidence?: Record<string, Record<string, number>> | undefined) => ICliquePotentials;
export default _default;
