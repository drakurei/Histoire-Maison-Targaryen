import { useCallback, useEffect, useRef } from 'react';
import { gsap, SplitText, useGSAP } from '@/core/motion';
import { uiByKey } from '@/core/content/ui';
import { useLang } from '@/core/i18n';
import { Emblem } from '@/shared/emblem/Emblem';
import styles from './Seuil.module.css';

interface SeuilProps {
  /** Vrai quand le site derrière le seuil est prêt (polices chargées, première vue montée). */
  ready: boolean;
  /** Appelé une fois le seuil entièrement levé. */
  onDone: () => void;
}

const HV = 'art-x-valyrian';

/** Forme valyrienne d'une formule : ici le valyrien est le sujet, quelle que soit la langue d'affichage. */
function formula(key: string, fallback: string): string {
  return uiByKey.get(key)?.hv ?? fallback;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Le seuil : l'emblème et « Valar morghūlis » tiennent lieu d'écran de chargement.
 * L'emblème se trace, la formule s'inscrit ; quand le site est prêt, « Valar dohaeris »
 * répond et le seuil se lève seul. Un clic ou une touche le passe.
 */
export function Seuil({ ready, onDone }: SeuilProps) {
  const root = useRef<HTMLDivElement>(null);
  const { reading } = useLang();
  const introDone = useRef(false);
  const leaving = useRef(false);
  const readyRef = useRef(ready);
  const leave = useRef<() => void>(() => undefined);
  const done = useRef(onDone);
  done.current = onDone;
  readyRef.current = ready;

  const callText = formula('phrase.valar_morghulis', 'Valar morghūlis');
  const answerText = formula('phrase.valar_dohaeris', 'Valar dohaeris');
  const callGloss = uiByKey.get('phrase.valar_morghulis')?.[reading] ?? '';
  const answerGloss = uiByKey.get('phrase.valar_dohaeris')?.[reading] ?? '';
  const waitWord = formula('phrase.loading', 'Umbās');
  const waitGloss = uiByKey.get('phrase.loading')?.[reading] ?? '';
  const skipLabel = uiByKey.get('seuil.skip')?.[reading] ?? '';

  const { contextSafe } = useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);

      if (prefersReducedMotion()) {
        // Image fixe : tout est déjà là. On attend le site, puis un fondu court.
        introDone.current = true;
        leave.current = () => {
          if (leaving.current) return;
          leaving.current = true;
          gsap.to(el, { autoAlpha: 0, duration: 0.15, delay: 0.5, onComplete: () => done.current() });
        };
        if (readyRef.current) leave.current();
        return;
      }

      const paths = q('[data-seuil-emblem] path');
      const call = new SplitText(q('[data-seuil-call]'), { type: 'chars' });
      const answer = new SplitText(q('[data-seuil-answer]'), { type: 'chars' });
      const hidden = 'inset(0% 0% 100% 0%)';
      const shown = 'inset(0% 0% 0% 0%)';

      gsap.set(paths, { fillOpacity: 0, stroke: 'currentColor', strokeWidth: 1.4 });
      gsap.set([call.chars, answer.chars], { clipPath: hidden });
      gsap.set(q('[data-seuil-gloss], [data-seuil-wait]'), { autoAlpha: 0 });
      gsap.set(q('[data-seuil-answer-gloss]'), { autoAlpha: 0 });
      gsap.set(el, { autoAlpha: 1 });

      const breath = gsap.to(q('[data-seuil-emblem]'), { opacity: 0.82, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true });

      gsap
        .timeline({ defaults: { ease: 'power4.out' } })
        .fromTo(paths, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.5, ease: 'power2.inOut', stagger: 0.05 })
        .to(paths, { fillOpacity: 1, strokeWidth: 0, duration: 0.7, ease: 'power2.out' }, '-=0.4')
        .to(call.chars, { clipPath: shown, duration: 0.55, stagger: 0.045 }, '-=0.55')
        .to(q('[data-seuil-gloss]'), { autoAlpha: 1, duration: 0.4 }, '-=0.15')
        .to(q('[data-seuil-wait]'), { autoAlpha: 1, duration: 0.4 }, '<')
        .call(() => {
          introDone.current = true;
          if (readyRef.current) leave.current();
          else breath.play();
        });

      leave.current = () => {
        if (leaving.current) return;
        leaving.current = true;
        breath.kill();
        gsap
          .timeline({ defaults: { ease: 'power4.out' } })
          .to(q('[data-seuil-emblem]'), { opacity: 1, duration: 0.3 })
          .to(q('[data-seuil-wait]'), { autoAlpha: 0, duration: 0.2 }, '<')
          .to(q('[data-seuil-call]'), { opacity: 0.38, duration: 0.4 }, '<')
          .to(q('[data-seuil-gloss]'), { autoAlpha: 0, duration: 0.25 }, '<')
          .to(answer.chars, { clipPath: shown, duration: 0.55, stagger: 0.045 }, '-=0.1')
          .to(q('[data-seuil-answer-gloss]'), { autoAlpha: 1, duration: 0.4 }, '-=0.2')
          .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1, ease: 'expo.inOut' }, '+=0.85')
          .to(q('[data-seuil-stage]'), { yPercent: -6, duration: 1, ease: 'expo.inOut' }, '<')
          .call(() => done.current());
      };

      return () => {
        call.revert();
        answer.revert();
      };
    },
    { scope: root, dependencies: [reading] },
  );

  // Le site vient de se dire prêt : si l'inscription est finie, on répond et on ouvre.
  useEffect(() => {
    if (ready && introDone.current) leave.current();
  }, [ready]);

  const skip = useCallback(
    () =>
      contextSafe(() => {
        const el = root.current;
        if (!el || leaving.current) return;
        leaving.current = true;
        gsap.killTweensOf(el.querySelectorAll('*'));
        gsap.to(el, { autoAlpha: 0, duration: 0.15, onComplete: () => done.current() });
      })(),
    [contextSafe],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab' || event.metaKey || event.ctrlKey || event.altKey) return;
      skip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [skip]);

  return (
    <div ref={root} className={styles.seuil} onClick={skip} aria-busy={!ready}>
      <div className={styles.stage} data-seuil-stage>
        <div className={styles.emblem} data-seuil-emblem>
          <Emblem />
        </div>
        <p className={styles.formulas} lang={HV}>
          <span className={styles.call} data-seuil-call>
            {callText}
          </span>
          <span className={styles.answer} data-seuil-answer>
            {answerText}
          </span>
        </p>
        <p className={styles.glosses}>
          <span data-seuil-gloss>{callGloss}</span>
          <span className={styles.answerGloss} data-seuil-answer-gloss>
            {answerGloss}
          </span>
        </p>
      </div>
      <p className={styles.wait} role="status" data-seuil-wait>
        <span lang={HV}>{waitWord}</span>
        {waitGloss ? <span className={styles.waitGloss}>{waitGloss}</span> : null}
      </p>
      <button type="button" className={styles.skip} onClick={skip}>
        {skipLabel}
      </button>
    </div>
  );
}
