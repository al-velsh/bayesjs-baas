/* eslint-disable @typescript-eslint/camelcase */
import { IEvidence, INode } from '../src/types'
import { createNetwork } from '../src/utils'

export const Node1: INode = {
  id: 'node1',
  states: ['T', 'F'],
  parents: [],
  cpt: { T: 0.5, F: 0.5 },
}

export const Node2: INode = {
  id: 'node2',
  states: ['T', 'F'],
  parents: ['node1'],
  cpt: [

    { when: { node1: 'T' }, then: { T: 0.5, F: 0.5 } },
    { when: { node1: 'F' }, then: { T: 0.5, F: 0.5 } },
  ],
}

export const Node3: INode = {
  id: 'node3',
  states: ['T', 'F'],
  parents: ['node2'],
  cpt: [
    { when: { node2: 'T' }, then: { T: 0.5, F: 0.5 } },
    { when: { node2: 'F' }, then: { T: 0.5, F: 0.5 } },
  ],
}

export const allNodes = [Node1, Node2, Node3]
export const threNodesNetwork = createNetwork(...allNodes)

export const evidences: IEvidence[] = [
  {
    node1: {
      T: 0.8,
      F: 0.2,
    },
    node3: {
      T: 0.3,
      F: 0.7,
    },
  },
]
