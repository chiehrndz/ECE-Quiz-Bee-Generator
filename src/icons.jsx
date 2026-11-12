// Lucide-style icons (24x24, 2px stroke) inlined so the app needs no extra dependency.
// Markup below is static and developer-authored, never user input.
const D = (d) => `<path d="${d}"/>`;
const R = (x, y, w, h, rx = 2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;
const C = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;

const PATHS = {
  dashboard: R(3, 3, 7, 9, 1) + R(14, 3, 7, 5, 1) + R(14, 12, 7, 9, 1) + R(3, 16, 7, 5, 1),
  target: C(12, 12, 10) + C(12, 12, 6) + C(12, 12, 2),
  clipboard: R(8, 2, 8, 4, 1) + D("M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2") + D("m9 14 2 2 4-4"),
  book: D("M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z") + D("M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"),
  retry: D("M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8") + D("M3 3v5h5"),
  chart: D("M3 3v18h18") + D("M18 17V9") + D("M13 17V5") + D("M8 17v-3"),
  sigma: D("M18 7V4H6l6 8-6 8h12v-3"),
  sliders:
    D("M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"),
  chevronLeft: D("m15 18-6-6 6-6"),
  chevronRight: D("m9 18 6-6-6-6"),
  chevronDown: D("m6 9 6 6 6-6"),
  menu: D("M4 6h16M4 12h16M4 18h16"),
  x: D("M18 6 6 18M6 6l12 12"),
  sun: C(12, 12, 4) + D("M12 2v2M12 20v2m-7.07-2.93 1.41-1.41m11.32-11.32 1.41-1.41M2 12h2m16 0h2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41"),
  moon: D("M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"),
  flag: D("M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z") + D("M4 22v-7"),
  clock: C(12, 12, 10) + D("M12 6v6l4 2"),
  check: D("M20 6 9 17l-5-5"),
  checkCircle: C(12, 12, 10) + D("m9 12 2 2 4-4"),
  xCircle: C(12, 12, 10) + D("m15 9-6 6M9 9l6 6"),
  flame: D("M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"),
  trophy: D("M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"),
  play: D("M6 3l14 9-14 9z"),
  search: C(11, 11, 8) + D("m21 21-4.3-4.3"),
  calculator: R(4, 2, 16, 20) + D("M8 6h8M16 14v4M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01"),
  radio: C(12, 12, 2) + D("M4.93 4.93a10 10 0 0 0 0 14.14M7.76 7.76a6 6 0 0 0 0 8.48M16.24 7.76a6 6 0 0 1 0 8.48M19.07 4.93a10 10 0 0 1 0 14.14"),
  cpu: R(4, 4, 16, 16) + R(9, 9, 6, 6, 1) + D("M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"),
  cap: D("M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z") + D("M22 10v6M6 12.5V16a6 3 0 0 0 12 0v-3.5"),
  zap: D("M13 2 3 14h9l-1 8 10-12h-9l1-8z"),
  arrowRight: D("M5 12h14m-7-7 7 7-7 7"),
  arrowLeft: D("M19 12H5m7 7-7-7 7-7"),
  alert: D("m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3") + D("M12 9v4M12 17h.01"),
  info: C(12, 12, 10) + D("M12 16v-4M12 8h.01"),
  trash: D("M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"),
  panel: R(3, 3, 18, 18) + D("M9 3v18"),
  inbox: D("M22 12h-6l-2 3h-4l-2-3H2") + D("M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"),
  activity: D("M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"),
  list: D("M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"),
  layers: D("m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z") + D("m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65M22 12.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"),
  shuffle: D("M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22m-3-3 3 3-3 3M2 6h1.9c1.5 0 2.9.9 3.6 2.2M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8m6.7 5.6 3-3-3-3"),
  bulb: D("M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5M9 18h6M10 22h4"),
};

export function Icon({ name, size = 18, className = "", strokeWidth = 2, ...rest }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`icon ${className}`}
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: PATHS[name] || "" }}
      {...rest}
    />
  );
}

export function Logo({ size = 36 }) {
  return <img src="/logo.svg" width={size} height={size} alt="" className="logo-img" />;
}
