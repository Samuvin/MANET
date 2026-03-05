'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { textToMorse, morseToText, validateInput, MAX_MESSAGE_LENGTH } from '@/lib/morse';

const NODE_IDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const;
type NodeId = (typeof NODE_IDS)[number];

const VIEWBOX_W = 600;
const VIEWBOX_H = 480;

/** Node positions [x, y] in SVG viewBox coordinates. */
const NODE_POS: Record<NodeId, [number, number]> = {
  A: [120, 50],
  B: [300, 50],
  C: [480, 50],
  D: [80, 160],
  E: [240, 160],
  F: [360, 160],
  G: [520, 160],
  H: [160, 270],
  I: [300, 270],
  J: [440, 270],
  K: [240, 380],
  L: [360, 380],
};

/** Adjacency list: each node -> list of neighbors. */
const GRAPH: Record<NodeId, NodeId[]> = {
  A: ['B', 'D'],
  B: ['A', 'C', 'E'],
  C: ['B', 'G'],
  D: ['A', 'E', 'H'],
  E: ['B', 'D', 'F', 'I'],
  F: ['E', 'G', 'J'],
  G: ['C', 'F'],
  H: ['D', 'I', 'K'],
  I: ['E', 'H', 'J', 'K'],
  J: ['F', 'I', 'L'],
  K: ['H', 'I', 'L'],
  L: ['J', 'K'],
};

/** Edges as [from, to] pairs (from < to to avoid duplicates). */
const EDGES: [NodeId, NodeId][] = [
  ['A', 'B'],
  ['A', 'D'],
  ['B', 'C'],
  ['B', 'E'],
  ['C', 'G'],
  ['D', 'E'],
  ['D', 'H'],
  ['E', 'F'],
  ['E', 'I'],
  ['F', 'G'],
  ['F', 'J'],
  ['H', 'I'],
  ['H', 'K'],
  ['I', 'J'],
  ['I', 'K'],
  ['J', 'L'],
  ['K', 'L'],
];

/** BFS shortest path from source to dest. Returns path (node ids) or empty array. */
function shortestPath(source: NodeId, dest: NodeId): NodeId[] {
  if (source === dest) return [source];
  const queue: { node: NodeId; path: NodeId[] }[] = [{ node: source, path: [source] }];
  const visited = new Set<NodeId>([source]);
  while (queue.length > 0) {
    const { node, path } = queue.shift()!;
    for (const next of GRAPH[node] ?? []) {
      if (next === dest) return [...path, next];
      if (visited.has(next)) continue;
      visited.add(next);
      queue.push({ node: next, path: [...path, next] });
    }
  }
  return [];
}

const SPEED_OPTIONS = [
  { value: 400, label: 'Slower' },
  { value: 600, label: 'Normal' },
  { value: 900, label: 'Faster' },
] as const;

const VIEWBOX = `0 0 ${VIEWBOX_W} ${VIEWBOX_H}`;

const MORSE_DISPLAY_MAX = 50;

