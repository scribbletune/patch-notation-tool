const STROKE = "#231d1f";
const STROKE_WIDTH = 3;

const frameMarkup = {
  circle:
    '<circle cx="50" cy="50" r="44" fill="#faf7f0" stroke="#231d1f" stroke-width="3" />',
  square:
    '<rect x="12" y="12" width="76" height="76" fill="#faf7f0" stroke="#231d1f" stroke-width="3" />',
  triangle:
    '<polygon points="14,12 90,50 14,88" fill="#faf7f0" stroke="#231d1f" stroke-width="3" />',
  diamond:
    '<polygon points="50,8 92,50 50,92 8,50" fill="#faf7f0" stroke="#231d1f" stroke-width="3" />'
};

const glyphMarkup = {
  sine: '<path d="M24 48 C31 26, 43 26, 50 48 S69 70, 76 48" fill="none" stroke="#231d1f" stroke-width="3" stroke-linecap="round"/>',
  triangleWave: '<polyline points="26,60 40,34 58,66 74,40" fill="none" stroke="#231d1f" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>',
  saw: '<polyline points="28,64 28,40 46,64 46,40 64,64 64,40" fill="none" stroke="#231d1f" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>',
  squareWave: '<polyline points="28,64 28,38 48,38 48,64 68,64 68,38" fill="none" stroke="#231d1f" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>',
  pwm: '<polyline points="22,66 22,38 38,38 38,66 58,66 58,38 74,38 74,66" fill="none" stroke="#231d1f" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><line x1="40" y1="26" x2="58" y2="26" stroke="#231d1f" stroke-width="3"/><polyline points="46,22 40,26 46,30" fill="none" stroke="#231d1f" stroke-width="3"/><polyline points="52,22 58,26 52,30" fill="none" stroke="#231d1f" stroke-width="3"/>',
  noise: '<polyline points="24,58 30,28 36,62 42,34 48,56 54,24 60,66 66,30 72,58 76,42" fill="none" stroke="#231d1f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  wavetable: '<rect x="24" y="26" width="52" height="48" fill="none" stroke="#231d1f" stroke-width="2"/><line x1="50" y1="26" x2="50" y2="74" stroke="#231d1f" stroke-width="2"/><line x1="24" y1="50" x2="76" y2="50" stroke="#231d1f" stroke-width="2"/><path d="M28 41 C32 33, 36 33, 40 41 S48 49, 52 41" fill="none" stroke="#231d1f" stroke-width="2"/><polyline points="56,44 62,34 68,44 74,34" fill="none" stroke="#231d1f" stroke-width="2"/><path d="M28 61 C31 55, 34 55, 37 61 S43 67, 46 61" fill="none" stroke="#231d1f" stroke-width="2"/><polyline points="56,66 56,54 64,66 64,54 72,66 72,54" fill="none" stroke="#231d1f" stroke-width="2"/>',
  grains: '<g stroke="#231d1f" stroke-width="2.4" stroke-linecap="round"><line x1="26" y1="42" x2="34" y2="42"/><line x1="38" y1="36" x2="46" y2="36"/><line x1="52" y1="30" x2="60" y2="30"/><line x1="60" y1="40" x2="70" y2="40"/><line x1="28" y1="55" x2="36" y2="55"/><line x1="42" y1="50" x2="50" y2="50"/><line x1="56" y1="56" x2="64" y2="56"/><line x1="34" y1="64" x2="42" y2="64"/><line x1="48" y1="68" x2="56" y2="68"/><line x1="62" y1="64" x2="70" y2="64"/></g>',
  mic: '<path d="M42 38 C42 28, 58 28, 58 38 L58 52 C58 62, 42 62, 42 52 Z" fill="none" stroke="#231d1f" stroke-width="3"/><path d="M36 50 C36 68, 64 68, 64 50" fill="none" stroke="#231d1f" stroke-width="3"/><line x1="50" y1="68" x2="50" y2="78" stroke="#231d1f" stroke-width="3"/><line x1="40" y1="78" x2="60" y2="78" stroke="#231d1f" stroke-width="3"/>',
  play: '<polygon points="30,34 46,50 30,66" fill="#231d1f"/><g stroke="#231d1f" stroke-width="2"><line x1="49" y1="50" x2="70" y2="50"/><line x1="58" y1="34" x2="58" y2="66"/><line x1="62" y1="38" x2="62" y2="62"/><line x1="66" y1="42" x2="66" y2="58"/></g>',
  record: '<g stroke="#231d1f" stroke-width="2"><line x1="28" y1="50" x2="48" y2="50"/><line x1="36" y1="34" x2="36" y2="66"/><line x1="40" y1="38" x2="40" y2="62"/><line x1="44" y1="42" x2="44" y2="58"/></g><circle cx="66" cy="50" r="12" fill="#231d1f"/>',
  cube: '<rect x="30" y="30" width="28" height="36" fill="none" stroke="#231d1f" stroke-width="2"/><polyline points="30,30 42,22 70,22 58,30" fill="none" stroke="#231d1f" stroke-width="2"/><polyline points="58,30 70,22 70,58 58,66" fill="none" stroke="#231d1f" stroke-width="2"/><line x1="58" y1="66" x2="30" y2="66" stroke="#231d1f" stroke-width="2"/><line x1="42" y1="22" x2="42" y2="58" stroke="#231d1f" stroke-width="2" stroke-dasharray="4 3"/>',
  pipe: '<ellipse cx="30" cy="50" rx="8" ry="12" fill="none" stroke="#231d1f" stroke-width="3"/><path d="M38 38 L66 38 Q74 50 66 62 L38 62" fill="none" stroke="#231d1f" stroke-width="3" stroke-dasharray="4 4"/>',
  string: '<line x1="20" y1="50" x2="80" y2="50" stroke="#231d1f" stroke-width="3"/><path d="M22 48 C34 34, 66 34, 78 48" fill="none" stroke="#231d1f" stroke-width="2" stroke-dasharray="5 4"/><path d="M22 52 C34 66, 66 66, 78 52" fill="none" stroke="#231d1f" stroke-width="2" stroke-dasharray="5 4"/>',
  membrane: '<ellipse cx="50" cy="38" rx="20" ry="5" fill="none" stroke="#231d1f" stroke-width="3"/><ellipse cx="50" cy="58" rx="20" ry="5" fill="none" stroke="#231d1f" stroke-width="3" stroke-dasharray="4 4"/><line x1="30" y1="38" x2="30" y2="58" stroke="#231d1f" stroke-width="2" stroke-dasharray="4 4"/><line x1="70" y1="38" x2="70" y2="58" stroke="#231d1f" stroke-width="2" stroke-dasharray="4 4"/>',
  speech: '<path d="M26 46 L42 34 L58 40 L72 36 L66 60 L40 60 Z" fill="#231d1f"/><polyline points="26,46 34,28 38,54 44,32 48,56 54,30 60,54 64,38" fill="none" stroke="#faf7f0" stroke-width="2"/>',
  keyboard: '<rect x="24" y="34" width="52" height="28" fill="none" stroke="#231d1f" stroke-width="2"/><g stroke="#231d1f" stroke-width="2"><line x1="34" y1="34" x2="34" y2="62"/><line x1="44" y1="34" x2="44" y2="62"/><line x1="54" y1="34" x2="54" y2="62"/><line x1="64" y1="34" x2="64" y2="62"/></g><g fill="#231d1f"><rect x="31" y="34" width="6" height="18"/><rect x="41" y="34" width="6" height="18"/><rect x="61" y="34" width="6" height="18"/></g>',
  touch: '<rect x="24" y="34" width="52" height="28" fill="none" stroke="#231d1f" stroke-width="2"/><g stroke="#231d1f" stroke-width="1.5"><line x1="32" y1="34" x2="32" y2="62"/><line x1="40" y1="34" x2="40" y2="62"/><line x1="48" y1="34" x2="48" y2="62"/><line x1="56" y1="34" x2="56" y2="62"/><line x1="64" y1="34" x2="64" y2="62"/></g>',
  knobs: '<g fill="none" stroke="#231d1f" stroke-width="2.2"><circle cx="32" cy="36" r="6"/><circle cx="50" cy="36" r="6"/><circle cx="68" cy="36" r="6"/><circle cx="32" cy="56" r="6"/><circle cx="50" cy="56" r="6"/><circle cx="68" cy="56" r="6"/></g><g stroke="#231d1f" stroke-width="2"><line x1="32" y1="36" x2="30" y2="32"/><line x1="50" y1="36" x2="52" y2="32"/><line x1="68" y1="36" x2="72" y2="38"/></g>',
  steps: '<g fill="#231d1f"><rect x="24" y="28" width="10" height="10"/><rect x="34" y="38" width="10" height="10"/><rect x="44" y="28" width="10" height="10"/><rect x="54" y="38" width="10" height="10"/><rect x="64" y="28" width="10" height="10"/><rect x="24" y="48" width="10" height="10"/><rect x="34" y="58" width="10" height="10"/><rect x="44" y="48" width="10" height="10"/><rect x="54" y="58" width="10" height="10"/><rect x="64" y="48" width="10" height="10"/></g>',
  fourDots: '<g fill="#231d1f"><circle cx="30" cy="46" r="3.5"/><circle cx="44" cy="46" r="3.5"/><circle cx="58" cy="46" r="3.5"/><circle cx="72" cy="46" r="3.5"/></g>',
  bpmText: '<text x="50" y="62" text-anchor="middle" font-size="20" font-weight="700" fill="#231d1f">BPM</text>',
  recorderPanel: '<line x1="20" y1="50" x2="80" y2="50" stroke="#231d1f" stroke-width="2" stroke-dasharray="5 5"/><path d="M26 49 C31 33, 41 33, 46 49 S58 65, 64 49" fill="none" stroke="#231d1f" stroke-width="3"/><circle cx="34" cy="66" r="11" fill="#231d1f"/><polygon points="58,56 72,66 58,76" fill="#231d1f"/>',
  lfoReset: '<polyline points="20,62 36,38 52,60 68,40" fill="none" stroke="#231d1f" stroke-width="3"/><line x1="16" y1="50" x2="84" y2="50" stroke="#231d1f" stroke-width="2" stroke-dasharray="4 4"/><line x1="52" y1="26" x2="52" y2="72" stroke="#231d1f" stroke-width="2" stroke-dasharray="4 4"/><circle cx="52" cy="62" r="3" fill="#231d1f"/>',
  lfoSaw: '<polyline points="24,62 24,40 72,40 72,62 44,62" fill="none" stroke="#231d1f" stroke-width="3"/><line x1="16" y1="50" x2="84" y2="50" stroke="#231d1f" stroke-width="2" stroke-dasharray="4 4"/>',
  rampDown: '<polyline points="26,34 26,64 72,64" fill="none" stroke="#231d1f" stroke-width="3"/><polyline points="26,34 72,64" fill="none" stroke="#231d1f" stroke-width="3"/><line x1="16" y1="50" x2="84" y2="50" stroke="#231d1f" stroke-width="2" stroke-dasharray="4 4"/>',
  adsr: '<polyline points="20,64 30,34 42,48 54,48 72,64" fill="none" stroke="#231d1f" stroke-width="3" stroke-linejoin="round"/>',
  ar: '<polyline points="24,64 34,36 54,36 72,64" fill="none" stroke="#231d1f" stroke-width="3"/>',
  ad: '<polyline points="24,64 34,36 72,64" fill="none" stroke="#231d1f" stroke-width="3"/>',
  dadsr: '<line x1="20" y1="34" x2="20" y2="64" stroke="#231d1f" stroke-width="2" stroke-dasharray="4 4"/><polyline points="20,64 30,58 40,34 50,48 60,48 72,64" fill="none" stroke="#231d1f" stroke-width="3"/>',
  ahdsr: '<polyline points="22,64 32,36 46,36 54,48 62,48 74,64" fill="none" stroke="#231d1f" stroke-width="3"/>',
  loopArrow: '<path d="M26 76 H66" fill="none" stroke="#231d1f" stroke-width="2.5"/><path d="M36 70 C26 70, 24 82, 36 82" fill="none" stroke="#231d1f" stroke-width="2.5"/><polyline points="58,72 66,76 58,80" fill="none" stroke="#231d1f" stroke-width="2.5"/>',
  plusV: '<text x="50" y="60" text-anchor="middle" font-size="28" font-weight="700" fill="#231d1f">+V</text>',
  plusMinusVSlider: '<text x="34" y="34" text-anchor="middle" font-size="18" font-weight="700" fill="#231d1f">+V</text><line x1="60" y1="28" x2="60" y2="72" stroke="#231d1f" stroke-width="3"/><line x1="52" y1="50" x2="68" y2="50" stroke="#231d1f" stroke-width="3"/><text x="34" y="74" text-anchor="middle" font-size="18" font-weight="700" fill="#231d1f">-V</text>',
  steppedRandom: '<polyline points="22,46 30,46 30,36 40,36 40,58 50,58 50,40 60,40 60,66 70,66 70,30 78,30" fill="none" stroke="#231d1f" stroke-width="3"/>',
  smoothRandom: '<path d="M22 52 C28 36, 34 36, 40 52 S52 68, 58 52 S70 36, 76 52" fill="none" stroke="#231d1f" stroke-width="3"/>',
  envelopeFollower: '<path d="M22 56 C30 52, 34 34, 42 30 S58 42, 66 54 S74 60, 78 56" fill="none" stroke="#231d1f" stroke-width="3"/><path d="M28 58 L36 46 L44 60 L52 40 L60 56" fill="none" stroke="#231d1f" stroke-width="2"/>',
  lowpass: '<polyline points="26,44 44,44 54,56" fill="none" stroke="#231d1f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  lowpassRes: '<polyline points="22,45 38,45 46,38 54,57" fill="none" stroke="#231d1f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  highpass: '<polyline points="26,56 34,44 58,44" fill="none" stroke="#231d1f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  highpassRes: '<path d="M24 58 C26 42, 30 38, 36 52 L58 44" fill="none" stroke="#231d1f" stroke-width="3" stroke-linecap="round"/>',
  bandpass: '<path d="M28 56 C34 34, 40 34, 46 56 S58 78, 64 56" fill="none" stroke="#231d1f" stroke-width="3"/>',
  notch: '<path d="M28 44 C36 44, 40 58, 46 58 C52 58, 56 44, 64 44" fill="none" stroke="#231d1f" stroke-width="3"/>',
  arrowUp: '<line x1="28" y1="62" x2="56" y2="34" stroke="#231d1f" stroke-width="3"/><polyline points="48,34 56,34 56,42" fill="none" stroke="#231d1f" stroke-width="3"/>',
  lpg: '<polyline points="18,50 40,50 52,38 58,44 62,58" fill="none" stroke="#231d1f" stroke-width="3"/><line x1="28" y1="64" x2="48" y2="44" stroke="#231d1f" stroke-width="3"/><polyline points="44,40 52,38 50,46" fill="none" stroke="#231d1f" stroke-width="3"/>',
  ringmod: '<line x1="30" y1="34" x2="62" y2="66" stroke="#231d1f" stroke-width="3"/><line x1="62" y1="34" x2="30" y2="66" stroke="#231d1f" stroke-width="3"/><polyline points="50,28 62,28 62,40" fill="none" stroke="#231d1f" stroke-width="3"/><polyline points="42,72 30,72 30,60" fill="none" stroke="#231d1f" stroke-width="3"/>',
  mixer: '<g stroke="#231d1f" stroke-width="2.5"><line x1="20" y1="36" x2="38" y2="36"/><line x1="20" y1="62" x2="38" y2="62"/><line x1="38" y1="36" x2="48" y2="50"/><line x1="38" y1="62" x2="48" y2="50"/><polyline points="48,30 48,70 56,70 56,30"/><line x1="56" y1="50" x2="78" y2="50"/></g><path d="M22 28 L26 40 L30 28" fill="none" stroke="#231d1f" stroke-width="2"/><path d="M22 54 L26 66 L30 54" fill="none" stroke="#231d1f" stroke-width="2"/>',
  attenuator: '<polyline points="18,50 36,50 44,40 50,60 56,40 64,50 78,50" fill="none" stroke="#231d1f" stroke-width="3"/><line x1="28" y1="64" x2="56" y2="36" stroke="#231d1f" stroke-width="3"/><polyline points="48,36 56,36 56,44" fill="none" stroke="#231d1f" stroke-width="3"/>',
  crossfader: '<line x1="50" y1="28" x2="50" y2="72" stroke="#231d1f" stroke-width="4"/><line x1="38" y1="50" x2="62" y2="50" stroke="#231d1f" stroke-width="4"/>',
  inverter: '<path d="M28 50 C28 34, 38 34, 44 50 S56 66, 62 50" fill="none" stroke="#231d1f" stroke-width="3" stroke-dasharray="6 4"/><path d="M40 50 C40 34, 50 34, 56 50 S68 66, 74 50" fill="none" stroke="#231d1f" stroke-width="3"/>',
  waveshaper: '<path d="M24 44 C32 32, 42 32, 50 44 S68 56, 76 44" fill="none" stroke="#231d1f" stroke-width="3" stroke-dasharray="6 4"/><polyline points="24,56 38,56 46,44 56,44 64,56 76,56" fill="none" stroke="#231d1f" stroke-width="2.5"/>',
  wavefolder: '<path d="M26 56 C30 28, 38 28, 42 56 S54 84, 58 56 S70 28, 74 56" fill="none" stroke="#231d1f" stroke-width="3"/>',
  halfRect: '<path d="M26 56 C32 34, 42 34, 48 56" fill="none" stroke="#231d1f" stroke-width="3"/><polyline points="48,56 70,56 70,68 56,68" fill="none" stroke="#231d1f" stroke-width="2.5" stroke-dasharray="5 4"/>',
  clipper: '<polyline points="20,56 36,36 54,64 76,44" fill="none" stroke="#231d1f" stroke-width="3"/><line x1="24" y1="44" x2="76" y2="44" stroke="#231d1f" stroke-width="2" stroke-dasharray="4 4"/><line x1="24" y1="60" x2="76" y2="60" stroke="#231d1f" stroke-width="2" stroke-dasharray="4 4"/>',
  fullRect: '<path d="M24 56 C30 34, 40 34, 46 56" fill="none" stroke="#231d1f" stroke-width="3"/><path d="M46 56 C52 34, 62 34, 68 56" fill="none" stroke="#231d1f" stroke-width="3" stroke-dasharray="5 4"/>',
  reverb: '<ellipse cx="40" cy="48" rx="14" ry="16" fill="url(#fadeWave)"/><path d="M28 52 C34 32, 40 32, 46 52" fill="none" stroke="#231d1f" stroke-width="2.5"/><line x1="28" y1="64" x2="68" y2="64" stroke="#231d1f" stroke-width="2.5"/><polyline points="60,56 68,64 60,72" fill="none" stroke="#231d1f" stroke-width="2.5"/>',
  delay: '<path d="M24 48 C30 32, 38 32, 44 48 S58 64, 64 48" fill="none" stroke="#231d1f" stroke-width="3"/><path d="M36 44 C42 28, 50 28, 56 44 S70 60, 76 44" fill="none" stroke="#231d1f" stroke-width="2.2" stroke-dasharray="5 4"/><path d="M48 40 C54 24, 62 24, 68 40 S82 56, 88 40" fill="none" stroke="#231d1f" stroke-width="1.8" stroke-dasharray="4 5"/><line x1="24" y1="68" x2="76" y2="68" stroke="#231d1f" stroke-width="2.5"/><polyline points="68,62 76,68 68,74" fill="none" stroke="#231d1f" stroke-width="2.5"/>',
  chorus: '<path d="M24 48 C30 32, 38 32, 44 48 S58 64, 64 48" fill="none" stroke="#231d1f" stroke-width="3"/><path d="M36 44 C42 28, 50 28, 56 44 S70 60, 76 44" fill="none" stroke="#231d1f" stroke-width="2.2" stroke-dasharray="5 4"/><line x1="24" y1="64" x2="56" y2="64" stroke="#231d1f" stroke-width="2.5"/><polyline points="30,58 24,64 30,70" fill="none" stroke="#231d1f" stroke-width="2.5"/>',
  phase: '<path d="M20 50 C26 34, 34 34, 40 50 S54 66, 60 50 S74 34, 80 50" fill="none" stroke="#231d1f" stroke-width="2.6" stroke-dasharray="5 4"/><path d="M26 50 C32 34, 40 34, 46 50 S60 66, 66 50 S80 34, 86 50" fill="none" stroke="#231d1f" stroke-width="2.6"/><line x1="22" y1="68" x2="54" y2="68" stroke="#231d1f" stroke-width="2.5"/><polyline points="30,62 22,68 30,74" fill="none" stroke="#231d1f" stroke-width="2.5"/>',
  comb: '<path d="M24 62 Q24 36 30 62 T42 62 T54 62 T66 62" fill="none" stroke="#231d1f" stroke-width="3"/>',
  switcher: '<line x1="20" y1="34" x2="44" y2="34" stroke="#231d1f" stroke-width="3"/><line x1="20" y1="50" x2="44" y2="50" stroke="#231d1f" stroke-width="3"/><line x1="20" y1="66" x2="44" y2="66" stroke="#231d1f" stroke-width="3"/><circle cx="30" cy="34" r="2.6" fill="#231d1f"/><circle cx="30" cy="50" r="2.6" fill="#231d1f"/><circle cx="30" cy="66" r="2.6" fill="#231d1f"/><polyline points="44,66 58,50 78,50" fill="none" stroke="#231d1f" stroke-width="3"/>',
  attenuverter: '<polyline points="18,50 36,50 44,40 50,60 56,40 64,50 78,50" fill="none" stroke="#231d1f" stroke-width="3"/><line x1="28" y1="64" x2="56" y2="36" stroke="#231d1f" stroke-width="3"/><polyline points="48,36 56,36 56,44" fill="none" stroke="#231d1f" stroke-width="3"/><line x1="32" y1="36" x2="24" y2="44" stroke="#231d1f" stroke-width="3"/><polyline points="24,36 24,44 32,44" fill="none" stroke="#231d1f" stroke-width="3"/>',
  cvMixer: '<rect x="34" y="34" width="18" height="32" fill="none" stroke="#231d1f" stroke-width="2.5"/><line x1="20" y1="40" x2="34" y2="40" stroke="#231d1f" stroke-width="2.5"/><line x1="20" y1="60" x2="34" y2="60" stroke="#231d1f" stroke-width="2.5"/><line x1="52" y1="50" x2="80" y2="50" stroke="#231d1f" stroke-width="2.5"/><line x1="26" y1="34" x2="38" y2="22" stroke="#231d1f" stroke-width="2.5"/><polyline points="34,22 38,22 38,26" fill="none" stroke="#231d1f" stroke-width="2.5"/><line x1="26" y1="66" x2="38" y2="54" stroke="#231d1f" stroke-width="2.5"/><polyline points="34,54 38,54 38,58" fill="none" stroke="#231d1f" stroke-width="2.5"/>',
  plusMinusV: '<text x="50" y="56" text-anchor="middle" font-size="24" font-weight="700" fill="#231d1f">+/-V</text>',
  matrix: '<g stroke="#231d1f" stroke-width="2" stroke-dasharray="5 4"><line x1="26" y1="32" x2="74" y2="32"/><line x1="26" y1="50" x2="74" y2="50"/><line x1="26" y1="68" x2="74" y2="68"/><line x1="32" y1="26" x2="32" y2="74"/><line x1="50" y1="26" x2="50" y2="74"/><line x1="68" y1="26" x2="68" y2="74"/></g><g fill="#231d1f"><circle cx="32" cy="50" r="3"/><circle cx="50" cy="50" r="3"/><circle cx="68" cy="50" r="3"/></g>',
  dcVca: '<line x1="22" y1="60" x2="56" y2="26" stroke="#231d1f" stroke-width="3"/><polyline points="48,26 56,26 56,34" fill="none" stroke="#231d1f" stroke-width="3"/><line x1="20" y1="62" x2="80" y2="62" stroke="#231d1f" stroke-width="2" stroke-dasharray="5 4"/>',
  precisionAdder: '<text x="50" y="58" text-anchor="middle" font-size="28" font-weight="700" fill="#231d1f">V+V</text>',
  bufferedMultiple: '<line x1="18" y1="50" x2="40" y2="50" stroke="#231d1f" stroke-width="3"/><line x1="40" y1="36" x2="40" y2="64" stroke="#231d1f" stroke-width="3"/><line x1="48" y1="36" x2="74" y2="36" stroke="#231d1f" stroke-width="3"/><line x1="48" y1="50" x2="74" y2="50" stroke="#231d1f" stroke-width="3"/><line x1="48" y1="64" x2="74" y2="64" stroke="#231d1f" stroke-width="3"/>',
  noteDivide: '<circle cx="34" cy="58" r="6" fill="#231d1f"/><line x1="40" y1="58" x2="40" y2="34" stroke="#231d1f" stroke-width="3"/><path d="M40 34 C48 34, 48 44, 40 44" fill="none" stroke="#231d1f" stroke-width="2.2"/><line x1="54" y1="44" x2="74" y2="44" stroke="#231d1f" stroke-width="3"/><line x1="64" y1="34" x2="64" y2="54" stroke="#231d1f" stroke-width="3"/>',
  noteMultiply: '<circle cx="34" cy="58" r="6" fill="#231d1f"/><line x1="40" y1="58" x2="40" y2="34" stroke="#231d1f" stroke-width="3"/><path d="M40 34 C48 34, 48 44, 40 44" fill="none" stroke="#231d1f" stroke-width="2.2"/><line x1="58" y1="38" x2="74" y2="54" stroke="#231d1f" stroke-width="3"/><line x1="74" y1="38" x2="58" y2="54" stroke="#231d1f" stroke-width="3"/>',
  comparator: '<polyline points="24,62 34,62 34,40 52,40 52,62 74,62" fill="none" stroke="#231d1f" stroke-width="3"/><polyline points="28,62 36,48 44,62" fill="none" stroke="#231d1f" stroke-width="2.2"/><polyline points="56,62 64,48 72,62" fill="none" stroke="#231d1f" stroke-width="2.2"/><line x1="18" y1="50" x2="82" y2="50" stroke="#231d1f" stroke-width="2" stroke-dasharray="4 4"/>',
  sampleHold: '<polyline points="26,64 34,64 34,34 52,34 52,56 70,56 70,42" fill="none" stroke="#231d1f" stroke-width="3"/><line x1="20" y1="50" x2="80" y2="50" stroke="#231d1f" stroke-width="2" stroke-dasharray="4 4"/><line x1="26" y1="72" x2="26" y2="58" stroke="#231d1f" stroke-width="2" stroke-dasharray="4 4"/><line x1="46" y1="72" x2="46" y2="38" stroke="#231d1f" stroke-width="2" stroke-dasharray="4 4"/><line x1="66" y1="72" x2="66" y2="52" stroke="#231d1f" stroke-width="2" stroke-dasharray="4 4"/>',
  quantizer: '<polyline points="22,62 32,62 32,36 52,36 52,50 68,50 68,62" fill="none" stroke="#231d1f" stroke-width="3"/><line x1="18" y1="50" x2="82" y2="50" stroke="#231d1f" stroke-width="2" stroke-dasharray="4 4"/><line x1="30" y1="24" x2="30" y2="76" stroke="#231d1f" stroke-width="2" stroke-dasharray="4 4"/><line x1="64" y1="24" x2="64" y2="76" stroke="#231d1f" stroke-width="2" stroke-dasharray="4 4"/>',
  slew: '<polyline points="22,64 34,64 52,34 72,34" fill="none" stroke="#231d1f" stroke-width="3"/><polyline points="22,64 40,64 40,34 52,34" fill="none" stroke="#231d1f" stroke-width="2" stroke-dasharray="4 4"/>',
  gateDelay: '<polyline points="22,64 34,64 34,36 50,36 50,64 72,64" fill="none" stroke="#231d1f" stroke-width="3"/><polyline points="22,64 26,64 26,28 42,28 42,56 58,56" fill="none" stroke="#231d1f" stroke-width="2" stroke-dasharray="4 4"/><line x1="42" y1="50" x2="56" y2="50" stroke="#231d1f" stroke-width="2.2"/><polyline points="50,44 56,50 50,56" fill="none" stroke="#231d1f" stroke-width="2.2"/>',
  logicAnd: '<path d="M28 32 H50 Q72 32 72 50 Q72 68 50 68 H28 Z" fill="none" stroke="#231d1f" stroke-width="2.5"/><line x1="18" y1="40" x2="28" y2="40" stroke="#231d1f" stroke-width="2.5"/><line x1="18" y1="60" x2="28" y2="60" stroke="#231d1f" stroke-width="2.5"/><line x1="72" y1="50" x2="84" y2="50" stroke="#231d1f" stroke-width="2.5"/><text x="50" y="56" text-anchor="middle" font-size="18" font-weight="700" fill="#231d1f">&amp;</text>',
  logicNand: '<path d="M28 32 H50 Q68 32 68 50 Q68 68 50 68 H28 Z" fill="none" stroke="#231d1f" stroke-width="2.5"/><line x1="18" y1="40" x2="28" y2="40" stroke="#231d1f" stroke-width="2.5"/><line x1="18" y1="60" x2="28" y2="60" stroke="#231d1f" stroke-width="2.5"/><circle cx="74" cy="50" r="4" fill="none" stroke="#231d1f" stroke-width="2.5"/><line x1="78" y1="50" x2="86" y2="50" stroke="#231d1f" stroke-width="2.5"/><text x="48" y="56" text-anchor="middle" font-size="18" font-weight="700" fill="#231d1f">&amp;</text>',
  logicOr: '<path d="M28 32 Q40 32 48 42 Q56 32 72 50 Q56 68 48 58 Q40 68 28 68 Q34 58 34 50 Q34 42 28 32" fill="none" stroke="#231d1f" stroke-width="2.5"/><line x1="18" y1="40" x2="30" y2="40" stroke="#231d1f" stroke-width="2.5"/><line x1="18" y1="60" x2="30" y2="60" stroke="#231d1f" stroke-width="2.5"/><line x1="72" y1="50" x2="84" y2="50" stroke="#231d1f" stroke-width="2.5"/><text x="53" y="56" text-anchor="middle" font-size="16" font-weight="700" fill="#231d1f">≥1</text>',
  logicXor: '<path d="M24 32 Q34 42 34 50 Q34 58 24 68" fill="none" stroke="#231d1f" stroke-width="2.5"/><path d="M30 32 Q42 32 50 42 Q58 32 74 50 Q58 68 50 58 Q42 68 30 68 Q36 58 36 50 Q36 42 30 32" fill="none" stroke="#231d1f" stroke-width="2.5"/><line x1="18" y1="40" x2="30" y2="40" stroke="#231d1f" stroke-width="2.5"/><line x1="18" y1="60" x2="30" y2="60" stroke="#231d1f" stroke-width="2.5"/><line x1="74" y1="50" x2="84" y2="50" stroke="#231d1f" stroke-width="2.5"/><text x="54" y="56" text-anchor="middle" font-size="16" font-weight="700" fill="#231d1f">=1</text>'
};

export function buildSymbolInnerMarkup(symbol) {
  const gradientId = `fadeWave-${symbol.id}`;
  const frame = frameMarkup[symbol.frame] ?? frameMarkup.square;
  const glyphs = (symbol.glyphs || [])
    .map((glyph) => (glyphMarkup[glyph] || "").replaceAll("url(#fadeWave)", `url(#${gradientId})`))
    .join("");

  return `
    <defs>
      <linearGradient id="${gradientId}" x1="0%" x2="100%">
        <stop offset="0%" stop-color="#231d1f" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#231d1f" stop-opacity="0.05" />
      </linearGradient>
    </defs>
    ${frame}
    ${glyphs}
  `;
}

export function buildStandaloneSvg(symbol, size = 128) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" fill="none">
      ${buildSymbolInnerMarkup(symbol)}
    </svg>
  `.trim();
}

export const symbolStroke = STROKE;
export const symbolStrokeWidth = STROKE_WIDTH;
