// A small, dependency-free force-directed layout — enough for a co-author graph
// of a few hundred nodes. Models repulsion between every pair (O(n²) per tick),
// spring attraction along links, and a gentle pull toward the centre. An `alpha`
// value cools the system over time so the loop can stop once it settles.

export interface SimNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  /** When pinned (dragged), the node is held at fx/fy instead of integrating. */
  fx: number | null;
  fy: number | null;
}

export interface SimLink {
  source: SimNode;
  target: SimNode;
  /** Edge weight — number of joint papers. */
  w: number;
}

export interface SimOptions {
  width: number;
  height: number;
  charge?: number; // repulsion strength (negative-ish magnitude)
  linkDistance?: number;
  linkStrength?: number;
  gravity?: number; // pull toward centre
  collidePadding?: number; // extra gap kept between circle edges
}

export class ForceSim {
  nodes: SimNode[];
  links: SimLink[];
  width: number;
  height: number;

  alpha = 1;
  alphaMin = 0.005;
  alphaDecay = 0.0228; // ~300 ticks to settle, like d3's default
  velocityDecay = 0.6;
  /** Floor on pair distance so the inverse-square repulsion can't blow up. */
  minDist = 12;
  /** Per-axis speed clamp — a second guard against runaway integration. */
  maxSpeed = 120;

  private charge: number;
  private linkDistance: number;
  private linkStrength: number;
  private gravity: number;
  private collidePadding: number;

  constructor(nodes: SimNode[], links: SimLink[], opts: SimOptions) {
    this.nodes = nodes;
    this.links = links;
    this.width = opts.width;
    this.height = opts.height;
    this.charge = opts.charge ?? 30000;
    this.linkDistance = opts.linkDistance ?? 120;
    this.linkStrength = opts.linkStrength ?? 0.05;
    this.gravity = opts.gravity ?? 0.026;
    this.collidePadding = opts.collidePadding ?? 14;
  }

  /** Re-energise the simulation (e.g. after a drag or resize). */
  reheat(value = 0.7) {
    this.alpha = Math.max(this.alpha, value);
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  /** Advance one step. Returns false once the layout has cooled. */
  tick(): boolean {
    if (this.alpha < this.alphaMin) return false;
    this.alpha += (0 - this.alpha) * this.alphaDecay;

    const { nodes, links } = this;
    const cx = this.width / 2;
    const cy = this.height / 2;
    const a = this.alpha;
    const minD2 = this.minDist * this.minDist;

    // Many-body repulsion (every unordered pair). Distance is floored at minDist
    // so coincident/near-coincident nodes can't produce an unbounded impulse.
    for (let i = 0; i < nodes.length; i++) {
      const ni = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const nj = nodes[j];
        let dx = ni.x - nj.x;
        let dy = ni.y - nj.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1e-6) {
          // jitter coincident nodes apart deterministically
          dx = (((i * 31 + j) % 7) - 3) * 0.5 || 0.5;
          dy = (((i * 17 + j) % 5) - 2) * 0.5 || 0.5;
          d2 = dx * dx + dy * dy;
        }
        const dist = Math.sqrt(d2);
        const force = (this.charge * a) / Math.max(d2, minD2);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        ni.vx += fx;
        ni.vy += fy;
        nj.vx -= fx;
        nj.vy -= fy;
      }
    }

    // Spring attraction along links. Stronger weights pull a bit harder.
    for (const link of links) {
      const s = link.source;
      const tg = link.target;
      let dx = tg.x - s.x;
      let dy = tg.y - s.y;
      let dist = Math.sqrt(dx * dx + dy * dy) || 0.5;
      const k = this.linkStrength * Math.min(1 + Math.log(link.w), 3) * a;
      const diff = (dist - this.linkDistance) * k;
      const fx = (dx / dist) * diff;
      const fy = (dy / dist) * diff;
      s.vx += fx;
      s.vy += fy;
      tg.vx -= fx;
      tg.vy -= fy;
    }

    // Gravity toward centre + integrate.
    for (const n of nodes) {
      if (n.fx != null && n.fy != null) {
        n.x = n.fx;
        n.y = n.fy;
        n.vx = 0;
        n.vy = 0;
        continue;
      }
      n.vx += (cx - n.x) * this.gravity * a;
      n.vy += (cy - n.y) * this.gravity * a;
      n.vx *= this.velocityDecay;
      n.vy *= this.velocityDecay;
      const m = this.maxSpeed;
      if (n.vx > m) n.vx = m;
      else if (n.vx < -m) n.vx = -m;
      if (n.vy > m) n.vy = m;
      else if (n.vy < -m) n.vy = -m;
      n.x += n.vx;
      n.y += n.vy;
    }

    // Collision: keep circles (plus padding) from overlapping. A couple of
    // relaxation passes nudge overlapping pairs apart along their centre line;
    // pinned (dragged) nodes hold position and push the other aside.
    const pad = this.collidePadding;
    for (let iter = 0; iter < 2; iter++) {
      for (let i = 0; i < nodes.length; i++) {
        const ni = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const nj = nodes[j];
          let dx = nj.x - ni.x;
          let dy = nj.y - ni.y;
          const minSep = ni.r + nj.r + pad;
          let d2 = dx * dx + dy * dy;
          if (d2 >= minSep * minSep) continue;
          let dist = Math.sqrt(d2);
          if (dist < 1e-6) {
            dx = ((i * 13 + j) % 5) - 2 || 1;
            dy = ((i * 7 + j) % 5) - 2 || 1;
            dist = Math.sqrt(dx * dx + dy * dy);
          }
          const push = minSep - dist;
          const ox = (dx / dist) * push;
          const oy = (dy / dist) * push;
          const iPinned = ni.fx != null;
          const jPinned = nj.fx != null;
          if (iPinned && jPinned) continue;
          if (iPinned) {
            nj.x += ox;
            nj.y += oy;
          } else if (jPinned) {
            ni.x -= ox;
            ni.y -= oy;
          } else {
            ni.x -= ox * 0.5;
            ni.y -= oy * 0.5;
            nj.x += ox * 0.5;
            nj.y += oy * 0.5;
          }
        }
      }
    }

    return true;
  }
}

/** Phyllotaxis (sunflower) seeding gives an even, non-overlapping initial spread. */
export function seedPositions(nodes: SimNode[], width: number, height: number) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.42;
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < nodes.length; i++) {
    const t = nodes.length <= 1 ? 0 : i / (nodes.length - 1);
    const r = radius * Math.sqrt(t);
    const theta = i * golden;
    nodes[i].x = cx + r * Math.cos(theta);
    nodes[i].y = cy + r * Math.sin(theta);
    nodes[i].vx = 0;
    nodes[i].vy = 0;
  }
}
