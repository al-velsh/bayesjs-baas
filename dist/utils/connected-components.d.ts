import { IGraph } from '..';
/** Find the connected components of the clique graph.  Complexity is on the
 * order O(n m) where n is the number of cliques and m is the number of separation
 * sets.   This complexity could be reduced to n (log m) by using a more efficient
 * means of finding
 */
export declare const getConnectedComponents: (junctionTree: IGraph) => string[][];
