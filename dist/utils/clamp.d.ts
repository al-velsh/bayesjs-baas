import { IEvidence, INetwork } from '../types';
/**
 * Creates a new network with nodes in `given` clamped to the provided distributions.
 * - Hard evidence (string) becomes a 1/0 distribution
 * - Soft evidence maps are normalized and assigned as the node's CPT
 * - Parents are removed (node becomes a root) so the provided distribution is authoritative
 */
export declare function clampNetwork(network: INetwork, given: IEvidence): INetwork;
