#!/usr/bin/env python3
"""Build the README header images: docs/readme/vulcan.svg (desktop) and vulcan-mobile.svg (phone).

    python3 docs/readme/make_svg.py

Stdlib only (Pillow is used to shrink the embedded screenshots when it is installed).
Colours and type come from frontend/Design/screens/shared/tokens.css. Phase status is read
from the PLAN.md section 10 table, so rerun this after a phase is ticked off. Screenshots come
from docs/readme/screens/, made by shoot.cjs.
The animations are plain CSS inside the SVG (entrances, drifting ember light, flowing arrows),
and they switch off for people who ask their system for reduced motion.
"""
import base64
import html
import io
import re
import textwrap
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
SHOTS = HERE / "screens"

# ---------------------------------------------------------------- tokens (tokens.css)
BASE, ELEV, CARD, OVERLAY, HAIR = "#0b0b0d", "#131316", "#1b1b20", "#232329", "#2a2a31"
TEXT, SEC, MUTED = "#f5f2ec", "#a6a29b", "#6e6a64"
EMBER, E300, E400, E700 = "#ff6a00", "#ffb347", "#ff8a3d", "#c2410c"
BODY_TINT = "#d9d4cc"
DISPLAY = "'Space Grotesk', Inter, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
BODY = "Inter, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace"
TS = 1.4  # stretches every entrance so the page settles over a few seconds

# ---------------------------------------------------------------- content
TAGLINE = "Forge your physique."
BRIEF = ("An AI-native fitness app for Android. Workout tracking, AI coaching, food photo analysis, "
         "physique analysis and a step-driven calorie budget, personalized to every user.")

PILLARS = [
    ("Gym tracker", "Routines and live sets with RPE, supersets and dropsets. Rest timer, PRs, "
                    "1RM and volume charts. Logs with zero signal."),
    ("AI programs", "Gemini writes a full program from your profile and real training history, "
                    "then saves it as routines you can edit."),
    ("AI food logging", "Photo in, calories and macros out. You confirm or adjust before it counts "
                        "against today's targets."),
    ("Physique analysis", "Check-in photos name strong and weak areas, and those focus areas feed "
                          "straight into the next program."),
    ("Steps and budget", "Health Connect steps refine the daily calorie target. The weight trend "
                         "tunes cut and bulk budgets."),
    ("Personal engine", "Pure, unit-tested functions for TDEE, macro targets, progression, stalls "
                        "and deloads. Computed, never stored."),
]

STACK = [
    ("App", ["TypeScript", "Expo", "React Native", "Expo Router", "NativeWind", "TanStack Query", "Zustand"]),
    ("Backend", ["Python", "FastAPI", "SQLModel", "Alembic", "PyJWT", "google-genai"]),
    ("Platform", ["Supabase", "Docker", "AWS EC2", "Terraform", "Cloudflare Tunnel", "GitHub Actions", "EAS"]),
]

SCREENS = [("s02-welcome", "WELCOME"), ("s10-active-workout", "LIVE WORKOUT"),
           ("s19-ai-food-confirm", "AI FOOD SCAN"), ("s24-physique-analysis", "PHYSIQUE READ"),
           ("s26-program-review", "AI PROGRAM")]
SCREENS_MOBILE = [1, 2, 3]

PHASE_SHORT = ["Scaffold", "Onboarding", "Gym tracker", "Steps", "AI food", "AI programs", "Physique", "Launch"]


def read_phases():
    rows = re.findall(r"^\|\s*(\d+)\s*\|\s*`phases/[^`]+`\s*\|\s*(.+?)\s*\|\s*(✅|⬜)\s*\|",
                      (ROOT / "PLAN.md").read_text(encoding="utf-8"), re.M)
    return [(int(n), PHASE_SHORT[int(n)] if int(n) < len(PHASE_SHORT) else f"Phase {n}", d, s == "✅")
            for n, d, s in rows]


PHASES = read_phases()
DONE = sum(1 for p in PHASES if p[3])
CURRENT = next((p for p in PHASES if not p[3]), None)


