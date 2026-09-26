/**
 * @fileoverview Continuous 2D Drag-and-Drop Cartesian Coordinate Canvas.
 * Visualizes tasks as interactive draggable nodes on a continuous 1 to 5 Cartesian plane.
 * Operators can freely drag tasks across quadrants to dynamically recalculate priority parameters.
 * @packageDocumentation
 */

import React, { useState, useRef, useCallback } from 'react';
import { TaskItem, ImportanceLevel, UrgencyLevel, ImpactLevel, EffortLevel } from '../types/task';
import { Sparkles, Move, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface CartesianScatterCanvasProps {
  tasks: TaskItem[];
  mode: 'EISENHOWER' | 'IMPACT_EFFORT';
  onUpdateTaskCoords: (
    taskId: string,
    coords: { x: number; y: number }
  ) => void;
  onSelectTask?: (task: TaskItem) => void;
}

export const CartesianScatterCanvas: React.FC<CartesianScatterCanvasProps> = ({
  tasks,
  mode,
  onUpdateTaskCoords,
  onSelectTask
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragCoords, setDragCoords] = useState<{ x: number; y: number } | null>(null);
  const [hoveredTask, setHoveredTask] = useState<TaskItem | null>(null);
  const dragDistanceRef = useRef<number>(0);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasDraggedRef = useRef<boolean>(false);
  const suppressClickUntilRef = useRef<number>(0);
  const activeDragIdRef = useRef<string | null>(null);
  const dragCoordsRef = useRef<{ x: number; y: number } | null>(null);

  // Keep refs in sync for window event listeners
  activeDragIdRef.current = activeDragId;
  dragCoordsRef.current = dragCoords;

  const isEisenhower = mode === 'EISENHOWER';
  const xAxisLabel = isEisenhower ? 'Urgency (1 = Deferred → 5 = Immediate)' : 'Effort / Friction (1 = Quick Win → 5 = Exhaustive)';
  const yAxisLabel = isEisenhower ? 'Importance (1 = Incidental → 5 = Vital Life Objective)' : 'Impact / Leverage (1 = Negligible → 5 = Transformative)';

  // Quadrant Labels
  const quadrantTopLeft = isEisenhower ? 'Q2: SCHEDULE / STRATEGIC' : 'MAJOR PROJECTS (HIGH IMPACT, HIGH EFFORT)';
  const quadrantTopRight = isEisenhower ? 'Q1: DO FIRST (CRITICAL CRISIS)' : 'QUICK WINS (HIGH IMPACT, LOW EFFORT)';
  const quadrantBottomLeft = isEisenhower ? 'Q4: DE-PRIORITIZE (ELIMINATE)' : 'TIME SINKS (LOW IMPACT, HIGH EFFORT)';
  const quadrantBottomRight = isEisenhower ? 'Q3: DELEGATE / RUSH' : 'FILL-INS (LOW IMPACT, LOW EFFORT)';

  // Helper to map continuous 1-5 coordinate to percentage (0% to 100%)
  const valToPercent = (val: number) => {
    // 1 -> 8%, 5 -> 92%
    return 8 + ((val - 1) / 4) * 84;
  };

  // Helper to map mouse pixel position to 1-5 coordinate
  const clientToCoords = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 3, y: 3 };
    const rect = containerRef.current.getBoundingClientRect();
    const paddingX = rect.width * 0.08;
    const paddingY = rect.height * 0.08;
    const innerWidth = rect.width - paddingX * 2;
    const innerHeight = rect.height - paddingY * 2;

    const relX = clientX - rect.left - paddingX;
    const relY = clientY - rect.top - paddingY;

    // Invert Y because SVG/CSS 0 is top, but Cartesian 5 is top!
    const normX = Math.max(0, Math.min(1, relX / innerWidth));
    const normY = Math.max(0, Math.min(1, 1 - relY / innerHeight));

    const xVal = Math.round((1 + normX * 4) * 10) / 10;
    const yVal = Math.round((1 + normY * 4) * 10) / 10;

    return {
      x: Math.max(1, Math.min(5, xVal)),
      y: Math.max(1, Math.min(5, yVal))
    };
  }, []);

  const handlePointerDown = (task: TaskItem, e: React.PointerEvent) => {
    // Only primary mouse button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.stopPropagation();

    setActiveDragId(task.id);
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    dragDistanceRef.current = 0;
    hasDraggedRef.current = false;
    const coords = clientToCoords(e.clientX, e.clientY);
    setDragCoords(coords);

    const onWindowPointerMove = (moveEvt: PointerEvent) => {
      const dx = moveEvt.clientX - dragStartPosRef.current.x;
      const dy = moveEvt.clientY - dragStartPosRef.current.y;
      const dist = Math.hypot(dx, dy);
      dragDistanceRef.current = dist;

      if (dist > 5) {
        hasDraggedRef.current = true;
      }

      const nextCoords = clientToCoords(moveEvt.clientX, moveEvt.clientY);
      setDragCoords(nextCoords);
    };

    const onWindowPointerUp = (upEvt: PointerEvent) => {
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
      window.removeEventListener('pointercancel', onWindowPointerUp);

      const targetTaskId = activeDragIdRef.current || task.id;
      const finalCoords = dragCoordsRef.current || clientToCoords(upEvt.clientX, upEvt.clientY);

      if (hasDraggedRef.current && distCheck(upEvt)) {
        const snapX = Math.round(finalCoords.x);
        const snapY = Math.round(finalCoords.y);
        onUpdateTaskCoords(targetTaskId, {
          x: Math.max(1, Math.min(5, snapX)),
          y: Math.max(1, Math.min(5, snapY))
        });
        // Suppress synthetic click event following drop
        suppressClickUntilRef.current = Date.now() + 350;
      }

      setActiveDragId(null);
      setDragCoords(null);
    };

    const distCheck = (upEvt: PointerEvent) => {
      const dx = upEvt.clientX - dragStartPosRef.current.x;
      const dy = upEvt.clientY - dragStartPosRef.current.y;
      return Math.hypot(dx, dy) > 5 || dragDistanceRef.current > 5;
    };

    window.addEventListener('pointermove', onWindowPointerMove);
    window.addEventListener('pointerup', onWindowPointerUp);
    window.addEventListener('pointercancel', onWindowPointerUp);
  };

  return (
    <div className="relative w-full rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-xl backdrop-blur-xl p-5 sm:p-7 overflow-hidden transition-all">
      {/* HUD Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200 dark:border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2 text-cyan-800 dark:text-cyan-400 font-extrabold uppercase tracking-wider">
          <Move className="w-4 h-4 text-cyan-600 animate-pulse" />
          <span>INTERACTIVE CARTESIAN PLANE // DRAG CHIPS TO RE-CALIBRATE</span>
        </div>
        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
          <span>X: {xAxisLabel.split('(')[0]}</span>
          <span>•</span>
          <span>Y: {yAxisLabel.split('(')[0]}</span>
        </div>
      </div>

      {/* Floating Dragging Tooltip */}
      {activeDragId && dragCoords && (
        <div className="absolute top-4 right-6 z-30 px-3.5 py-1.5 rounded-xl bg-cyan-600 text-white font-mono text-xs font-bold shadow-lg animate-bounce-subtle">
          CALIBRATING COORDS: X={dragCoords.x.toFixed(1)} (
          {Math.round(dragCoords.x)}) • Y={dragCoords.y.toFixed(1)} (
          {Math.round(dragCoords.y)})
        </div>
      )}

      {/* Main Coordinate Grid Plane */}
      <div
        ref={containerRef}
        className="relative w-full h-[520px] sm:h-[600px] mt-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300/80 dark:border-slate-800/80 select-none overflow-hidden touch-none"
      >
        {/* Subtle Background Quadrant Tinting */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none opacity-40 dark:opacity-25">
          {/* Top Left Quadrant */}
          <div className="border-r border-b border-dashed border-slate-400 dark:border-slate-700 bg-amber-500/5 p-4 flex flex-col justify-start items-start">
            <span className="text-[10px] font-mono font-bold uppercase text-amber-700 dark:text-amber-400 tracking-wider">
              {quadrantTopLeft}
            </span>
          </div>
          {/* Top Right Quadrant */}
          <div className="border-b border-dashed border-slate-400 dark:border-slate-700 bg-rose-500/5 p-4 flex flex-col justify-start items-end">
            <span className="text-[10px] font-mono font-bold uppercase text-rose-700 dark:text-rose-400 tracking-wider">
              {quadrantTopRight}
            </span>
          </div>
          {/* Bottom Left Quadrant */}
          <div className="border-r border-dashed border-slate-400 dark:border-slate-700 bg-slate-500/5 p-4 flex flex-col justify-end items-start">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-700 dark:text-slate-400 tracking-wider">
              {quadrantBottomLeft}
            </span>
          </div>
          {/* Bottom Right Quadrant */}
          <div className="bg-cyan-500/5 p-4 flex flex-col justify-end items-end">
            <span className="text-[10px] font-mono font-bold uppercase text-cyan-700 dark:text-cyan-400 tracking-wider">
              {quadrantBottomRight}
            </span>
          </div>
        </div>

        {/* Center Crosshairs */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-400 dark:bg-slate-700 pointer-events-none" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-400 dark:bg-slate-700 pointer-events-none" />

        {/* Axis Number Indicators */}
        {[1, 2, 3, 4, 5].map((lvl) => {
          const xPercent = valToPercent(lvl);
          const yPercent = 100 - valToPercent(lvl);
          return (
            <React.Fragment key={lvl}>
              {/* X Axis marker at bottom */}
              <div
                className="absolute bottom-2 font-mono text-[10px] font-bold text-slate-600 dark:text-slate-400 -translate-x-1/2"
                style={{ left: `${xPercent}%` }}
              >
                {lvl}
              </div>
              {/* Y Axis marker at left */}
              <div
                className="absolute left-2 font-mono text-[10px] font-bold text-slate-600 dark:text-slate-400 -translate-y-1/2"
                style={{ top: `${yPercent}%` }}
              >
                {lvl}
              </div>
            </React.Fragment>
          );
        })}

        {/* Interactive Task Chips */}
        {tasks.map((task, index) => {
          const isDraggingThis = activeDragId === task.id;

          const rawX = isEisenhower ? task.urgency : task.effort;
          const rawY = isEisenhower ? task.importance : task.impact;

          const xVal = isDraggingThis && dragCoords ? dragCoords.x : rawX;
          const yVal = isDraggingThis && dragCoords ? dragCoords.y : rawY;

          const leftPercent = valToPercent(xVal);
          const topPercent = 100 - valToPercent(yVal);

          // Slight collision offset based on index so overlapping chips remain distinct
          const offsetX = isDraggingThis ? 0 : ((index % 3) - 1) * 6;
          const offsetY = isDraggingThis ? 0 : (((index * 2) % 3) - 1) * 6;

          const isCritical = task.importance >= 4 && task.urgency >= 4;
          const isHighLeverage = task.impact >= 4 && task.effort <= 2;

          return (
            <div
              key={task.id}
              onPointerDown={(e) => handlePointerDown(task, e)}
              onMouseEnter={() => setHoveredTask(task)}
              onMouseLeave={() => setHoveredTask(null)}
              onClick={(e) => {
                // If user dragged or just dropped, suppress the synthetic click event!
                if (
                  Date.now() < suppressClickUntilRef.current ||
                  hasDraggedRef.current ||
                  dragDistanceRef.current > 5
                ) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                if (onSelectTask) {
                  // Resolve the freshest version of the task by ID from tasks prop
                  const freshestTask = tasks.find((t) => t.id === task.id) || task;
                  onSelectTask(freshestTask);
                }
              }}
              style={{
                left: `calc(${leftPercent}% + ${offsetX}px)`,
                top: `calc(${topPercent}% + ${offsetY}px)`,
                zIndex: isDraggingThis ? 50 : 20 + (task.importance || 1)
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing transition-transform duration-100 ${
                isDraggingThis ? 'scale-115 shadow-2xl' : 'hover:scale-105 shadow-md'
              }`}
            >
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono font-bold backdrop-blur-md transition-colors ${
                  isDraggingThis
                    ? 'bg-cyan-600 text-white border-white ring-4 ring-cyan-500/30'
                    : isCritical
                    ? 'bg-rose-500 text-white border-rose-600 ring-2 ring-rose-500/20'
                    : isHighLeverage
                    ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-500/20'
                    : 'bg-white/95 dark:bg-slate-800/95 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isCritical
                      ? 'bg-white animate-ping'
                      : isHighLeverage
                      ? 'bg-amber-300'
                      : 'bg-cyan-500'
                  }`}
                />
                <span className="max-w-[120px] sm:max-w-[160px] truncate">
                  {task.title}
                </span>
                <span className="text-[10px] opacity-80 pl-0.5">
                  ({xVal.toFixed(0)},{yVal.toFixed(0)})
                </span>
              </div>
            </div>
          );
        })}

        {/* Hovered Task Preview HUD */}
        {hoveredTask && !activeDragId && (
          <div className="absolute bottom-4 left-4 max-w-sm p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-300 dark:border-slate-700 shadow-xl backdrop-blur-md pointer-events-none z-40 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-700 dark:text-cyan-400 font-bold uppercase">
                {hoveredTask.category}
              </span>
              {hoveredTask.dueDate && (
                <span className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <Clock className="w-3 h-3" />
                  {new Date(hoveredTask.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
            <h4 className="text-xs font-bold text-slate-950 dark:text-white mt-1 line-clamp-2">
              {hoveredTask.title}
            </h4>
            <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-slate-700 dark:text-slate-300">
              <span>IMP: {hoveredTask.importance}/5</span>
              <span>URG: {hoveredTask.urgency}/5</span>
              <span>IMPACT: {hoveredTask.impact}/5</span>
              <span>EFFORT: {hoveredTask.effort}/5</span>
            </div>
          </div>
        )}
      </div>

      {/* Axis Footer Descriptor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 text-[11px] font-mono text-slate-600 dark:text-slate-400">
        <span>◀ {xAxisLabel.split('→')[0]}</span>
        <span>{xAxisLabel.split('→')[1] ? '→ ' + xAxisLabel.split('→')[1] : ''}</span>
      </div>
    </div>
  );
};
