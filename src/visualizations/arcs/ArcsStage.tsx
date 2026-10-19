import { useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { formatPassage, passageRange, type Passage } from '../../core/bible/passage.ts';
import { formatInteger } from '../../shared/lib/format.ts';
import { ClickIcon, PinchIcon, RetryIcon, TapIcon } from '../../shared/ui/icons.tsx';
import controls from '../shared/components/controls.module.css';
import { collectConnections, connectionLinkIds, type Connection } from '../shared/connections.ts';
import type { LinkFilter } from '../shared/link-filter.ts';
import { useElementSize } from '../shared/use-element-size.ts';
import type { VizData } from '../shared/viz-data.ts';
import { buildArcInstances } from './arc-instances.ts';
import { ArcsController, type ArcHover } from './arcs-controller.ts';
import styles from './ArcsStage.module.css';

interface ArcsStageProps {
  readonly data: VizData;
  /** Whether it's on screen; hidden, it doesn't draw. */
  readonly active: boolean;
  /** Links that pass the filter, drawn as the background. */
  readonly linkIds: Int32Array;
  readonly filter: LinkFilter;
  readonly focus: Passage | null;
  /** A connection pointed at in the details panel: its arc and its whole passage stand out. */
  readonly preview: Connection | null;
  readonly onSelect: (passage: Passage | null) => void;
}

/** The arc diagram: a WebGL layer for arcs, a 2D overlay for the axis, and a hover tooltip. */
export function ArcsStage({
  data,
  active,
  linkIds,
  filter,
  focus,
  preview,
  onSelect,
}: ArcsStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<ArcsController | null>(null);
  const size = useElementSize(containerRef);
  const [hover, setHover] = useState<ArcHover | null>(null);
  /** El sistema le quitó el contexto WebGL y no lo devolvió (todavía). */
  const [contextLost, setContextLost] = useState(false);
  /** Cada reintento crea otro lienzo: uno que perdió su contexto no puede pedir otro. */
  const [attempt, setAttempt] = useState(0);
  const select = useEffectEvent((passage: Passage | null) => {
    onSelect(passage);
  });

  useEffect(() => {
    const container = containerRef.current;
    const glCanvas = glCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!container || !glCanvas || !overlayCanvas) {
      return undefined;
    }
    const controller = new ArcsController({
      container,
      glCanvas,
      overlayCanvas,
      versification: data.versification,
      onHover: setHover,
      onSelect: (passage) => {
        select(passage);
      },
      onClear: () => {
        select(null);
      },
      onContextChange: (state) => {
        setContextLost(state === 'lost');
      },
    });
    controllerRef.current = controller;
    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, [data.versification, attempt]);

  useEffect(() => {
    controllerRef.current?.setActive(active);
  }, [active, attempt]);

  useEffect(() => {
    controllerRef.current?.setSize(size.width, size.height);
  }, [size, attempt]);

  useEffect(() => {
    controllerRef.current?.setLinks(
      buildArcInstances(data.crossReferences.index, linkIds, data.verseGenres),
    );
  }, [data, linkIds, attempt]);

  useEffect(() => {
    const { index } = data.crossReferences;
    controllerRef.current?.setLinkResolver((range) =>
      buildArcInstances(
        index,
        connectionLinkIds(collectConnections(index, range, filter, data.verseGenres)),
        data.verseGenres,
      ),
    );
  }, [data, filter, attempt]);

  useEffect(() => {
    controllerRef.current?.setFocus(focus && passageRange(focus, data.versification));
  }, [focus, data.versification, attempt]);

  useEffect(() => {
    const link = preview?.link;
    controllerRef.current?.setPreview(
      link
        ? {
            links: buildArcInstances(
              data.crossReferences.index,
              Int32Array.of(link.id),
              data.verseGenres,
            ),
            passage: { start: link.targetStart, end: link.targetEnd },
          }
        : null,
    );
  }, [preview, data, attempt]);

  return (
    <>
      <div
        ref={containerRef}
        className={styles.stage}
        tabIndex={0}
        role="application"
        aria-label="Diagrama de arcos de las referencias cruzadas. Arrastra o usa las flechas para mover, desplaza o usa +/- para acercar, haz clic para enfocar un pasaje y Escape para quitar el foco. En una pantalla táctil, mantén el dedo para ver un pasaje."
      >
        <canvas key={attempt} ref={glCanvasRef} className={styles.canvas} />
        <canvas ref={overlayCanvasRef} className={styles.canvas} aria-hidden="true" />
        {hover && <HoverTooltip hover={hover} data={data} filter={filter} size={size} />}
      </div>
      {/* Fuera del diagrama: sus gestos se quedan con los toques y el botón no los recibiría. */}
      {contextLost && (
        <div role="alert" className={styles.notice}>
          <p>El dispositivo interrumpió el dibujo de los arcos.</p>
          <button
            type="button"
            className={controls.button}
            onClick={() => {
              setContextLost(false);
              setAttempt((previous) => previous + 1);
            }}
          >
            <RetryIcon />
            Volver a dibujar
          </button>
        </div>
      )}
    </>
  );
}

interface Size {
  readonly width: number;
  readonly height: number;
}

/** Gap between a mouse pointer and its tooltip. */
const MOUSE_OFFSET_PX = 14;
/** A finger hides what's under it, so its tooltip floats this far above, like iOS's loupe. */
const FINGER_CLEARANCE_PX = 56;
/** The tooltip never comes closer than this to the stage's edges. */
const EDGE_PX = 8;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, Math.max(min, max)));
}

