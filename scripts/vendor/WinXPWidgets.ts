import {
  EXTERNAL_LINKS,
  LANGUAGE_COLORS,
  WINXP_COLOR_THEMES,
  type WinXPColorTheme,
} from '@/constants'
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

export function resolveWinXPPalette(
  cfg: Record<string, unknown>,
  globalStyles?: GlobalStyles
): WinXPColorTheme {
  const themeName = (cfg.themePreset as string) || ''
  const matched = WINXP_COLOR_THEMES.find((t) =>
    t.name.toLowerCase().includes(themeName.toLowerCase())
  )
  if (matched) return matched

  return {
    name: 'Luna Blue',
    titleGradientStart: (cfg.titleGradientStart as string) || '#0058ee',
    titleGradientEnd:
      (cfg.titleGradientEnd as string) ||
      (globalStyles?.accentColor && globalStyles.accentColor !== '#c5ff4a'
        ? globalStyles.accentColor
        : '#2989f5'),
    titleColor: '#ffffff',
    windowBg: '#ece9d8',
    border: '#0054e3',
    accent: '#3c81f3',
  }
}

function renderWindowChrome(
  id: string,
  w: number,
  h: number,
  title: string,
  palette: WinXPColorTheme,
  iconSvgPath?: string
): string {
  const gradId = `winxp-title-grad-${id}`
  const btnGradId = `winxp-btn-grad-${id}`
  const closeBtnGradId = `winxp-close-grad-${id}`

  return `
    <defs>
      <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${palette.titleGradientStart}" />
        <stop offset="25%" stop-color="${palette.titleGradientEnd}" />
        <stop offset="85%" stop-color="${palette.titleGradientStart}" />
        <stop offset="100%" stop-color="${palette.titleGradientEnd}" />
      </linearGradient>
      <linearGradient id="${btnGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#3c8cf5" />
        <stop offset="40%" stop-color="#2464df" />
        <stop offset="100%" stop-color="#1446b8" />
      </linearGradient>
      <linearGradient id="${closeBtnGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#e96c56" />
        <stop offset="40%" stop-color="#d63f24" />
        <stop offset="100%" stop-color="#b8240c" />
      </linearGradient>
      <filter id="winxp-shadow-${id}" x="-4%" y="-4%" width="108%" height="112%">
        <feDropShadow dx="3" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.35" />
      </filter>
    </defs>

    <!-- Outer Window Frame -->
    <rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="6" ry="6" fill="${palette.windowBg}" stroke="${palette.border}" stroke-width="3" filter="url(#winxp-shadow-${id})" />

    <!-- Title Bar Header -->
    <path d="M 4 8 Q 4 4 8 4 L ${w - 8} 4 Q ${w - 4} 4 ${w - 4} 8 L ${w - 4} 30 L 4 30 Z" fill="url(#${gradId})" />

    <!-- Title Bar Inner Highlight (Classic XP Gel Gloss) -->
    <path d="M 4 8 Q 4 4 8 4 L ${w - 8} 4 Q ${w - 4} 4 ${w - 4} 8 L ${w - 4} 16 L 4 16 Z" fill="#ffffff" fill-opacity="0.25" />

    <!-- Window Icon -->
    ${
      iconSvgPath
        ? `<g transform="translate(10, 8)">${iconSvgPath}</g>`
        : `<circle cx="16" cy="17" r="6" fill="#f59e0b" /><text x="13.5" y="20.5" font-family="'Segoe UI', Tahoma, sans-serif" font-size="9" font-weight="bold" fill="#ffffff">XP</text>`
    }

    <!-- Window Title -->
    <text x="32" y="20" font-family="'Trebuchet MS', 'Segoe UI', Tahoma, sans-serif" font-size="12" font-weight="bold" fill="${palette.titleColor}" style="text-shadow: 1px 1px 1px #001a66;">
      ${esc(title)}
    </text>

    <!-- Title Bar Buttons (Minimize, Maximize, Close) -->
    <g transform="translate(${w - 74}, 7)">
      <!-- Minimize Button -->
      <rect x="0" y="0" width="19" height="17" rx="3" fill="url(#${btnGradId})" stroke="#ffffff" stroke-width="1" stroke-opacity="0.7" />
      <line x1="4" y1="12" x2="14" y2="12" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />

      <!-- Maximize Button -->
      <rect x="23" y="0" width="19" height="17" rx="3" fill="url(#${btnGradId})" stroke="#ffffff" stroke-width="1" stroke-opacity="0.7" />
      <rect x="27" y="4" width="10" height="9" fill="none" stroke="#ffffff" stroke-width="1.8" />
      <line x1="27" y1="6" x2="37" y2="6" stroke="#ffffff" stroke-width="2" />

      <!-- Close Button (Red) -->
      <rect x="46" y="0" width="21" height="17" rx="3" fill="url(#${closeBtnGradId})" stroke="#ffffff" stroke-width="1" stroke-opacity="0.8" />
      <path d="M 52 5 L 61 12 M 61 5 L 52 12" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
    </g>
  `
}


