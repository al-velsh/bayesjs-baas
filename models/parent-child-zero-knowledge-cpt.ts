import { IEvidence, INode } from '../src/types'

export const parent: INode = {
  id: 'PARENT',
  states: ['T', 'F'],
  parents: [],
  cpt: { T: 0.50, F: 0.50 },
}

export const child: INode = {
  id: 'CHILD',
  states: ['T', 'F'],
  parents: ['PARENT'],
  cpt: [
    { when: { PARENT: 'T' }, then: { T: 0.50, F: 0.50 } },
    { when: { PARENT: 'F' }, then: { T: 0.50, F: 0.50 } },
  ],
}

export const allNodes = [parent, child]

export const completeDataSetParentChild: IEvidence[] = [
  {
    PARENT: {
      T: 0.95,
      F: 0.05,
    },
    CHILD: {
      T: 0.90,
      F: 0.10,
    },
  },
  {
    PARENT: {
      T: 0.05,
      F: 0.95,
    },
    CHILD: {
      T: 0.10,
      F: 0.90,
    },
  },
  {
    PARENT: {
      T: 0.98,
      F: 0.02,
    },
    CHILD: {
      T: 0.95,
      F: 0.05,
    },
  },
  {
    PARENT: {
      T: 0.02,
      F: 0.98,
    },
    CHILD: {
      T: 0.05,
      F: 0.95,
    },
  },
  {
    PARENT: {
      T: 0.90,
      F: 0.10,
    },
    CHILD: {
      T: 0.92,
      F: 0.08,
    },
  },
  {
    PARENT: {
      T: 0.10,
      F: 0.90,
    },
    CHILD: {
      T: 0.08,
      F: 0.92,
    },
  },
  {
    PARENT: {
      T: 0.96,
      F: 0.04,
    },
    CHILD: {
      T: 0.91,
      F: 0.09,
    },
  },
  {
    PARENT: {
      T: 0.04,
      F: 0.96,
    },
    CHILD: {
      T: 0.09,
      F: 0.91,
    },
  },
  {
    PARENT: {
      T: 0.99,
      F: 0.01,
    },
    CHILD: {
      T: 0.97,
      F: 0.03,
    },
  },
  {
    PARENT: {
      T: 0.01,
      F: 0.99,
    },
    CHILD: {
      T: 0.03,
      F: 0.97,
    },
  },
  {
    PARENT: {
      T: 0.94,
      F: 0.06,
    },
    CHILD: {
      T: 0.93,
      F: 0.07,
    },
  },
  {
    PARENT: {
      T: 0.06,
      F: 0.94,
    },
    CHILD: {
      T: 0.07,
      F: 0.93,
    },
  },
  {
    PARENT: {
      T: 0.97,
      F: 0.03,
    },
    CHILD: {
      T: 0.94,
      F: 0.06,
    },
  },
  {
    PARENT: {
      T: 0.03,
      F: 0.97,
    },
    CHILD: {
      T: 0.06,
      F: 0.94,
    },
  },
  {
    PARENT: {
      T: 0.92,
      F: 0.08,
    },
    CHILD: {
      T: 0.90,
      F: 0.10,
    },
  },
  {
    PARENT: {
      T: 0.08,
      F: 0.92,
    },
    CHILD: {
      T: 0.10,
      F: 0.90,
    },
  },
  {
    PARENT: {
      T: 0.95,
      F: 0.05,
    },
    CHILD: {
      T: 0.96,
      F: 0.04,
    },
  },
  {
    PARENT: {
      T: 0.05,
      F: 0.95,
    },
    CHILD: {
      T: 0.04,
      F: 0.96,
    },
  },
  {
    PARENT: {
      T: 0.91,
      F: 0.09,
    },
    CHILD: {
      T: 0.94,
      F: 0.06,
    },
  },
  {
    PARENT: {
      T: 0.09,
      F: 0.91,
    },
    CHILD: {
      T: 0.06,
      F: 0.94,
    },
  },
]
