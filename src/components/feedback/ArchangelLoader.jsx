import { useId, useSyncExternalStore } from 'react';
import './archangel-loader.css';

const motionQuery = '(prefers-reduced-motion: reduce)';
const subscribe = callback => {
  const query = window.matchMedia?.(motionQuery);
  query?.addEventListener('change', callback);
  return () => query?.removeEventListener('change', callback);
};
const reducedSnapshot = () => window.matchMedia?.(motionQuery).matches ?? false;
const times = '0;.12;.38;.58;.72;.86;1';
const duration = '4.2s';
const upper = ['M173 125 Q185 126 191 145', 'M173 125 Q186 106 196 101', 'M173 125 Q193 129 199 140'];
const lower = ['M191 145 Q187 152 177 158', 'M196 101 Q207 91 217 88', 'M199 140 Q210 129 210 114'];
const poses = frames => [frames[0],frames[0],frames[1],frames[2],frames[2],frames[1],frames[0]].join(';');
const feathers = [
  'M132 130 C111 115 105 90 87 62 C91 96 101 124 124 143',
  'M121 139 C100 118 92 97 78 82 C79 109 93 135 116 147',
  'M110 144 C86 127 78 107 66 99 C70 123 85 142 105 150',
  'M99 149 C79 138 65 120 55 118 C62 138 77 150 93 153',
  'M88 153 C72 149 58 138 51 136 C61 151 73 158 85 158',
];
function Arm({ frames, reduced }) {
  return <g strokeLinecap="round" strokeLinejoin="round">
    {[['#725b36',15],['#f4ead3',11]].map(([stroke,width]) => <path key={stroke} d={reduced?frames[2]:frames[0]} fill="none" stroke={stroke} strokeWidth={width}>
      {!reduced&&<animate attributeName="d" values={poses(frames)} keyTimes={times} dur={duration} repeatCount="indefinite" calcMode="linear"/>}
    </path>)}
  </g>;
}

