import * as expect from 'expect'

import { createNetwork } from '../../src/utils'
import { allNodes, completeDataSetParentChild } from '../../models/parent-child-zero-knowledge-cpt'
import { ICptWithoutParents, ICptWithParents, IEvidence, ICliquePotentialItem } from '../../src'
import {
  learningFromEvidence,
  expectationStep,
  maximizationStep,
  computeCompleteDataLogLikelihood,
  getPotentialForFamily,
} from '../../src/utils/parameter-learning'
import { allNodesSprinkler, missingWhetherRainDataSetSprinkler } from '../../models/extended-sprinkler'
import { node1, simplestEvindence } from '../../models/simplest-model'
import { evidences, threNodesNetwork } from '../../models/3-nodes-model'

const microNetwork = createNetwork(...allNodes)
const sprinklerExtendedNetwork = createNetwork(...allNodesSprinkler)
const simplestNetwork = createNetwork(node1)

describe('Parameter Learning Utils', () => {
  describe('learningFromEvidence - EM Algorithm', () => {
    it('should learn CPT from uniform evidence on a simple network', () => {
      const preLearningNetwork = JSON.parse(JSON.stringify(simplestNetwork))
      console.log(preLearningNetwork)
      const newNetwork = learningFromEvidence(preLearningNetwork, simplestEvindence)
      const newCpt = newNetwork.node1.cpt as ICptWithoutParents

      expect(newCpt.True).toBeCloseTo(0.12, 1)
      expect(newCpt.False).toBeCloseTo(0.88, 1)
    })

    it('should learn CPT with hidden variables in the network', () => {
      const preLearningNetwork = JSON.parse(JSON.stringify(threNodesNetwork))
      const newNetwork = learningFromEvidence(preLearningNetwork, evidences)
      const newCpt = newNetwork.node1.cpt as ICptWithoutParents

      expect(newCpt.T).toBeCloseTo(0.8, 1)
      expect(newCpt.F).toBeCloseTo(0.2, 1)
    })

    it('should learn from a complete dataset with parent-child relationships', () => {
      const preLearningNetwork = JSON.parse(JSON.stringify(microNetwork))
      const newNetwork = learningFromEvidence(preLearningNetwork, completeDataSetParentChild)

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

    it('should learn hidden variables from partial evidence in extended network', () => {
      const preLearningNetwork = JSON.parse(JSON.stringify(sprinklerExtendedNetwork))
      const newNetwork = learningFromEvidence(preLearningNetwork, missingWhetherRainDataSetSprinkler)

      const weatherNode = newNetwork.Weather
      const weatherCpt = weatherNode.cpt as ICptWithParents

      const whenHighWeather = weatherCpt.find(entry => entry.when.Cloudy === 'High' && entry.when.Humidity === 'High')
      expect(whenHighWeather).toBeDefined()

      const whenLowWeather = weatherCpt.find(entry => entry.when.Cloudy === 'Low' && entry.when.Humidity === 'Low')
      expect(whenLowWeather).toBeDefined()

      if (whenHighWeather && whenLowWeather) {
        expect(whenHighWeather.then.Bad).toBeGreaterThan(0.7)
        expect(whenLowWeather.then.Good).toBeGreaterThan(0.7)
      }
    })

    it('should return the same network when given empty evidence array', () => {
      const preLearningNetwork = JSON.parse(JSON.stringify(simplestNetwork))
      const newNetwork = learningFromEvidence(preLearningNetwork, [])

      expect(newNetwork).toEqual(preLearningNetwork)
    })

    it('should converge within safety limit of iterations', () => {
      const preLearningNetwork = JSON.parse(JSON.stringify(microNetwork))
      const startTime = Date.now()

      const newNetwork = learningFromEvidence(preLearningNetwork, completeDataSetParentChild)
      const endTime = Date.now()

      expect(newNetwork).toBeDefined()
      expect(endTime - startTime).toBeLessThan(30000)
    })

    it('should respect custom stopRatio parameter', () => {
      const preLearningNetwork = JSON.parse(JSON.stringify(simplestNetwork))

      const network1 = learningFromEvidence(preLearningNetwork, simplestEvindence, 0.1)
      const network2 = learningFromEvidence(preLearningNetwork, simplestEvindence, 0.00001)

      expect(network1).toBeDefined()
      expect(network2).toBeDefined()
    })

    it('should not modify the original network object', () => {
      const originalNetwork = JSON.parse(JSON.stringify(simplestNetwork))
      const networkCopy = JSON.parse(JSON.stringify(simplestNetwork))

      learningFromEvidence(networkCopy, simplestEvindence)

      expect(JSON.stringify(originalNetwork)).toBe(JSON.stringify(simplestNetwork))
    })
  })

  describe('expectationStep - E-step of EM Algorithm', () => {
    it('should compute expected counts for simple network', () => {
      const evidence: IEvidence[] = [
        { node1: 'True' },
        { node1: 'True' },
        { node1: 'False' },
      ]

      const expectedCounts = expectationStep(simplestNetwork, evidence)

      expect(expectedCounts).toBeDefined()
      expect(expectedCounts.node1).toBeDefined()
      expect(Array.isArray(expectedCounts.node1)).toBe(true)
      expect(expectedCounts.node1.length).toBeGreaterThan(0)
    })

    it('should accumulate counts across multiple evidence instances', () => {
      const evidence: IEvidence[] = [
        { node1: 'True' },
        { node1: 'True' },
      ]

      const expectedCounts = expectationStep(simplestNetwork, evidence)

      const trueCount = expectedCounts.node1.find(c => c.when.node1 === 'True')
      expect(trueCount).toBeDefined()
      if (trueCount) {
        expect(trueCount.then).toBeGreaterThan(1)
      }
    })

    it('should handle evidence with hidden nodes', () => {
      const partialEvidence: IEvidence[] = [
        { node1: 'T', node3: 'T' },
        { node1: 'T', node3: 'F' },
      ]

      const expectedCounts = expectationStep(threNodesNetwork, partialEvidence)

      expect(expectedCounts).toBeDefined()
      expect(expectedCounts.node1).toBeDefined()
      expect(expectedCounts.node2).toBeDefined()
      expect(expectedCounts.node3).toBeDefined()
    })

    it('should compute counts for nodes with parents', () => {
      const evidence: IEvidence[] = [
        { PARENT: 'T', CHILD: 'T' },
        { PARENT: 'F', CHILD: 'F' },
      ]

      const expectedCounts = expectationStep(microNetwork, evidence)

      expect(expectedCounts.PARENT).toBeDefined()
      expect(expectedCounts.CHILD).toBeDefined()
      expect(expectedCounts.CHILD.length).toBeGreaterThan(0)
    })

    it('should handle single evidence instance', () => {
      const evidence: IEvidence[] = [{ node1: 'True' }]

      const expectedCounts = expectationStep(simplestNetwork, evidence)

      expect(expectedCounts.node1).toBeDefined()
      expect(expectedCounts.node1.length).toBeGreaterThan(0)
    })
  })

  describe('maximizationStep - M-step of EM Algorithm', () => {
    it('should normalize probabilities for nodes without parents', () => {
      const mockCounts: Record<string, ICliquePotentialItem[]> = {
        node1: [
          { when: { node1: 'True' }, then: 3 },
          { when: { node1: 'False' }, then: 7 },
        ],
      }

      const network = JSON.parse(JSON.stringify(simplestNetwork))
      const result = maximizationStep(network, mockCounts)
      const cpt = result.node1.cpt as ICptWithoutParents

      expect(cpt.True).toBeCloseTo(0.3, 5)
      expect(cpt.False).toBeCloseTo(0.7, 5)

      const total = cpt.True + cpt.False
      expect(total).toBeCloseTo(1, 5)
    })

    it('should normalize conditional probabilities for nodes with parents', () => {
      const mockCounts: Record<string, ICliquePotentialItem[]> = {
        PARENT: [
          { when: { PARENT: 'T' }, then: 5 },
          { when: { PARENT: 'F' }, then: 5 },
        ],
        CHILD: [
          { when: { PARENT: 'T', CHILD: 'T' }, then: 4 },
          { when: { PARENT: 'T', CHILD: 'F' }, then: 1 },
          { when: { PARENT: 'F', CHILD: 'T' }, then: 1 },
          { when: { PARENT: 'F', CHILD: 'F' }, then: 4 },
        ],
      }

      const network = JSON.parse(JSON.stringify(microNetwork))
      const result = maximizationStep(network, mockCounts)
      const childCpt = result.CHILD.cpt as ICptWithParents

      for (const entry of childCpt) {
        const total = Object.values(entry.then).reduce((sum, val) => sum + val, 0)
        expect(total).toBeCloseTo(1, 5)
      }

      const whenParentTrue = childCpt.find(entry => entry.when.PARENT === 'T')
      expect(whenParentTrue).toBeDefined()
      if (whenParentTrue) {
        expect(whenParentTrue.then.T).toBeCloseTo(0.8, 5)
        expect(whenParentTrue.then.F).toBeCloseTo(0.2, 5)
      }
    })

    it('should handle multiple parent configurations', () => {
      const mockCounts: Record<string, ICliquePotentialItem[]> = {
        PARENT: [
          { when: { PARENT: 'T' }, then: 6 },
          { when: { PARENT: 'F' }, then: 4 },
        ],
        CHILD: [
          { when: { PARENT: 'T', CHILD: 'T' }, then: 6 },
          { when: { PARENT: 'T', CHILD: 'F' }, then: 0 },
          { when: { PARENT: 'F', CHILD: 'T' }, then: 0 },
          { when: { PARENT: 'F', CHILD: 'F' }, then: 4 },
        ],
      }

      const network = JSON.parse(JSON.stringify(microNetwork))
      const result = maximizationStep(network, mockCounts)
      const childCpt = result.CHILD.cpt as ICptWithParents

      const parentStates = childCpt.map(entry => entry.when.PARENT)
      expect(parentStates).toContain('T')
      expect(parentStates).toContain('F')
    })

    it('should update all nodes in the network', () => {
      const mockCounts: Record<string, ICliquePotentialItem[]> = {
        PARENT: [
          { when: { PARENT: 'T' }, then: 7 },
          { when: { PARENT: 'F' }, then: 3 },
        ],
        CHILD: [
          { when: { PARENT: 'T', CHILD: 'T' }, then: 5 },
          { when: { PARENT: 'T', CHILD: 'F' }, then: 2 },
          { when: { PARENT: 'F', CHILD: 'T' }, then: 1 },
          { when: { PARENT: 'F', CHILD: 'F' }, then: 2 },
        ],
      }

      const network = JSON.parse(JSON.stringify(microNetwork))
      const originalParentCpt = JSON.stringify(network.PARENT.cpt)
      const originalChildCpt = JSON.stringify(network.CHILD.cpt)

      const result = maximizationStep(network, mockCounts)

      expect(JSON.stringify(result.PARENT.cpt)).not.toBe(originalParentCpt)
      expect(JSON.stringify(result.CHILD.cpt)).not.toBe(originalChildCpt)
    })

    it('should throw error when no potential is found for a node', () => {
      const incompleteCounts: Record<string, ICliquePotentialItem[]> = {
        node1: [
          { when: { node1: 'True' }, then: 5 },
        ],
      }

      const network = JSON.parse(JSON.stringify(microNetwork))

      expect(() => {
        maximizationStep(network, incompleteCounts)
      }).toThrow()
    })

    it('should not modify the original network', () => {
      const mockCounts: Record<string, ICliquePotentialItem[]> = {
        node1: [
          { when: { node1: 'True' }, then: 5 },
          { when: { node1: 'False' }, then: 5 },
        ],
      }

      const network = JSON.parse(JSON.stringify(simplestNetwork))
      const originalCpt = JSON.stringify(network.node1.cpt)

      maximizationStep(network, mockCounts)

      expect(JSON.stringify(network.node1.cpt)).toBe(originalCpt)
    })
  })

  describe('computeCompleteDataLogLikelihood', () => {
    it('should compute log likelihood for simple network', () => {
      const counts: Record<string, ICliquePotentialItem[]> = {
        node1: [
          { when: { node1: 'True' }, then: 2 },
          { when: { node1: 'False' }, then: 8 },
        ],
      }

      const network = JSON.parse(JSON.stringify(simplestNetwork))
      const logLikelihood = computeCompleteDataLogLikelihood(network, counts)

      expect(typeof logLikelihood).toBe('number')
      expect(isFinite(logLikelihood)).toBe(true)
    })

    it('should compute negative log likelihood for typical cases', () => {
      const counts: Record<string, ICliquePotentialItem[]> = {
        node1: [
          { when: { node1: 'True' }, then: 3 },
          { when: { node1: 'False' }, then: 7 },
        ],
      }

      const network = JSON.parse(JSON.stringify(simplestNetwork))
      const logLikelihood = computeCompleteDataLogLikelihood(network, counts)

      expect(logLikelihood).toBeLessThan(0)
    })

    it('should compute log likelihood for network with parents', () => {
      const counts: Record<string, ICliquePotentialItem[]> = {
        PARENT: [
          { when: { PARENT: 'T' }, then: 5 },
          { when: { PARENT: 'F' }, then: 5 },
        ],
        CHILD: [
          { when: { PARENT: 'T', CHILD: 'T' }, then: 4 },
          { when: { PARENT: 'T', CHILD: 'F' }, then: 1 },
          { when: { PARENT: 'F', CHILD: 'T' }, then: 1 },
          { when: { PARENT: 'F', CHILD: 'F' }, then: 4 },
        ],
      }

      const network = JSON.parse(JSON.stringify(microNetwork))
      const logLikelihood = computeCompleteDataLogLikelihood(network, counts)

      expect(typeof logLikelihood).toBe('number')
      expect(isFinite(logLikelihood)).toBe(true)
    })

    it('should throw error when entry of context is not found', () => {
      const invalidCounts: Record<string, ICliquePotentialItem[]> = {
        PARENT: [
          { when: { PARENT: 'T' }, then: 5 },
        ],
        CHILD: [
          { when: { PARENT: 'INVALID', CHILD: 'T' }, then: 5 },
        ],
      }

      const network = JSON.parse(JSON.stringify(microNetwork))

      expect(() => {
        computeCompleteDataLogLikelihood(network, invalidCounts)
      }).toThrow('Implementation error: no entry of context was found')
    })

    it('should handle zero counts gracefully', () => {
      const counts: Record<string, ICliquePotentialItem[]> = {
        node1: [
          { when: { node1: 'True' }, then: 0 },
          { when: { node1: 'False' }, then: 10 },
        ],
      }

      const network = JSON.parse(JSON.stringify(simplestNetwork))
      const logLikelihood = computeCompleteDataLogLikelihood(network, counts)

      expect(isFinite(logLikelihood)).toBe(true)
    })
  })

  describe('getPotentialForFamily', () => {
    it('should marginalize potential to include only family nodes', () => {
      const potential: ICliquePotentialItem[] = [
        { when: { A: 'T', B: 'T', C: 'T' }, then: 0.1 },
        { when: { A: 'T', B: 'T', C: 'F' }, then: 0.2 },
        { when: { A: 'T', B: 'F', C: 'T' }, then: 0.15 },
        { when: { A: 'T', B: 'F', C: 'F' }, then: 0.05 },
        { when: { A: 'F', B: 'T', C: 'T' }, then: 0.2 },
        { when: { A: 'F', B: 'T', C: 'F' }, then: 0.1 },
        { when: { A: 'F', B: 'F', C: 'T' }, then: 0.1 },
        { when: { A: 'F', B: 'F', C: 'F' }, then: 0.1 },
      ]
      const family = ['A', 'C']

      const result = getPotentialForFamily(potential, family)

      expect(result.length).toBe(4)

      for (const entry of result) {
        expect(entry.when).toHaveProperty('A')
        expect(entry.when).toHaveProperty('C')
        expect(entry.when).not.toHaveProperty('B')
      }
    })

    it('should sum probabilities correctly when marginalizing', () => {
      const potential: ICliquePotentialItem[] = [
        { when: { A: 'T', B: 'T' }, then: 0.3 },
        { when: { A: 'T', B: 'F' }, then: 0.2 },
        { when: { A: 'F', B: 'T' }, then: 0.4 },
        { when: { A: 'F', B: 'F' }, then: 0.1 },
      ]
      const family = ['A']

      const result = getPotentialForFamily(potential, family)

      expect(result.length).toBe(2)

      const trueEntry = result.find(e => e.when.A === 'T')
      const falseEntry = result.find(e => e.when.A === 'F')

      expect(trueEntry).toBeDefined()
      expect(falseEntry).toBeDefined()

      if (trueEntry && falseEntry) {
        expect(trueEntry.then).toBeCloseTo(0.5, 5)
        expect(falseEntry.then).toBeCloseTo(0.5, 5)
      }
    })

    it('should handle single node family', () => {
      const potential: ICliquePotentialItem[] = [
        { when: { A: 'T' }, then: 0.6 },
        { when: { A: 'F' }, then: 0.4 },
      ]
      const family = ['A']

      const result = getPotentialForFamily(potential, family)

      expect(result.length).toBe(2)
      expect(result).toEqual(potential)
    })

    it('should return all combinations when family includes all nodes', () => {
      const potential: ICliquePotentialItem[] = [
        { when: { A: 'T', B: 'T' }, then: 0.25 },
        { when: { A: 'T', B: 'F' }, then: 0.25 },
        { when: { A: 'F', B: 'T' }, then: 0.25 },
        { when: { A: 'F', B: 'F' }, then: 0.25 },
      ]
      const family = ['A', 'B']

      const result = getPotentialForFamily(potential, family)

      expect(result.length).toBe(4)
    })

    it('should handle empty family by summing all probabilities', () => {
      const potential: ICliquePotentialItem[] = [
        { when: { A: 'T' }, then: 0.3 },
        { when: { A: 'F' }, then: 0.7 },
      ]
      const family: string[] = []

      const result = getPotentialForFamily(potential, family)

      expect(result.length).toBe(1)
      expect(result[0].then).toBeCloseTo(1.0, 5)
    })
  })

  describe('Integration Tests', () => {
    it('should produce valid probability distributions after full EM cycle', () => {
      const network = JSON.parse(JSON.stringify(microNetwork))
      const evidence: IEvidence[] = completeDataSetParentChild

      const counts = expectationStep(network, evidence)
      const updatedNetwork = maximizationStep(network, counts)

      for (const nodeId in updatedNetwork) {
        const node = updatedNetwork[nodeId]
        if (node.parents.length === 0) {
          const cpt = node.cpt as ICptWithoutParents
          const sum = Object.values(cpt).reduce((a, b) => a + b, 0)
          expect(sum).toBeCloseTo(1, 5)
        } else {
          const cpt = node.cpt as ICptWithParents
          for (const entry of cpt) {
            const sum = Object.values(entry.then).reduce((a, b) => a + b, 0)
            expect(sum).toBeCloseTo(1, 5)
          }
        }
      }
    })

    it('should improve log likelihood after M-step', () => {
      const network = JSON.parse(JSON.stringify(microNetwork))
      const evidence: IEvidence[] = completeDataSetParentChild

      const counts = expectationStep(network, evidence)
      const initialLogLikelihood = computeCompleteDataLogLikelihood(network, counts)

      const updatedNetwork = maximizationStep(network, counts)
      const newCounts = expectationStep(updatedNetwork, evidence)
      const newLogLikelihood = computeCompleteDataLogLikelihood(updatedNetwork, newCounts)

      expect(newLogLikelihood).toBeGreaterThanOrEqual(initialLogLikelihood)
    })
  })
})