export function renderWinXPMediaPlayer(
  widget: WidgetInstance,
  data: NormalizedGitHubData,
  globalStyles: GlobalStyles,
  forceStatic = false
): string {
  const w = widget.size.width || 780
  const h = widget.size.height || 300
  const id = `winxp-wmp-${widget.instanceId.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const cfg = widget.config || {}
  const pal = resolveWinXPPalette(cfg, globalStyles)

  const windowTitle = (cfg.windowTitle as string) || 'Windows Media Player'
  const trackTitle =
    (cfg.trackTitle as string) || `${data.user.login} - Full Stack Symphonies (2001-2026)`
  const visualizerMode = (cfg.visualizerMode as string) || 'Ambience : Water'
  const customTime = (cfg.customTime as string) || '03:42 / 04:20'

  const topLanguages = Object.keys(data.languages || {}).slice(0, 4)
  const playlistItems =
    topLanguages.length > 0 ? topLanguages : ['TypeScript', 'React', 'Node.js', 'Rust']

  const barsCount = 28
  const barsSvg = Array.from({ length: barsCount })
    .map((_, i) => {
      const bh = 15 + Math.sin(i * 0.7) * 20 + ((i * 13) % 25)
      const x = 18 + i * 9
      const y = 140 - bh
      return `
        <rect x="${x}" y="${y}" width="6" height="${bh}" fill="url(#wmp-spectrum-${id})">
          ${
            !forceStatic
              ? `<animate attributeName="height" values="${bh};${bh * 0.4 + 10};${Math.min(55, bh * 1.3)};${bh}" dur="${1.2 + (i % 5) * 0.2}s" repeatCount="indefinite" />
                 <animate attributeName="y" values="${y};${140 - (bh * 0.4 + 10)};${140 - Math.min(55, bh * 1.3)};${y}" dur="${1.2 + (i % 5) * 0.2}s" repeatCount="indefinite" />`
              : ''
          }
        </rect>
      `
    })
    .join('')

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
      <defs>
        <linearGradient id="wmp-skin-${id}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#192841" />
          <stop offset="50%" stop-color="#0a1324" />
          <stop offset="100%" stop-color="#050a14" />
        </linearGradient>
        <linearGradient id="wmp-spectrum-${id}" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#10b981" />
          <stop offset="60%" stop-color="#3b82f6" />
          <stop offset="90%" stop-color="#ec4899" />
        </linearGradient>
      </defs>

      ${renderWindowChrome(id, w, h, windowTitle, pal)}

      <!-- WMP Dark Metallic Body -->
      <g transform="translate(6, 32)">
        <rect x="0" y="0" width="${w - 12}" height="${h - 38}" rx="2" fill="url(#wmp-skin-${id})" stroke="#2a4365" stroke-width="1.5" />

        <!-- Top Navigation Ribbon / Now Playing -->
        <g transform="translate(10, 8)">
          <rect x="0" y="0" width="${w - 32}" height="26" rx="3" fill="#0f172a" stroke="#1e293b" />
          <circle cx="16" cy="13" r="8" fill="#2563eb" />
          <polygon points="14,9 20,13 14,17" fill="#ffffff" />
          <text x="32" y="17" font-family="'Segoe UI', Tahoma, sans-serif" font-size="11" font-weight="bold" fill="#60a5fa">
            Now Playing: <tspan fill="#ffffff">${esc(trackTitle)}</tspan>
          </text>
          <text x="${w - 100}" y="17" font-family="'Segoe UI', Tahoma, sans-serif" font-size="10.5" fill="#94a3b8">
            ${esc(customTime)}
          </text>
        </g>

        <!-- Left Visualizer Screen -->
        <g transform="translate(10, 42)">
          <rect x="0" y="0" width="280" height="150" rx="4" fill="#020617" stroke="#334155" stroke-width="2" />
          <line x1="10" y1="75" x2="270" y2="75" stroke="#1e293b" stroke-dasharray="2,2" />
          <line x1="10" y1="110" x2="270" y2="110" stroke="#1e293b" stroke-dasharray="2,2" />
          <line x1="10" y1="140" x2="270" y2="140" stroke="#2563eb" stroke-opacity="0.4" />

          ${barsSvg}

          <text x="14" y="20" font-family="'Trebuchet MS', sans-serif" font-size="11" font-weight="bold" fill="#38bdf8">
            ${esc(visualizerMode)}
          </text>
        </g>

        <!-- Right Playlist -->
        <g transform="translate(302, 42)">
          <rect x="0" y="0" width="${w - 324}" height="150" rx="4" fill="#090d16" stroke="#1e293b" />
          <text x="14" y="20" font-family="'Segoe UI', Tahoma, sans-serif" font-size="11" font-weight="bold" fill="#94a3b8">
            PLAYLIST: TECH STACK AUDIO CHANNELS
          </text>
          <line x1="14" y1="28" x2="${w - 340}" y2="28" stroke="#1e293b" />

          ${playlistItems
            .map((lang, idx) => {
              const yPos = 48 + idx * 26
              const isSelected = idx === 0
              return `
                <g transform="translate(14, ${yPos})">
                  <rect x="0" y="-12" width="${w - 355}" height="22" rx="2" fill="${isSelected ? '#1e3a8a' : 'transparent'}" />
                  <text x="8" y="3" font-family="'Segoe UI', Tahoma, sans-serif" font-size="10.5" font-weight="${isSelected ? 'bold' : 'normal'}" fill="${isSelected ? '#ffffff' : '#cbd5e1'}">
                    ${idx + 1}. Track 0${idx + 1} - ${esc(lang)} Code Engine.mp3
                  </text>
                  <text x="${w - 410}" y="3" font-family="'Segoe UI', Tahoma, sans-serif" font-size="9.5" fill="#64748b">
                    320 kbps
                  </text>
                </g>
              `
            })
            .join('')}
        </g>

        <!-- Bottom Transport Controls Bar -->
        <g transform="translate(10, 202)">
          <rect x="0" y="0" width="${w - 32}" height="52" rx="3" fill="#0b1322" stroke="#1e293b" />

          <rect x="14" y="8" width="${w - 60}" height="4" rx="2" fill="#1e293b" />
          <rect x="14" y="8" width="${Math.round((w - 60) * 0.65)}" height="4" rx="2" fill="#3b82f6" />
          <circle cx="${14 + Math.round((w - 60) * 0.65)}" cy="10" r="5" fill="#60a5fa" stroke="#ffffff" stroke-width="1.5" />

          <!-- Circular Metal Play / Pause Buttons -->
          <g transform="translate(${Math.round((w - 32) / 2 - 60)}, 20)">
            <circle cx="0" cy="14" r="11" fill="#1e293b" stroke="#3b82f6" />
            <polygon points="-4,14 2,9 2,19" fill="#93c5fd" />
            <line x1="-4" y1="9" x2="-4" y2="19" stroke="#93c5fd" stroke-width="1.5" />

            <circle cx="35" cy="14" r="15" fill="url(#wmp-spectrum-${id})" stroke="#ffffff" stroke-width="1.5" />
            <rect x="30" y="8" width="3.5" height="12" fill="#ffffff" />
            <rect x="36.5" y="8" width="3.5" height="12" fill="#ffffff" />

            <circle cx="70" cy="14" r="11" fill="#1e293b" stroke="#3b82f6" />
            <polygon points="4,14 -2,9 -2,19" fill="#93c5fd" />
            <line x1="4" y1="9" x2="4" y2="19" stroke="#93c5fd" stroke-width="1.5" />

            <circle cx="100" cy="14" r="11" fill="#1e293b" stroke="#3b82f6" />
            <rect x="96" y="10" width="8" height="8" fill="#93c5fd" />
          </g>

          <g transform="translate(${w - 150}, 30)">
            <path d="M 0 5 L 4 5 L 8 1 L 8 9 L 4 5 Z" fill="#94a3b8" />
            <rect x="16" y="4" width="70" height="3" rx="1.5" fill="#334155" />
            <rect x="16" y="4" width="55" height="3" rx="1.5" fill="#10b981" />
            <circle cx="71" cy="5.5" r="4" fill="#ffffff" stroke="#10b981" stroke-width="1.5" />
          </g>
        </g>
      </g>
    </svg>
  `
}


