import { IClique, ISepSet } from '..';
export declare const createSepSets: (cliques: IClique[], onRemoveEdge: (nodeIdA: string, nodeIdB: string) => void) => ISepSet[];
