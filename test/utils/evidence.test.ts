import * as expect from 'expect'
import { createNetwork } from '../../src/utils'
import { allNodes } from '../../models/rain-sprinkler-grasswet'
import { prepareEvidence } from '../../src/utils/evidence'

const network = createNetwork(...allNodes)

describe('utils/evidence.prepareEvidence', () => {
  it('normalizes soft evidence to sum to 1 and fills missing states with 0', () => {
    const given = { RAIN: { T: 3, F: 7 } }
    const { hard, soft } = prepareEvidence(network, given)

    expect(hard).toEqual({})
    expect(Object.keys(soft)).toEqual(['RAIN'])
    // 3/(3+7)=0.3, 7/(3+7)=0.7
    expect(Number(soft.RAIN.T.toFixed(4))).toBe(0.3)
    expect(Number(soft.RAIN.F.toFixed(4))).toBe(0.7)
  })

  it('treats unspecified states as 0 before normalization', () => {
    const given = { RAIN: { T: 2 } as Record<string, number> }
    const { soft } = prepareEvidence(network, given)
    // sum=2 => T=1, F=0 after normalization
    expect(soft.RAIN.T).toBe(1)
    expect(soft.RAIN.F).toBe(0)
  })

  it('splits hard evidence unchanged', () => {
    const given = { SPRINKLER: 'T' }
    const { hard, soft } = prepareEvidence(network, given)
    expect(hard).toEqual({ SPRINKLER: 'T' })
    expect(soft).toEqual({})
  })

  it('throws for unknown node id', () => {
    const given = { UNKNOWN_NODE: { X: 1 } as Record<string, number> }
    expect(() => prepareEvidence(network, given)).toThrow()
  })

  it('throws for unknown hard state', () => {
    const given = { RAIN: 'X' as string }
    expect(() => prepareEvidence(network, given)).toThrow()
  })

  it('throws for negative or non-finite weights', () => {
    expect(() => prepareEvidence(network, { RAIN: { T: -1, F: 2 } })).toThrow()
    expect(() => prepareEvidence(network, { RAIN: { T: Number.NaN, F: 1 } as Record<string, number> })).toThrow()
  })

  it('throws for zero total soft evidence', () => {
    expect(() => prepareEvidence(network, { RAIN: { T: 0, F: 0 } })).toThrow()
  })
})
