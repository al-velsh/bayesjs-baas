import { IPFP, getVariableMarginalDistribution } from '../../src/inferences/bigClique/IPFP'
import { ICliquePotentialItem, ISoftEvidence } from '../../src/types'

describe('getVariableMarginalDistribution', () => {
  it('should calculate marginal distribution for a simple binary variable', () => {
    const cliquePotential: ICliquePotentialItem[] = [
      { when: { A: 'true' }, then: 0.6 },
      { when: { A: 'false' }, then: 0.4 },
    ]

    const marginal = getVariableMarginalDistribution(cliquePotential, 'A')

    expect(marginal.true).toBeCloseTo(0.6, 10)
    expect(marginal.false).toBeCloseTo(0.4, 10)
  })

  it('should calculate marginal distribution for a variable with multiple states', () => {
    const cliquePotential: ICliquePotentialItem[] = [
      { when: { X: 'state1' }, then: 0.3 },
      { when: { X: 'state2' }, then: 0.5 },
      { when: { X: 'state3' }, then: 0.2 },
    ]

    const marginal = getVariableMarginalDistribution(cliquePotential, 'X')

    expect(marginal.state1).toBeCloseTo(0.3, 10)
    expect(marginal.state2).toBeCloseTo(0.5, 10)
    expect(marginal.state3).toBeCloseTo(0.2, 10)
  })

  it('should aggregate probabilities for the same state across multiple entries', () => {
    const cliquePotential: ICliquePotentialItem[] = [
      { when: { A: 'true', B: 'true' }, then: 0.25 },
      { when: { A: 'true', B: 'false' }, then: 0.25 },
      { when: { A: 'false', B: 'true' }, then: 0.25 },
      { when: { A: 'false', B: 'false' }, then: 0.25 },
    ]

    const marginalA = getVariableMarginalDistribution(cliquePotential, 'A')
    const marginalB = getVariableMarginalDistribution(cliquePotential, 'B')

    expect(marginalA.true).toBeCloseTo(0.5, 10)
    expect(marginalA.false).toBeCloseTo(0.5, 10)
    expect(marginalB.true).toBeCloseTo(0.5, 10)
    expect(marginalB.false).toBeCloseTo(0.5, 10)
  })

  it('should handle complex cliques with multiple variables', () => {
    const cliquePotential: ICliquePotentialItem[] = [
      { when: { A: 'true', B: 'true', C: 'true' }, then: 0.125 },
      { when: { A: 'true', B: 'true', C: 'false' }, then: 0.125 },
      { when: { A: 'true', B: 'false', C: 'true' }, then: 0.125 },
      { when: { A: 'true', B: 'false', C: 'false' }, then: 0.125 },
      { when: { A: 'false', B: 'true', C: 'true' }, then: 0.125 },
      { when: { A: 'false', B: 'true', C: 'false' }, then: 0.125 },
      { when: { A: 'false', B: 'false', C: 'true' }, then: 0.125 },
      { when: { A: 'false', B: 'false', C: 'false' }, then: 0.125 },
    ]

    const marginalA = getVariableMarginalDistribution(cliquePotential, 'A')
    const marginalB = getVariableMarginalDistribution(cliquePotential, 'B')
    const marginalC = getVariableMarginalDistribution(cliquePotential, 'C')

    expect(marginalA.true).toBeCloseTo(0.5, 10)
    expect(marginalA.false).toBeCloseTo(0.5, 10)
    expect(marginalB.true).toBeCloseTo(0.5, 10)
    expect(marginalB.false).toBeCloseTo(0.5, 10)
    expect(marginalC.true).toBeCloseTo(0.5, 10)
    expect(marginalC.false).toBeCloseTo(0.5, 10)
  })

  it('should handle non-uniform distributions', () => {
    const cliquePotential: ICliquePotentialItem[] = [
      { when: { A: 'x', B: 'y' }, then: 0.1 },
      { when: { A: 'x', B: 'z' }, then: 0.2 },
      { when: { A: 'w', B: 'y' }, then: 0.3 },
      { when: { A: 'w', B: 'z' }, then: 0.4 },
    ]

    const marginalA = getVariableMarginalDistribution(cliquePotential, 'A')
    const marginalB = getVariableMarginalDistribution(cliquePotential, 'B')

    expect(marginalA.x).toBeCloseTo(0.3, 10)
    expect(marginalA.w).toBeCloseTo(0.7, 10)
    expect(marginalB.y).toBeCloseTo(0.4, 10)
    expect(marginalB.z).toBeCloseTo(0.6, 10)
  })

  it('should return marginal that sums to 1 for normalized distributions', () => {
    const cliquePotential: ICliquePotentialItem[] = [
      { when: { A: 's1', B: 's1' }, then: 0.2 },
      { when: { A: 's1', B: 's2' }, then: 0.1 },
      { when: { A: 's2', B: 's1' }, then: 0.3 },
      { when: { A: 's2', B: 's2' }, then: 0.15 },
      { when: { A: 's3', B: 's1' }, then: 0.15 },
      { when: { A: 's3', B: 's2' }, then: 0.1 },
    ]

    const marginalA = getVariableMarginalDistribution(cliquePotential, 'A')
    const sumA = Object.values(marginalA).reduce((acc, val) => acc + val, 0)

    expect(sumA).toBeCloseTo(1, 10)
  })

  it('should handle single entry clique', () => {
    const cliquePotential: ICliquePotentialItem[] = [
      { when: { A: 'only' }, then: 1.0 },
    ]

    const marginal = getVariableMarginalDistribution(cliquePotential, 'A')

    expect(marginal.only).toBeCloseTo(1.0, 10)
  })
})

