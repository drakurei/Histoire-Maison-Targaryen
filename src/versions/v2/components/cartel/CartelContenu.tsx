import type { Voir } from '../../state/useVoir';

import { Apercu } from './Apercu';
import { EtatDuRoyaume } from './EtatDuRoyaume';

/** Contenu du cartel, chargé à la demande. */
export default function CartelContenu({ voir }: { voir: Voir }) {
  if (voir.kind === 'etat') return <EtatDuRoyaume />;
  return <Apercu kind={voir.kind} id={voir.id} />;
}
