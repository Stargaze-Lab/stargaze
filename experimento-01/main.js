import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════
const CONFIG = {
  MAX_AGE:        100,
  START_ANGLE:    Math.PI / 2,
  RING_INNER:     2.8,
  RING_OUTER:     4.8,
  SPHERE_BASE:    0.09,
  COLLISION_DEG:  0.5,
  HOVER_SCALE:    1.8,
  HOVER_EMISSIVE: 0.55,
  BG_COLOR:       0x0a0a0c,
  LABEL_SIZE:     13,       // px do canvas de texto
  LABEL_RADIUS:   1.8,      // raio interno dos labels (< RING_INNER)
  CAM_Y:          6,
  CAM_Z:          11,
  CAM_FOV:        45,
}

const CATEGORIES = {
  birth:       { color: 0xe8e0d0, hex: '#e8e0d0', label: 'Birth',       size: 1.8 },
  personal:    { color: 0xc9a87c, hex: '#c9a87c', label: 'Personal',    size: 1.0 },
  education:   { color: 0x7eb8c9, hex: '#7eb8c9', label: 'Education',   size: 1.0 },
  career:      { color: 0x8fbf9f, hex: '#8fbf9f', label: 'Career',      size: 1.0 },
  achievement: { color: 0xd4a853, hex: '#d4a853', label: 'Achievement', size: 1.3 },
  travel:      { color: 0xa889c0, hex: '#a889c0', label: 'Travel',      size: 0.9 },
  misc:        { color: 0x8899aa, hex: '#8899aa', label: 'Misc',        size: 0.9 },
  death:       { color: 0x6a5a6e, hex: '#6a5a6e', label: 'Death',       size: 1.8 },
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const CAT_ORDER   = ['birth','personal','education','career','achievement','travel','misc','death']

// ─── State ────────────────────────────────────────────────────
let renderer, scene, camera, controls
let trinketMeshes  = []   // esferas 3D
let ringObjects    = []   // anel + ticks + labels
let hoveredEvent   = null // evento atualmente em hover (sincroniza anel ↔ index)
let selectedEvent  = null // evento clicado (pinned)
const raycaster    = new THREE.Raycaster()
const pointer      = new THREE.Vector2()

// index dots: map eventId → DOM element
const indexDotMap  = new Map()
// mesh map: eventId → mesh
const meshMap      = new Map()

// ─── DOM ──────────────────────────────────────────────────────
const canvas      = document.getElementById('canvas')
const tooltip     = document.getElementById('tooltip')
const ttCat       = document.getElementById('tt-category')
const ttDate      = document.getElementById('tt-date')
const ttTitle     = document.getElementById('tt-title')
const ttDesc      = document.getElementById('tt-desc')
const indexPanel  = document.getElementById('index-panel')
const hint        = document.getElementById('hint')
const subjectName = document.getElementById('subject-name')
const headerYears = document.getElementById('header-years')
const headerEvts  = document.getElementById('header-events')

// ─── Boot ─────────────────────────────────────────────────────
setupRenderer()
setupScene()
setupCamera()
setupControls()
setupLights()
setupTweakPanel()
setupPointerEvents()
window.addEventListener('resize', onResize)
setTimeout(() => hint.classList.add('faded'), 5000)
renderer.setAnimationLoop(render)
loadPersona('life_threads_curie.csv')

// ═══════════════════════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════════════════════
function setupRenderer() {
  const w = window.innerWidth, h = window.innerHeight - 48
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(w, h)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
}

function setupScene() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(CONFIG.BG_COLOR)
}

function setupCamera() {
  const w = window.innerWidth, h = window.innerHeight - 48
  camera = new THREE.PerspectiveCamera(CONFIG.CAM_FOV, w / h, 0.1, 100)
  camera.position.set(0, CONFIG.CAM_Y, CONFIG.CAM_Z)
  camera.lookAt(0, 0, 0)
}