export default function ManetDemo() {
  const [source, setSource] = useState<NodeId>('A');
  const [dest, setDest] = useState<NodeId>('L');
  const [messageInput, setMessageInput] = useState('');
  const [path, setPath] = useState<NodeId[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [status, setStatus] = useState('');
  const [flowLine, setFlowLine] = useState('');
  const [receivedText, setReceivedText] = useState('');
  const [speedMs, setSpeedMs] = useState(600);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runPath = useCallback(
    (replay = false) => {
      const nextPath = replay && path.length > 0 ? path : shortestPath(source, dest);
      if (!replay) setPath(nextPath);
      setActiveIndex(-1);
      setStatus('');
      setFlowLine('');
      setReceivedText('');
      if (nextPath.length === 0) {
        setStatus('No path between selected nodes.');
        return;
      }
      if (nextPath.length === 1) {
        setStatus('Source and destination are the same.');
        return;
      }
      const validated = validateInput(messageInput.trim(), MAX_MESSAGE_LENGTH);
      const textToSend = validated.valid ? validated.sanitized : '';
      const morse = textToSend ? textToMorse(textToSend) : '';
      const decodedAtDest = textToSend ? morseToText(morse) : '';

      const hopCount = nextPath.length - 1;
      setStatus(
        `Path: ${nextPath.join(' → ')}${hopCount > 1 ? ` (${hopCount} hop${hopCount === 1 ? '' : 's'})` : ''}`
      );
      setIsAnimating(true);
      const pathNodes = nextPath;
      let i = 0;
      const tick = () => {
        if (i <= pathNodes.length) {
          setActiveIndex(i);
          if (morse) {
            const node = pathNodes[i];
            if (i === 0 && node) {
              setFlowLine(`Node ${node}: Sending → ${morse.length > MORSE_DISPLAY_MAX ? morse.slice(0, MORSE_DISPLAY_MAX) + '…' : morse}`);
            } else if (i > 0 && i < pathNodes.length - 1 && node) {
              setFlowLine(`Node ${node}: Relaying → ${morse.length > MORSE_DISPLAY_MAX ? morse.slice(0, MORSE_DISPLAY_MAX) + '…' : morse}`);
            } else if (i === pathNodes.length - 1 && node) {
              setFlowLine(`Node ${node}: Received.`);
              setReceivedText(decodedAtDest ? `Decoded: ${decodedAtDest}` : '');
            }
          } else if (i < pathNodes.length) {
            const node = pathNodes[i];
            setFlowLine(node ? `Node ${node}${i === 0 ? ': Source' : i === pathNodes.length - 1 ? ': Destination' : ': Relaying'}` : '');
          }
          i += 1;
          timeoutRef.current = setTimeout(tick, speedMs);
        } else {
          setIsAnimating(false);
        }
      };
      timeoutRef.current = setTimeout(tick, speedMs);
    },
    [source, dest, path, speedMs, messageInput]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleNodeClick = useCallback(
    (nodeId: NodeId) => {
      if (isAnimating) return;
      if (source === nodeId) {
        setSource(dest);
        setDest(nodeId);
      } else if (dest === nodeId) {
        setDest(source);
        setSource(nodeId);
      } else {
        setDest(nodeId);
      }
    },
    [source, dest, isAnimating]
  );

  const isActive = (nodeId: NodeId) =>
    activeIndex >= 0 && activeIndex < path.length && path[activeIndex] === nodeId;

  const getPathSegmentIndex = (from: NodeId, to: NodeId): number => {
    for (let i = 0; i < path.length - 1; i++) {
      if ((path[i] === from && path[i + 1] === to) || (path[i] === to && path[i + 1] === from))
        return i;
    }
    return -1;
  };

  const pathSegments = path.length < 2 ? [] : path.slice(0, -1).map((from, i) => [from, path[i + 1]] as [NodeId, NodeId]);

  return (
    <section className="manet-demo-section" aria-labelledby="manet-demo-heading">
      <h2 id="manet-demo-heading" className="section-heading">
        Interactive demo
      </h2>
      <p className="section-desc">
        Pick source and destination nodes, enter a message, then Send. The message is encoded to Morse and travels along the path; at the destination it is decoded so you see the full flow.
      </p>

      <div className="manet-demo-message-row">
        <label htmlFor="manet-demo-message" className="manet-demo-label-block">
          Message to send
        </label>
        <input
          id="manet-demo-message"
          type="text"
          className="manet-demo-message-input"
          placeholder="e.g. hello world"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={isAnimating}
          aria-describedby="manet-demo-message-hint"
        />
        <span id="manet-demo-message-hint" className="manet-demo-hint">
          Letters and numbers only. Converted to Morse and sent along the path.
        </span>
      </div>

      <div className="manet-demo-controls">
        <div className="manet-demo-control-group">
          <label htmlFor="demo-source-select" className="manet-demo-label">
            Source
          </label>
          <select
            id="demo-source-select"
            value={source}
            onChange={(e) => setSource(e.target.value as NodeId)}
            className="manet-demo-select"
            disabled={isAnimating}
            aria-label="Select source node"
          >
            {NODE_IDS.map((id) => (
              <option key={id} value={id}>
                Node {id}
              </option>
            ))}
          </select>
        </div>
        <div className="manet-demo-control-group">
          <label htmlFor="demo-dest-select" className="manet-demo-label">
            Destination
          </label>
          <select
            id="demo-dest-select"
            value={dest}
            onChange={(e) => setDest(e.target.value as NodeId)}
            className="manet-demo-select"
            disabled={isAnimating}
            aria-label="Select destination node"
          >
            {NODE_IDS.map((id) => (
              <option key={id} value={id}>
                Node {id}
              </option>
            ))}
          </select>
        </div>
        <div className="manet-demo-control-group">
          <label htmlFor="demo-speed" className="manet-demo-label">
            Speed
          </label>
          <select
            id="demo-speed"
            value={speedMs}
            onChange={(e) => setSpeedMs(Number(e.target.value))}
            className="manet-demo-select"
            disabled={isAnimating}
            aria-label="Animation speed"
          >
            {SPEED_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="manet-demo-actions">
          <button
            type="button"
            onClick={() => runPath(false)}
            className="btn btn-primary"
            disabled={isAnimating}
            aria-busy={isAnimating}
            aria-live="polite"
          >
            {isAnimating ? 'Sending…' : 'Send message'}
          </button>
          <button
            type="button"
            onClick={() => runPath(true)}
            className="btn btn-secondary"
            disabled={isAnimating || path.length < 2}
            aria-label="Replay last path"
          >
            Replay
          </button>
        </div>
      </div>

      <div
        className="manet-demo-graph-wrapper"
        role="img"
        aria-label="Network graph: nodes A through E. Click a node to set destination."
      >
        <svg
          viewBox={VIEWBOX}
          className="manet-demo-svg"
          aria-hidden="true"
        >
          <defs>
            <marker
              id="demo-arrow"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <path d="M0 0 L6 3 L0 6 Z" fill="var(--signal-on)" />
            </marker>
          </defs>
          {/* Static edges */}
          <g className="manet-demo-edges">
            {EDGES.map(([a, b]) => {
              const [x1, y1] = NODE_POS[a];
              const [x2, y2] = NODE_POS[b];
              const segIdx = getPathSegmentIndex(a, b);
              const isPathEdge = segIdx >= 0;
              const isPathActive = isPathEdge && activeIndex === segIdx + 1;
              return (
                <line
                  key={`${a}-${b}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  className={`manet-demo-edge ${isPathEdge ? 'manet-demo-edge-path' : ''} ${isPathActive ? 'manet-demo-edge-active' : ''}`}
                />
              );
            })}
          </g>
          {/* Animated path highlight (segment by segment) */}
          {pathSegments.map(([from, to], idx) => {
            const [x1, y1] = NODE_POS[from];
            const [x2, y2] = NODE_POS[to];
            const show = activeIndex >= idx + 1;
            if (!show) return null;
            const isCurrent = activeIndex === idx + 1;
            return (
              <line
                key={`path-${idx}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className="manet-demo-path-line"
                strokeDasharray={isCurrent ? '6 4' : undefined}
              />
            );
          })}
          {/* Nodes */}
          {NODE_IDS.map((id) => {
            const [x, y] = NODE_POS[id];
            const active = isActive(id);
            const isSource = source === id;
            const isDest = dest === id;
            return (
              <g
                key={id}
                className={`manet-demo-node-svg ${active ? 'manet-demo-node-svg-active' : ''} ${isSource ? 'manet-demo-node-svg-source' : ''} ${isDest ? 'manet-demo-node-svg-dest' : ''}`}
                transform={`translate(${x}, ${y})`}
              >
                <circle
                  r="24"
                  fill="var(--bg-panel)"
                  stroke="var(--border)"
                  strokeWidth="2"
                  className="manet-demo-node-circle"
                />
                <text
                  y="6"
                  textAnchor="middle"
                  fill="var(--text)"
                  fontSize="14"
                  fontWeight="600"
                >
                  {id}
                </text>
              </g>
            );
          })}
        </svg>
        {/* Invisible hit targets for keyboard + click (larger than circle) */}
        {NODE_IDS.map((id) => {
          const [x, y] = NODE_POS[id];
          const pctX = (x / VIEWBOX_W) * 100;
          const pctY = (y / VIEWBOX_H) * 100;
          return (
            <button
              key={id}
              type="button"
              className="manet-demo-node-hit"
              onClick={() => handleNodeClick(id)}
              disabled={isAnimating}
              style={{ left: `${pctX}%`, top: `${pctY}%`, transform: 'translate(-50%, -50%)' }}
              aria-label={`Node ${id}. Click to set as destination.`}
              aria-pressed={dest === id}
            />
          );
        })}
      </div>

      {(flowLine || receivedText) && (
        <div className="manet-demo-flow" role="log" aria-live="polite">
          {flowLine && <p className="manet-demo-flow-line">{flowLine}</p>}
          {receivedText && <p className="manet-demo-received">{receivedText}</p>}
        </div>
      )}

      <p
        className="manet-demo-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {status || (path.length >= 2 ? `Last path: ${path.join(' → ')}` : '\u00a0')}
      </p>
    </section>
  );
}
