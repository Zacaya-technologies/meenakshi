'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Icon } from '@/components/ui/Icons';

const SLIDES = [
  {
    id: 'wooden',
    eyebrow: 'Warm, Natural & Easy-Care',
    title: 'Wood-Look Tiles',
    copy: 'The warmth of timber planks with the durability of tile, for living rooms, bedrooms and feature walls.',
    cta: { label: 'Explore Collection', href: '/shop?design=wooden' },
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2000&q=80',
    align: 'left'
  },
  {
    id: 'marble',
    eyebrow: 'Italian Statuario & Onyx',
    title: 'Luxury Marble Slabs',
    copy: 'Book-matched slabs up to 800x3000 mm, finished for villas, hotels and flagship retail.',
    cta: { label: 'View Marble Slabs', href: '/shop?design=marble' },
    image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2000&q=80',
    align: 'left'
  },
  {
    id: 'outdoor',
    eyebrow: 'Anti-Skid R11 Rated',
    title: 'Outdoor & Parking',
    copy: 'Full-body vitrified 20 mm pavers engineered for driveways, terraces and pool decks.',
    cta: { label: 'Shop Outdoor Tiles', href: '/outdoor-tiles' },
    image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=2000&q=80',
    align: 'left'
  }
];

const AUTOPLAY_MS = 6000;

export default function HeroBanner() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);

  const go = useCallback((next) => {
    setIndex((next + SLIDES.length) % SLIDES.length);
  }, []);

  // Autoplay pauses on hover, on focus within, and whenever the user has asked
  // for reduced motion — an auto-advancing carousel is motion they did not ask for.
  useEffect(() => {
    if (paused || reduceMotion) return;
    timer.current = setTimeout(() => go(index + 1), AUTOPLAY_MS);
    return () => clearTimeout(timer.current);
  }, [index, paused, reduceMotion, go]);

  const slide = SLIDES[index];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      /* Fixed aspect box reserves the space before the image decodes, so the
         page below never jumps when the hero paints. */
      className="relative isolate w-full overflow-hidden bg-brand-navy"
      style={{ height: 'clamp(480px, 52vw, 620px)' }}
    >
      {/* Default (sync) mode: the outgoing and incoming slides are both mounted
          for the crossfade. They are absolutely positioned, so they stack
          rather than reflow. */}
      <AnimatePresence initial={false}>
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.7, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.image}
            alt=""
            className="h-full w-full object-cover"
          />
          {/* Scrim: strong enough on the copy side to hold 4.5:1 on white text */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-navy/92 via-brand-navy/65 to-brand-navy/15" />
        </motion.div>
      </AnimatePresence>

      {/* Copy */}
      {/* Bottom padding keeps the copy and buttons clear of the slide controls */}
      <div className="relative mx-auto flex h-full max-w-shell items-center px-4 pb-16 sm:px-6 sm:pb-12">
        <motion.div
          key={`${slide.id}-copy`}
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.5, ease: 'easeOut', delay: reduceMotion ? 0 : 0.12 }}
          className="max-w-xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
            <Icon.gem className="h-3.5 w-3.5 text-brand-blue" />
            {slide.eyebrow}
          </span>

          <h1 className="mt-5 font-heading text-[2rem] font-extrabold uppercase leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
            {slide.title}
          </h1>

          <p className="mt-4 max-w-md text-base leading-relaxed text-white/80">
            {slide.copy}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={slide.cta.href}
              className="inline-flex min-h-[48px] items-center rounded-2xl bg-gradient-to-r from-brand-blue to-brand-deep px-7 font-heading text-sm font-bold text-white shadow-glow transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(30,167,253,0.5)]"
            >
              {slide.cta.label}
            </Link>
            <Link
              href="/shop"
              className="inline-flex min-h-[48px] items-center rounded-2xl border-[1.5px] border-white/35 bg-white/10 px-7 font-heading text-sm font-bold text-white backdrop-blur transition duration-200 hover:border-white hover:bg-white/20"
            >
              Browse All Tiles
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Slide controls */}
      <div className="absolute inset-x-0 bottom-5 z-10 mx-auto flex max-w-shell items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2" role="tablist" aria-label="Choose slide">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={i === index}
              aria-label={`${s.title} slide`}
              onClick={() => go(i)}
              className="flex h-11 cursor-pointer items-center justify-center px-1"
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? 'w-7 bg-brand-blue' : 'w-3 bg-white/45 hover:bg-white/70'
                }`}
              />
            </button>
          ))}
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <SlideArrow onClick={() => go(index - 1)} label="Previous slide">
            <Icon.chevronLeft className="h-5 w-5" />
          </SlideArrow>
          <SlideArrow onClick={() => go(index + 1)} label="Next slide">
            <Icon.chevronRight className="h-5 w-5" />
          </SlideArrow>
        </div>
      </div>
    </section>
  );
}

function SlideArrow({ onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur transition hover:border-white hover:bg-white/25"
    >
      {children}
    </button>
  );
}
