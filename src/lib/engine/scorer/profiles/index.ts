export { WORKDAY_PROFILE } from './workday';
export { TALEO_PROFILE } from './taleo';
export { ICIMS_PROFILE } from './icims';
export { GREENHOUSE_PROFILE } from './greenhouse';
export { LEVER_PROFILE } from './lever';
export { SUCCESSFACTORS_PROFILE } from './successfactors';
export { GUPY_PROFILE } from './gupy';
export type { ATSProfile, ATSQuirk } from './types';

import type { ATSProfile } from './types';
import { WORKDAY_PROFILE } from './workday';
import { TALEO_PROFILE } from './taleo';
import { ICIMS_PROFILE } from './icims';
import { GREENHOUSE_PROFILE } from './greenhouse';
import { LEVER_PROFILE } from './lever';
import { SUCCESSFACTORS_PROFILE } from './successfactors';
import { GUPY_PROFILE } from './gupy';

export const ALL_PROFILES: ATSProfile[] = [
	GUPY_PROFILE,
	WORKDAY_PROFILE,
	TALEO_PROFILE,
	SUCCESSFACTORS_PROFILE,
	ICIMS_PROFILE,
	GREENHOUSE_PROFILE,
	LEVER_PROFILE
];

export function getProfile(name: string): ATSProfile | undefined {
	return ALL_PROFILES.find((profile) => profile.name.toLowerCase() === name.toLowerCase());
}
