export interface IInferAllOptions {
  /**
   * Enforces to clear junction tree cache before inferring all network. Default: false
   */
  force?: boolean;
  /**
   * The results value precision. Default: 4
   */
  precision?: number;
  /**
   * If true, treat provided IEvidence as clamped (soft-evidence as authoritative posteriors):
   * nodes in evidence are converted to root nodes with CPT equal to the provided distribution.
   * Default: false
   */
  clampSoftEvidence?: boolean;
}
