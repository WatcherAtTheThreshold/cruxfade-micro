// ================================================================
// SEEDED RANDOM NUMBER GENERATOR
// Ensures reproducible runs when using same seed
// ================================================================

/**
 * Simple seeded PRNG using LCG algorithm
 */
class SeededRandom {
    constructor(seed = 0) {
        this.seed = seed;
        this.current = seed;
    }
    
    /**
     * Generate next random number (0 to 1)
     */
    random() {
        // Linear Congruential Generator
        this.current = (this.current * 1664525 + 1013904223) % 4294967296;
        return this.current / 4294967296;
    }
    
    /**
     * Generate random integer between min and max (inclusive)
     */
    randomInt(min, max) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }
    
    /**
     * Pick random element from array
     */
    pickRandom(array) {
        return array[this.randomInt(0, array.length - 1)];
    }
}

// Global RNG instance
let rng = new SeededRandom();

/**
 * Initialize RNG with seed
 */
export function initRNG(seed) {
    rng = new SeededRandom(seed);
    console.log('🎲 RNG initialized with seed:', seed);
}

/**
 * Get random number (0 to 1)
 */
export function random() {
    return rng.random();
}

/**
 * Get random integer
 */
export function randomInt(min, max) {
    return rng.randomInt(min, max);
}

/**
 * Pick random from array
 */
export function pickRandom(array) {
    return rng.pickRandom(array);
}