import * as expect from 'expect'
import { createNetwork } from '../../src/utils'
import { allNodes } from '../../models/rain-sprinkler-grasswet'
import { prepareEvidence } from '../../src/utils/evidence'

const network = createNetwork(...allNodes)

describe('utils/evidence.prepareEvidence', () => {
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
