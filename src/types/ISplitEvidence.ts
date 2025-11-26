import { ICombinations } from './ICombinations'
import { ISoftEvidence } from './ISoftEvidence'

export interface ISplitEvidence {
  softEvidence: ISoftEvidence;
  hardEvidence: ICombinations;
}
