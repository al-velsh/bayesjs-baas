import * as roundTo from 'round-to'

import { IInferAllOptions, IEvidence, INetwork, INetworkResult, INode, INodeResult } from '../types'
import { assoc, clone, identity, ifElse, mergeRight, nthArg, pipe, propEq, reduce } from 'ramda'
import { getNodeStates, getNodesFromNetwork } from './network'

import { infer } from '../inferences/junctionTree'
import { clampNetwork } from './clamp'

const defaultOptions: IInferAllOptions = {
  force: false,
  precision: 8,
}

const getOptions = mergeRight(defaultOptions)

const inferNodeState = (network: INetwork, nodeId: string, nodeState: string, given: IEvidence, options: IInferAllOptions) => {
  // For pure hard-evidence entries on the queried node, keep the fast path
  if (typeof given[nodeId] === 'string') {
    return propEq(nodeId, nodeState, given) ? 1 : 0
  }
  // For soft-evidence entries and clamp mode, return the provided distribution directly
  if (options.clampSoftEvidence && typeof given[nodeId] === 'object' && given[nodeId] !== null) {
    const weights = given[nodeId] as Record<string, number>
    let sum = 0
    for (const key in weights) sum += weights[key] || 0
    const denom = sum > 0 ? sum : 1
    return (weights[nodeState] || 0) / denom
  }

  const precision = options.precision !== undefined ? options.precision : 8
  return roundTo(infer(network, { [nodeId]: nodeState }, given), precision)
}

const inferNode = (network: INetwork, node: INode, given: IEvidence, options: IInferAllOptions) =>
  reduce(
    (acc, nodeState) => assoc(
      nodeState,
      inferNodeState(network, node.id, nodeState, given, options),
      acc,
    ),
    {} as INodeResult,
    getNodeStates(node),
  )

const cloneIfForce: <T>(network: T, options: IInferAllOptions) => T = ifElse(
  pipe(nthArg(1), propEq('force', true)),
  clone,
  identity,
)

export const inferAll = (network: INetwork, given: IEvidence = {}, options: IInferAllOptions = {}): INetworkResult => {
  const finalOptions = getOptions(options)
  let networkToInfer = cloneIfForce(network, finalOptions)
  const givenToInfer = given

  networkToInfer = finalOptions.clampSoftEvidence ? clampNetwork(networkToInfer, givenToInfer) : networkToInfer
  const givenForInfer: IEvidence = finalOptions.clampSoftEvidence ? {} : givenToInfer

  return reduce(
    (acc, node) => assoc(node.id, inferNode(networkToInfer, node, givenForInfer, finalOptions), acc),
    {} as INetworkResult,
    getNodesFromNetwork(networkToInfer),
  )
}