def shot_uri(name, width=330):
    raw = (SHOTS / f"{name}.jpg").read_bytes()
    try:
        from PIL import Image
        im = Image.open(io.BytesIO(raw)).convert("RGB")
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=80, optimize=True, progressive=True)
        raw = buf.getvalue()
    except ImportError:
        pass
    return "data:image/jpeg;base64," + base64.b64encode(raw).decode()


def esc(s):
    return html.escape(s, quote=False)


def ease_stops(c0, c1, n=13):
    r0, r1 = [int(c0[i:i + 2], 16) for i in (1, 3, 5)], [int(c1[i:i + 2], 16) for i in (1, 3, 5)]
    out = []
    for k in range(n):
        t = k / (n - 1)
        e = t * t * (3 - 2 * t)
        out.append(f'<stop offset="{t:.3f}" stop-color="#%02x%02x%02x"/>'
                   % tuple(round(a + (b - a) * e) for a, b in zip(r0, r1)))
    return "".join(out)


def star(cx, cy, R):
    """VULCAN's eight-point forge star: long cardinal points, shorter diagonals."""
    import math
    pts = []
    for k in range(16):
        a = math.radians(k * 22.5 - 90)
        r = (R if k % 4 == 0 else R * 0.6) if k % 2 == 0 else R * 0.2
        pts.append(f"{cx + r * math.cos(a):.1f},{cy + r * math.sin(a):.1f}")
    return " ".join(pts)


