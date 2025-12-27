import { IClique, ICliquePotentials, IEvidence } from '../../types';
export declare const getCachedValues: (cliques: IClique[], given: IEvidence) => ICliquePotentials | null | undefined;
export declare const setCachedValues: (cliques: IClique[], given: IEvidence, result: ICliquePotentials) => void;
