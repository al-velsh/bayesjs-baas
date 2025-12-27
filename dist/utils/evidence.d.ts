import { IEvidence, INetwork } from '../types';
import { ISplitEvidence } from '../types/ISplitEvidence';
/**
 * Prepares the provided evidence by splitting, validating and normalizing.
 *
 * @param network The Bayesian network (used to validate node IDs and states)
 * @param preGiven   Hard and/or soft evidence for a subset of nodes
 * @returns       A split evidence object with hardEvidence and softEvidence
 * @throws Error  If a node ID is unknown, a hard-evidence state is invalid,
 *                or soft-evidence weights are invalid (negative/non-finite) or sum to zero
 */
export declare function prepareEvidence(network: INetwork, preGiven: IEvidence): ISplitEvidence;
