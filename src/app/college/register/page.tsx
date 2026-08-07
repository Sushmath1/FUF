'use client'

import confetti from 'canvas-confetti'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { Navbar } from '@/components/Navbar'
import { ParticleBackground } from '@/components/ParticleBackground'
import { ThemeProvider } from '@/components/ThemeProvider'

type ThemeState = {
  themeDescription: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  bgColor: string
  surfaceColor: string
  fontStyle: string
  moodText: string
  particleStyle: string
}

type FormState = {
  name: string
  shortName: string
  festName: string
  festTagline: string
  festStartDate: string
  festEndDate: string
  contactName: string
  contactNumber: string
  adminEmail: string
  password: string
  confirmPassword: string
}

type BuildingPin = {
  id: string
  xPercent: number
  yPercent: number
  name: string
  shortName: string
}

const defaultTheme: ThemeState = {
  themeDescription: '',
  primaryColor: '#06b6d4',
  secondaryColor: '#6366f1',
  accentColor: '#22c55e',
  bgColor: '#030712',
  surfaceColor: '#0f172a',
  fontStyle: 'modern',
  moodText: 'Your fest. Your schedule.',
  particleStyle: 'dots',
}

export default function CollegeRegisterPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [mapPreview, setMapPreview] = useState<string | null>(null)
  const [buildingPins, setBuildingPins] = useState<BuildingPin[]>([])
  const [pendingPin, setPendingPin] = useState<{ xPercent: number; yPercent: number } | null>(null)
  const [theme, setTheme] = useState<ThemeState>(defaultTheme)

  const [form, setForm] = useState<FormState>({
    name: '',
    shortName: '',
    festName: '',
    festTagline: '',
    festStartDate: '',
    festEndDate: '',
    contactName: '',
    contactNumber: '',
    adminEmail: '',
    password: '',
    confirmPassword: '',
  })

  const progress = useMemo(() => (step / 5) * 100, [step])

  const formError = useMemo(() => {
    if (form.password && form.password.length < 8) return 'Password must be at least 8 characters'
    if (form.confirmPassword && form.password !== form.confirmPassword) return 'Passwords do not match'
    if (form.adminEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail)) return 'Please enter a valid email'
    return ''
  }, [form])

  const generateTheme = async () => {
    if (!theme.themeDescription.trim()) {
      setError('Please describe your fest theme first')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/ai/generate-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: theme.themeDescription }),
      })

      const data = (await response.json()) as { theme?: Partial<ThemeState>; error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Theme generation failed')

      setTheme((prev) => ({
        ...prev,
        ...(data.theme ?? {}),
      }))
      toast.success('Theme generated')
    } catch (genError) {
      setError(genError instanceof Error ? genError.message : 'Theme generation failed')
    } finally {
      setLoading(false)
    }
  }

  const onMapUpload = (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setMapPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const onMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.currentTarget
    const rect = target.getBoundingClientRect()
    const xPercent = ((event.clientX - rect.left) / rect.width) * 100
    const yPercent = ((event.clientY - rect.top) / rect.height) * 100
    setPendingPin({ xPercent, yPercent })
  }

  const addPendingPin = (name: string, shortName: string) => {
    if (!pendingPin) return
    setBuildingPins((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        xPercent: pendingPin.xPercent,
        yPercent: pendingPin.yPercent,
        name,
        shortName,
      },
    ])
    setPendingPin(null)
  }

  const createAccount = async () => {
    setCreating(true)
    setError('')

    try {
      const response = await fetch('/api/colleges/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          shortName: form.shortName || undefined,
          festName: form.festName,
          festTagline: form.festTagline || undefined,
          festStartDate: new Date(form.festStartDate).toISOString(),
          festEndDate: new Date(form.festEndDate).toISOString(),
          contactName: form.contactName,
          contactNumber: form.contactNumber,
          adminEmail: form.adminEmail,
          password: form.password,
          themeDescription: theme.themeDescription,
          primaryColor: theme.primaryColor,
          secondaryColor: theme.secondaryColor,
          accentColor: theme.accentColor,
        }),
      })

      const data = (await response.json()) as { collegeId?: string; error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Could not create account')

      setCreatedId(data.collegeId ?? null)
      confetti({ particleCount: 180, spread: 90 })
      toast.success('College account created')
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create account')
    } finally {
      setCreating(false)
    }
  }

  return (
    <ThemeProvider {...theme}>
      <main style={{ minHeight: '100vh', background: 'var(--gradient)', position: 'relative' }}>
        <ParticleBackground style={theme.particleStyle as 'dots'} />
        <Navbar />

        <div style={{ width: 'min(980px, 100%)', margin: '0 auto', padding: '90px 20px 40px', position: 'relative', zIndex: 1 }}>
          <div className="card" style={{ padding: 8, marginBottom: 16 }}>
            <div style={{ height: 8, background: 'var(--surface2)', borderRadius: 999 }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'var(--primary)',
                  borderRadius: 999,
                  transition: 'width 0.25s ease',
                }}
              />
            </div>
          </div>

          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 10 }}>Register your college</h1>

          {error && <p style={{ color: '#ef4444', marginBottom: 12 }}>{error}</p>}

          {step === 1 && (
            <section className="card" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>Step 1 - Basic details</h2>
              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
                <input placeholder="College name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input placeholder="Short name" value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} />
                <input placeholder="Fest name" value={form.festName} onChange={(e) => setForm({ ...form, festName: e.target.value })} />
                <input placeholder="Tagline (optional)" value={form.festTagline} onChange={(e) => setForm({ ...form, festTagline: e.target.value })} />
                <input type="date" value={form.festStartDate} onChange={(e) => setForm({ ...form, festStartDate: e.target.value })} />
                <input type="date" value={form.festEndDate} onChange={(e) => setForm({ ...form, festEndDate: e.target.value })} />
                <input placeholder="Contact name" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
                <input placeholder="Contact number" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
                <input type="email" placeholder="Admin email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} />
                <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <input type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
              </div>
              {formError && <p style={{ marginTop: 10, color: '#ef4444' }}>{formError}</p>}
            </section>
          )}

          {step === 2 && (
            <section className="card" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>Step 2 - Theme setup</h2>
              <textarea
                rows={4}
                placeholder="Describe your fest theme"
                value={theme.themeDescription}
                onChange={(event) => setTheme({ ...theme, themeDescription: event.target.value })}
              />
              <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => void generateTheme()} disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner" /> Generating your theme...
                  </>
                ) : (
                  'Generate theme with AI'
                )}
              </button>

              <div className="card" style={{ marginTop: 14, padding: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
                  {[theme.primaryColor, theme.secondaryColor, theme.accentColor, theme.bgColor, theme.surfaceColor].map((color, i) => (
                    <div key={i} style={{ background: color, height: 36, borderRadius: 8, border: '1px solid var(--border)' }} />
                  ))}
                </div>
                <p style={{ marginTop: 10, fontWeight: 700, color: theme.primaryColor }}>{theme.moodText}</p>
              </div>

              <div style={{ marginTop: 14, display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
                <label>Primary<input type="color" value={theme.primaryColor} onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })} /></label>
                <label>Secondary<input type="color" value={theme.secondaryColor} onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })} /></label>
                <label>Accent<input type="color" value={theme.accentColor} onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })} /></label>
                <label>Background<input type="color" value={theme.bgColor} onChange={(e) => setTheme({ ...theme, bgColor: e.target.value })} /></label>
                <label>Surface<input type="color" value={theme.surfaceColor} onChange={(e) => setTheme({ ...theme, surfaceColor: e.target.value })} /></label>
              </div>

              <div style={{ marginTop: 12, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
                <select value={theme.fontStyle} onChange={(event) => setTheme({ ...theme, fontStyle: event.target.value })}>
                  <option value="monospace">monospace</option>
                  <option value="serif">serif</option>
                  <option value="modern">modern</option>
                  <option value="futuristic">futuristic</option>
                  <option value="traditional">traditional</option>
                </select>
                <select value={theme.particleStyle} onChange={(event) => setTheme({ ...theme, particleStyle: event.target.value })}>
                  <option value="dots">dots</option>
                  <option value="stars">stars</option>
                  <option value="sparks">sparks</option>
                  <option value="petals">petals</option>
                  <option value="bubbles">bubbles</option>
                </select>
              </div>

              <button className="btn-outline" style={{ marginTop: 12 }} onClick={() => void generateTheme()} disabled={loading}>
                Regenerate
              </button>
            </section>
          )}

          {step === 3 && (
            <section className="card" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>Step 3 - Campus map</h2>
              <label
                className="card"
                style={{
                  padding: 20,
                  borderStyle: 'dashed',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  style={{ display: 'none' }}
                  onChange={(event) => onMapUpload(event.target.files?.[0] ?? null)}
                />
                <p>Drop JPG/PNG or click to upload</p>
              </label>

              {mapPreview && (
                <img src={mapPreview} alt="Map preview" style={{ width: '100%', marginTop: 12, borderRadius: 10 }} />
              )}

              <div className="card" style={{ marginTop: 14, padding: 14, borderColor: 'var(--accent)' }}>
                <p style={{ color: 'var(--text-muted)' }}>
                  Tip: Open Google Maps, search your college, switch to Satellite view, and take a screenshot.
                </p>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="card" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>Step 4 - Buildings</h2>
              {!mapPreview && <p style={{ color: 'var(--text-muted)' }}>Upload a map in Step 3 first.</p>}

              {mapPreview && (
                <>
                  <p style={{ marginBottom: 10, color: 'var(--text-muted)' }}>
                    Click anywhere on the map to add a building pin.
                  </p>
                  <div
                    onClick={onMapClick}
                    style={{
                      position: 'relative',
                      borderRadius: 10,
                      overflow: 'hidden',
                      border: '1px solid var(--border)',
                      cursor: 'crosshair',
                    }}
                  >
                    <img src={mapPreview} alt="Campus map" style={{ width: '100%', display: 'block' }} />
                    {buildingPins.map((pin) => (
                      <div
                        key={pin.id}
                        title={pin.name}
                        style={{
                          position: 'absolute',
                          left: `${pin.xPercent}%`,
                          top: `${pin.yPercent}%`,
                          transform: 'translate(-50%, -50%)',
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: 'var(--accent)',
                          border: '2px solid #fff',
                        }}
                      />
                    ))}
                  </div>
                </>
              )}

              {pendingPin && (
                <div className="card" style={{ marginTop: 12, padding: 12 }}>
                  <p style={{ marginBottom: 8 }}>New building pin at ({pendingPin.xPercent.toFixed(1)}%, {pendingPin.yPercent.toFixed(1)}%)</p>
                  <PinForm onSave={addPendingPin} onCancel={() => setPendingPin(null)} />
                </div>
              )}

              {buildingPins.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <h3 style={{ marginBottom: 8 }}>Placed pins</h3>
                  {buildingPins.map((pin) => (
                    <div key={pin.id} className="card" style={{ padding: 10, marginBottom: 6 }}>
                      <strong>{pin.name}</strong> ({pin.shortName || 'N/A'})
                    </div>
                  ))}
                </div>
              )}

              <button className="btn-outline" style={{ marginTop: 14 }} onClick={() => setStep(5)}>
                Add later from dashboard
              </button>
            </section>
          )}

          {step === 5 && (
            <section className="card" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>Step 5 - Done</h2>
              <div className="card" style={{ padding: 14 }}>
                <p><strong>College:</strong> {form.name}</p>
                <p><strong>Fest:</strong> {form.festName}</p>
                <p><strong>Dates:</strong> {form.festStartDate} to {form.festEndDate}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {[theme.primaryColor, theme.secondaryColor, theme.accentColor, theme.bgColor, theme.surfaceColor].map((color, i) => (
                    <span key={i} style={{ width: 24, height: 24, borderRadius: 6, background: color }} />
                  ))}
                </div>
              </div>

              {!createdId ? (
                <button className="btn-primary" style={{ marginTop: 14 }} disabled={creating || !!formError} onClick={() => void createAccount()}>
                  {creating ? (
                    <>
                      <span className="spinner" /> Creating account...
                    </>
                  ) : (
                    'Create my account'
                  )}
                </button>
              ) : (
                <Link href="/college/login" className="btn-primary" style={{ marginTop: 14, textDecoration: 'none' }}>
                  Go to dashboard
                </Link>
              )}
            </section>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, gap: 10 }}>
            <button className="btn-outline" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))}>
              Back
            </button>
            <button className="btn-primary" disabled={step === 5 || !!formError} onClick={() => setStep((s) => Math.min(5, s + 1))}>
              Next
            </button>
          </div>
        </div>
      </main>
    </ThemeProvider>
  )
}

function PinForm({
  onSave,
  onCancel,
}: {
  onSave: (name: string, shortName: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [shortName, setShortName] = useState('')

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <input placeholder="Building name" value={name} onChange={(e) => setName(e.target.value)} />
      <input placeholder="Short name" value={shortName} onChange={(e) => setShortName(e.target.value)} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-primary" disabled={!name.trim()} onClick={() => onSave(name.trim(), shortName.trim())}>
          Save pin
        </button>
        <button className="btn-outline" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