function setupControls() {
  controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.minDistance   = 2
  controls.maxDistance   = 24
  controls.maxPolarAngle = Math.PI * 0.85
}

function setupLights() {
  scene.add(new THREE.AmbientLight(0xffffff, 0.65))
  const key = new THREE.DirectionalLight(0xffffff, 1.2)
  key.position.set(-4, 8, 4)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xaabbcc, 0.35)
  fill.position.set(4, 2, -4)
  scene.add(fill)
}

// ═══════════════════════════════════════════════════════════════
// PERSONA LOAD
// ═══════════════════════════════════════════════════════════════
async function loadPersona(filename) {
  try {
    const res    = await fetch(`./data/${filename}`)
    const text   = await res.text()
    const events = parseCSV(text)
    // add stable id
    events.forEach((ev, i) => { ev._id = i })
    clearScene()
    buildRing(events)
    buildTicks(events)
    buildTrinkets(events)
    buildIndexPanel(events)
    updateHeader(events, filename)
  } catch (e) {
    console.error('Load error:', e)
  }
}

function clearScene() {
  ;[...ringObjects, ...trinketMeshes].forEach(obj => scene.remove(obj))
  ringObjects   = []
  trinketMeshes = []
  meshMap.clear()
  indexDotMap.clear()
  indexPanel.innerHTML = ''
  hoveredEvent  = null
  selectedEvent = null
  tooltip.classList.remove('visible', 'pinned')
}

function rebuildScene() {
  const events = scene.userData.events
  if (!events) return
  ;[...ringObjects, ...trinketMeshes].forEach(obj => scene.remove(obj))
  ringObjects   = []
  trinketMeshes = []
  meshMap.clear()
  buildRing(events)
  buildTicks(events)
  buildTrinkets(events)
}

function updateHeader(events, filename) {
  const personas = {
    'life_threads_curie.csv':  'Marie Curie',
    'life_threads_mozart.csv': 'Wolfgang Mozart',
  }
  subjectName.textContent = personas[filename] || filename
  const years = events.map(e => e.year)
  headerYears.textContent = `${Math.min(...years)} – ${Math.max(...years)}`
  headerEvts.textContent  = `${events.length} events`
}

// ═══════════════════════════════════════════════════════════════
// CSV
// ═══════════════════════════════════════════════════════════════
function parseCSV(text) {
  const lines  = text.trim().split('\n')
  const header = lines[0].split(',').map(h => h.trim())
  return lines.slice(1).map(line => {
    const cols = splitCSVLine(line)
    const obj  = {}
    header.forEach((h, i) => { obj[h] = (cols[i] || '').trim() })
    obj.year        = parseInt(obj.year)          || 0
    obj.month       = parseInt(obj.month)         || 1
    obj.age_years   = parseInt(obj.age_years)     || 0
    obj.age_decimal = parseFloat(obj.age_decimal) || 0
    return obj
  })
}

function splitCSVLine(line) {
  const result = []
  let cur = '', inQ = false
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; continue }
    if (ch === ',' && !inQ) { result.push(cur); cur = ''; continue }
    cur += ch
  }
  result.push(cur)
  return result
}

// ═══════════════════════════════════════════════════════════════
// ANEL
// ═══════════════════════════════════════════════════════════════
function buildRing(events) {
  const maxAge = Math.max(...events.map(e => e.age_decimal))
  scene.userData.maxAge  = maxAge
  scene.userData.events  = events
  const midR = (CONFIG.RING_INNER + CONFIG.RING_OUTER) / 2

  addRingLine(circlePts(midR, 128),              0x1a1a2e, 0.4)
  addRingLine(circlePts(CONFIG.RING_INNER, 128), 0x12121a, 0.4)
  addRingLine(circlePts(CONFIG.RING_OUTER, 128), 0x12121a, 0.4)
  addRingLine(arcPts(midR, maxAge),              0x4a4a6a, 0.9)

  addRingDot(toPos(0,       1,  midR), 0.055, 0xc8c8d4)
  addRingDot(toPos(maxAge, 12,  midR), 0.055, 0x5a4a5e)
}