# ================================================================ builder
class Page:
    def __init__(self, mobile):
        self.m = mobile
        self.W = 480 if mobile else 960
        self.LX, self.RX = (30, 450) if mobile else (72, 888)
        self.RL, self.RR = (14, 466) if mobile else (48, 912)
        self.out = []

    def add(self, s):
        self.out.append(s)

    def text(self, x, y, s, size, fill, family=BODY, anchor="start", spacing=0, weight=None, extra=""):
        a = f' text-anchor="{anchor}"' if anchor != "start" else ""
        sp = f' letter-spacing="{spacing}"' if spacing else ""
        w = f' font-weight="{weight}"' if weight else ""
        self.add(f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" fill="{fill}"{w}{a}{sp}{extra}>{esc(s)}</text>')

    def rise(self, d):
        self.add(f'<g class="rise" style="--d:{d * TS:.2f}s">')

    def end(self):
        self.add("</g>")

    def label(self, y, n, name, d):
        self.rise(d)
        self.add(f'<path d="M{self.RL} {y}H{self.RR}" stroke="{TEXT}" stroke-opacity=".16" fill="none"/>')
        self.add(f'<path d="M{self.RL - 6} {y}H{self.RL + 6}M{self.RL} {y - 6}V{y + 6}M{self.RR - 6} {y}H{self.RR + 6}M{self.RR} {y - 6}V{y + 6}" '
                 f'stroke="{EMBER}" stroke-opacity=".75" stroke-width="1.2" fill="none"/>')
        self.text(self.LX, y + 32, f"{n:02d} — {name}", 13 if self.m else 14, SEC, MONO, spacing=1.6)
        self.end()

    def chips(self, x0, y0, chips, size):
        """Chips left to right, wrapping at the right edge. Returns the y below the last row."""
        x, top = x0, y0
        cw = size * 0.6
        for c in chips:
            w = len(c) * cw + 26
            if x + w > self.RX and x > x0:
                x, top = x0, top + 46
            self.add(f'<rect x="{x:.0f}" y="{top}" width="{w:.0f}" height="36" rx="10" fill="{CARD}" stroke="{HAIR}"/>')
            self.text(f"{x + w / 2:.0f}", top + 24, c, size, TEXT, MONO, "middle")
            x += w + 10
        return top + 36

    # ------------------------------------------------------------ sections
    def header(self):
        m, LX, RX = self.m, self.LX, self.RX
        self.rise(0)
        self.text(LX, 46 if m else 60, "00 — VULCAN", 13 if m else 14, SEC, MONO, spacing=1.6)
        self.text(RX, 46 if m else 60, "ANDROID · IN BUILD", 13 if m else 14, SEC, MONO, "end", 1.6)
        self.end()

        R, cx, cy = (30, LX + 30, 118) if m else (46, LX + 46, 152)
        self.rise(0.1)
        self.add(f'<g class="pulse"><circle cx="{cx}" cy="{cy}" r="{R * 1.6:.0f}" fill="url(#ember)"/></g>')
        self.add(f'<polygon points="{star(cx, cy, R)}" fill="url(#flame)" filter="url(#glow)"/>')
        self.add(f'<polygon points="{star(cx, cy, R * 0.55)}" fill="none" stroke="{BASE}" stroke-opacity=".55" stroke-width="1.4"/>')
        self.end()
        self.rise(0.2)
        self.text(cx + R + (18 if m else 28), cy + (18 if m else 27), "VULCAN", 52 if m else 80, TEXT, DISPLAY,
                  spacing=6 if m else 10, weight=700)
        self.end()

        y = cy + R + (58 if m else 76)
        self.rise(0.35)
        self.text(LX, y, TAGLINE, 28 if m else 34, "url(#flameText)", DISPLAY, weight=600, spacing=-.3)
        self.end()
        lines = textwrap.wrap(BRIEF, 48 if m else 74, break_on_hyphens=False)
        y += 46 if m else 52
        self.rise(0.5)
        for i, ln in enumerate(lines):
            self.text(LX, y + i * (27 if m else 30), ln, 17 if m else 19, BODY_TINT)
        self.end()
        y += (len(lines) - 1) * (27 if m else 30) + (54 if m else 62)

        specs = [("STATUS", f"Phase {CURRENT[0]} · {CURRENT[1]}" if CURRENT else "All phases done",
                  f"{DONE} of {len(PHASES)} phases done"),
                 ("AI", "Gemini Flash-Lite", "behind a FastAPI proxy"),
                 ("DATA", "Supabase", "Postgres with RLS everywhere")]
        self.rise(0.7)
        if m:
            for i, (k, v, sub) in enumerate(specs):
                x = LX + (i % 2) * 214
                yy = y + (i // 2) * 74
                if i % 2:
                    self.add(f'<path d="M{x - 14} {yy - 12}V{yy + 46}" stroke="{TEXT}" stroke-opacity=".16"/>')
                self.text(x, yy, k, 12, MUTED, MONO, spacing=1.4)
                self.text(x, yy + 24, v, 16, TEXT, MONO)
                self.text(x, yy + 44, sub, 12.5, MUTED, MONO)
            y += 74 + 46
        else:
            for i, (k, v, sub) in enumerate(specs):
                x = LX + i * 282
                if i:
                    self.add(f'<path d="M{x - 16} {y - 12}V{y + 48}" stroke="{TEXT}" stroke-opacity=".16"/>')
                self.text(x, y, k, 12, MUTED, MONO, spacing=1.6)
                self.text(x, y + 26, v, 16, TEXT, MONO)
                self.text(x, y + 46, sub, 13, MUTED, MONO)
            y += 46
        self.end()
        return y + (60 if m else 70)

    def screens(self, y):
        m, LX, RX = self.m, self.LX, self.RX
        self.label(y, 1, "SCREENS", 0.85)
        picks = [SCREENS[i] for i in SCREENS_MOBILE] if m else SCREENS
        gap = 12 if m else 18
        pw = (RX - LX + (12 if m else 28) - gap * (len(picks) - 1)) / len(picks)
        x0 = LX - (6 if m else 14)
        pad = 5
        iw = pw - 2 * pad
        ih = iw * 844 / 390
        top = y + 70
        for i, (name, cap) in enumerate(picks):
            x = x0 + i * (pw + gap)
            stagger = (16 if i % 2 else 0) if not m else (14 if i == 1 else 0)
            yy = top + stagger
            self.add(f'<g class="rise" style="--d:{(1.0 + i * 0.12) * TS:.2f}s">')
            self.add(f'<clipPath id="c{i}{int(m)}"><rect x="{x + pad:.1f}" y="{yy + pad:.1f}" width="{iw:.1f}" height="{ih:.1f}" rx="{16 if m else 18}"/></clipPath>')
            self.add(f'<rect x="{x:.1f}" y="{yy}" width="{pw:.1f}" height="{ih + 2 * pad:.1f}" rx="{20 if m else 22}" fill="{CARD}" stroke="{HAIR}"/>')
            self.add(f'<image href="{shot_uri(name)}" x="{x + pad:.1f}" y="{yy + pad:.1f}" width="{iw:.1f}" height="{ih:.1f}" '
                     f'preserveAspectRatio="xMidYMid slice" clip-path="url(#c{i}{int(m)})"/>')
            self.text(f"{x + pw / 2:.1f}", f"{yy + ih + 2 * pad + 28:.1f}", cap, 11.5 if not m else 11, SEC, MONO, "middle", 1.4)
            self.end()
        return top + ih + 2 * pad + 16 + 28 + 40

    def pillars(self, y):
        m, LX, RX = self.m, self.LX, self.RX
        self.label(y, 2, "WHAT IT DOES", 1.6)
        cols = 1 if m else 2
        cw = (RX - LX + 28) if m else 404
        step = cw + 16
        wrap = 50 if m else 48
        lh = 23 if m else 22
        bs = 16 if m else 15
        self.rise(1.75)
        yy = y + 70
        heights = [len(textwrap.wrap(b, wrap)) for _, b in PILLARS]
        for row in range((len(PILLARS) + cols - 1) // cols):
            idx = list(range(row * cols, min(len(PILLARS), row * cols + cols)))
            h = 78 + max(heights[i] for i in idx) * lh
            for j, i in enumerate(idx):
                t, b = PILLARS[i]
                x = LX - 14 + j * step
                self.add(f'<rect x="{x}" y="{yy}" width="{cw}" height="{h}" rx="14" fill="{CARD}" stroke="{HAIR}"/>')
                self.add(f'<rect x="{x}" y="{yy + 18}" width="3" height="28" rx="1.5" fill="url(#flame)"/>')
                self.text(x + 22, yy + 30, f"{i + 1:02d}", 12, E400, MONO, spacing=1.4)
                self.text(x + 56, yy + 39, t, 21, TEXT, DISPLAY, weight=600)
                for k, ln in enumerate(textwrap.wrap(b, wrap)):
                    self.text(x + 22, yy + 72 + k * lh, ln, bs, SEC)
            yy += h + 16
        self.end()
        return yy + 24

    def architecture(self, y):
        m, LX, RX = self.m, self.LX, self.RX
        self.label(y, 3, "HOW IT'S BUILT", 2.0)
        y0 = y + 72

        def box(x, yy, w, h, kick, title, subs, hot=False):
            self.add(f'<rect x="{x}" y="{yy}" width="{w}" height="{h}" rx="14" fill="{CARD}" '
                     f'stroke="{EMBER if hot else HAIR}" stroke-opacity="{.7 if hot else 1}"/>')
            self.text(x + 18, yy + 28, kick, 11.5, E400 if hot else MUTED, MONO, spacing=1.4)
            self.text(x + 18, yy + 56, title, 20, TEXT, DISPLAY, weight=600)
            for k, s in enumerate(subs):
                self.text(x + 18, yy + 80 + k * 20, s, 12.5, SEC, MONO)

        def arrow(path, lx=None, ly=None, lab=None, anchor="middle", dashed=False):
            self.add(f'<path d="{path}" stroke="{HAIR}" stroke-width="2" fill="none"/>')
            if not dashed:
                self.add(f'<path class="flow" d="{path}" stroke="{EMBER}" stroke-width="2" stroke-dasharray="4 10" '
                         f'stroke-linecap="round" fill="none"/>')
            else:
                self.add(f'<path d="{path}" stroke="{SEC}" stroke-opacity=".5" stroke-width="1.5" stroke-dasharray="3 5" fill="none"/>')
            if lab:
                self.text(lx, ly, lab, 11, SEC, MONO, anchor, 1.2)

        app_subs = ["Expo · React Native", "TypeScript, Expo Router", "TanStack Query, Zustand", "Health Connect steps"]
        self.rise(2.15)
        if not m:
            ax, aw = LX - 14, 250
            sx, sw = 398, 250
            gx, gw = 722, RX + 14 - 722
            box(ax, y0, aw, 212, "MOBILE", "VULCAN app", app_subs, hot=True)
            box(sx, y0, sw, 96, "DATA", "Supabase", ["Postgres + RLS · Auth"])
            box(sx, y0 + 116, sw, 96, "AI PROXY", "FastAPI", ["JWT · quotas · call log"])
            box(gx, y0 + 116, gw, 96, "MODEL", "Gemini", ["Flash-Lite"])
            arrow(f"M{ax + aw} {y0 + 48}H{sx}", (ax + aw + sx) / 2, y0 + 40, "CRUD")
            arrow(f"M{ax + aw} {y0 + 164}H{sx}", (ax + aw + sx) / 2, y0 + 156, "JWT · AI")
            arrow(f"M{sx + sw} {y0 + 164}H{gx}", (sx + sw + gx) / 2, y0 + 156, "SDK")
            arrow(f"M{sx + sw / 2} {y0 + 116}V{y0 + 96}", sx + sw / 2 + 10, y0 + 110, "SERVICE ROLE", "start", dashed=True)
            yb = y0 + 212
        else:
            fw = RX - LX + 28
            ax = LX - 14
            box(ax, y0, fw, 152, "MOBILE", "VULCAN app", app_subs, hot=True)
            hw = (fw - 16) / 2
            y1 = y0 + 152 + 56
            box(ax, y1, hw, 118, "DATA", "Supabase", ["Postgres + RLS", "Auth · Storage"])
            box(ax + hw + 16, y1, hw, 118, "AI PROXY", "FastAPI", ["JWT · quotas", "call log"])
            arrow(f"M{ax + hw / 2:.0f} {y0 + 152}V{y1}", ax + hw / 2 + 10, y0 + 152 + 32, "CRUD", "start")
            arrow(f"M{ax + hw + 16 + hw / 2:.0f} {y0 + 152}V{y1}", ax + hw + 16 + hw / 2 + 10, y0 + 152 + 32, "JWT · AI", "start")
            arrow(f"M{ax + hw + 16} {y1 + 54}H{ax + hw}", dashed=True)
            y2 = y1 + 118 + 56
            box(ax + hw + 16, y2, hw, 96, "MODEL", "Gemini", ["Flash-Lite"])
            arrow(f"M{ax + hw + 16 + hw / 2:.0f} {y1 + 118}V{y2}", ax + hw + 16 + hw / 2 + 10, y1 + 118 + 32, "SDK", "start")
            yb = y2 + 96
        self.end()

        rule = ("Normal data goes straight from the app to Supabase. Only AI requests reach the API, "
                "which holds the Gemini key, checks quotas and logs every call.")
        self.rise(2.3)
        yy = yb + 52
        for k, ln in enumerate(textwrap.wrap(rule, 48 if m else 82)):
            self.text(LX, yy + k * (27 if m else 29), ln, 17 if m else 18, BODY_TINT)
        yy += (len(textwrap.wrap(rule, 48 if m else 82)) - 1) * (27 if m else 29) + 56
        self.end()

        self.rise(2.45)
        for name, chips in STACK:
            self.text(LX, yy, name.upper(), 12.5, MUTED, MONO, spacing=1.4)
            yy = self.chips(LX, yy + 14, chips, 14 if m else 14.5) + 40
        self.end()
        return yy + 8

    def phases(self, y):
        m, LX, RX = self.m, self.LX, self.RX
        self.label(y, 4, "BUILD PHASES", 2.6)
        self.rise(2.75)
        self.text(LX, y + 92, f"{DONE}", 52 if m else 58, TEXT, DISPLAY, weight=700)
        self.text(LX + (44 if m else 50), y + 92, f"/ {len(PHASES)}", 22 if m else 24, MUTED, DISPLAY, weight=500)
        self.text(LX, y + 120, "phases shipped", 13.5, SEC, MONO, spacing=.4)
        if CURRENT:
            nx = LX + (170 if m else 230)
            self.text(nx, y + 70, "NOW", 12, E400, MONO, spacing=1.4)
            for k, ln in enumerate(textwrap.wrap(CURRENT[2], 26 if m else 52)[:3]):
                self.text(nx, y + 94 + k * 22, ln, 15.5 if m else 17, TEXT)
        self.end()

        def node(cx, cy, done, cur):
            if done:
                self.add(f'<circle cx="{cx:.1f}" cy="{cy}" r="11" fill="url(#flame)"/>')
                self.add(f'<path d="M{cx - 4.5:.1f} {cy}l3 3 6-6.5" stroke="{BASE}" stroke-width="2.2" fill="none" '
                         f'stroke-linecap="round" stroke-linejoin="round"/>')
            elif cur:
                self.add(f'<g class="pulse"><circle cx="{cx:.1f}" cy="{cy}" r="26" fill="url(#ember)"/></g>')
                self.add(f'<circle cx="{cx:.1f}" cy="{cy}" r="11" fill="{BASE}" stroke="{EMBER}" stroke-width="2.5"/>')
                self.add(f'<circle cx="{cx:.1f}" cy="{cy}" r="4" fill="{EMBER}"/>')
            else:
                self.add(f'<circle cx="{cx:.1f}" cy="{cy}" r="10" fill="{BASE}" stroke="{MUTED}" stroke-width="1.5"/>')

        n = len(PHASES)
        reach = DONE if CURRENT else n - 1
        if not m:
            ty = y + 196
            x0, x1 = LX + 34, RX - 34
            step = (x1 - x0) / (n - 1)
            self.rise(2.9)
            self.add(f'<path d="M{x0} {ty}H{x1}" stroke="{HAIR}" stroke-width="2"/>')
            self.add(f'<rect class="sweep" style="--d:{3.1 * TS:.2f}s" x="{x0}" y="{ty - 1.5}" width="{reach * step:.1f}" height="3" rx="1.5" fill="url(#flame)"/>')
            for num, short, _, done in PHASES:
                cx = x0 + num * step
                node(cx, ty, done, CURRENT and num == CURRENT[0])
                self.text(f"{cx:.1f}", ty + 40, f"P{num}", 11.5, E400 if (done or (CURRENT and num == CURRENT[0])) else MUTED, MONO, "middle", 1.2)
                self.text(f"{cx:.1f}", ty + 62, short, 14, TEXT if done or (CURRENT and num == CURRENT[0]) else SEC, BODY, "middle")
            self.end()
            return ty + 62 + 54
        ty = y + 176
        rs = 44
        nx = LX + 12
        self.rise(2.9)
        self.add(f'<path d="M{nx} {ty}V{ty + (n - 1) * rs}" stroke="{HAIR}" stroke-width="2"/>')
        self.add(f'<rect x="{nx - 1.5}" y="{ty}" width="3" height="{reach * rs}" rx="1.5" fill="url(#flameV)"/>')
        for num, short, _, done in PHASES:
            cy = ty + num * rs
            cur = CURRENT and num == CURRENT[0]
            node(nx, cy, done, cur)
            self.text(nx + 30, cy + 5, f"P{num}", 12, E400 if done or cur else MUTED, MONO, spacing=1.2)
            self.text(nx + 68, cy + 6, short, 16, TEXT if done or cur else SEC)
            if cur:
                self.text(RX, cy + 5, "IN PROGRESS", 11, E400, MONO, "end", 1.2)
        self.end()
        return ty + (n - 1) * rs + 56

    # ------------------------------------------------------------ assemble
    def build(self):
        body_start = len(self.out)
        y = self.header()
        band0 = y - 40
        y = self.screens(y)
        y = self.pillars(y)
        band1 = y - 10
        y = self.architecture(y + 30)
        y = self.phases(y)
        fy = y + 30
        self.rise(3.3)
        self.add(f'<path d="M{self.RL} {fy - 34}H{self.RR}" stroke="{TEXT}" stroke-opacity=".16" fill="none"/>')
        self.text(self.LX, fy, "Forged by VULCAN.", 15 if self.m else 16, SEC, DISPLAY, weight=500)
        self.text(self.RX, fy, "dark only · android first", 12.5, MUTED, MONO, "end", 1.2)
        self.end()
        H = int(fy + 40)
        body = self.out[body_start:]
        self.out = self.out[:body_start]
        self.frame(H, band0, band1)
        self.out += body
        self.add("</svg>")
        return "\n".join(self.out) + "\n", H

    def frame(self, H, b0, b1):
        W, m = self.W, self.m
        self.add(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="VULCAN. '
                 f'{TAGLINE} {esc(BRIEF)} Built with Expo, FastAPI, Supabase and Gemini. '
                 f'{DONE} of {len(PHASES)} build phases done.">')
        self.add("""<style>
    .rise{opacity:0;animation:rise 1.2s cubic-bezier(.2,.7,.2,1) var(--d,0s) forwards}
    @keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    .sweep{transform-box:fill-box;transform-origin:left center;transform:scaleX(0);animation:sweep 1.4s cubic-bezier(.3,.7,.2,1) var(--d,0s) forwards}
    @keyframes sweep{to{transform:scaleX(1)}}
    .flow{animation:flow 1.6s linear infinite}
    @keyframes flow{to{stroke-dashoffset:-28}}
    .pulse{transform-box:fill-box;transform-origin:center;animation:pulse 3.2s ease-in-out infinite}
    @keyframes pulse{0%,100%{opacity:.55;transform:scale(.92)}50%{opacity:1;transform:scale(1.08)}}
    @keyframes sA{0%,100%{transform:translate(0,0) rotate(0deg) scale(1,1)}33%{transform:translate(150px,40px) rotate(5deg) scale(1.18,.86)}66%{transform:translate(-90px,60px) rotate(-4deg) scale(.92,1.2)}}
    @keyframes sB{0%,100%{transform:translate(0,0) rotate(0deg) scale(1.05,1)}40%{transform:translate(-160px,30px) rotate(-6deg) scale(.85,1.15)}75%{transform:translate(100px,-50px) rotate(3deg) scale(1.2,.9)}}
    @keyframes sC{0%,100%{transform:translate(0,0) rotate(0deg) scale(.95,1.05)}30%{transform:translate(110px,-60px) rotate(-5deg) scale(1.15,.9)}70%{transform:translate(-140px,20px) rotate(6deg) scale(.9,1.2)}}
    .sA,.sB,.sC{transform-box:fill-box;transform-origin:center}
    .sA{animation:sA 34s ease-in-out infinite}.sB{animation:sB 41s ease-in-out infinite}.sC{animation:sC 29s ease-in-out infinite}
    .rev{animation-direction:reverse}
    @media (prefers-reduced-motion:reduce){.rise{animation:none;opacity:1}.sweep{animation:none;transform:none}.flow,.pulse,.sA,.sB,.sC{animation:none}}
    </style>""")
        self.add(f"""<defs>
    <linearGradient id="flame" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{E300}"/><stop offset=".55" stop-color="{EMBER}"/><stop offset="1" stop-color="#e63e00"/></linearGradient>
    <linearGradient id="flameV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{E300}"/><stop offset="1" stop-color="{EMBER}"/></linearGradient>
    <linearGradient id="flameText" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{E300}"/><stop offset=".5" stop-color="{E400}"/><stop offset="1" stop-color="{EMBER}"/></linearGradient>
    <radialGradient id="ember"><stop offset="0" stop-color="{EMBER}" stop-opacity=".45"/><stop offset=".5" stop-color="{EMBER}" stop-opacity=".12"/><stop offset="1" stop-color="{EMBER}" stop-opacity="0"/></radialGradient>
    <radialGradient id="glowE"><stop offset="0" stop-color="{EMBER}" stop-opacity=".2"/><stop offset=".55" stop-color="{EMBER}" stop-opacity=".06"/><stop offset="1" stop-color="{EMBER}" stop-opacity="0"/></radialGradient>
    <radialGradient id="glowA"><stop offset="0" stop-color="{E300}" stop-opacity=".12"/><stop offset=".55" stop-color="{E300}" stop-opacity=".04"/><stop offset="1" stop-color="{E300}" stop-opacity="0"/></radialGradient>
    <radialGradient id="glowD"><stop offset="0" stop-color="{E700}" stop-opacity=".2"/><stop offset=".6" stop-color="{E700}" stop-opacity=".06"/><stop offset="1" stop-color="{E700}" stop-opacity="0"/></radialGradient>
    <linearGradient id="b0" x1="0" y1="0" x2="0" y2="1">{ease_stops(BASE, ELEV)}</linearGradient>
    <linearGradient id="b1" x1="0" y1="0" x2="0" y2="1">{ease_stops(ELEV, BASE)}</linearGradient>
    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur in="SourceGraphic" stdDeviation="{5 if m else 7}" result="b"/>
     <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="{TEXT}" stroke-opacity=".035"/></pattern>
    </defs>""")
        self.add(f'<rect width="{W}" height="{H}" fill="{BASE}"/>')
        self.add(f'<rect y="{b0}" width="{W}" height="82" fill="url(#b0)"/>')
        self.add(f'<rect y="{b0 + 80}" width="{W}" height="{b1 - b0 - 160}" fill="{ELEV}"/>')
        self.add(f'<rect y="{b1 - 82}" width="{W}" height="82" fill="url(#b1)"/>')
        self.add(f'<rect width="{W}" height="{H}" fill="url(#grid)"/>')
        self.add(f'<path d="M{self.RL} 0V{H}M{self.RR} 0V{H}" stroke="{TEXT}" stroke-opacity=".14" stroke-dasharray="3 5" fill="none"/>')

        def smoke(cx, cy, rx, ry, tilt, g, cls, rev=False):
            return (f'<g class="{cls}{" rev" if rev else ""}"><ellipse cx="{cx:.0f}" cy="{cy:.0f}" rx="{rx}" ry="{ry}" '
                    f'transform="rotate({tilt} {cx:.0f} {cy:.0f})" fill="url(#{g})"/></g>')

        k = .5 if m else 1
        self.add("<g>"
                 + smoke(W * .26, b0 * .3, 540 * k, 150 * k, -10, "glowE", "sA")
                 + smoke(W * .75, b0 * .7, 470 * k, 130 * k, 8, "glowA", "sB")
                 + smoke(W * .9, b0 * .2, 320 * k, 120 * k, 14, "glowD", "sC", True)
                 + smoke(W * .7, b0 + (b1 - b0) * .35, 520 * k, 160 * k, -8, "glowD", "sC")
                 + smoke(W * .22, b0 + (b1 - b0) * .75, 460 * k, 150 * k, 10, "glowE", "sB", True)
                 + smoke(W * .56, b1 + (H - b1) * .3, 520 * k, 160 * k, -9, "glowE", "sB")
                 + smoke(W * .18, b1 + (H - b1) * .7, 420 * k, 140 * k, 12, "glowA", "sC")
                 + smoke(W * .84, H - 120, 400 * k, 130 * k, -6, "glowD", "sA", True)
                 + "</g>")


for mobile, name in ((False, "vulcan.svg"), (True, "vulcan-mobile.svg")):
    svg, h = Page(mobile).build()
    (HERE / name).write_text(svg, encoding="utf-8")
    print(f"{name}: {960 if not mobile else 480}x{h}, {len(svg) // 1024} KB, {DONE}/{len(PHASES)} phases done")
