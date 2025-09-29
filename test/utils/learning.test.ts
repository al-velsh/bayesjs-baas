import * as expect from 'expect'

import { createNetwork } from '../../src/utils'
import { allNodes } from '../../models/paren-child-zero-knowledge-cpt'
import { ICptWithParents, IEvidence, INetwork } from '../../src'
import { learningFromEvidence } from '../../src/utils/learning'
import { allNodesSprinkler } from '../../models/extended-splinker'

const microNetwork = createNetwork(...allNodes)
const sprinklerExtendedNetwork = createNetwork(...allNodesSprinkler)

describe('Learning Utils', () => {
  describe('Simple learning examples', () => {
    it('Learn form a complete dataset', () => {
      const softEvidenceCombinations: IEvidence[] = [
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

      let newNetwork: INetwork = JSON.parse(JSON.stringify(microNetwork))
      newNetwork = learningFromEvidence(newNetwork, softEvidenceCombinations)

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
      const learningCases: IEvidence[] = [
        {
          Cloudy: { High: 0.9, Low: 0.1 },
          Humidity: { High: 0.8, Low: 0.2 },
          Sprinkler: { On: 0.1, Off: 0.9 },
          WetGround: { Yes: 0.95, No: 0.05 },
        },
        {
          Cloudy: { High: 0.8, Low: 0.2 },
          Humidity: { High: 0.9, Low: 0.1 },
          Sprinkler: { On: 0.05, Off: 0.95 },
          WetGround: { Yes: 0.9, No: 0.1 },
        },
        {
          Cloudy: { High: 0.99, Low: 0.01 },
          Humidity: { High: 0.95, Low: 0.05 },
          Sprinkler: { On: 0.0, Off: 1.0 },
          WetGround: { Yes: 0.98, No: 0.02 },
        },
        {
          Cloudy: { High: 0.7, Low: 0.3 },
          Humidity: { High: 0.75, Low: 0.25 },
          Sprinkler: { On: 0.1, Off: 0.9 },
          WetGround: { Yes: 0.8, No: 0.2 },
        },

        // ########## SCENARIO 2: Dry Day with Sprinklers ☀️🌿 ##########
        {
          Cloudy: { High: 0.1, Low: 0.9 },
          Humidity: { High: 0.2, Low: 0.8 },
          Sprinkler: { On: 0.9, Off: 0.1 },
          WetGround: { Yes: 0.92, No: 0.08 },
        },
        {
          Cloudy: { High: 0.05, Low: 0.95 },
          Humidity: { High: 0.1, Low: 0.9 },
          Sprinkler: { On: 0.95, Off: 0.05 },
          WetGround: { Yes: 0.88, No: 0.12 },
        },
        {
          Cloudy: { High: 0.3, Low: 0.7 },
          Humidity: { High: 0.2, Low: 0.8 },
          Sprinkler: { On: 0.98, Off: 0.02 },
          WetGround: { Yes: 0.9, No: 0.1 },
        },
        {
          Cloudy: { High: 0.2, Low: 0.8 },
          Humidity: { High: 0.5, Low: 0.5 },
          Sprinkler: { On: 0.85, Off: 0.15 },
          WetGround: { Yes: 0.85, No: 0.15 },
        },

        {
          Cloudy: { High: 0.9, Low: 0.1 },
          Humidity: { High: 0.9, Low: 0.1 },
          Sprinkler: { On: 0.8, Off: 0.2 },
          WetGround: { Yes: 0.99, No: 0.01 },
        },
        {
          Cloudy: { High: 0.85, Low: 0.15 },
          Humidity: { High: 0.95, Low: 0.05 },
          Sprinkler: { On: 0.7, Off: 0.3 },
          WetGround: { Yes: 0.98, No: 0.02 },
        },
        {
          Cloudy: { High: 0.95, Low: 0.05 },
          Humidity: { High: 0.9, Low: 0.1 },
          Sprinkler: { On: 0.9, Off: 0.1 },
          WetGround: { Yes: 0.99, No: 0.01 },
        },

        // ########## SCENARIO 4: Ambiguous/Muggy Day 🌫️ ##########
        {
          Cloudy: { High: 0.6, Low: 0.4 },
          Humidity: { High: 0.7, Low: 0.3 },
          Sprinkler: { On: 0.1, Off: 0.9 },
          WetGround: { Yes: 0.4, No: 0.6 },
        },
        {
          Cloudy: { High: 0.3, Low: 0.7 },
          Humidity: { High: 0.8, Low: 0.2 },
          Sprinkler: { On: 0.2, Off: 0.8 },
          WetGround: { Yes: 0.25, No: 0.75 },
        },
        {
          Cloudy: { High: 0.2, Low: 0.8 },
          Humidity: { High: 0.9, Low: 0.1 },
          Sprinkler: { On: 0.05, Off: 0.95 },
          WetGround: { Yes: 0.3, No: 0.7 },
        },
        {
          Cloudy: { High: 0.5, Low: 0.5 },
          Humidity: { High: 0.5, Low: 0.5 },
          Sprinkler: { On: 0.1, Off: 0.9 },
          WetGround: { Yes: 0.5, No: 0.5 },
        },

        // ########## SCENARIO 5 & 6: Dry Days (Balanced) 🌵 ##########
        {
          Cloudy: { High: 0.01, Low: 0.99 },
          Humidity: { High: 0.1, Low: 0.9 },
          Sprinkler: { On: 0.05, Off: 0.95 },
          WetGround: { Yes: 0.02, No: 0.98 },
        },
        {
          Cloudy: { High: 0.1, Low: 0.9 },
          Humidity: { High: 0.15, Low: 0.85 },
          Sprinkler: { On: 0.1, Off: 0.9 },
          WetGround: { Yes: 0.05, No: 0.95 },
        },
        {
          Cloudy: { High: 0.2, Low: 0.8 },
          Humidity: { High: 0.3, Low: 0.7 },
          Sprinkler: { On: 0.15, Off: 0.85 },
          WetGround: { Yes: 0.1, No: 0.9 },
        },
        {
          Cloudy: { High: 0.05, Low: 0.95 },
          Humidity: { High: 0.2, Low: 0.8 },
          Sprinkler: { On: 0.05, Off: 0.95 },
          WetGround: { Yes: 0.03, No: 0.97 },
        },
        {
          Cloudy: { High: 0.12, Low: 0.88 },
          Humidity: { High: 0.25, Low: 0.75 },
          Sprinkler: { On: 0.2, Off: 0.8 },
          WetGround: { Yes: 0.15, No: 0.85 },
        },
        {
          Cloudy: { High: 0.0, Low: 1.0 },
          Humidity: { High: 0.05, Low: 0.95 },
          Sprinkler: { On: 0.01, Off: 0.99 },
          WetGround: { Yes: 0.01, No: 0.99 },
        },
        {
          Cloudy: { High: 0.15, Low: 0.85 },
          Humidity: { High: 0.1, Low: 0.9 },
          Sprinkler: { On: 0.1, Off: 0.9 },
          WetGround: { Yes: 0.04, No: 0.96 },
        },
        {
          Cloudy: { High: 0.25, Low: 0.75 },
          Humidity: { High: 0.2, Low: 0.8 },
          Sprinkler: { On: 0.2, Off: 0.8 },
          WetGround: { Yes: 0.1, No: 0.9 },
        },
        {
          Cloudy: { High: 0.3, Low: 0.7 },
          Humidity: { High: 0.4, Low: 0.6 },
          Sprinkler: { On: 0.3, Off: 0.7 },
          WetGround: { Yes: 0.2, No: 0.8 },
        },
        {
          Cloudy: { High: 0.1, Low: 0.9 },
          Humidity: { High: 0.3, Low: 0.7 },
          Sprinkler: { On: 0.1, Off: 0.9 },
          WetGround: { Yes: 0.11, No: 0.89 },
        },
        { // Outliner example
          Cloudy: { High: 0.1, Low: 0.9 },
          Humidity: { High: 0.1, Low: 0.9 },
          Sprinkler: { On: 0.1, Off: 0.9 },
          WetGround: { Yes: 0.80, No: 0.20 },
        },
      ]

      let newNetwork = sprinklerExtendedNetwork

      newNetwork = learningFromEvidence(newNetwork, learningCases)

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
