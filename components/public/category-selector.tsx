"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { CATEGORY_GROUPS, CategoryGroupIcon, CategoryIcon, sortCategories } from "@/lib/categories";
import type { Category, CategoryGroup } from "@/types/domain";

type Slot = { key: string; category: Category | null };
type GroupsShape = { plate: string; thumbs: Record<string, string> };
type Drag = { x: number; scroll: number; time: number; index: number; lastX: number; lastTime: number; prevX: number; prevTime: number; moved: boolean };
type Geometry = { arcs: HTMLElement[]; labels: Array<HTMLElement | null>; ids: Array<string | null>; centers: number[]; span: number; radius: number; step: number };

const MIN_DROP = 16;
const MAX_DROP = 46;
const SETTLE_MS = 130;
/** Gest kraći od ovoga je zamah (pomera tačno jedno mesto), duži je vučenje. */
const FLICK_MS = 320;
const BAND_GAP = 6;
const LINE_GAP = 7;
/** Vidljivost naziva svake necentrirane kategorije — ista za prvog suseda i za krajnje stavke. */
const LABEL_DIM = 0.34;

/** Kapsula čije obe ivice leže na kružnici točka, sa zaobljenim krajevima. */
function arcCapsule(from: number, to: number, thickness: number, radius: number, centerX: number, centerY: number) {
  const cap = thickness / 2;
  const angleAt = (x: number) => Math.asin(Math.max(-1, Math.min(1, (x - centerX) / radius)));
  const point = (r: number, angle: number) => `${(centerX + r * Math.sin(angle)).toFixed(2)} ${(centerY - r * Math.cos(angle)).toFixed(2)}`;
  const start = angleAt(from + cap);
  const end = angleAt(to - cap);
  const outer = radius + cap;
  const inner = radius - cap;
  return `M ${point(outer, start)} A ${outer} ${outer} 0 0 1 ${point(outer, end)} A ${cap} ${cap} 0 0 1 ${point(inner, end)} A ${inner} ${inner} 0 0 0 ${point(inner, start)} A ${cap} ${cap} 0 0 1 ${point(outer, start)} Z`;
}

