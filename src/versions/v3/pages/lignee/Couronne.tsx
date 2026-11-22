/**
 * Couronne lisible des vues de la lignée (v3-spec §6.5, audit V2 n° 16) : la variante
 * `legible` de `CrownGlyph` (bandeau plein, trois pointes, socle), sous le nom que les vues
 * de la lignée emploient déjà.
 */
import { CrownGlyph } from '@/shared/marks/Marks';

interface CouronneProps {
  className?: string;
  /** Au moins 16 px pour rester reconnaissable. */
  size?: string;
  /** Nom accessible ; sans titre, la couronne est décorative. */
  title?: string;
}

export function Couronne(props: CouronneProps) {
  return <CrownGlyph variant="legible" {...props} />;
}
