import { IClique, ICliquePotentials } from '../../types';
export declare const getCachedValues: (cliques: IClique[], given: Record<string, string | Record<string, number>>) => ICliquePotentials | null | undefined;
export declare const setCachedValues: (cliques: IClique[], given: Record<string, string | Record<string, number>>, result: ICliquePotentials) => void;
