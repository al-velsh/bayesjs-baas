import { IInfer, INetwork, IRawInfer } from '../../types';
export declare const infer: IInfer;
export declare const rawInfer: (network: INetwork, given?: Record<string, string | Record<string, number>>) => IRawInfer;
export declare const getPreNormalizedPotentials: (network: INetwork, given?: Record<string, string | Record<string, number>>) => IRawInfer;
