import { IEvidence, INetwork } from '../types';
/**
 * Normalized soft evidence map per node.
 * - Keys: node IDs
 * - Values: a map from state -> normalized weight in [0, 1]
 * - For each node, the weights sum to 1 across all of its states
 */
export declare type SoftEvidenceMap = Record<string, Record<string, number>>;
/**
 * Prepares the provided evidence by validating and normalizing it into a single soft map.
 *
 * Behavior:
 * - Hard evidence entries (string) are converted to soft evidence with weight 1 for the chosen
 *   state and 0 for other states.
 * - Soft evidence entries (object of state->weight) are validated and normalized:
 *   - Unknown states are ignored; missing states are assigned weight 0
 *   - All weights must be non-negative finite numbers
 *   - Total weight must be > 0; otherwise, an error is thrown
 *   - Weights are normalized to sum to 1 across the node's states
 *
 * @param network The Bayesian network (used to validate node IDs and states)
 * @param given   Hard and/or soft evidence for a subset of nodes
 * @returns       A normalized soft evidence map (nodeId -> state -> weight)
 * @throws Error  If a node ID is unknown, a hard-evidence state is invalid,
 *                or soft-evidence weights are invalid (negative/non-finite) or sum to zero
 */
export declare function prepareEvidence(network: INetwork, given?: IEvidence): SoftEvidenceMap;
