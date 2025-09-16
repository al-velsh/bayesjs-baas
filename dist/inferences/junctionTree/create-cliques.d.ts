import { IClique, IGraph, INetwork, ISepSet } from '../../types';
interface ICreateCliquesResult {
    cliques: IClique[];
    sepSets: ISepSet[];
    junctionTree: IGraph;
}
declare const _default: (network: INetwork) => ICreateCliquesResult;
export default _default;
