import * as expect from 'expect'
import { inferences, IInfer, IEvidence } from '../../src'
import { createNetwork } from '../../src/utils'
import { allNodes } from '../../models/rain-sprinkler-grasswet'

const { enumeration, junctionTree, variableElimination } = inferences
const network = createNetwork(...allNodes)

const engines: Array<{ name: string; infer: IInfer }> = [
  { name: 'Enumeration', infer: enumeration.infer },
  { name: 'Junction Tree', infer: junctionTree.infer },
  { name: 'Variable Elimination', infer: variableElimination.infer },
]

describe('soft evidence normalization and combo', () => {
  it('normalizes weights equivalently (RAIN {T:3,F:7} equals {T:0.3,F:0.7})', () => {
    for (const { name, infer } of engines) {
      const p1 = infer(network, { SPRINKLER: 'T' }, { RAIN: { T: 3, F: 7 } }).toFixed(4)
      const p2 = infer(network, { SPRINKLER: 'T' }, { RAIN: { T: 0.3, F: 0.7 } }).toFixed(4)
      expect({ name, p1, p2 }.p1).toBe(p2)
    }
  })

  it('unspecified soft state treated as 0 before normalization', () => {
    for (const { infer } of engines) {
      const p = infer(network, { GRASS_WET: 'T' }, { RAIN: { T: 2 } as Record<string, number> })
      // With T=2 (normalized to T=1,F=0), equals P(GRASS_WET|RAIN=T)
      const gold = infer(network, { GRASS_WET: 'T' }, { RAIN: 'T' })
      expect(Number(p.toFixed(4))).toBe(Number(gold.toFixed(4)))
    }
  })

  it('combines hard and soft evidence correctly', () => {
    for (const { infer } of engines) {
      const given: IEvidence = { RAIN: { T: 0.6, F: 0.4 }, SPRINKLER: 'F' }
      const t = infer(network, { GRASS_WET: 'T' }, given)
      const f = infer(network, { GRASS_WET: 'F' }, given)
      expect(Number((t + f).toFixed(6))).toBe(1)
    }
  })
})
