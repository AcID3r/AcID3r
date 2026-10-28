import { getTechInfo } from '@/data/techCatalog'
import type { GlobalStyles, NormalizedGitHubData, WidgetInstance } from '@/engine/types'

function esc(str: string): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function cw(size: number): number {
  return size * 0.6
}

function wrap(text: string, maxchars: number): string[] {
  if (!text) return []
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if (cur && cur.length + 1 + w.length > maxchars) {
      lines.push(cur)
      cur = w
    } else {
      cur = cur ? `${cur} ${w}` : w
    }
  }
  if (cur) lines.push(cur)
  return lines
}

function hexToRgba(hex: string, alpha: number): string {
  if (!hex) return `rgba(85,255,255,${alpha})`
  if (hex.startsWith('rgba(')) {
    return hex.replace(/[\d.]+\)$/, `${alpha})`)
  }
  let h = hex.replace('#', '').trim()
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (!/^[0-9A-F]{6}$/i.test(h)) {
    return hex
  }
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export interface SurveillancePalette {
  primary: string
  secondary: string
  led: string
  ground: string
  black: string
  text: string
  dim: string
  gray: string
  bright: string
  green: string
  red: string
  yellow: string
  bc: string
  bc2: string
  bch: string
  calShades: string[]
}

export function resolvePalette(
  cfg: Record<string, unknown>,
  globalStyles?: GlobalStyles
): SurveillancePalette {
  const primary = (cfg.accentColor as string) || globalStyles?.accentColor || '#55ffff'

  const secondary = (cfg.secondaryColor as string) || '#c084fc'

  const led = (cfg.ledColor as string) || '#ff5555'

  const bc = hexToRgba(primary, 0.3)
  const bc2 = hexToRgba(primary, 0.18)
  const bch = hexToRgba(primary, 0.6)

  const calShades = [
    hexToRgba(primary, 0.1),
    hexToRgba(primary, 0.28),
    hexToRgba(primary, 0.5),
    hexToRgba(primary, 0.72),
    primary,
  ]

  return {
    primary,
    secondary,
    led,
    ground: '#050308',
    black: '#000000',
    text: '#aaaaaa',
    dim: '#6f6478',
    gray: '#8a8a8a',
    bright: '#e6fbfb',
    green: '#55ff55',
    red: '#ff5555',
    yellow: '#ffff55',
    bc,
    bc2,
    bch,
    calShades,
  }
}

const _C = {
  ground: '#050308',
  black: '#000000',
  text: '#aaaaaa',
  dim: '#6f6478',
  gray: '#8a8a8a',
  bright: '#e6fbfb',
  cyan: '#55ffff',
  green: '#55ff55',
  red: '#ff5555',
  yellow: '#ffff55',
  purple: '#c084fc',
}

function getBaseCss(id: string): string {
  return `
    #${id} text, #${id} tspan { font-family: 'Departure Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; white-space: pre; }
    #${id} .led { animation: blink-${id} 1.1s steps(1,end) infinite; }
    @keyframes blink-${id} { 0%,55%{opacity:1} 56%,100%{opacity:.12} }
  `
}

function getDefs(id: string, pal?: SurveillancePalette): string {
  const p = pal || resolvePalette({})
  const hex = (p.primary || '#55ffff').replace('#', '')
  const rNorm = (parseInt(hex.slice(0, 2) || '55', 16) / 255).toFixed(3)
  const gNorm = (parseInt(hex.slice(2, 4) || 'ff', 16) / 255).toFixed(3)
  const bNorm = (parseInt(hex.slice(4, 6) || 'ff', 16) / 255).toFixed(3)

  return `
    <defs>
      <pattern id="scan-${id}" width="4" height="4" patternUnits="userSpaceOnUse">
        <rect width="4" height="2" fill="#000"/>
      </pattern>
      <radialGradient id="vig-${id}" cx="50%" cy="50%" r="62%">
        <stop offset="55%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity=".6"/>
      </radialGradient>
      <radialGradient id="amb1-${id}" cx="24%" cy="12%" r="46%">
        <stop offset="0%" stop-color="${p.primary}" stop-opacity=".06"/>
        <stop offset="100%" stop-color="${p.primary}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="amb2-${id}" cx="80%" cy="92%" r="52%">
        <stop offset="0%" stop-color="${p.secondary}" stop-opacity=".11"/>
        <stop offset="100%" stop-color="${p.secondary}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="nmfade-${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity=".9"/>
      </linearGradient>
      <filter id="glow-${id}" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="1.6" result="b"/>
        <feMerge>
          <feMergeNode in="b"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <filter id="avtint-${id}">
        <feColorMatrix type="matrix" values="
          0.33 0.33 0.33 0 0
          0.33 0.33 0.33 0 0
          0.33 0.33 0.33 0 0
          0    0    0    1 0
        " result="gray"/>
        <feComponentTransfer in="gray" result="contrast">
          <feFuncR type="linear" slope="1.2" intercept="-0.08"/>
          <feFuncG type="linear" slope="1.2" intercept="-0.08"/>
          <feFuncB type="linear" slope="1.2" intercept="-0.08"/>
        </feComponentTransfer>
        <feColorMatrix in="contrast" type="matrix" values="
          ${rNorm} 0 0 0 0
          0 ${gNorm} 0 0 0
          0 0 ${bNorm} 0 0
          0 0 0 1 0
        "/>
      </filter>
    </defs>
  `
}

