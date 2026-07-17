import { redirect } from '@sveltejs/kit';
import { teacherFeaturesEnabled } from '$lib/config/appVariant';

export function load() {
  if (!teacherFeaturesEnabled) {
    throw redirect(307, '/');
  }
}
