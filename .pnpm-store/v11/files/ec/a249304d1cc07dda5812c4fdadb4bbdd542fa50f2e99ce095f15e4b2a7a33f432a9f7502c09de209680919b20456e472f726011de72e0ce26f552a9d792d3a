export interface ChartSpringOptions {
    stiffness?: number;
    damping?: number;
    mass?: number;
    restSpeed?: number;
    restDelta?: number;
}
export interface ChartSpringState {
    from: number;
    to: number;
    /** Value units per second. */
    velocity?: number;
}
export interface ChartSpringSample {
    value: number;
    /** Value units per second. */
    velocity: number;
    done: boolean;
}
export interface ChartSpring {
    readonly options: Readonly<Required<ChartSpringOptions>>;
    sample: (elapsedMs: number, state?: ChartSpringState) => ChartSpringSample;
}
/**
 * Creates an analytic damped harmonic oscillator. Sampling is frame-rate
 * independent, and a sampled value and velocity can seed the next target.
 */
export declare function createChartSpring(input?: ChartSpringOptions): ChartSpring;
