import { INode } from '../src/types'

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