function led(x: number, y: number, color = '#ff5555', blink = true, id = ''): string {
  const cls = blink ? ' class="led"' : ''
  const filter = id ? ` filter="url(#glow-${id})"` : ''
  return `<rect x="${x}" y="${y - 4}" width="8" height="8" fill="${color}"${cls}${filter}/>`
}

function corners(
  x: number,
  y: number,
  w: number,
  h: number,
  col = 'rgba(85,255,255,.60)',
  s = 12,
  inset = 5
): string {
  const L = x + inset
  const R = x + w - inset
  const T = y + inset
  const B = y + h - inset
  const p = [
    `<path d="M${L} ${T + s} v${-s} M${L} ${T} h${s}"/>`,
    `<path d="M${R} ${T + s} v${-s} M${R} ${T} h${-s}"/>`,
    `<path d="M${L} ${B - s} v${s} M${L} ${B} h${s}"/>`,
    `<path d="M${R} ${B - s} v${s} M${R} ${B} h${-s}"/>`,
  ]
  return `<g stroke="${col}" stroke-width="1" fill="none">${p.join('')}</g>`
}

function scanlines(x: number, y: number, w: number, h: number, op = 0.18, id = ''): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#scan-${id})" opacity="${op}"/>`
}

function panelFrame(
  w: number,
  h: number,
  title: string,
  ref: string,
  y0 = 0,
  id = '',
  pal?: SurveillancePalette
): string {
  const p = pal || resolvePalette({})
  const parts: string[] = []
  parts.push(
    `<rect x="1" y="${y0 + 1}" width="${w - 2}" height="${h - 2}" fill="${p.black}" stroke="${p.bc}"/>`
  )
  parts.push(
    `<rect x="1" y="${y0 + 1}" width="${w - 2}" height="26" fill="${hexToRgba(p.primary, 0.05)}"/>`
  )
  parts.push(`<line x1="1" y1="${y0 + 27}" x2="${w - 1}" y2="${y0 + 27}" stroke="${p.bc2}"/>`)
  parts.push(led(16, y0 + 14, p.led, true, id))
  parts.push(
    `<text x="30" y="${y0 + 17.5}" font-size="9.5" letter-spacing="1.6" fill="${p.primary}">${esc(title)}</text>`
  )
  parts.push(
    `<text x="${w - 14}" y="${y0 + 17.5}" font-size="9.5" letter-spacing="1.6" text-anchor="end" fill="${p.gray}">${esc(ref)}</text>`
  )
  parts.push(corners(1, y0 + 1, w - 2, h - 2, p.bch, 12, 5))
  parts.push(scanlines(2, y0 + 28, w - 4, h - 30, 0.18, id))
  return parts.join('')
}

function wrapSvg(
  w: number,
  h: number,
  id: string,
  extraCss: string,
  body: string,
  bgOn = true,
  pal?: SurveillancePalette
): string {
  const p = pal || resolvePalette({})
  const bgHtml = bgOn
    ? `
      <rect width="${w}" height="${h}" fill="${p.ground}"/>
      <rect width="${w}" height="${h}" fill="url(#amb1-${id})"/>
      <rect width="${w}" height="${h}" fill="url(#amb2-${id})"/>
    `
    : ''
  return `
    <svg xmlns="http://www.w3.org/2000/svg" id="${id}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" font-family="'Departure Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace">
      ${getDefs(id, p)}
      <style>
        ${getBaseCss(id)}
        ${extraCss}
      </style>
      ${bgHtml}
      ${body}
    </svg>
  `
}