export default function ArchangelLoader() {
  const id = useId().replaceAll(':','');
  const reduced = useSyncExternalStore(subscribe, reducedSnapshot, () => true);
  return <svg className="archangel-scene" viewBox="0 0 320 300" aria-hidden="true" focusable="false" data-motion={reduced?'reduced':'animated'}>
    <defs>
      <linearGradient id={id+'-feather'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fffdf5"/><stop offset=".55" stopColor="#e7dcc0"/><stop offset="1" stopColor="#ad9668"/></linearGradient>
      <linearGradient id={id+'-robe'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#25435b"/><stop offset=".55" stopColor="#0a2036"/><stop offset="1" stopColor="#36536a"/></linearGradient>
      <linearGradient id={id+'-steel'} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#8d9ea7"/><stop offset=".45" stopColor="#fffef7"/><stop offset=".55" stopColor="#d5e4e9"/><stop offset="1" stopColor="#718b9b"/></linearGradient>
      <radialGradient id={id+'-light'}><stop stopColor="#e6c16b" stopOpacity=".18"/><stop offset="1" stopColor="#e6c16b" stopOpacity="0"/></radialGradient>
      <g id={id+'-wing'}>
        <path d="M140 132 C119 112 116 79 85 49 C80 76 59 85 47 103 C35 124 58 153 86 163 C108 171 129 160 141 145Z" fill={'url(#'+id+'-feather)'} stroke="#a9905e" strokeWidth="1"/>
        {feathers.map(d=><path key={d} d={d} fill="none" stroke="#a58e62" strokeWidth="1" strokeLinejoin="round"/>)}
        <path d="M139 139 C124 121 118 102 110 89 C114 118 119 139 133 151" fill="#f7efdb" stroke="#b29a6b" strokeWidth="1"/>
        <path d="M132 143 C117 139 111 136 101 134 M128 148 C115 149 107 148 99 146" fill="none" stroke="#c6b58e" strokeWidth="1"/>
      </g>
    </defs>
    <circle cx="160" cy="143" r="132" fill={'url(#'+id+'-light)'}/>
    <circle cx="160" cy="145" r="119" fill="none" stroke="#bea15f" strokeOpacity=".16" strokeWidth="1"/>
    <path d="M155 22 H165 M160 17 V27 M39 151 H45 M42 148 V154 M278 140 H284 M281 137 V143" fill="none" stroke="#c29b46" strokeWidth="1.2" opacity=".6"/>
    <ellipse cx="155" cy="270" rx="53" ry="5" fill="#10243a" opacity=".08"/>
    <g>
      {!reduced&&<animateTransform attributeName="transform" type="rotate" values="0 139 139;-4 139 139;0 139 139" dur={duration} repeatCount="indefinite"/>}
      <use href={'#'+id+'-wing'}/>
    </g>
    <g transform="translate(320 0) scale(-1 1)"><g>
      {!reduced&&<animateTransform attributeName="transform" type="rotate" values="0 139 139;-4 139 139;0 139 139" dur={duration} repeatCount="indefinite"/>}
      <use href={'#'+id+'-wing'}/>
    </g></g>
    <circle cx="160" cy="83" r="27" fill="none" stroke="#ccaa58" strokeWidth="1.2"/>
    <circle cx="160" cy="83" r="23" fill="none" stroke="#ccaa58" strokeWidth=".6" opacity=".35"/>
    {/* Mantle, greaves and draped tunic. */}
    <path d="M145 117 C129 137 136 156 127 181 L109 242 Q128 257 146 248 L181 245 Q198 215 182 173 L178 124Z" fill={'url(#'+id+'-robe)'} stroke="#142a3c" strokeWidth="1.2"/>
    <path d="M143 232 L156 234 L151 263 Q147 267 136 267 L137 260Z M167 231 L177 231 L185 259 Q192 265 184 266 L172 264Z" fill="#d5c6a3" stroke="#8c7650" strokeWidth="1.2"/>
    <path d="M143 245 L153 246 M173 245 L182 244 M138 260 L150 260 M173 258 L185 258" fill="none" stroke="#a08650" strokeWidth="2"/>
    <path d="M145 159 Q161 167 176 158 C173 187 185 209 180 242 L162 249 L149 242 L130 249 C135 221 133 199 145 159Z" fill={'url(#'+id+'-feather)'} stroke="#b5a17b" strokeWidth="1.1"/>
    <path d="M150 177 Q139 210 143 240 M161 172 Q154 203 160 244 M169 180 Q168 214 175 238" fill="none" stroke="#ad976f" strokeWidth="1.5"/>
    <path d="M146 112 L173 113 L180 144 L171 165 Q159 174 143 162 L137 133Z" fill="#17334a" stroke="#b69a5c" strokeWidth="1.5"/>
    <path d="M146 118 Q159 124 172 118 M141 133 Q159 143 177 134 M144 148 Q159 153 175 147" fill="none" stroke="#b79c62" strokeWidth="1.2"/>
    <path d="M141 117 L150 113 L173 157 L166 164Z" fill="#e9dfc4" stroke="#b9a176" strokeWidth=".7"/>
    <path d="M143 160 Q159 167 175 159 L176 166 Q159 173 142 166Z" fill="#b99545"/>
    <rect x="157" y="163" width="8" height="7" rx="1" fill="#f3d88d" stroke="#86692f"/>
    <path d="M153 101 L153 116 Q162 124 168 112 L167 99" fill="#e5d5b3" stroke="#aa9063" strokeWidth="1"/>
    {/* Face in profile, swept hair and a small laurel. */}
    <path d="M148 77 Q158 65 170 77 L172 85 L177 89 L172 92 Q173 103 164 106 L154 101 L149 91Z" fill="#f0e2c4" stroke="#a99066" strokeWidth="1"/>
    <path d="M173 87 L169 87 M171 96 L166 96" fill="none" stroke="#6b5a43" strokeWidth="1.2"/>
    <path d="M169 76 Q159 78 153 89 L155 103 Q146 107 144 97 Q136 92 143 83 Q138 74 149 70 Q163 62 170 73Z" fill="#665c4b" stroke="#514a3d" strokeWidth="1"/>
    <path d="M147 79 Q151 69 162 70 M145 88 Q148 80 154 77 M148 97 Q145 92 150 87" fill="none" stroke="#baaa87" strokeWidth="1.2"/>
    <path d="M147 77 Q158 69 169 77" fill="none" stroke="#c6a14d" strokeWidth="2"/>
    {/* Left arm steadies the scabbard. */}
    <path d="M143 126 Q126 144 135 159 L164 176" fill="none" stroke="#8f7953" strokeWidth="14" strokeLinecap="round"/>
    <path d="M143 126 Q126 144 135 159 L164 176" fill="none" stroke="#e8ddc3" strokeWidth="10" strokeLinecap="round"/>
    <path d="M128 151 L138 149 L145 161 L136 167Z" fill="#19364b" stroke="#b3975c" strokeWidth="1"/>
    <Arm frames={upper} reduced={reduced}/><Arm frames={lower} reduced={reduced}/>
    <path d="M137 119 Q143 112 150 121 L148 131 L135 134Z M169 117 Q180 113 185 126 L177 132 L167 127Z" fill="#e6dac0" stroke="#ad945e" strokeWidth="1.2"/>
    {/* The blade physically slides out from behind the opaque scabbard. */}
    <g className="archangel-sword-draw" transform={reduced?'translate(40 -70)':undefined}>
      {!reduced&&<animateTransform attributeName="transform" type="translate" values="0 0;0 0;40 -70;40 -70;40 -70;40 -70;0 0" keyTimes={times} dur={duration} repeatCount="indefinite"/>}
      <g transform={reduced?'rotate(150 170 170)':undefined}>
        {!reduced&&<animateTransform attributeName="transform" type="rotate" values="0 170 170;0 170 170;0 170 170;150 170 170;150 170 170;0 170 170;0 170 170" keyTimes={times} dur={duration} repeatCount="indefinite"/>}
        <g transform="translate(170 170) rotate(30)">
          <path d="M-3 3 L-3 75 L0 86 L3 75 L3 3Z" fill={'url(#'+id+'-steel)'} stroke="#a6b8bf" strokeWidth=".7"/>
          <path d="M0 8 V77" stroke="#fff" strokeWidth=".7"/>
          <path d="M-13 1 Q0 -5 13 1 L13 5 Q0 1 -13 5Z" fill="#c5a153" stroke="#84652b" strokeWidth=".8"/>
          <path d="M-2 -20 H2 V0 H-2Z" fill="#18354a" stroke="#c5a153" strokeWidth="1"/>
          <circle cy="-23" r="3.5" fill="#d0ac59"/>
          <ellipse cy="-13" rx="5.5" ry="6.5" fill="#e9dbba" stroke="#a88e61" strokeWidth="1"/>
          <path d="M-3 -15 H3 M-3 -12 H3" stroke="#b39b70" strokeWidth=".8"/>
        </g>
      </g>
    </g>
    <g transform="translate(170 170) rotate(30)">
      <path d="M-5 6 L-4 80 Q0 91 4 80 L5 6Z" fill="#122d43" stroke="#a88c50" strokeWidth="1.4"/>
      <path d="M-5 8 H5 M-4 16 H4 M-3 76 H3" stroke="#d1af64" strokeWidth="2.5"/>
      <path d="M0 22 V69" stroke="#526375" strokeWidth=".8"/>
    </g>
    <ellipse cx="164" cy="175" rx="6" ry="5" transform="rotate(30 164 175)" fill="#e9dbba" stroke="#aa9166" strokeWidth="1"/>
    <path className="archangel-ground" d="M126 281 H194 M145 286 H175" fill="none" stroke="#b99545" strokeWidth="1" strokeLinecap="round"/>
  </svg>;
}
