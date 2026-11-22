import { useId } from "react";

// Original "emoji-style" lussekatt (saffron bun) illustration.
const PATH =
  "M34.7 47.2 L34.9 46.9 L35.2 46.6 L35.5 46.4 L35.8 46.1 L36.2 45.8 L36.6 45.6 L37.0 45.4 L37.5 45.3 L37.9 45.1 L38.4 45.0 L38.9 45.0 L39.5 44.9 L40.0 44.9 L40.5 45.0 L41.1 45.1 L41.6 45.2 L42.2 45.4 L42.7 45.6 L43.2 45.9 L43.8 46.2 L44.3 46.5 L44.8 46.9 L45.3 47.4 L45.7 47.8 L46.1 48.4 L46.5 48.9 L46.9 49.5 L47.2 50.1 L47.5 50.8 L47.7 51.5 L47.9 52.2 L48.1 52.9 L48.2 53.7 L48.2 54.4 L48.2 55.2 L48.1 56.0 L48.0 56.8 L47.8 57.6 L47.6 58.4 L47.3 59.2 L46.9 60.0 L46.5 60.7 L46.1 61.5 L45.5 62.2 L44.9 62.9 L44.3 63.5 L43.6 64.1 L42.9 64.7 L42.1 65.2 L41.3 65.7 L40.4 66.1 L39.5 66.5 L38.6 66.8 L37.6 67.1 L36.6 67.3 L35.6 67.4 L34.5 67.4 L33.5 67.4 L32.4 67.3 L31.3 67.2 L30.3 66.9 L29.2 66.6 L28.2 66.2 L27.2 65.7 L26.2 65.2 L25.2 64.6 L24.3 63.9 L23.4 63.2 L22.5 62.4 L21.7 61.5 L21.0 60.5 L20.3 59.5 L19.6 58.5 L19.1 57.4 L18.6 56.2 L18.2 55.0 L17.8 53.8 L17.6 52.5 L17.4 51.2 L17.3 49.9 L17.3 48.6 L17.4 47.3 L17.6 45.9 L17.8 44.6 L18.2 43.3 L18.7 42.0 L19.2 40.7 L19.9 39.4 L20.6 38.2 L21.4 37.0 L22.3 35.9 L23.3 34.8 L24.3 33.8 L25.5 32.9 L26.7 32.0 L27.9 31.2 L29.3 30.5 L30.6 29.8 L32.1 29.3 L33.6 28.8 L35.1 28.5 L36.6 28.2 L38.2 28.1 L39.8 28.0 L41.4 28.1 L43.0 28.2 L44.6 28.5 L46.2 28.9 L47.8 29.4 L49.4 30.0 L50.9 30.7 L52.4 31.5 L53.8 32.4 L55.2 33.5 L56.5 34.6 L57.7 35.8 L58.9 37.1 L60.0 38.5 L61.0 39.9 L61.9 41.5 L66.1 86.5 L67.0 88.1 L68.0 89.5 L69.1 90.9 L70.3 92.2 L71.5 93.4 L72.8 94.5 L74.2 95.6 L75.6 96.5 L77.1 97.3 L78.6 98.0 L80.2 98.6 L81.8 99.1 L83.4 99.5 L85.0 99.8 L86.6 99.9 L88.2 100.0 L89.8 99.9 L91.4 99.8 L92.9 99.5 L94.4 99.2 L95.9 98.7 L97.4 98.2 L98.7 97.5 L100.1 96.8 L101.3 96.0 L102.5 95.1 L103.7 94.2 L104.7 93.2 L105.7 92.1 L106.6 91.0 L107.4 89.8 L108.1 88.6 L108.8 87.3 L109.3 86.0 L109.8 84.7 L110.2 83.4 L110.4 82.1 L110.6 80.7 L110.7 79.4 L110.7 78.1 L110.6 76.8 L110.4 75.5 L110.2 74.2 L109.8 73.0 L109.4 71.8 L108.9 70.6 L108.4 69.5 L107.7 68.5 L107.0 67.5 L106.3 66.5 L105.5 65.6 L104.6 64.8 L103.7 64.1 L102.8 63.4 L101.8 62.8 L100.8 62.3 L99.8 61.8 L98.8 61.4 L97.7 61.1 L96.7 60.8 L95.6 60.7 L94.5 60.6 L93.5 60.6 L92.4 60.6 L91.4 60.7 L90.4 60.9 L89.4 61.2 L88.5 61.5 L87.6 61.9 L86.7 62.3 L85.9 62.8 L85.1 63.3 L84.4 63.9 L83.7 64.5 L83.1 65.1 L82.5 65.8 L81.9 66.5 L81.5 67.3 L81.1 68.0 L80.7 68.8 L80.4 69.6 L80.2 70.4 L80.0 71.2 L79.9 72.0 L79.8 72.8 L79.8 73.6 L79.8 74.3 L79.9 75.1 L80.1 75.8 L80.3 76.5 L80.5 77.2 L80.8 77.9 L81.1 78.5 L81.5 79.1 L81.9 79.6 L82.3 80.2 L82.7 80.6 L83.2 81.1 L83.7 81.5 L84.2 81.8 L84.8 82.1 L85.3 82.4 L85.8 82.6 L86.4 82.8 L86.9 82.9 L87.5 83.0 L88.0 83.1 L88.5 83.1 L89.1 83.0 L89.6 83.0 L90.1 82.9 L90.5 82.7 L91.0 82.6 L91.4 82.4 L91.8 82.2 L92.2 81.9 L92.5 81.6 L92.8 81.4 L93.1 81.1 L93.3 80.8";

export default function BunSvg({ size = 64, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 128 128"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Lussebulle"
    >
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFCF55" />
          <stop offset=".5" stopColor="#F6A21E" />
          <stop offset="1" stopColor="#D96E0B" />
        </linearGradient>
        <radialGradient id={`r${id}`} cx=".35" cy=".3" r=".7">
          <stop offset="0" stopColor="#6a3044" />
          <stop offset="1" stopColor="#1e0a12" />
        </radialGradient>
        <filter id={`b${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
        <filter id={`s${id}`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <ellipse cx="64" cy="98" rx="52" ry="9" fill="#5a2a00" opacity=".22" filter={`url(#s${id})`} />
      <g transform="translate(64 62) rotate(-32) scale(0.9) translate(-64 -64)">
        <circle cx="37" cy="52" r="10" fill="#F4A021" stroke="#9A4708" strokeWidth="1.7" />
        <circle cx="91" cy="76" r="10" fill="#F4A021" stroke="#9A4708" strokeWidth="1.7" />
        <path d={PATH} fill="none" stroke="#9A4708" strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" />
        <path d={PATH} fill="none" stroke={`url(#g${id})`} strokeWidth="13.6" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d={PATH}
          fill="none"
          stroke="#FFF0B8"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity=".75"
          transform="translate(-1.2 -2)"
          filter={`url(#b${id})`}
        />
        <ellipse cx="37" cy="52" rx="4.8" ry="4.3" fill={`url(#r${id})`} />
        <ellipse cx="35.5" cy="50.5" rx="1.5" ry="1" fill="#fff" opacity=".8" />
        <ellipse cx="91" cy="76" rx="4.8" ry="4.3" fill={`url(#r${id})`} />
        <ellipse cx="89.5" cy="74.5" rx="1.5" ry="1" fill="#fff" opacity=".8" />
      </g>
    </svg>
  );
}
