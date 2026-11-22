/**
 * Les registres complets, indexés une fois, pour le cartel. Chargé avec le contenu du cartel,
 * à sa première ouverture : les lieux et les unions ne pèsent pas sur le premier affichage.
 */
import { dragons } from '@/core/content/dragons';
import { parentage, persons, unions } from '@/core/content/people';
import { places } from '@/core/content/places';
import { events } from '@/core/content/timeline';
import { wars } from '@/core/content/wars';

import { prepareRegistry } from '../model/relations';

export const registry = prepareRegistry({ persons, unions, parentage, dragons, events, wars, places });
