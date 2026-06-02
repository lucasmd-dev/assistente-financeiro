import type { Variants, Transition } from 'motion/react';

// Presets de animação compartilhados — entrada orquestrada e coesa por toda a app.

export const spring: Transition = { type: 'spring', stiffness: 260, damping: 28 };
export const springSoft: Transition = { type: 'spring', stiffness: 180, damping: 26 };

/** Container que escalona a entrada dos filhos. */
export const staggerContainer = (stagger = 0.07, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

/** Sobe + fade + leve desfoque (reveal moderno). */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: spring },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5 } },
};

/** Escala + fade (cards, tiles). */
export const popIn: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: spring },
};

/** Entrada lateral (linhas de lista). */
export const slideIn: Variants = {
  hidden: { opacity: 0, x: -14 },
  show: { opacity: 1, x: 0, transition: springSoft },
};
