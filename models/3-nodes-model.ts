import { IEvidence, INode } from '../src/types'
import {createNetwork} from "../src/utils";

// Node 1 (no parents)
export const Node1: INode = {
  id: 'Node_1',
  states: ['T', 'F'],
  parents: [],
  cpt: { T: 0.5, F: 0.5 },
}

// Node 2 (parent: Node 1)
export const Node2: INode = {
  id: 'Node_2',
  states: ['T', 'F'],
  parents: ['Node_1'],
  cpt: [
    { when: { Node_1: 'T' }, then: { T: 0.5, F: 0.5 } },
    { when: { Node_1: 'F' }, then: { T: 0.5, F: 0.5 } },
  ],
}

// Node 3 (parent: Node 2)
export const Node3: INode = {
  id: 'Node_3',
  states: ['T', 'F'],
  parents: ['Node_2'],
  cpt: [
    { when: { Node_2: 'T' }, then: { T: 0.5, F: 0.5 } },
    { when: { Node_2: 'F' }, then: { T: 0.5, F: 0.5 } },
  ],
}

export const allNodes = [Node1, Node2, Node3]
export const threNodesNetwork = createNetwork(...allNodes)

// Evidence array following the simplest-model pattern
export const evidences: IEvidence[] = [
  {
    Node_1: {
      T: 0.8,
      F: 0.2,
    },
    Node_3: {
      T: 0.3,
      F: 0.7,
    },
  },
]