describe('IPFP', () => {
  describe('Basic functionality', () => {
    it('should apply soft evidence to a simple clique potential', () => {
      const cliquePotential: ICliquePotentialItem[] = [
        { when: { A: 'true', B: 'true' }, then: 0.25 },
        { when: { A: 'true', B: 'false' }, then: 0.25 },
        { when: { A: 'false', B: 'true' }, then: 0.25 },
        { when: { A: 'false', B: 'false' }, then: 0.25 },
      ]

      const softEvidence: ISoftEvidence = {
        A: { true: 0.7, false: 0.3 },
      }

      const result = IPFP(cliquePotential, softEvidence)

      const marginalA = getVariableMarginalDistribution(result, 'A')

      // The marginal should match the soft evidence (with small tolerance for convergence)
      expect(marginalA.true).toBeCloseTo(0.7, 3)
      expect(marginalA.false).toBeCloseTo(0.3, 3)
    })

    it('should not modify the original clique potential', () => {
      const cliquePotential: ICliquePotentialItem[] = [
        { when: { A: 'true' }, then: 0.6 },
        { when: { A: 'false' }, then: 0.4 },
      ]

      const originalCopy = JSON.parse(JSON.stringify(cliquePotential))
      const softEvidence: ISoftEvidence = {
        A: { true: 0.8, false: 0.2 },
      }

      IPFP(cliquePotential, softEvidence)

      // Original should remain unchanged
      expect(cliquePotential).toEqual(originalCopy)
    })

    it('should return normalized probabilities that sum to approximately 1', () => {
      const cliquePotential: ICliquePotentialItem[] = [
        { when: { A: 'state1' }, then: 0.3 },
        { when: { A: 'state2' }, then: 0.5 },
        { when: { A: 'state3' }, then: 0.2 },
      ]

      const softEvidence: ISoftEvidence = {
        A: { state1: 0.4, state2: 0.4, state3: 0.2 },
      }

      const result = IPFP(cliquePotential, softEvidence)
      const sum = result.reduce((acc, entry) => acc + entry.then, 0)

      expect(sum).toBeCloseTo(1, 3)
    })
  })

  describe('Multiple variables', () => {
    it('should apply soft evidence to multiple variables correctly', () => {
      const cliquePotential: ICliquePotentialItem[] = [
        { when: { A: 'true', B: 'true', C: 'true' }, then: 0.125 },
        { when: { A: 'true', B: 'true', C: 'false' }, then: 0.125 },
        { when: { A: 'true', B: 'false', C: 'true' }, then: 0.125 },
        { when: { A: 'true', B: 'false', C: 'false' }, then: 0.125 },
        { when: { A: 'false', B: 'true', C: 'true' }, then: 0.125 },
        { when: { A: 'false', B: 'true', C: 'false' }, then: 0.125 },
        { when: { A: 'false', B: 'false', C: 'true' }, then: 0.125 },
        { when: { A: 'false', B: 'false', C: 'false' }, then: 0.125 },
      ]

      const softEvidence: ISoftEvidence = {
        A: { true: 0.6, false: 0.4 },
        B: { true: 0.7, false: 0.3 },
      }

      const result = IPFP(cliquePotential, softEvidence)

      const marginalA = getVariableMarginalDistribution(result, 'A')
      const marginalB = getVariableMarginalDistribution(result, 'B')

      expect(marginalA.true).toBeCloseTo(0.6, 3)
      expect(marginalA.false).toBeCloseTo(0.4, 3)
      expect(marginalB.true).toBeCloseTo(0.7, 3)
      expect(marginalB.false).toBeCloseTo(0.3, 3)
    })
  })

  describe('Convergence and epsilon', () => {
    it('should converge with default epsilon', () => {
      const cliquePotential: ICliquePotentialItem[] = [
        { when: { X: 'a' }, then: 0.5 },
        { when: { X: 'b' }, then: 0.5 },
      ]

      const softEvidence: ISoftEvidence = {
        X: { a: 0.9, b: 0.1 },
      }

      const result = IPFP(cliquePotential, softEvidence)

      const marginal = getVariableMarginalDistribution(result, 'X')

      expect(marginal.a).toBeCloseTo(0.9, 4)
      expect(marginal.b).toBeCloseTo(0.1, 4)
    })

    it('should converge with custom epsilon', () => {
      const cliquePotential: ICliquePotentialItem[] = [
        { when: { X: 'a' }, then: 0.5 },
        { when: { X: 'b' }, then: 0.5 },
      ]

      const softEvidence: ISoftEvidence = {
        X: { a: 0.75, b: 0.25 },
      }

      const result = IPFP(cliquePotential, softEvidence, 0.01)

      const marginal = getVariableMarginalDistribution(result, 'X')

      expect(marginal.a).toBeCloseTo(0.75, 2)
      expect(marginal.b).toBeCloseTo(0.25, 2)
    })

    it('should handle very strict epsilon', () => {
      const cliquePotential: ICliquePotentialItem[] = [
        { when: { X: 'a' }, then: 0.5 },
        { when: { X: 'b' }, then: 0.5 },
      ]

      const softEvidence: ISoftEvidence = {
        X: { a: 0.6, b: 0.4 },
      }

      const result = IPFP(cliquePotential, softEvidence, 0.000001)

      expect(result).toBeDefined()
      expect(result.length).toBe(2)
    })
  })

  describe('Edge cases', () => {
    it('should handle clique potential with single entry', () => {
      const cliquePotential: ICliquePotentialItem[] = [
        { when: { A: 'only' }, then: 1.0 },
      ]

      const softEvidence: ISoftEvidence = {
        A: { only: 1.0 },
      }

      const result = IPFP(cliquePotential, softEvidence)

      expect(result[0].then).toBeCloseTo(1.0, 4)
    })

    it('should handle extreme probability distributions', () => {
      const cliquePotential: ICliquePotentialItem[] = [
        { when: { A: 'true' }, then: 0.99 },
        { when: { A: 'false' }, then: 0.01 },
      ]

      const softEvidence: ISoftEvidence = {
        A: { true: 0.01, false: 0.99 },
      }

      const result = IPFP(cliquePotential, softEvidence)

      const marginal = getVariableMarginalDistribution(result, 'A')

      expect(marginal.true).toBeCloseTo(0.01, 3)
      expect(marginal.false).toBeCloseTo(0.99, 3)
    })

    it('should handle complex clique with multiple states', () => {
      const cliquePotential: ICliquePotentialItem[] = [
        { when: { A: 's1', B: 's1' }, then: 0.1 },
        { when: { A: 's1', B: 's2' }, then: 0.15 },
        { when: { A: 's1', B: 's3' }, then: 0.05 },
        { when: { A: 's2', B: 's1' }, then: 0.2 },
        { when: { A: 's2', B: 's2' }, then: 0.25 },
        { when: { A: 's2', B: 's3' }, then: 0.05 },
        { when: { A: 's3', B: 's1' }, then: 0.05 },
        { when: { A: 's3', B: 's2' }, then: 0.1 },
        { when: { A: 's3', B: 's3' }, then: 0.05 },
      ]

      const softEvidence: ISoftEvidence = {
        A: { s1: 0.5, s2: 0.3, s3: 0.2 },
      }

      const result = IPFP(cliquePotential, softEvidence)

      const marginalA = getVariableMarginalDistribution(result, 'A')

      expect(marginalA.s1).toBeCloseTo(0.5, 3)
      expect(marginalA.s2).toBeCloseTo(0.3, 3)
      expect(marginalA.s3).toBeCloseTo(0.2, 3)
    })

    it('should preserve sum of probabilities equals 1 after transformation', () => {
      const cliquePotential: ICliquePotentialItem[] = [
        { when: { A: 'x', B: 'y' }, then: 0.2 },
        { when: { A: 'x', B: 'z' }, then: 0.3 },
        { when: { A: 'w', B: 'y' }, then: 0.3 },
        { when: { A: 'w', B: 'z' }, then: 0.2 },
      ]

      const softEvidence: ISoftEvidence = {
        A: { x: 0.6, w: 0.4 },
        B: { y: 0.3, z: 0.7 },
      }

      const result = IPFP(cliquePotential, softEvidence)
      const sum = result.reduce((acc, entry) => acc + entry.then, 0)

      expect(sum).toBeCloseTo(1, 3)
    })
  })

  describe('Marginal distribution preservation', () => {
    it('should maintain marginal distributions for evidence variables', () => {
      const cliquePotential: ICliquePotentialItem[] = [
        { when: { A: 'true', B: 'true' }, then: 0.3 },
        { when: { A: 'true', B: 'false' }, then: 0.2 },
        { when: { A: 'false', B: 'true' }, then: 0.4 },
        { when: { A: 'false', B: 'false' }, then: 0.1 },
      ]

      const softEvidence: ISoftEvidence = {
        A: { true: 0.8, false: 0.2 },
      }

      const result = IPFP(cliquePotential, softEvidence)

      // Verify marginal for A matches soft evidence
      const marginalA = getVariableMarginalDistribution(result, 'A')

      expect(marginalA.true).toBeCloseTo(0.8, 3)
      expect(marginalA.false).toBeCloseTo(0.2, 3)

      // Verify B's marginal is still valid (sums to 1)
      const marginalB = getVariableMarginalDistribution(result, 'B')

      expect(marginalB.true + marginalB.false).toBeCloseTo(1, 3)
    })
  })
})
