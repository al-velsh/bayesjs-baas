import * as expect from 'expect'

import { createNetwork } from '../../src/utils'
import { allNodes, completeDataSetParentChild } from '../../models/parent-child-zero-knowledge-cpt'
import {ICptWithoutParents, ICptWithParents, INetwork} from '../../src'
import { learningFromEvidence } from '../../src/utils/parameter-learning'
import { allNodesSprinkler, missingWhetherRainDataSetSprinkler } from '../../models/extended-sprinkler'
import {node1, simplestEvindence} from "../../models/simplest-model";

const microNetwork = createNetwork(...allNodes)
const sprinklerExtendedNetwork = createNetwork(...allNodesSprinkler)
const simplestNetwork = createNetwork(node1)

describe('Learning Utils', () => {
  describe('Simple learning examples', () => {

    it('Learning with all evidence been the same should result in a CPT with the same values as evidence', () => {
      let preLearningNetwork = JSON.parse(JSON.stringify(simplestNetwork))
      const newNetwork = learningFromEvidence(preLearningNetwork, simplestEvindence)
      const newCpt = newNetwork["Node_1"].cpt as ICptWithoutParents
      expect(newCpt.True).toBeCloseTo(0.12, 1)
      expect(newCpt.False).toBeCloseTo(0.88, 1)
    })

    it('Learn form a complete dataset', () => {
      let newNetwork: INetwork = JSON.parse(JSON.stringify(microNetwork))

      newNetwork = learningFromEvidence(newNetwork, completeDataSetParentChild)

      console.log(JSON.stringify(newNetwork, null, 2))

      const childNode = newNetwork.CHILD
      const childCpt = childNode.cpt as ICptWithParents

      const whenParentTrue = childCpt.find(entry => entry.when.PARENT === 'T')
      expect(whenParentTrue).toBeDefined()
      if (whenParentTrue) {
        expect(whenParentTrue.then.T).toBeCloseTo(1, 1)
        expect(whenParentTrue.then.F).toBeCloseTo(0, 1)
      }

      const whenParentFalse = childCpt.find(entry => entry.when.PARENT === 'F')
      expect(whenParentFalse).toBeDefined()
      if (whenParentFalse) {
        expect(whenParentFalse.then.T).toBeCloseTo(0, 1)
        expect(whenParentFalse.then.F).toBeCloseTo(1, 1)
      }
    })

    it('Should learn hidden variables from the evidence', () => {
      let newNetwork = sprinklerExtendedNetwork

      newNetwork = learningFromEvidence(newNetwork, missingWhetherRainDataSetSprinkler)

      console.log(JSON.stringify(newNetwork, null, 2))

      const weatherNode = newNetwork.Weather
      const weatherCpt = weatherNode.cpt as ICptWithParents

      const whenHighWeather = weatherCpt.find(entry => entry.when.Cloudy === 'High' && entry.when.Humidity === 'High')
      expect(whenHighWeather).toBeDefined()

      const whenLowWeather = weatherCpt.find(entry => entry.when.Cloudy === 'Low' && entry.when.Humidity === 'Low')
      expect(whenHighWeather).toBeDefined()

      if (whenHighWeather && whenLowWeather) {
        expect(whenHighWeather.then.Bad).toBeGreaterThan(0.8)
        expect(whenLowWeather.then.Good).toBeGreaterThan(0.8)
      }
    })
  })
})
