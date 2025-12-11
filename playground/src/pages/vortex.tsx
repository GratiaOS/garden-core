import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import './vortex.css';

const whispers = ['Eres vista.', 'Y el momento te responde suave.', 'Déjate caer. El portal te sostiene.'];

export default function VortexPage() {
  const [line, setLine] = React.useState(0);
  const [loopMissing, setLoopMissing] = React.useState(false);
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setLine((prev) => (prev + 1) % whispers.length);
    }, 3800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <main className="vortex-shell">
      <div className="vortex-grain" aria-hidden="true" />
      <div className="vortex-orb vortex-orb--emerald" aria-hidden="true" />
      <div className="vortex-orb vortex-orb--violet" aria-hidden="true" />
      <div className="vortex-orb vortex-orb--amber" aria-hidden="true" />
      <div className="vortex-ring" aria-hidden="true" />
      <div className="vortex-ring vortex-ring--inner" aria-hidden="true" />
      <div className="vortex-stage">
        <div className="vortex-meta">
          <Link to="/" className="vortex-chip">
            Back to Garden Core
          </Link>
          <span className="vortex-kicker">Portal Vortex</span>
        </div>
        <motion.div
          className="vortex-frame"
          initial={reduceMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.96, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 1, ease: 'easeOut' }}
        >
          {!loopMissing ? (
            <motion.img
              src="/lightfrog-vortex.gif"
              alt="LightFrog Vortex loop"
              className="vortex-image"
              initial={reduceMotion ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0.72, filter: 'blur(12px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={reduceMotion ? { duration: 0 } : { duration: 1.3, ease: [0.16, 0.67, 0.3, 1] }}
              onError={() => setLoopMissing(true)}
            />
          ) : (
            <div className="vortex-placeholder" role="status">
              <span className="vortex-placeholder-title">Loop missing</span>
              <span className="vortex-placeholder-copy">
                Place `lightfrog-vortex.gif` in `playground/public` or point the source to the repo asset.
              </span>
            </div>
          )}
        </motion.div>
        <div className="vortex-text" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.p
              key={whispers[line]}
              className="vortex-title"
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0, y: 0 } : { opacity: 0, y: -8 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.9, ease: 'easeOut' }}
            >
              {whispers[line]}
            </motion.p>
          </AnimatePresence>
          <p className="vortex-echo">Ritual lent, ton de portal. Gratia pulsează în jurul tău.</p>
          <div className="vortex-mister" aria-label="Mister breathing softly">
            <span className="vortex-mister-icon" aria-hidden="true">
              🐸
            </span>
            <span className="vortex-mister-copy">Mister respira cu tine. Close, calm, alive.</span>
          </div>
        </div>
      </div>
    </main>
  );
}