function addRingLine(pts, color, opacity) {
  const obj = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  )
  scene.add(obj); ringObjects.push(obj)
}

function addRingDot(pos, size, color) {
  const obj = new THREE.Mesh(
    new THREE.SphereGeometry(size, 8, 8),
    new THREE.MeshBasicMaterial({ color })
  )
  obj.position.copy(pos)
  scene.add(obj); ringObjects.push(obj)
}

function circlePts(r, steps) {
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2
    pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r))
  }
  return pts
}

function arcPts(r, maxAge) {
  const pts = []
  for (let i = 0; i <= 300; i++)
    pts.push(toPos((i / 300) * maxAge, 6, r))
  return pts
}

// ═══════════════════════════════════════════════════════════════
// TICKS + LABELS (interno, a cada 5 anos)
// ═══════════════════════════════════════════════════════════════
function buildTicks(events) {
  const maxAge = scene.userData.maxAge || 66
  const midR   = (CONFIG.RING_INNER + CONFIG.RING_OUTER) / 2

  for (let y = 0; y <= Math.ceil(maxAge); y++) {
    const isDecade = y % 10 === 0
    const isFive   = y % 5  === 0
    if (!isFive && !isDecade) continue   // só de 5 em 5

    const inner    = isDecade ? CONFIG.RING_INNER - 0.16 : CONFIG.RING_INNER - 0.08
    const outer    = isDecade ? CONFIG.RING_OUTER + 0.16 : CONFIG.RING_OUTER + 0.08
    const opacity  = isDecade ? 0.75 : 0.35
    const color    = isDecade ? 0x5a5a8a : 0x2a2a3e

    addRingLine(
      [ toPos(y, 1, inner), toPos(y, 12, outer) ],
      color, opacity
    )

    // Label no raio interno configurável — inclui o 0
    if (y <= Math.ceil(maxAge)) {
      addYearLabel(y, isDecade)
    }
  }
}