export function renderWinXPTaskbar(
  widget: WidgetInstance,
  data: NormalizedGitHubData,
  globalStyles: GlobalStyles,
  _forceStatic = false
): string {
  const w = widget.size.width || 780
  const h = widget.size.height || 48
  const id = `winxp-taskbar-${widget.instanceId.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const cfg = widget.config || {}

  const username = data.user.login || 'User'
  const customTime = (cfg.customTime as string) || '04:20 PM'
  const startButtonLabel = (cfg.startButtonLabel as string) || 'start'
  const activeWindowLabel = (cfg.activeWindowLabel as string) || `${username} - GitAscii`
  const inactiveWindowLabel = (cfg.inactiveWindowLabel as string) || 'Minesweeper'

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
      <defs>
        <linearGradient id="winxp-tb-grad-${id}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#245edb" />
          <stop offset="10%" stop-color="#3f8cf3" />
          <stop offset="30%" stop-color="#245edb" />
          <stop offset="90%" stop-color="#1941a5" />
          <stop offset="100%" stop-color="#1941a5" />
        </linearGradient>

        <linearGradient id="winxp-start-grad-${id}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#388e3c" />
          <stop offset="12%" stop-color="#66bb6a" />
          <stop offset="45%" stop-color="#43a047" />
          <stop offset="90%" stop-color="#2e7d32" />
          <stop offset="100%" stop-color="#1b5e20" />
        </linearGradient>

        <linearGradient id="winxp-tray-grad-${id}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0f64c8" />
          <stop offset="30%" stop-color="#1e7ce8" />
          <stop offset="90%" stop-color="#0e54ad" />
          <stop offset="100%" stop-color="#0b418a" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="${w}" height="${h}" fill="url(#winxp-tb-grad-${id})" />
      <line x1="0" y1="0" x2="${w}" y2="0" stroke="#529bf7" stroke-width="1.5" />

      <!-- Iconic Green Start Button -->
      <g transform="translate(0, 0)">
        <path d="M 0 0 L 105 0 Q 118 0 120 24 Q 118 48 105 48 L 0 48 Z" fill="url(#winxp-start-grad-${id})" />

        <g transform="translate(14, 12)">
          <path d="M 3 4 Q 7 2 10 4 L 10 10 Q 6 8 3 10 Z" fill="#e11d48" />
          <path d="M 12 4 Q 16 6 19 4 L 19 10 Q 15 12 12 10 Z" fill="#2563eb" />
          <path d="M 3 12 Q 7 10 10 12 L 10 18 Q 6 16 3 18 Z" fill="#16a34a" />
          <path d="M 12 12 Q 16 14 19 12 L 19 18 Q 15 20 12 18 Z" fill="#ca8a04" />
        </g>

        <text x="44" y="31" font-family="'Trebuchet MS', 'Segoe UI', Tahoma, sans-serif" font-size="19" font-weight="900" font-style="italic" fill="#ffffff" style="text-shadow: 1px 1px 2px #0f380f;">
          ${esc(startButtonLabel)}
        </text>
      </g>

      <!-- Quick Launch Toolbar -->
      <g transform="translate(130, 8)">
        <line x1="0" y1="4" x2="0" y2="28" stroke="#1d4ed8" stroke-width="1" />
        <line x1="1" y1="4" x2="1" y2="28" stroke="#60a5fa" stroke-width="1" />

        <rect x="8" y="6" width="18" height="18" rx="2" fill="#0284c7" stroke="#38bdf8" />
        <circle cx="42" cy="15" r="9" fill="#0284c7" stroke="#ffffff" stroke-width="1.5" />
        <text x="38" y="19" font-family="'Georgia', serif" font-size="13" font-weight="bold" font-style="italic" fill="#ffffff">e</text>
        <circle cx="68" cy="15" r="9" fill="#f97316" />
        <polygon points="66,11 72,15 66,19" fill="#ffffff" />
      </g>

      <!-- Running Task Windows Buttons (Active Tabs) -->
      <g transform="translate(225, 6)">
        <rect x="0" y="0" width="165" height="34" rx="3" fill="#1e40af" stroke="#3b82f6" stroke-width="1.5" />
        <circle cx="16" cy="17" r="6" fill="#22c55e" />
        <text x="28" y="21" font-family="'Segoe UI', Tahoma, sans-serif" font-size="11" font-weight="bold" fill="#ffffff">
          ${esc(activeWindowLabel)}
        </text>

        <rect x="175" y="0" width="145" height="34" rx="3" fill="#2563eb" stroke="#1d4ed8" stroke-width="1" />
        <polygon points="186,13 194,17 186,21" fill="#facc15" />
        <text x="200" y="21" font-family="'Segoe UI', Tahoma, sans-serif" font-size="11" fill="#dbeafe">
          ${esc(inactiveWindowLabel)}
        </text>
      </g>

      <!-- System Notification Tray (Bottom Right) -->
      <g transform="translate(${w - 145}, 0)">
        <path d="M 12 0 L ${145} 0 L ${145} 48 L 0 48 Q 8 24 12 0 Z" fill="url(#winxp-tray-grad-${id})" />
        <line x1="12" y1="0" x2="${145}" y2="0" stroke="#3b82f6" stroke-width="1.5" />

        <g transform="translate(20, 16)">
          <path d="M 0 5 L 4 5 L 8 1 L 8 11 L 4 7 L 0 7 Z" fill="#ffffff" />
          <rect x="16" y="2" width="10" height="8" rx="1" fill="#22c55e" stroke="#ffffff" stroke-width="1" />
          <polygon points="34,2 40,4 40,8 34,13 28,8 28,4" fill="#eab308" />
        </g>

        <text x="80" y="29" font-family="'Segoe UI', Tahoma, sans-serif" font-size="11.5" font-weight="bold" fill="#ffffff">
          ${esc(customTime)}
        </text>
      </g>
    </svg>
  `
}

