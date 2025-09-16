import { ICombinations, INetwork, IEvidence } from '.';
export interface IInfer {
    (network: INetwork, nodes: ICombinations, given?: IEvidence): number;
}