function addYearLabel(age, isDecade) {
  const fs  = CONFIG.LABEL_SIZE
  const cw  = fs * 4, ch = fs * 2
  const c2  = document.createElement('canvas')
  c2.width  = cw; c2.height = ch
  const ctx = c2.getContext('2d')
  ctx.clearRect(0, 0, cw, ch)
  ctx.fillStyle = isDecade ? '#8888aa' : '#4a4a62'
  ctx.font      = `${fs}px monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(age.toString(), cw / 2, ch / 2)

  const sp = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c2), transparent: true, opacity: isDecade ? 0.9 : 0.6 })
  )
  // posiciona no raio interno configurável
  sp.position.copy(toPos(age, 6, CONFIG.LABEL_RADIUS))
  // escala proporcional ao font size
  const sc = fs * 0.025
  sp.scale.set(sc * (cw / ch), sc, 1)
  scene.add(sp)
  ringObjects.push(sp)
}

// ═══════════════════════════════════════════════════════════════
// TRINKETS
// ═══════════════════════════════════════════════════════════════
function buildTrinkets(events) {
  trinketMeshes = []
  meshMap.clear()

  const slotMap = {}
  events.forEach(ev => {
    const key = `${ev.age_years}_${ev.month}`
    if (!slotMap[key]) slotMap[key] = []
    slotMap[key].push(ev)
  })

  events.forEach(ev => {
    const cat      = ev.category || 'misc'
    const cfg      = CATEGORIES[cat] || CATEGORIES.misc
    const key      = `${ev.age_years}_${ev.month}`
    const group    = slotMap[key]
    const colIdx   = group.indexOf(ev)
    const colTotal = group.length
    const colDeg   = colTotal > 1 ? (colIdx - (colTotal - 1) / 2) * CONFIG.COLLISION_DEG : 0

    const radius = CONFIG.SPHERE_BASE * cfg.size
    const mat    = new THREE.MeshStandardMaterial({
      color: cfg.color, roughness: 0.55, metalness: 0.0,
      emissive: cfg.color, emissiveIntensity: 0.12,
    })

    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 20), mat)
    mesh.position.copy(toPos(ev.age_years, ev.month, null, colDeg))
    mesh.userData = { event: ev, baseEmissive: 0.12 }
    scene.add(mesh)
    trinketMeshes.push(mesh)
    meshMap.set(ev._id, mesh)
  })
}

// ═══════════════════════════════════════════════════════════════
// INDEX PANEL — categorias como seções, bolinhas cronológicas
// ═══════════════════════════════════════════════════════════════
function buildIndexPanel(events) {
  indexPanel.innerHTML = ''
  indexDotMap.clear()

  // Agrupar por categoria, ordenar cronologicamente dentro
  const groups = {}
  CAT_ORDER.forEach(cat => { groups[cat] = [] })
  events.forEach(ev => {
    const cat = ev.category || 'misc'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(ev)
  })
  CAT_ORDER.forEach(cat => {
    groups[cat].sort((a, b) => a.age_decimal - b.age_decimal)
  })

  CAT_ORDER.forEach(cat => {
    const evs = groups[cat]
    if (!evs || evs.length === 0) return

    const cfg     = CATEGORIES[cat] || CATEGORIES.misc
    const section = document.createElement('div')
    section.className = 'index-section'

    const title = document.createElement('div')
    title.className   = 'index-section-title'
    title.textContent = cfg.label
    section.appendChild(title)

    const dotRow = document.createElement('div')
    dotRow.className = 'index-dot-row'

    evs.forEach(ev => {
      const dot = document.createElement('div')
      dot.className = 'index-dot'
      dot.style.background = cfg.hex
      dot.title = `${ev.event_short} (${ev.year})`

      dot.addEventListener('mouseenter', e => {
        if (selectedEvent) return
        activateEvent(ev)
        showTooltipForEvent(ev, e.clientX, e.clientY)
      })
      dot.addEventListener('mousemove', e => {
        if (selectedEvent) return
        positionTooltip(e.clientX, e.clientY)
      })
      dot.addEventListener('mouseleave', () => {
        if (selectedEvent) return
        deactivateEvent(ev)
        hideTooltip()
      })
      dot.addEventListener('click', e => {
        e.stopPropagation()
        if (selectedEvent && selectedEvent._id === ev._id) {
          deactivateEvent(ev)
          selectedEvent = null
          hideTooltip()
        } else {
          if (selectedEvent) deactivateEvent(selectedEvent)
          selectedEvent = ev
          activateEvent(ev)
          pinTooltipForEvent(ev, e.clientX, e.clientY)
        }
      })

      dotRow.appendChild(dot)
      indexDotMap.set(ev._id, dot)
    })

    section.appendChild(dotRow)
    indexPanel.appendChild(section)
  })
}

// ═══════════════════════════════════════════════════════════════
// ACTIVATE / DEACTIVATE (sincroniza anel ↔ index)
// ═══════════════════════════════════════════════════════════════
function activateEvent(ev) {
  hoveredEvent = ev

  // Esfera 3D
  const mesh = meshMap.get(ev._id)
  if (mesh) {
    mesh.material.emissiveIntensity = CONFIG.HOVER_EMISSIVE
    mesh.scale.setScalar(CONFIG.HOVER_SCALE)
  }

  // Index dot
  const dot = indexDotMap.get(ev._id)
  if (dot) dot.classList.add('active')
}

function deactivateEvent(ev) {
  if (!ev) return
  if (hoveredEvent && hoveredEvent._id === ev._id) hoveredEvent = null

  const mesh = meshMap.get(ev._id)
  if (mesh) {
    mesh.material.emissiveIntensity = mesh.userData.baseEmissive
    mesh.scale.setScalar(1.0)
  }

  const dot = indexDotMap.get(ev._id)
  if (dot) dot.classList.remove('active')
}

// ═══════════════════════════════════════════════════════════════
// MATH
// ═══════════════════════════════════════════════════════════════
function toPos(age, month, rOverride, colDeg) {
  const colRad = colDeg ? (colDeg * Math.PI) / 180 : 0
  const angle  = CONFIG.START_ANGLE - (age / CONFIG.MAX_AGE) * Math.PI * 2 + colRad
  const m      = Math.max(1, Math.min(12, month || 1))
  const r      = (rOverride !== null && rOverride !== undefined)
    ? rOverride
    : CONFIG.RING_INNER + ((m - 1) / 11) * (CONFIG.RING_OUTER - CONFIG.RING_INNER)
  return new THREE.Vector3(Math.cos(angle) * r, 0, -Math.sin(angle) * r)
}

// ═══════════════════════════════════════════════════════════════
// TWEAK PANEL
// ═══════════════════════════════════════════════════════════════
function setupTweakPanel() {
  document.getElementById('tweak-header').addEventListener('click', () => {
    const panel  = document.getElementById('tweak-panel')
    const toggle = document.getElementById('tweak-toggle')
    panel.classList.toggle('collapsed')
    toggle.textContent = panel.classList.contains('collapsed') ? '▼' : '▲'
  })

  document.getElementById('tw-persona').addEventListener('change', e => {
    loadPersona(e.target.value)
  })

  slider('tw-maxage',    'tw-maxage-val',    v => { CONFIG.MAX_AGE        = +v; rebuildScene(); return v })
  slider('tw-angle',     'tw-angle-val',     v => { CONFIG.START_ANGLE    = (+v * Math.PI) / 180; rebuildScene(); return v + '°' })
  slider('tw-inner',     'tw-inner-val',     v => { CONFIG.RING_INNER     = +v; rebuildScene(); return v })
  slider('tw-outer',     'tw-outer-val',     v => { CONFIG.RING_OUTER     = +v; rebuildScene(); return v })
  slider('tw-col',       'tw-col-val',       v => { CONFIG.COLLISION_DEG  = +v; rebuildScene(); return v + '°' })

  slider('tw-labelsize', 'tw-labelsize-val', v => { CONFIG.LABEL_SIZE     = +v; rebuildScene(); return v + 'px' })
  slider('tw-labelr',    'tw-labelr-val',    v => { CONFIG.LABEL_RADIUS   = +v; rebuildScene(); return v })

  slider('tw-size', 'tw-size-val', v => {
    CONFIG.SPHERE_BASE = +v
    trinketMeshes.forEach(m => {
      const cfg = CATEGORIES[m.userData.event.category] || CATEGORIES.misc
      m.geometry.dispose()
      m.geometry = new THREE.SphereGeometry(CONFIG.SPHERE_BASE * cfg.size, 20, 20)
    })
    return v
  })

  document.getElementById('tw-bg').addEventListener('input', e => {
    scene.background.set(e.target.value)
  })

  // Color grid
  const grid = document.getElementById('color-grid')
  Object.entries(CATEGORIES).forEach(([key, cfg]) => {
    const row = document.createElement('div')
    row.className = 'color-row'
    row.innerHTML = `
      <span class="color-row-label">${cfg.label}</span>
      <input type="color" value="${cfg.hex}" data-cat="${key}" />
    `
    row.querySelector('input').addEventListener('input', e => {
      const hex = e.target.value
      cfg.hex   = hex
      cfg.color = parseInt(hex.replace('#', ''), 16)
      trinketMeshes.forEach(m => {
        if (m.userData.event.category === key) {
          m.material.color.set(hex)
          m.material.emissive.set(hex)
        }
      })
      // Atualiza index dots
      indexDotMap.forEach((dot, id) => {
        const mesh = meshMap.get(id)
        if (mesh && mesh.userData.event.category === key)
          dot.style.background = hex
      })
    })
    grid.appendChild(row)
  })
}

function slider(id, valId, fn) {
  const input = document.getElementById(id)
  const label = document.getElementById(valId)
  if (!input) return
  input.addEventListener('input', e => { label.textContent = fn(e.target.value) })
}

// ═══════════════════════════════════════════════════════════════
// POINTER EVENTS (anel 3D)
// ═══════════════════════════════════════════════════════════════
function setupPointerEvents() {
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('click', onClick)
}

function onMove(e) {
  updatePointer(e)
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(trinketMeshes)

  if (hits.length > 0) {
    const ev = hits[0].object.userData.event
    if (!selectedEvent && (!hoveredEvent || hoveredEvent._id !== ev._id)) {
      if (hoveredEvent) deactivateEvent(hoveredEvent)
      activateEvent(ev)
      showTooltipForEvent(ev, e.clientX, e.clientY)
    } else if (!selectedEvent) {
      showTooltipForEvent(ev, e.clientX, e.clientY)
    }
    canvas.style.cursor = 'pointer'
  } else {
    if (!selectedEvent && hoveredEvent) {
      deactivateEvent(hoveredEvent)
      hideTooltip()
    }
    canvas.style.cursor = 'default'
  }
}

function onClick(e) {
  updatePointer(e)
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(trinketMeshes)

  if (selectedEvent) { deactivateEvent(selectedEvent); selectedEvent = null }
  tooltip.classList.remove('pinned')

  if (hits.length > 0) {
    const ev = hits[0].object.userData.event
    selectedEvent = ev
    activateEvent(ev)
    pinTooltipForEvent(ev, e.clientX, e.clientY)
  } else {
    hideTooltip()
  }
}

function updatePointer(e) {
  const rect = canvas.getBoundingClientRect()
  pointer.x  =  ((e.clientX - rect.left) / rect.width)  * 2 - 1
  pointer.y  = -((e.clientY - rect.top)  / rect.height) * 2 + 1
}

// ═══════════════════════════════════════════════════════════════
// TOOLTIP
// ═══════════════════════════════════════════════════════════════
function showTooltipForEvent(ev, x, y) {
  fillTooltip(ev)
  if (x !== undefined) positionTooltip(x, y)
  tooltip.classList.add('visible')
  tooltip.classList.remove('pinned')
}

function pinTooltipForEvent(ev, x, y) {
  fillTooltip(ev)
  positionTooltip(x, y)
  tooltip.classList.add('visible', 'pinned')
}

function fillTooltip(ev) {
  const cat = ev.category || 'misc'
  const cfg = CATEGORIES[cat] || CATEGORIES.misc
  ttCat.textContent             = cfg.label.toUpperCase()
  ttCat.style.color             = cfg.hex
  tooltip.style.borderLeftColor = cfg.hex
  const mo = (ev.month >= 1 && ev.month <= 12) ? MONTH_NAMES[ev.month - 1] + ' ' : ''
  ttDate.textContent  = `${mo}${ev.year} · Age ${ev.age_years}`
  ttTitle.textContent = ev.event_short    || ''
  ttDesc.textContent  = ev.description_en || ''
}

function positionTooltip(x, y) {
  const tw = 300, th = 185
  // Prefere abaixo do mouse — só sobe se não couber
  let lx = x + 20
  let ly = y + 16
  if (ly + th > window.innerHeight) ly = y - th - 8
  if (lx + tw > window.innerWidth)  lx = x - tw - 20
  tooltip.style.left = lx + 'px'
  tooltip.style.top  = ly + 'px'
}

function hideTooltip() {
  if (tooltip.classList.contains('pinned')) return
  tooltip.classList.remove('visible')
}

// ═══════════════════════════════════════════════════════════════
// RESIZE + RENDER
// ═══════════════════════════════════════════════════════════════
function onResize() {
  const w = window.innerWidth, h = window.innerHeight - 48
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

function render() {
  controls.update()
  renderer.render(scene, camera)
}