export function renderWinXPErrorDialog(
  widget: WidgetInstance,
  data: NormalizedGitHubData,
  globalStyles: GlobalStyles,
  _forceStatic = false
): string {
  const w = widget.size.width || 520
  const h = widget.size.height || 210
  const id = `winxp-error-${widget.instanceId.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const cfg = widget.config || {}
  const pal = resolveWinXPPalette(cfg, globalStyles)

  const errorTitle = (cfg.errorTitle as string) || 'CommitOverflow.exe - System Error'
  const errorMessage =
    (cfg.errorMessage as string) ||
    'An unhandled git commit overload has occurred at 0x004A9F21. The developer profile cannot stop coding.'
  const errorCode = (cfg.errorCode as string) || 'Error Code: 0x80004005 (E_FAIL_PERFECTION)'
  const okButtonLabel = (cfg.okButtonLabel as string) || 'OK'
  const cancelButtonLabel = (cfg.cancelButtonLabel as string) || 'Cancel'
  const msgLines = wrap(errorMessage, 48).slice(0, 3)

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
      ${renderWindowChrome(id, w, h, errorTitle, pal)}

      <!-- Dialog Body -->
      <g transform="translate(16, 46)">
        <g transform="translate(10, 15)">
          <circle cx="20" cy="20" r="18" fill="#dc2626" stroke="#991b1b" stroke-width="2" />
          <path d="M 12 12 L 28 28 M 28 12 L 12 28" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" />
        </g>

        <g transform="translate(64, 14)">
          ${msgLines
            .map(
              (line, idx) =>
                `<text y="${idx * 16}" font-family="'Segoe UI', Tahoma, sans-serif" font-size="11.5" fill="#0f172a">${esc(line)}</text>`
            )
            .join('')}
          <text y="${msgLines.length * 16 + 14}" font-family="'Courier New', Courier, monospace" font-size="10.5" font-weight="bold" fill="#64748b">
            ${esc(errorCode)}
          </text>
        </g>

        <g transform="translate(${Math.round(w / 2 - 95)}, ${h - 96})">
          <rect x="0" y="0" width="75" height="24" rx="3" fill="#ece9d8" stroke="#0058ee" stroke-width="1.5" />
          <rect x="2" y="2" width="71" height="20" fill="none" stroke="#000000" stroke-dasharray="1,1" />
          <text x="28" y="16" font-family="'Segoe UI', Tahoma, sans-serif" font-size="11" font-weight="bold" fill="#000000">${esc(okButtonLabel)}</text>

          <rect x="90" y="0" width="75" height="24" rx="3" fill="#ece9d8" stroke="#7f9db9" stroke-width="1.5" />
          <text x="108" y="16" font-family="'Segoe UI', Tahoma, sans-serif" font-size="11" fill="#000000">${esc(cancelButtonLabel)}</text>
        </g>
      </g>
    </svg>
  `
}