/**
 * Places the tooltip from its measured size. Beside a mouse pointer (below and to the right, or
 * the other side near an edge); centered above a finger, or below it when there is no room.
 */
function placeTooltip(tooltip: HTMLElement, hover: ArcHover, stage: Size): void {
  const { offsetWidth: width, offsetHeight: height } = tooltip;
  let left: number;
  let top: number;
  if (hover.input === 'mouse') {
    left = hover.x + MOUSE_OFFSET_PX;
    if (left + width > stage.width - EDGE_PX) {
      left = hover.x - MOUSE_OFFSET_PX - width;
    }
    top = hover.y + MOUSE_OFFSET_PX;
    if (top + height > stage.height - EDGE_PX) {
      top = hover.y - MOUSE_OFFSET_PX - height;
    }
  } else {
    left = hover.x - width / 2;
    top = hover.y - FINGER_CLEARANCE_PX - height;
    if (top < EDGE_PX) {
      top = hover.y + FINGER_CLEARANCE_PX;
    }
  }
  tooltip.style.left = `${String(clamp(left, EDGE_PX, stage.width - width - EDGE_PX))}px`;
  tooltip.style.top = `${String(clamp(top, EDGE_PX, stage.height - height - EDGE_PX))}px`;
}

function HoverTooltip({
  hover,
  data,
  filter,
  size,
}: {
  readonly hover: ArcHover;
  readonly data: VizData;
  readonly filter: LinkFilter;
  readonly size: Size;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { versification, crossReferences, verseGenres } = data;
  const count = useMemo(() => {
    const connections = collectConnections(
      crossReferences.index,
      passageRange(hover.passage, versification),
      filter,
      verseGenres,
    );
    return connectionLinkIds(connections).length;
  }, [crossReferences.index, hover.passage, versification, filter, verseGenres]);
  // After every render: the content, and so the size, changes with the passage. Before paint, so
  // the tooltip never shows in the wrong place.
  useLayoutEffect(() => {
    if (tooltipRef.current) {
      placeTooltip(tooltipRef.current, hover, size);
    }
  });
  return (
    <div ref={tooltipRef} className={styles.tooltip} data-input={hover.input}>
      <strong>{formatPassage(hover.passage, versification)}</strong>
      <span>
        {formatInteger(count)} {count === 1 ? 'connection' : 'connections'}
      </span>
      <span className={styles.gestures}>
        {hover.input === 'touch' ? <TapIcon /> : <ClickIcon />} to focus · <PinchIcon /> to zoom
      </span>
    </div>
  );
}
