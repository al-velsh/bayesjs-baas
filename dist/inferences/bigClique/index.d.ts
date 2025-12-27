import { IEvidence, IInfer, INetwork, IRawInfer } from '../../types';
export declare const rawInfer: (network: INetwork, given?: IEvidence) => IRawInfer;
export declare const infer: IInfer;
export declare const getPreNormalizedPotentials: (network: INetwork, given?: IEvidence) => IRawInfer;
