
import * as expect from 'expect'
import { IInfer, inferences } from '../../src'
import { allNodes } from '../../models/rain-sprinkler-grasswet'
import { createNetwork } from '../../src/utils'

const { enumeration, junctionTree, variableElimination } = inferences
const network = createNetwork(...allNodes)

const infersGiveRainSoftEvidence = (infer: IInfer) => {
  const given = { RAIN: { T: 0.3, F: 0.7 } }

  // Expected values under soft evidence (likelihood weighting)
  expect(infer(network, { SPRINKLER: 'T' }, given).toFixed(4)).toBe('0.3623')
  expect(infer(network, { SPRINKLER: 'F' }, given).toFixed(4)).toBe('0.6377')

  expect(infer(network, { GRASS_WET: 'T' }, given).toFixed(4)).toBe('0.4028')
  expect(infer(network, { GRASS_WET: 'F' }, given).toFixed(4)).toBe('0.5972')
}

const inferencesNames: { [key: string]: IInfer } = {
  Enumeration: enumeration.infer,
  'Junction Tree': junctionTree.infer,
  'Variable Elimination': variableElimination.infer,
}

const tests: { [key: string]: (infer: IInfer) => void } = {
  'infers give Rain Soft Evidence': infersGiveRainSoftEvidence,
}

describe('infers', () => {
  describe('sprinkler network with soft evidence', () => {
    const testNames = Object.keys(tests)
    const inferNames = Object.keys(inferencesNames)

    for (const testName of testNames) {
      const method = tests[testName]
      for (const inferName of inferNames) {
        const infer = inferencesNames[inferName]
        it(`${testName} (${inferName})`, () => method(infer))
      }
    }
  })
})