export function renderSurveillanceHeader(
  widget: WidgetInstance,
  data: NormalizedGitHubData,
  globalStyles: GlobalStyles,
  forceStatic = false
): string {
  const w = widget.size.width || 780
  const cfg = widget.config || {}
  const id = widget.instanceId || 'surv-hdr'
  const pal = resolvePalette(cfg, globalStyles)

  const username = (cfg.username as string) || data.user.login || 'operator'
  const name = (cfg.displayName as string) || data.user.name || username
  const bio = (cfg.customBio as string) || data.user.bio || 'Terminal Purist // Open Source Hacker'
  const modeTag = (cfg.modeTag as string) || '198X MODE'
  const sigStatus = (cfg.sigStatus as string) || 'STRONG'
  const roleTag = (cfg.roleTag as string) || 'Developer'
  const quoteText =
    (cfg.quoteText as string) ||
    '“Once I told the computer to do something and it did it exactly how I told it to.”'
  const coords = (cfg.coords as string) || '◎ 12.911210, 79.132685'
  const avatarUrl =
    (cfg.avatarUrl as string) || data.user.avatar_url || `https://github.com/${username}.png`

  const fw = Math.min(300, Math.max(200, Math.round(w * 0.38)))
  const fh = Math.round(fw * 0.75)
  const rowY = 176
  const h = widget.size.height || rowY + fh + 16

  const css = forceStatic
    ? ''
    : `
      @keyframes jitter-${id}{0%,93%,100%{transform:translateX(0)}94%{transform:translateX(-3px)}96%{transform:translateX(2px)}98%{transform:translateX(-1px)}}
      #${id} .nm{animation:jitter-${id} 7s steps(1) infinite;transform-box:fill-box}
      @keyframes roll-${id}{0%{transform:translateY(-14px)}100%{transform:translateY(${fh}px)}}
      #${id} .track{animation:roll-${id} 9s linear infinite}
    `

  const b: string[] = []

  b.push(
    `<text x="8" y="14" font-size="10" letter-spacing="1.5" fill="${pal.dim}">NODE//${esc(username)}  ·  SIG:<tspan fill="${pal.green}">${esc(sigStatus)}</tspan>  ·  ${esc(modeTag)}</text>`
  )
  b.push(led(w - 116, 10, pal.led, !forceStatic, id))
  b.push(
    `<text x="${w - 8}" y="14" font-size="10" letter-spacing="1.5" text-anchor="end" fill="${pal.red}">REC 00:37:12</text>`
  )
  b.push(`<line x1="8" y1="24" x2="${w - 8}" y2="24" stroke="${pal.bc2}"/>`)

  const cx = w / 2
  b.push(
    `<text x="${cx}" y="52" font-size="10.5" letter-spacing="2.4" text-anchor="middle" fill="${pal.primary}" opacity=".8">[ SYSTEM :: OXIDE TERMINAL PROFILE :: ${esc(modeTag)} ]</text>`
  )

  const nm = `&gt; ${esc(name)}`
  if (!forceStatic) {
    b.push(
      `<text class="nm" x="${cx - 2}" y="108" font-size="48" letter-spacing="5" text-anchor="middle" fill="${pal.red}" opacity=".5">${nm}</text>`
    )
    b.push(
      `<text class="nm" x="${cx + 2}" y="108" font-size="48" letter-spacing="5" text-anchor="middle" fill="${pal.primary}" opacity=".55">${nm}</text>`
    )
  }
  b.push(
    `<text class="nm" x="${cx}" y="108" font-size="48" letter-spacing="5" text-anchor="middle" fill="${pal.bright}" filter="url(#glow-${id})"><tspan fill="${pal.dim}">&gt;</tspan> ${esc(name)}</text>`
  )
  b.push(
    `<text x="${cx}" y="130" font-size="11" letter-spacing=".9" text-anchor="middle" fill="${pal.dim}">[ ${esc(name)} // @${esc(username)} // ${esc(roleTag)} ]</text>`
  )
  b.push(
    `<text x="${cx}" y="152" font-size="13" letter-spacing="2.6" text-anchor="middle" fill="${pal.primary}">${esc(roleTag)} <tspan fill="${pal.secondary}">//</tspan> Terminal Purist</text>`
  )

  const fx = w - 8 - fw
  const fy = rowY
  const bx = 8
  const bw = fx - bx - 20
  const fs = 11
  const maxc = Math.max(20, Math.floor(bw / (fs * 0.72)))

  b.push(`<rect x="${bx}" y="${fy + 2}" width="2" height="${fh - 40}" fill="${pal.bc}"/>`)
  const tx = bx + 14
  let y = fy + 14
  b.push(
    `<text x="${tx}" y="${y}" font-size="${fs}" fill="${pal.text}"><tspan fill="${pal.primary}">${esc(name)} (@${esc(username)})</tspan> — system operator.</text>`
  )
  y += 16
  b.push(
    `<text x="${tx}" y="${y}" font-size="${fs}" fill="${pal.text}">Welcome to the terminal station.</text>`
  )
  y += 22
  for (const ql of wrap(quoteText, maxc)) {
    b.push(`<text x="${tx}" y="${y}" font-size="${fs}" fill="${pal.secondary}">${esc(ql)}</text>`)
    y += 16
  }
  y += 6
  for (const bl of wrap(bio, maxc)) {
    b.push(
      `<text x="${tx}" y="${y}" font-size="${fs}" fill="${pal.text}"><tspan fill="${pal.primary}">SYS:</tspan> ${esc(bl)}</text>`
    )
    y += 16
  }

  const iy = fy + 4
  const ih = fh - 4
  const barCols = ['#ffffff', '#ffff55', '#55ffff', '#55ff55', '#ff55ff', '#ff5555', '#5555ff']
  const sw = fw / barCols.length
  for (let i = 0; i < barCols.length; i++) {
    b.push(`<rect x="${fx + i * sw}" y="${fy}" width="${sw + 1}" height="4" fill="${barCols[i]}"/>`)
  }
  b.push(
    `<clipPath id="hfclip-${id}"><rect x="${fx}" y="${iy}" width="${fw}" height="${ih}"/></clipPath>`
  )
  b.push(`<g clip-path="url(#hfclip-${id})">`)
  b.push(
    `<image x="${fx}" y="${iy}" width="${fw}" height="${ih}" preserveAspectRatio="xMidYMid slice" crossorigin="anonymous" href="${avatarUrl}" filter="url(#avtint-${id})" style="image-rendering:pixelated;"/>`
  )
  b.push(
    `<rect x="${fx}" y="${iy}" width="${fw}" height="${ih}" fill="url(#scan-${id})" opacity=".4"/>`
  )
  if (!forceStatic) {
    b.push(
      `<rect class="track" x="${fx}" y="${iy}" width="${fw}" height="12" fill="#fff" opacity=".10"/>`
    )
  }
  b.push(`<rect x="${fx}" y="${iy}" width="${fw}" height="${ih}" fill="url(#vig-${id})"/>`)
  b.push(`</g>`)
  b.push(
    `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="none" stroke="${pal.bc}" stroke-width="2"/>`
  )

  b.push(`<rect x="${fx}" y="${iy}" width="${fw}" height="17" fill="rgba(0,0,0,.55)"/>`)
  b.push(led(fx + 9, iy + 8.5, pal.led, !forceStatic, id))
  b.push(
    `<text x="${fx + 19}" y="${iy + 12}" font-size="8" letter-spacing="1.2" fill="${pal.primary}">CH 03 · CAM-01</text>`
  )
  b.push(
    `<text x="${fx + fw - 8}" y="${iy + 12}" font-size="8" letter-spacing="1.2" text-anchor="end" fill="${pal.red}">LIVE</text>`
  )

  b.push(
    `<rect x="${fx}" y="${iy + ih - 34}" width="${fw}" height="34" fill="url(#nmfade-${id})"/>`
  )
  b.push(
    `<text x="${fx + 8}" y="${iy + ih - 16}" font-size="8" letter-spacing=".8" fill="${pal.red}">REC <tspan fill="${pal.primary}">02:41:07:14</tspan></text>`
  )
  b.push(
    `<text x="${fx + 8}" y="${iy + ih - 6}" font-size="8" letter-spacing=".8" fill="${pal.primary}">${esc(coords)}</text>`
  )
  b.push(corners(fx, fy, fw, fh, pal.bch, 11, 4))

  return wrapSvg(w, h, id, css, b.join(''), false, pal)
}
