"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CATEGORY_GROUPS, CategoryGroupIcon, CategoryIcon, sortCategories } from "@/lib/categories";
import type { Category, CategoryGroup } from "@/types/domain";

type Slot = { key: string; category: Category | null };
type Geometry = { arcs: HTMLElement[]; labels: Array<HTMLElement | null>; ids: Array<string | null>; centers: number[]; span: number; radius: number };

const MIN_DROP = 16;
const MAX_DROP = 46;
const SETTLE_MS = 130;
const BAND_GAP = 6;
const LINE_GAP = 7;

function WheelSlot({ category, centered, active, onSelect }: { category: Category; centered: boolean; active: boolean; onSelect: (category: Category) => void }) {
  return (
    <button data-slot data-category-id={category.id} data-active={centered} type="button" aria-pressed={active} onClick={() => onSelect(category)} className="category-slot touch-target">
      <span data-arc className="category-arc">
        <span data-arc-badge className="category-badge"><CategoryIcon category={category} className="category-icon" /></span>
        <span data-arc-label className="category-label">{category.name}</span>
      </span>
    </button>
  );
}

export function CategorySelector({ categories, activeId, onChange }: { categories: Category[]; activeId: string; onChange: (category: Category) => void }) {
  const reduceMotion = useReducedMotion();
  const spring = reduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 34 };
  const navRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const geometryRef = useRef<Geometry | null>(null);
  const frameRef = useRef(0);
  const settleRef = useRef(0);
  const centeredRef = useRef(activeId);
  const [centeredId, setCenteredId] = useState(activeId);

  const ordered = useMemo(() => sortCategories(categories), [categories]);
  const groups = useMemo(() => CATEGORY_GROUPS.filter((group) => ordered.some((category) => category.group_key === group.key)), [ordered]);
  // Razdvojnik se ubacuje tamo gde se menja grupa (piće → hrana).
  const slots = useMemo(() => ordered.flatMap<Slot>((category, index) => {
    const boundary = index > 0 && ordered[index - 1]?.group_key !== category.group_key;
    const slot: Slot = { key: category.id, category };
    return boundary ? [{ key: `razdvojnik-${category.group_key}`, category: null }, slot] : [slot];
  }), [ordered]);

  const byId = useMemo(() => new Map(ordered.map((category) => [category.id, category])), [ordered]);
  const latest = useRef({ activeId, onChange, byId });
  useEffect(() => { latest.current = { activeId, onChange, byId }; });

  const measure = useCallback(() => {
    const track = trackRef.current;
    const nav = navRef.current;
    if (!track || !nav) return;
    const elements = Array.from(track.querySelectorAll<HTMLElement>("[data-slot]"));
    if (!elements.length) { geometryRef.current = null; return; }
    const arcs = elements.map((slot) => slot.querySelector<HTMLElement>("[data-arc]") ?? slot);
    // Luk zadržava isti oblik i na širokim ekranima: krajnji ugao se dostiže posle ~2.6 stavke.
    const span = Math.max(96, Math.min(track.clientWidth / 2, (elements[0]?.offsetWidth ?? 72) * 2.6));
    const height = Math.max(...arcs.map((arc) => arc.offsetHeight));
    const drop = Math.min(MAX_DROP, Math.max(MIN_DROP, track.clientHeight - height - 2));
    const radius = (span * span + drop * drop) / (2 * drop);
    // Pozadina točka i linija ispod naziva su koncentrični krugovi sa istim centrom kao i stavke.
    nav.style.setProperty("--arc-cy", `${Math.round(track.offsetTop + height / 2 + radius)}px`);
    nav.style.setProperty("--arc-band-r", `${Math.round(radius + height / 2 + BAND_GAP)}px`);
    nav.style.setProperty("--arc-line-r", `${Math.round(radius - height / 2 - LINE_GAP)}px`);
    // Pozadina i linija se stapaju sa stranicom pre nego što ih donja ivica navigacije preseče.
    nav.style.setProperty("--arc-band-fade", `${Math.max(48, Math.round(nav.clientHeight - track.offsetTop + BAND_GAP))}px`);
    nav.style.setProperty("--arc-line-fade", `${Math.max(24, Math.round(nav.clientHeight - track.offsetTop - height - LINE_GAP))}px`);
    geometryRef.current = {
      arcs,
      labels: elements.map((slot) => slot.querySelector<HTMLElement>("[data-arc-label]")),
      ids: elements.map((slot) => slot.dataset.categoryId ?? null),
      centers: elements.map((slot) => slot.offsetLeft + slot.offsetWidth / 2),
      span,
      radius,
    };
  }, []);

  /** Svaka stavka sedi na kružnici: što je dalje od centra, to niže pada i više se rotira. */
  const paint = useCallback(() => {
    const track = trackRef.current;
    const geometry = geometryRef.current;
    if (!track || !geometry) return;
    const viewCenter = track.scrollLeft + track.clientWidth / 2;
    let nearestId: string | null = null;
    let nearest = Infinity;
    geometry.centers.forEach((center, index) => {
      const distance = center - viewCenter;
      const clamped = Math.max(-geometry.span, Math.min(geometry.span, distance));
      const drop = geometry.radius - Math.sqrt(Math.max(0, geometry.radius * geometry.radius - clamped * clamped));
      const angle = (Math.asin(clamped / geometry.radius) * 180) / Math.PI;
      const ratio = Math.min(1, Math.abs(distance) / geometry.span);
      const arc = geometry.arcs[index];
      if (!arc) return;
      arc.style.transform = `translate3d(0,${drop.toFixed(2)}px,0) rotate(${angle.toFixed(2)}deg) scale(${(1 - 0.2 * ratio).toFixed(3)})`;
      arc.style.opacity = (1 - 0.62 * ratio).toFixed(3);
      const label = geometry.labels[index];
      if (label) label.style.opacity = Math.max(0, 1 - 1.25 * ratio).toFixed(3);
      const id = geometry.ids[index];
      if (id && Math.abs(distance) < nearest) { nearest = Math.abs(distance); nearestId = id; }
    });
    if (nearestId && nearestId !== centeredRef.current) { centeredRef.current = nearestId; setCenteredId(nearestId); }
  }, []);

  const centerOn = useCallback((id: string, behavior: ScrollBehavior) => {
    const track = trackRef.current;
    const geometry = geometryRef.current;
    if (!track || !geometry) return;
    const center = geometry.centers[geometry.ids.indexOf(id)];
    if (center === undefined) return;
    track.scrollTo({ left: center - track.clientWidth / 2, behavior });
  }, []);

  useEffect(() => {
    measure();
    centerOn(latest.current.activeId, "auto");
    paint();
  }, [centerOn, measure, paint, slots]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const settle = () => {
      const { activeId: selected, onChange: change, byId: map } = latest.current;
      const id = centeredRef.current;
      const category = id && id !== selected ? map.get(id) : undefined;
      if (category) change(category);
    };
    const onScroll = () => {
      if (!frameRef.current) frameRef.current = requestAnimationFrame(() => { frameRef.current = 0; paint(); });
      window.clearTimeout(settleRef.current);
      settleRef.current = window.setTimeout(settle, SETTLE_MS);
    };
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      track.scrollLeft += event.deltaY;
    };
    const observer = new ResizeObserver(() => { measure(); centerOn(centeredRef.current, "auto"); paint(); });
    observer.observe(track);
    track.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      observer.disconnect();
      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("wheel", onWheel);
      window.clearTimeout(settleRef.current);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [centerOn, measure, paint]);

  useEffect(() => {
    if (activeId && activeId !== centeredRef.current) centerOn(activeId, reduceMotion ? "auto" : "smooth");
  }, [activeId, centerOn, reduceMotion]);

  const select = (category: Category) => {
    centerOn(category.id, reduceMotion ? "auto" : "smooth");
    if (category.id !== activeId) onChange(category);
  };
  const activeGroup: CategoryGroup = ordered.find((category) => category.id === centeredId)?.group_key ?? ordered[0]?.group_key ?? "drinks";

  return (
    <nav ref={navRef} aria-label="Kategorije" className="catalog-categories relative z-20 w-full">
      {groups.length > 1 ? (
        <div className="category-groups">
          <div className="category-groups-track" role="group" aria-label="Grupe kategorija">
            {groups.map((group) => {
              const isActive = group.key === activeGroup;
              const first = ordered.find((category) => category.group_key === group.key);
              return (
                <button key={group.key} type="button" aria-pressed={isActive} onClick={() => first && select(first)} className={`category-group${isActive ? " is-active" : ""}`}>
                  {isActive ? <motion.span aria-hidden layoutId="category-group-pill" transition={spring} className="category-group-pill" /> : null}
                  <CategoryGroupIcon group={group.key} className="category-group-icon" />
                  <span className="relative z-10">{group.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <span aria-hidden className="category-arc-band" />
      <div ref={trackRef} className="category-wheel">
        <span aria-hidden className="category-rail" />
        {slots.map((slot) => slot.category ? (
          <WheelSlot key={slot.key} category={slot.category} centered={slot.category.id === centeredId} active={slot.category.id === activeId} onSelect={select} />
        ) : (
          <span key={slot.key} data-slot aria-hidden className="category-divider">
            <span data-arc className="category-arc category-divider-arc"><span className="category-divider-line" /></span>
          </span>
        ))}
        <span aria-hidden className="category-rail" />
      </div>
      <span aria-hidden className="category-arc-line" />
      <span aria-hidden className="category-arc-marker" />
    </nav>
  );
}
