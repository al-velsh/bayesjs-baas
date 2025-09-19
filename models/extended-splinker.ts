import { INode } from '../src/types'

// ##################################
// ##### ROOT NODES (CAUSES) ########
// ##################################

/**
 * @description ☁️ Cloudy node with a flat prior. No conditional logic to apply.
 */
export const cloudy: INode = {
  id: 'Cloudy',
  states: ['High', 'Low'],
  parents: [],
  cpt: { High: 0.5, Low: 0.5 },
}

/**
 * @description 💧 Humidity node with a flat prior.
 */
export const humidity: INode = {
  id: 'Humidity',
  states: ['High', 'Low'],
  parents: [],
  cpt: { High: 0.5, Low: 0.5 },
}

/**
 * @description 🌿 Sprinkler node with a flat prior.
 */
export const sprinkler: INode = {
  id: 'Sprinkler',
  states: ['On', 'Off'],
  parents: [],
  cpt: { On: 0.5, Off: 0.5 },
}

// ##################################
// ##### INTERMEDIATE NODES ########
// ##################################

/**
 * @description ☀️ Weather node with systematic buffs.
 * Base probability for each state is 1/3 (~0.333).
 */
export const weather: INode = {
  id: 'Weather',
  states: ['Good', 'Average', 'Bad'],
  parents: ['Cloudy', 'Humidity'],
  cpt: [
    // Both parents support 'Bad'. Buff 'Bad' by +0.2 (0.1 * 2), then re-normalize.
    { when: { Cloudy: 'High', Humidity: 'High' }, then: { Good: 0.28, Average: 0.28, Bad: 0.44 } },
    // A mix of parents supports 'Average'. Buff 'Average' by +0.1, then re-normalize.
    { when: { Cloudy: 'High', Humidity: 'Low' }, then: { Good: 0.30, Average: 0.40, Bad: 0.30 } },
    // A mix of parents supports 'Average'. Buff 'Average' by +0.1, then re-normalize.
    { when: { Cloudy: 'Low', Humidity: 'High' }, then: { Good: 0.30, Average: 0.40, Bad: 0.30 } },
    // Both parents support 'Good'. Buff 'Good' by +0.2 (0.1 * 2), then re-normalize.
    { when: { Cloudy: 'Low', Humidity: 'Low' }, then: { Good: 0.44, Average: 0.28, Bad: 0.28 } },
  ],
}

/**
 * @description 🌧️ Rain node with systematic buffs.
 * Base probability for each state is 0.5.
 */
export const rain: INode = {
  id: 'Rain',
  states: ['Yes', 'No'],
  parents: ['Weather'],
  cpt: [
    // 'Bad' weather supports 'Yes'. Buff 'Yes' by +0.1, then re-normalize.
    { when: { Weather: 'Bad' }, then: { Yes: 0.55, No: 0.45 } },
    // 'Average' weather gives no clear support, so it remains flat.
    { when: { Weather: 'Average' }, then: { Yes: 0.5, No: 0.5 } },
    // 'Good' weather supports 'No'. Buff 'No' by +0.1, then re-normalize.
    { when: { Weather: 'Good' }, then: { Yes: 0.45, No: 0.55 } },
  ],
}

// ##################################
// ##### LEAF NODE (FINAL EFFECT) ###
// ##################################

/**
 * @description 💦 Wet Ground node with systematic buffs.
 * Base probability for each state is 0.5.
 */
export const wetGround: INode = {
  id: 'WetGround',
  states: ['Yes', 'No'],
  parents: ['Rain', 'Sprinkler'],
  cpt: [
    // Both parents support 'Yes'. Buff 'Yes' by +0.2, then re-normalize.
    { when: { Rain: 'Yes', Sprinkler: 'On' }, then: { Yes: 0.5, No: 0.5 } },
    // One parent supports 'Yes'. Buff 'Yes' by +0.1, then re-normalize.
    { when: { Rain: 'Yes', Sprinkler: 'Off' }, then: { Yes: 0.5, No: 0.5 } },
    // One parent supports 'Yes'. Buff 'Yes' by +0.1, then re-normalize.
    { when: { Rain: 'No', Sprinkler: 'On' }, then: { Yes: 0.5, No: 0.5 } },
    // Both parents support 'No'. Buff 'No' by +0.2, then re-normalize.
    { when: { Rain: 'No', Sprinkler: 'Off' }, then: { Yes: 0.5, No: 0.5 } },
  ],
}

/**
 * @description An array exporting all nodes of the network for easy import.
 */
export const allNodesSprinkler: INode[] = [
  cloudy,
  humidity,
  sprinkler,
  weather,
  rain,
  wetGround,
]
