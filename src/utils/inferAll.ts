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
  // For hard-evidence entries
  if (typeof given[nodeId] === 'string') {
    return propEq(nodeId, nodeState, given) ? 1 : 0
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
  const networkToInfer = cloneIfForce(network, finalOptions)
  const givenToInfer = cloneIfForce(given, finalOptions)

  return reduce(
    (acc, node) => assoc(node.id, inferNode(networkToInfer, node, givenToInfer, finalOptions), acc),
    {} as INetworkResult,
    getNodesFromNetwork(networkToInfer),
  )
}
