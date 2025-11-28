import { IEvidence, INode } from '../src/types'

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
    { when: { Rain: 'Yes', Sprinkler: 'On' }, then: { Yes: 0.6, No: 0.4 } },
    // One parent supports 'Yes'. Buff 'Yes' by +0.1, then re-normalize.
    { when: { Rain: 'Yes', Sprinkler: 'Off' }, then: { Yes: 0.5, No: 0.5 } },
    // One parent supports 'Yes'. Buff 'Yes' by +0.1, then re-normalize.
    { when: { Rain: 'No', Sprinkler: 'On' }, then: { Yes: 0.5, No: 0.5 } },
    // Both parents support 'No'. Buff 'No' by +0.2, then re-normalize.
    { when: { Rain: 'No', Sprinkler: 'Off' }, then: { Yes: 0.4, No: 0.6 } },
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

export const missingWhetherRainDataSetSprinkler: IEvidence[] = [
  {
    Cloudy: { High: 0.9, Low: 0.1 },
    Humidity: { High: 0.8, Low: 0.2 },
    Sprinkler: { On: 0.1, Off: 0.9 },
    //Weather: { Good: 0.25, Average: 0.30, Bad: 0.45 },
    WetGround: { Yes: 0.95, No: 0.05 },
  },
  {
    Cloudy: { High: 0.8, Low: 0.2 },
    Humidity: { High: 0.9, Low: 0.1 },
    Sprinkler: { On: 0.05, Off: 0.95 },
    //Weather: { Good: 0.27, Average: 0.30, Bad: 0.43 },
    WetGround: { Yes: 0.9, No: 0.1 },
  },
  {
    Cloudy: { High: 0.99, Low: 0.01 },
    Humidity: { High: 0.95, Low: 0.05 },
    Sprinkler: { On: 0.0, Off: 1.0 },
    //Weather: { Good: 0.22, Average: 0.28, Bad: 0.50 },
    WetGround: { Yes: 0.98, No: 0.02 },
  },
  {
    Cloudy: { High: 0.7, Low: 0.3 },
    Humidity: { High: 0.75, Low: 0.25 },
    Sprinkler: { On: 0.1, Off: 0.9 },
    //Weather: { Good: 0.28, Average: 0.32, Bad: 0.40 },
    WetGround: { Yes: 0.8, No: 0.2 },
  },

  // ########## SCENARIO 2: Dry Day with Sprinklers ☀️🌿 ##########
  {
    Cloudy: { High: 0.1, Low: 0.9 },
    Humidity: { High: 0.2, Low: 0.8 },
    Sprinkler: { On: 0.9, Off: 0.1 },
    //Weather: { Good: 0.50, Average: 0.32, Bad: 0.18 },
    WetGround: { Yes: 0.92, No: 0.08 },
  },
  {
    Cloudy: { High: 0.05, Low: 0.95 },
    Humidity: { High: 0.1, Low: 0.9 },
    Sprinkler: { On: 0.95, Off: 0.05 },
    //Weather: { Good: 0.55, Average: 0.30, Bad: 0.15 },
    WetGround: { Yes: 0.88, No: 0.12 },
  },
  {
    Cloudy: { High: 0.3, Low: 0.7 },
    Humidity: { High: 0.2, Low: 0.8 },
    Sprinkler: { On: 0.98, Off: 0.02 },
    //Weather: { Good: 0.48, Average: 0.33, Bad: 0.19 },
    WetGround: { Yes: 0.9, No: 0.1 },
  },
  {
    Cloudy: { High: 0.2, Low: 0.8 },
    Humidity: { High: 0.5, Low: 0.5 },
    Sprinkler: { On: 0.85, Off: 0.15 },
    //Weather: { Good: 0.42, Average: 0.35, Bad: 0.23 },
    WetGround: { Yes: 0.85, No: 0.15 },
  },

  {
    Cloudy: { High: 0.9, Low: 0.1 },
    Humidity: { High: 0.9, Low: 0.1 },
    Sprinkler: { On: 0.8, Off: 0.2 },
    //Weather: { Good: 0.23, Average: 0.27, Bad: 0.50 },
    WetGround: { Yes: 0.99, No: 0.01 },
  },
  {
    Cloudy: { High: 0.85, Low: 0.15 },
    Humidity: { High: 0.95, Low: 0.05 },
    Sprinkler: { On: 0.7, Off: 0.3 },
    //Weather: { Good: 0.24, Average: 0.28, Bad: 0.48 },
    WetGround: { Yes: 0.98, No: 0.02 },
  },
  {
    Cloudy: { High: 0.95, Low: 0.05 },
    Humidity: { High: 0.9, Low: 0.1 },
    Sprinkler: { On: 0.9, Off: 0.1 },
    //Weather: { Good: 0.22, Average: 0.27, Bad: 0.51 },
    WetGround: { Yes: 0.99, No: 0.01 },
  },

  // ########## SCENARIO 4: Ambiguous/Muggy Day 🌫️ ##########
  {
    Cloudy: { High: 0.6, Low: 0.4 },
    Humidity: { High: 0.7, Low: 0.3 },
    Sprinkler: { On: 0.1, Off: 0.9 },
    //Weather: { Good: 0.30, Average: 0.33, Bad: 0.37 },
    WetGround: { Yes: 0.4, No: 0.6 },
  },
  {
    Cloudy: { High: 0.3, Low: 0.7 },
    Humidity: { High: 0.8, Low: 0.2 },
    Sprinkler: { On: 0.2, Off: 0.8 },
    //Weather: { Good: 0.32, Average: 0.38, Bad: 0.30 },
    WetGround: { Yes: 0.25, No: 0.75 },
  },
  {
    Cloudy: { High: 0.2, Low: 0.8 },
    Humidity: { High: 0.9, Low: 0.1 },
    Sprinkler: { On: 0.05, Off: 0.95 },
    //Weather: { Good: 0.32, Average: 0.39, Bad: 0.29 },
    WetGround: { Yes: 0.3, No: 0.7 },
  },
  {
    Cloudy: { High: 0.5, Low: 0.5 },
    Humidity: { High: 0.5, Low: 0.5 },
    Sprinkler: { On: 0.1, Off: 0.9 },
    //Weather: { Good: 0.33, Average: 0.34, Bad: 0.33 },
    WetGround: { Yes: 0.5, No: 0.5 },
  },

  // ########## SCENARIO 5 & 6: Dry Days (Balanced) 🌵 ##########
  {
    Cloudy: { High: 0.01, Low: 0.99 },
    Humidity: { High: 0.1, Low: 0.9 },
    Sprinkler: { On: 0.05, Off: 0.95 },
    //Weather: { Good: 0.58, Average: 0.28, Bad: 0.14 },
    WetGround: { Yes: 0.02, No: 0.98 },
  },
  {
    Cloudy: { High: 0.1, Low: 0.9 },
    Humidity: { High: 0.15, Low: 0.85 },
    Sprinkler: { On: 0.1, Off: 0.9 },
    //Weather: { Good: 0.52, Average: 0.30, Bad: 0.18 },
    WetGround: { Yes: 0.05, No: 0.95 },
  },
  {
    Cloudy: { High: 0.2, Low: 0.8 },
    Humidity: { High: 0.3, Low: 0.7 },
    Sprinkler: { On: 0.15, Off: 0.85 },
    //Weather: { Good: 0.47, Average: 0.32, Bad: 0.21 },
    WetGround: { Yes: 0.1, No: 0.9 },
  },
  {
    Cloudy: { High: 0.05, Low: 0.95 },
    Humidity: { High: 0.2, Low: 0.8 },
    Sprinkler: { On: 0.05, Off: 0.95 },
    //Weather: { Good: 0.53, Average: 0.30, Bad: 0.17 },
    WetGround: { Yes: 0.03, No: 0.97 },
  },
  {
    Cloudy: { High: 0.12, Low: 0.88 },
    Humidity: { High: 0.25, Low: 0.75 },
    Sprinkler: { On: 0.2, Off: 0.8 },
    //Weather: { Good: 0.49, Average: 0.32, Bad: 0.19 },
    WetGround: { Yes: 0.15, No: 0.85 },
  },
  {
    Cloudy: { High: 0.0, Low: 1.0 },
    Humidity: { High: 0.05, Low: 0.95 },
    Sprinkler: { On: 0.01, Off: 0.99 },
    //Weather: { Good: 0.60, Average: 0.27, Bad: 0.13 },
    WetGround: { Yes: 0.01, No: 0.99 },
  },
  {
    Cloudy: { High: 0.15, Low: 0.85 },
    Humidity: { High: 0.1, Low: 0.9 },
    Sprinkler: { On: 0.1, Off: 0.9 },
    //Weather: { Good: 0.54, Average: 0.30, Bad: 0.16 },
    WetGround: { Yes: 0.04, No: 0.96 },
  },
  {
    Cloudy: { High: 0.25, Low: 0.75 },
    Humidity: { High: 0.2, Low: 0.8 },
    Sprinkler: { On: 0.2, Off: 0.8 },
    //Weather: { Good: 0.48, Average: 0.32, Bad: 0.20 },
    WetGround: { Yes: 0.1, No: 0.9 },
  },
  {
    Cloudy: { High: 0.3, Low: 0.7 },
    Humidity: { High: 0.4, Low: 0.6 },
    Sprinkler: { On: 0.3, Off: 0.7 },
    //Weather: { Good: 0.42, Average: 0.35, Bad: 0.23 },
    WetGround: { Yes: 0.2, No: 0.8 },
  },
  {
    Cloudy: { High: 0.1, Low: 0.9 },
    Humidity: { High: 0.3, Low: 0.7 },
    Sprinkler: { On: 0.1, Off: 0.9 },
    //Weather: { Good: 0.46, Average: 0.33, Bad: 0.21 },
    WetGround: { Yes: 0.11, No: 0.89 },
  },
  { // Outliner example
    Cloudy: { High: 0.1, Low: 0.9 },
    Humidity: { High: 0.1, Low: 0.9 },
    Sprinkler: { On: 0.1, Off: 0.9 },
    //Weather: { Good: 0.55, Average: 0.30, Bad: 0.15 },
    WetGround: { Yes: 0.80, No: 0.20 },
  },
]
