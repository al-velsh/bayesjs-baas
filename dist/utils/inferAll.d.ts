import { IInferAllOptions, INetwork, INetworkResult } from '../types';
export declare const inferAll: (network: INetwork, given?: Record<string, string | Record<string, number>>, options?: IInferAllOptions) => INetworkResult;