/** „Piće/Hrana" prati isti luk kao točak: podloga, oznaka i natpisi leže na kružnici. */
function shapeGroups(nav: HTMLElement, centerY: number): GroupsShape | null {
  const groups = nav.querySelector<HTMLElement>("[data-groups]");
  if (!groups?.offsetWidth) return null;
  const buttons = Array.from(groups.querySelectorAll<HTMLElement>("[data-group-key]"));
  const first = buttons[0];
  if (!first) return null;
  const width = groups.offsetWidth;
  const padding = Number.parseFloat(getComputedStyle(groups).paddingTop) || 6;
  // Debljina se meri iz samog dugmeta, ne iz --cat-groups-t: getComputedStyle vraća clamp() nerazrešen,
  // pa bi podloga ostala na fiksnoj vrednosti dok natpisi prate stvarnu visinu — i tekst bi ispao iz sredine.
  const height = Number.parseFloat(getComputedStyle(first).height);
  if (!height) return null;
  // Podloga je dugme sa razmakom sa obe strane, pa joj se osa poklapa sa sredinom reda dugmadi.
  const thickness = height + padding * 2;
  const centerX = width / 2;
  const radius = Math.max(120, centerY - groups.offsetTop - thickness / 2);
  const localCenterY = thickness / 2 + radius;
  const thumbs: Record<string, string> = {};
  for (const button of buttons) {
    const left = button.offsetLeft;
    const middle = left + button.offsetWidth / 2 - centerX;
    thumbs[button.dataset.groupKey ?? ""] = arcCapsule(left, left + button.offsetWidth, height, radius, centerX, localCenterY);
    button.style.setProperty("--group-sag", `${(radius - Math.sqrt(Math.max(0, radius * radius - middle * middle))).toFixed(2)}px`);
    button.style.setProperty("--group-tilt", `${((Math.asin(middle / radius) * 180) / Math.PI).toFixed(2)}deg`);
  }
  return { plate: arcCapsule(0, width, thickness, radius, centerX, localCenterY), thumbs };
}

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
  const navRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const geometryRef = useRef<Geometry | null>(null);
  const frameRef = useRef(0);
  const settleRef = useRef(0);
  const centeredRef = useRef(activeId);
  const committedRef = useRef("");
  const dragRef = useRef<Drag | null>(null);
  const draggedRef = useRef(false);
  /** Cilj glatke animacije koju smo sami pokrenuli — poravnanje je ne sme preseći. */
  const pendingRef = useRef<{ left: number; until: number } | null>(null);
  const [centeredId, setCenteredId] = useState(activeId);
  const [groupsShape, setGroupsShape] = useState<GroupsShape | null>(null);

  const ordered = useMemo(() => sortCategories(categories), [categories]);
  const groups = useMemo(() => CATEGORY_GROUPS.filter((group) => ordered.some((category) => category.group_key === group.key)), [ordered]);
  // Razdvojnik se ubacuje tamo gde se menja grupa (piće → hrana).
  const slots = useMemo(() => ordered.flatMap<Slot>((category, index) => {
    const boundary = index > 0 && ordered[index - 1]?.group_key !== category.group_key;
    const slot: Slot = { key: category.id, category };
    return boundary ? [{ key: `razdvojnik-${category.group_key}`, category: null }, slot] : [slot];
  }), [ordered]);

  const byId = useMemo(() => new Map(ordered.map((category) => [category.id, category])), [ordered]);
  const latest = useRef({ activeId, onChange, byId, reduceMotion });
  useEffect(() => { latest.current = { activeId, onChange, byId, reduceMotion }; });

  const measure = useCallback(() => {
    const track = trackRef.current;
    const nav = navRef.current;
    if (!track || !nav) return;
    const elements = Array.from(track.querySelectorAll<HTMLElement>("[data-slot]"));
    // Dok se traka ne rasporedi (streaming, skriveni segment) merenje bi dalo besmislen luk.
    if (!elements.length || !track.clientWidth || !track.clientHeight) { geometryRef.current = null; return; }
    const arcs = elements.map((slot) => slot.querySelector<HTMLElement>("[data-arc]") ?? slot);
    // Raspon je puna polovina trake: krajnja vidljiva stavka pada tačno onoliko koliko panel ima mesta,
    // pa kružnica važi za ceo vidljivi deo — bez ravnog dela na ivicama.
    const span = Math.max(96, track.clientWidth / 2);
    const height = Math.max(...arcs.map((arc) => arc.offsetHeight));
    const drop = Math.min(MAX_DROP, Math.max(MIN_DROP, track.clientHeight - height - 2));
    const radius = (span * span + drop * drop) / (2 * drop);
    // Pozadina točka i linija ispod naziva su koncentrični krugovi sa istim centrom kao i stavke.
    const centerY = track.offsetTop + height / 2 + radius;
    nav.style.setProperty("--arc-cy", `${Math.round(centerY)}px`);
    nav.style.setProperty("--arc-band-r", `${Math.round(radius + height / 2 + BAND_GAP)}px`);
    nav.style.setProperty("--arc-line-r", `${Math.round(radius - height / 2 - LINE_GAP)}px`);
    // Pozadina i linija se stapaju sa stranicom pre nego što ih donja ivica navigacije preseče.
    nav.style.setProperty("--arc-band-fade", `${Math.max(48, Math.round(nav.clientHeight - track.offsetTop + BAND_GAP))}px`);
    nav.style.setProperty("--arc-line-fade", `${Math.max(24, Math.round(nav.clientHeight - track.offsetTop - height - LINE_GAP))}px`);
    const shape = shapeGroups(nav, centerY);
    setGroupsShape((previous) => (previous && shape && previous.plate === shape.plate ? previous : shape));
    geometryRef.current = {
      arcs,
      labels: elements.map((slot) => slot.querySelector<HTMLElement>("[data-arc-label]")),
      ids: elements.map((slot) => slot.dataset.categoryId ?? null),
      centers: elements.map((slot) => slot.offsetLeft + slot.offsetWidth / 2),
      span,
      radius,
      step: elements[0]?.offsetWidth ?? 0,
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
      // Klamp tek na poluprečniku: stavka prati kružnicu do kraja, bez ravne „police" na ivicama.
      const clamped = Math.max(-geometry.radius, Math.min(geometry.radius, distance));
      const drop = geometry.radius - Math.sqrt(Math.max(0, geometry.radius * geometry.radius - clamped * clamped));
      const ratio = Math.min(1, Math.abs(distance) / geometry.span);
      const arc = geometry.arcs[index];
      if (!arc) return;
      const faded = 1 - 0.62 * ratio;
      arc.style.transform = `translate3d(0,${drop.toFixed(2)}px,0) scale(${(1 - 0.2 * ratio).toFixed(3)})`;
      arc.style.opacity = faded.toFixed(3);
      const label = geometry.labels[index];
      // Naziv ne bledi dalje od prvog suseda: prigušenje se zaustavi na jednom mestu od centra, a
      // deljenjem sa prigušenjem luka poništava se dodatno gašenje kroz roditelja — i krajnje se čitaju.
      if (label) {
        const away = geometry.step ? Math.min(1, Math.abs(distance) / geometry.step) : 1;
        label.style.opacity = Math.min(1, (1 - (1 - LABEL_DIM) * away) / faded).toFixed(3);
      }
      const id = geometry.ids[index];
      if (id && Math.abs(distance) < nearest) { nearest = Math.abs(distance); nearestId = id; }
    });
    if (nearestId && nearestId !== centeredRef.current) { centeredRef.current = nearestId; setCenteredId(nearestId); }
  }, []);

  const centerOn = useCallback((id: string, behavior: ScrollBehavior) => {
    const track = trackRef.current;
    const geometry = geometryRef.current;
    if (!track || !geometry) return false;
    const center = geometry.centers[geometry.ids.indexOf(id)];
    if (center === undefined) return false;
    const left = center - track.clientWidth / 2;
    pendingRef.current = { left, until: performance.now() + 800 };
    track.scrollTo({ left, behavior });
    return true;
  }, []);

  // Ključ umesto niza: osvežavanje kataloga sa istim kategorijama ne sme da pomeri točak u toku skrola.
  const slotsKey = slots.map((slot) => slot.key).join("|");
  useEffect(() => {
    measure();
    centerOn(latest.current.activeId, "auto");
    paint();
  }, [centerOn, measure, paint, slotsKey]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const settle = () => {
      const { activeId: selected, onChange: change, byId: map, reduceMotion: instant } = latest.current;
      settleRef.current = 0;
      const geometry = geometryRef.current;
      const id = centeredRef.current;
      if (!geometry || !id) return;
      // Ako naša glatka animacija još putuje ka cilju, sačekaj je umesto da je presečeš.
      const pending = pendingRef.current;
      if (pending && performance.now() < pending.until && Math.abs(track.scrollLeft - pending.left) > 2) {
        settleRef.current = window.setTimeout(settle, SETTLE_MS);
        return;
      }
      pendingRef.current = null;
      // CSS snap je isključen — poravnanje na najbližu stavku dovršavamo sami kad se skrol smiri.
      const center = geometry.centers[geometry.ids.indexOf(id)];
      if (center !== undefined && Math.abs(center - track.clientWidth / 2 - track.scrollLeft) > 1) {
        const left = center - track.clientWidth / 2;
        pendingRef.current = { left, until: performance.now() + 800 };
        track.scrollTo({ left, behavior: instant ? "auto" : "smooth" });
      }
      const category = id !== selected ? map.get(id) : undefined;
      if (!category) return;
      committedRef.current = category.id;
      change(category);
    };
    const onScroll = () => {
      if (!frameRef.current) frameRef.current = requestAnimationFrame(() => { frameRef.current = 0; paint(); });
      // Dok prst vuče točak ne poravnavamo — kraj gesta odlučuje gde se staje.
      if (dragRef.current) return;
      window.clearTimeout(settleRef.current);
      settleRef.current = window.setTimeout(settle, SETTLE_MS);
    };
    const onWheel = (event: WheelEvent) => {
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;
      event.preventDefault();
      pendingRef.current = null;
      track.scrollLeft += delta;
    };

    /** Pomeraj za tačno jednu kategoriju od zadate stavke (razdvojnik se preskače). */
    const stepTo = (fromIndex: number, step: number) => {
      const geometry = geometryRef.current;
      if (!geometry) return;
      const categories = geometry.ids.map((id, index) => (id ? index : -1)).filter((index) => index >= 0);
      const position = categories.indexOf(fromIndex);
      const target = categories[Math.max(0, Math.min(categories.length - 1, (position < 0 ? 0 : position) + step))];
      const center = target === undefined ? undefined : geometry.centers[target];
      if (center === undefined) return;
      const left = center - track.clientWidth / 2;
      pendingRef.current = { left, until: performance.now() + 800 };
      track.scrollTo({ left, behavior: latest.current.reduceMotion ? "auto" : "smooth" });
      window.clearTimeout(settleRef.current);
      settleRef.current = window.setTimeout(settle, SETTLE_MS + 260);
    };

    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const now = performance.now();
      if (now - drag.lastTime > 24) { drag.prevX = drag.lastX; drag.prevTime = drag.lastTime; }
      drag.lastX = event.clientX;
      drag.lastTime = now;
      const delta = event.clientX - drag.x;
      if (Math.abs(delta) > 4) { drag.moved = true; draggedRef.current = true; }
      track.scrollLeft = drag.scroll - delta;
    };
    const onPointerUp = () => {
      const drag = dragRef.current;
      dragRef.current = null;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      // Dodir bez pomeranja: vraćamo odloženo poravnanje koje je pointerdown otkazao.
      if (!drag?.moved) {
        window.clearTimeout(settleRef.current);
        settleRef.current = window.setTimeout(settle, SETTLE_MS);
        return;
      }
      const geometry = geometryRef.current;
      if (!geometry) return;
      const elapsed = performance.now() - drag.time;
      const distance = drag.lastX - drag.x;
      const window_ = drag.lastTime - drag.prevTime;
      const velocity = window_ > 0 ? (drag.lastX - drag.prevX) / window_ : 0;
      const quick = elapsed < FLICK_MS;
      // Kratak, brz zamah = tačno jedno mesto; sporo prevlačenje ide gde je korisnik odvukao.
      if (Math.abs(distance) > 8 && (quick || Math.abs(velocity) > 0.45)) {
        const direction = Math.abs(velocity) > 0.05 ? -Math.sign(velocity) : -Math.sign(distance);
        stepTo(quick ? drag.index : geometry.ids.indexOf(centeredRef.current), direction || 1);
        return;
      }
      settle();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const geometry = geometryRef.current;
      if (!geometry) return;
      window.clearTimeout(settleRef.current);
      settleRef.current = 0;
      pendingRef.current = null;
      const now = performance.now();
      dragRef.current = { x: event.clientX, scroll: track.scrollLeft, time: now, index: geometry.ids.indexOf(centeredRef.current), lastX: event.clientX, lastTime: now, prevX: event.clientX, prevTime: now, moved: false };
      draggedRef.current = false;
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    };
    const observer = new ResizeObserver(() => {
      measure();
      // Ne diramo poziciju dok korisnik skroluje — inače se točak trza usred zamaha.
      if (!settleRef.current) centerOn(centeredRef.current, "auto");
      paint();
    });
    observer.observe(track);
    track.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("wheel", onWheel, { passive: false });
    track.addEventListener("pointerdown", onPointerDown);
    return () => {
      observer.disconnect();
      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("wheel", onWheel);
      track.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.clearTimeout(settleRef.current);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [centerOn, measure, paint]);

  useEffect(() => {
    // Izbor koji je potekao iz samog točka (skrol ili klik) je već na mestu — ne centriramo ponovo.
    if (activeId === committedRef.current || !activeId || activeId === centeredRef.current) return;
    centerOn(activeId, reduceMotion ? "auto" : "smooth");
  }, [activeId, centerOn, reduceMotion]);

  const select = (category: Category) => {
    // Klik koji zatvara prevlačenje ne bira kategoriju.
    if (draggedRef.current) { draggedRef.current = false; return; }
    // Oznaka „sami smo pomerili točak" važi samo ako je centriranje stvarno prošlo.
    if (centerOn(category.id, reduceMotion ? "auto" : "smooth")) committedRef.current = category.id;
    if (category.id !== activeId) onChange(category);
  };
  const activeGroup: CategoryGroup = ordered.find((category) => category.id === centeredId)?.group_key ?? ordered[0]?.group_key ?? "drinks";

  return (
    <nav ref={navRef} aria-label="Kategorije" className="catalog-categories relative z-20 w-full">
      {groups.length > 1 ? (
        <div className="category-groups">
          <div data-groups className="category-groups-track" role="group" aria-label="Grupe kategorija">
            <svg aria-hidden className="category-groups-shape">
              <path className="category-groups-plate" d={groupsShape?.plate ?? ""} />
              <path className="category-groups-thumb" d={groupsShape?.thumbs[activeGroup] ?? ""} />
            </svg>
            {groups.map((group) => {
              const isActive = group.key === activeGroup;
              const first = ordered.find((category) => category.group_key === group.key);
              return (
                <button key={group.key} data-group-key={group.key} type="button" aria-pressed={isActive} onClick={() => first && select(first)} className={`category-group${isActive ? " is-active" : ""}`}>
                  <CategoryGroupIcon group={group.key} className="category-group-icon" />
                  <span>{group.label}</span>
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
