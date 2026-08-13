"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { CATEGORY_GROUPS, CategoryGroupIcon, CategoryIcon, sortCategories } from "@/lib/categories";
import type { Category, CategoryGroup } from "@/types/domain";

type Slot = { key: string; category: Category | null };
type GroupsShape = { plate: string; thumbs: Record<string, string> };
type Geometry = { arcs: HTMLElement[]; labels: Array<HTMLElement | null>; ids: Array<string | null>; centers: number[]; span: number; radius: number };

const MIN_DROP = 16;
const MAX_DROP = 46;
const SETTLE_MS = 130;
const BAND_GAP = 6;
const LINE_GAP = 7;

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
  const thickness = Number.parseFloat(getComputedStyle(nav).getPropertyValue("--cat-groups-t")) || 34;
  const width = groups.offsetWidth;
  const padding = Number.parseFloat(getComputedStyle(groups).paddingTop) || 6;
  const centerX = width / 2;
  const radius = Math.max(120, centerY - groups.offsetTop - thickness / 2);
  const localCenterY = thickness / 2 + radius;
  const thumbs: Record<string, string> = {};
  for (const button of groups.querySelectorAll<HTMLElement>("[data-group-key]")) {
    const left = button.offsetLeft;
    const middle = left + button.offsetWidth / 2 - centerX;
    thumbs[button.dataset.groupKey ?? ""] = arcCapsule(left, left + button.offsetWidth, thickness - padding * 2, radius, centerX, localCenterY);
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
      const ratio = Math.min(1, Math.abs(distance) / geometry.span);
      const arc = geometry.arcs[index];
      if (!arc) return;
      arc.style.transform = `translate3d(0,${drop.toFixed(2)}px,0) scale(${(1 - 0.2 * ratio).toFixed(3)})`;
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
    if (!track || !geometry) return false;
    const center = geometry.centers[geometry.ids.indexOf(id)];
    if (center === undefined) return false;
    track.scrollTo({ left: center - track.clientWidth / 2, behavior });
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
      const { activeId: selected, onChange: change, byId: map } = latest.current;
      settleRef.current = 0;
      const id = centeredRef.current;
      const category = id && id !== selected ? map.get(id) : undefined;
      if (!category) return;
      committedRef.current = category.id;
      change(category);
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
    const observer = new ResizeObserver(() => {
      measure();
      // Ne diramo poziciju dok korisnik skroluje — inače se točak trza usred zamaha.
      if (!settleRef.current) centerOn(centeredRef.current, "auto");
      paint();
    });
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
    // Izbor koji je potekao iz samog točka (skrol ili klik) je već na mestu — ne centriramo ponovo.
    if (activeId === committedRef.current || !activeId || activeId === centeredRef.current) return;
    centerOn(activeId, reduceMotion ? "auto" : "smooth");
  }, [activeId, centerOn, reduceMotion]);

  const select = (category: Category) => {
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
