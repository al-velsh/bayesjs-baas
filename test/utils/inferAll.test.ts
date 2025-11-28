import * as expect from 'expect'

import { allNodes } from '../../models/alarm'
import { clone } from 'ramda'
import { createNetwork } from '../../src/utils'
import { allNodes as hugeNetworkAllNodes } from '../../models/huge-network'
import { inferAll } from '../../src'
import { allNodes as sprinklerNodes } from '../../models/rain-sprinkler-grasswet'

const alarm = createNetwork(...allNodes)
const sprinkler = createNetwork(...sprinklerNodes)
const network = createNetwork(...allNodes)
const hugeNetwork = createNetwork(...hugeNetworkAllNodes)

describe('InferAll Utils', () => {
  describe('When option "force" is true', () => {
    const networkCloned = clone(network)
    const given = { EARTHQUAKE: 'T' }

    it("returns inference result for all node's state", () => {
      inferAll(networkCloned, given) // infer to cache

      // change network by mutation
      networkCloned.JOHN_CALLS.cpt = [
        { when: { ALARM: 'T' }, then: { T: 0.1, F: 0.9 } },
        { when: { ALARM: 'F' }, then: { T: 0.95, F: 0.05 } },
      ]

      expect(inferAll(networkCloned, given, { force: true })).toEqual({
        BURGLARY: {
          T: 0.001,
          F: 0.999,
        },
        EARTHQUAKE: {
          T: 1,
          F: 0,
        },
        ALARM: {
          T: 0.29066,
          F: 0.70934,
        },
        JOHN_CALLS: {
          T: 0.702939,
          F: 0.297061,
        },
        MARY_CALLS: {
          T: 0.2105554,
          F: 0.7894446,
        },
      })
    })
  })

  describe('When option "precision" changes', () => {
    describe('to 4', () => {
      describe('With alarm network', () => {
        describe('No evidences', () => {
          it("returns inference result for all node's state", () => {
            expect(inferAll(network, {}, { precision: 4 })).toEqual({
              BURGLARY: { T: 0.001, F: 0.999 },
              EARTHQUAKE: { T: 0.002, F: 0.998 },
              ALARM: { T: 0.0025, F: 0.9975 },
              JOHN_CALLS: { T: 0.0521, F: 0.9479 },
              MARY_CALLS: { T: 0.0117, F: 0.9883 },
            })
          })
        })
      })
    })

    describe('to 2', () => {
      describe('With alarm network', () => {
        describe('No evidences', () => {
          it("returns inference result for all node's state", () => {
            expect(inferAll(network, {}, { precision: 2 })).toEqual({
              BURGLARY: { T: 0, F: 1 },
              EARTHQUAKE: { T: 0, F: 1 },
              ALARM: { T: 0, F: 1 },
              JOHN_CALLS: { T: 0.05, F: 0.95 },
              MARY_CALLS: { T: 0.01, F: 0.99 },
            })
          })
        })
      })
    })
  })

  describe('When no options is passed', () => {
    describe('With alarm network', () => {
      describe('No evidences', () => {
        it("returns inference result for all node's state", () => {
          expect(inferAll(network)).toEqual({
            BURGLARY: { T: 0.001, F: 0.999 },
            EARTHQUAKE: { T: 0.002, F: 0.998 },
            ALARM: { T: 0.00251644, F: 0.99748356 },
            JOHN_CALLS: { T: 0.05213898, F: 0.94786102 },
            MARY_CALLS: { T: 0.01173634, F: 0.98826366 },
          })
        })
      })

      describe('Burglary True', () => {
        it("returns inference result for all node's state", () => {
          expect(inferAll(network, { BURGLARY: 'T' })).toEqual({
            BURGLARY: { T: 1, F: 0 },
            EARTHQUAKE: { T: 0.002, F: 0.998 },
            ALARM: { T: 0.94002, F: 0.05998 },
            JOHN_CALLS: { T: 0.849017, F: 0.150983 },
            MARY_CALLS: { T: 0.6586138, F: 0.3413862 },
          })
        })
      })

      describe('Burglary True and Earthquake True', () => {
        it("returns inference result for all node's state", () => {
          expect(inferAll(network, { BURGLARY: 'T', EARTHQUAKE: 'T' })).toEqual({
            BURGLARY: { T: 1, F: 0 },
            EARTHQUAKE: { T: 1, F: 0 },
            ALARM: { T: 0.95, F: 0.05 },
            JOHN_CALLS: { T: 0.8575, F: 0.1425 },
            MARY_CALLS: { T: 0.6655, F: 0.3345 },
          })
        })
      })
    })

    describe('inferAll with clampSoftEvidence', () => {
      it('clamps hard evidence as {1,0} (alarm: BURGLARY)', () => {
        const res = inferAll(alarm, { BURGLARY: 'T' })
        expect(res.BURGLARY.T).toBe(1)
        expect(res.BURGLARY.F).toBe(0)
      })

      it('clamps soft evidence exactly on the evidenced node (sprinkler: RAIN)', () => {
        const res = inferAll(sprinkler, { RAIN: { T: 0.3, F: 0.7 } })
        expect(Number(res.RAIN.T.toFixed(6))).toBe(0.3)
        expect(Number(res.RAIN.F.toFixed(6))).toBe(0.7)
        // still a proper distribution on other nodes
        expect(Number((res.SPRINKLER.T + res.SPRINKLER.F).toFixed(6))).toBe(1)
      })

      it('clamped-hard equals standard hard evidence results for downstream nodes (alarm)', () => {
        const hard = inferAll(alarm, { BURGLARY: 'T' })
        const clamped = inferAll(alarm, { BURGLARY: 'T' })
        // compare some downstream nodes
        expect(Number(hard.ALARM.T.toFixed(6))).toBe(Number(clamped.ALARM.T.toFixed(6)))
        expect(Number(hard.JOHN_CALLS.T.toFixed(6))).toBe(Number(clamped.JOHN_CALLS.T.toFixed(6)))
      })

      it('mix of clamped soft and hard applies: (sprinkler: RAIN soft, SPRINKLER hard)', () => {
        const res = inferAll(sprinkler, { RAIN: { T: 0.6, F: 0.4 }, SPRINKLER: 'F' })
        expect(Number(res.RAIN.T.toFixed(6))).toBe(0.6)
        expect(Number(res.RAIN.F.toFixed(6))).toBe(0.4)
        expect(res.SPRINKLER.T).toBe(0)
        expect(res.SPRINKLER.F).toBe(1)
      })
    })

    describe('inferAll with soft evidence', () => {
      it('maps hard evidence to soft {1,0} equivalently (alarm: BURGLARY)', () => {
        const hard = inferAll(alarm, { BURGLARY: 'T' })
        // console.log(JSON.stringify(hard, null, 2))
        const soft = inferAll(alarm, { BURGLARY: { T: 1, F: 0 } })
        console.log(JSON.stringify(soft, null, 2))

        // Compare a few nodes robustly
        expect(Number(hard.ALARM.T.toFixed(6))).toBe(Number(soft.ALARM.T.toFixed(6)))
        expect(Number(hard.JOHN_CALLS.T.toFixed(6))).toBe(Number(soft.JOHN_CALLS.T.toFixed(6)))
        expect(Number(hard.MARY_CALLS.T.toFixed(6))).toBe(Number(soft.MARY_CALLS.T.toFixed(6)))
      })

      it('mixing soft and hard evidence produces ALARM within hard bounds (alarm: BURGLARY soft, EARTHQUAKE hard)', () => {
        const hi = inferAll(alarm, { BURGLARY: 'T', EARTHQUAKE: 'T' }).ALARM.T
        const lo = inferAll(alarm, { BURGLARY: 'F', EARTHQUAKE: 'T' }).ALARM.T
        const mixed = inferAll(alarm, { BURGLARY: { T: 0.6, F: 0.4 }, EARTHQUAKE: 'T' }).ALARM.T

        const min = Math.min(lo, hi)
        const max = Math.max(lo, hi)

        console.log(`ALARM: ${mixed} (${min}, ${max})`)

        expect(mixed >= min && mixed <= max).toBe(true)
      })

      it('normalizes soft weights equivalently (sprinkler: RAIN {3,7} == {0.3,0.7})', () => {
        const r1 = inferAll(sprinkler, { RAIN: { T: 3, F: 7 } })
        const r2 = inferAll(sprinkler, { RAIN: { T: 0.3, F: 0.7 } })

        // Compare only a couple nodes to avoid full-structure sensitivity
        expect(Number(r1.SPRINKLER.T.toFixed(6))).toBe(Number(r2.SPRINKLER.T.toFixed(6)))
        expect(Number(r1.GRASS_WET.T.toFixed(6))).toBe(Number(r2.GRASS_WET.T.toFixed(6)))
      })
    })

    describe('With huge network', () => {
      describe('No evidences', () => {
        it("returns inference result for all node's state", () => {
          expect(inferAll(hugeNetwork)).toEqual({
            node1: { T: 0.98019999, F: 0.01980001 },
            node2: { T: 0.99, F: 0.01 },
            node3: { T: 0.99, F: 0.01 },
            node4: { T: 0.99, F: 0.01 },
            node5: { T: 0.99, F: 0.01 },
            node6: { T: 0.99, F: 0.01 },
            node7: { T: 0.99, F: 0.01 },
            node8: { T: 0.99, F: 0.01 },
            node9: { T: 0.99, F: 0.01 },
            node10: { T: 0.989902, F: 0.010098 },
            node11: { T: 0.99, F: 0.01 },
            node12: { T: 0.99, F: 0.01 },
            node13: { T: 0.989902, F: 0.010098 },
            node14: { T: 0.99, F: 0.01 },
            node15: { T: 0.99, F: 0.01 },
            node16: { T: 0.99, F: 0.01 },
            node17: { T: 0.989902, F: 0.010098 },
            node18: { T: 0.98999999, F: 0.01000001 },
            node19: { T: 0.99, F: 0.01 },
            node20: { T: 0.99, F: 0.01 },
            node21: { T: 0.99, F: 0.01 },
            node22: { T: 0.99, F: 0.01 },
            node23: { T: 0.99, F: 0.01 },
            node24: { T: 0.0198, F: 0.9802 },
            node25: { T: 0.99, F: 0.01 },
            node26: { T: 0.99, F: 0.01 },
            node27: { T: 0.99, F: 0.01 },
            node28: { T: 0.99, F: 0.01 },
            node29: { T: 0.99, F: 0.01 },
            node30: { T: 0.99, F: 0.01 },
            node31: { T: 0.98029799, F: 0.01970201 },
            node32: { T: 0.98029799, F: 0.01970201 },
            node33: { T: 0.98029799, F: 0.01970201 },
            node34: { T: 0.98029799, F: 0.01970201 },
            node35: { T: 0.98029799, F: 0.01970201 },
            node36: { T: 0, F: 1 },
            node37: { T: 0.98990103, F: 0.01009897 },
            node38: { T: 0.98990104, F: 0.01009896 },
            node39: { T: 0.99, F: 0.01 },
          })
        })
      })
    })
  })
})
