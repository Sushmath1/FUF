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

const FONT_PREVIEW_FAMILY: Record<string, string> = {
  monospace: 'monospace',
  serif: 'serif',
  modern: 'var(--font)',
  futuristic: 'sans-serif',
  traditional: 'serif',
}

const defaultTheme: ThemeState = {
  themeDescription: '',
  primaryColor: '#ff6b47',
  secondaryColor: '#ff9a6c',
  accentColor: '#ffd4a8',
  bgColor: '#120e0a',
  surfaceColor: '#1a0f0a',
  fontStyle: 'modern',
  moodText: 'Your fest. Your schedule.',
  particleStyle: 'dots',
}

export default function CollegeRegisterPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [themeGenerated, setThemeGenerated] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [mapPreview, setMapPreview] = useState<string | null>(null)
  const [buildingUploads, setBuildingUploads] = useState<{ id: string; label: string; dataUrl: string }[]>([])
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
      setThemeGenerated(true)
      toast.success('Theme generated')
    } catch {
      setError("Couldn't generate a theme right now. Try again or skip to use our default theme.")
    } finally {
      setLoading(false)
    }
  }

  const skipTheme = () => {
    setTheme(defaultTheme)
    setThemeGenerated(false)
    setError('')
    setStep(3)
  }

  const onMapUpload = (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setMapPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const onBuildingUpload = (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setBuildingUploads((prev) => [
        ...prev,
        { id: crypto.randomUUID(), label: file.name, dataUrl: reader.result as string },
      ])
    }
    reader.readAsDataURL(file)
  }

  const removeBuildingUpload = (id: string) => {
    setBuildingUploads((prev) => prev.filter((upload) => upload.id !== id))
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
        <ParticleBackground />
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

              <div
                className="card"
                style={{ padding: 12, marginBottom: 16, borderColor: 'var(--primary)', background: 'var(--glow)' }}
              >
                <p style={{ fontSize: 13, color: 'var(--text)' }}>
                  You will use your admin email and password to log in and manage your fest events.
                </p>
              </div>

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

                <div style={{ gridColumn: '1 / -1', display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
                  <div>
                    <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                    <p style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                      This will be your login password every time you access the admin dashboard.
                    </p>
                  </div>
                  <div>
                    <input type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
                    <p style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                      Re-enter the same password to confirm.
                    </p>
                  </div>
                </div>
              </div>
              {formError && <p style={{ marginTop: 10, color: '#ef4444' }}>{formError}</p>}
            </section>
          )}

          {step === 2 && (
            <section className="card" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>Design your fest theme</h2>

              <textarea
                rows={5}
                placeholder="Describe your fest vibe... e.g. Cyberpunk neon nights, Ancient royal gold, Beach summer party, Onam harvest festival"
                value={theme.themeDescription}
                onChange={(event) => setTheme({ ...theme, themeDescription: event.target.value })}
                style={{ fontSize: 16 }}
              />
              <button
                className="btn-primary"
                style={{ marginTop: 12, width: '100%', padding: '16px 24px', fontSize: 16 }}
                onClick={() => void generateTheme()}
                disabled={loading}
              >
                {loading ? (
                  <>
                    Creating your theme
                    <span className="loading-dots">
                      <span>.</span><span>.</span><span>.</span>
                    </span>
                  </>
                ) : (
                  'Generate theme with AI ✨'
                )}
              </button>

              {themeGenerated && (
                <div className="card" style={{ marginTop: 18, padding: 16, borderColor: 'var(--primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                    {[theme.primaryColor, theme.secondaryColor, theme.accentColor, theme.bgColor, theme.surfaceColor].map((color, i) => (
                      <div key={i} style={{ width: 40, height: 40, borderRadius: '50%', background: color, border: '2px solid var(--border)' }} />
                    ))}
                  </div>
                  <p style={{ marginTop: 14, fontWeight: 800, fontSize: 18, color: theme.primaryColor, textAlign: 'center' }}>
                    {theme.moodText}
                  </p>
                  <p style={{ marginTop: 8, textAlign: 'center', color: 'var(--text-muted)', fontFamily: FONT_PREVIEW_FAMILY[theme.fontStyle] ?? 'var(--font)' }}>
                    Aa Bb Cc — {theme.fontStyle} style
                  </p>
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button className="btn-outline" style={{ flex: 1 }} onClick={() => void generateTheme()} disabled={loading}>
                      Regenerate
                    </button>
                    <button className="btn-primary" style={{ flex: 1 }} onClick={() => setStep(3)}>
                      Looks good, continue
                    </button>
                  </div>
                </div>
              )}

              <p style={{ marginTop: 20, textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={skipTheme}
                  style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer', fontSize: 13 }}
                >
                  Skip and use the default FindUrFest theme instead
                </button>
              </p>
            </section>
          )}

          {step === 3 && (
            <section className="card" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Step 3 - Campus map</h2>
              <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>What would you like to upload?</p>

              <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))' }}>
                <UploadCard
                  icon="🗺️"
                  title="Campus overview map"
                  description="A satellite screenshot from Google Maps or a photo of your full campus layout showing all blocks and buildings."
                  onUpload={onMapUpload}
                />
                <UploadCard
                  icon="🏢"
                  title="Building floor plan"
                  description="A photo of the floor map posted near a building entrance, or a hand-drawn sketch showing rooms and corridors."
                  onUpload={onBuildingUpload}
                />
                <UploadCard
                  icon="✏️"
                  title="Hand-drawn sketch"
                  description="Draw your own layout on paper, photograph it clearly, and upload. Room names must be readable."
                  onUpload={onBuildingUpload}
                />
              </div>

              {mapPreview && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ marginBottom: 8, fontWeight: 700, color: 'var(--text-muted)' }}>Campus overview map:</p>
                  <img src={mapPreview} alt="Campus map preview" style={{ width: '100%', borderRadius: 10 }} />
                </div>
              )}

              {buildingUploads.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ marginBottom: 8, fontWeight: 700, color: 'var(--text-muted)' }}>
                    Building floor plans / sketches ({buildingUploads.length}):
                  </p>
                  <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
                    {buildingUploads.map((upload) => (
                      <div key={upload.id} className="card" style={{ padding: 8 }}>
                        <img
                          src={upload.dataUrl}
                          alt={upload.label}
                          style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6 }}
                        />
                        <p style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {upload.label}
                        </p>
                        <button
                          className="btn-outline"
                          style={{ marginTop: 6, width: '100%', padding: '6px 10px', fontSize: 12 }}
                          onClick={() => removeBuildingUpload(upload.id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="card" style={{ marginTop: 16, padding: 14, borderColor: 'var(--accent)' }}>
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
              <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 14 }}>Your college is ready!</h2>
              <div className="card" style={{ padding: 16 }}>
                <p style={{ marginBottom: 6 }}>
                  <strong style={{ color: 'var(--text-muted)' }}>College name:</strong> {form.name}
                </p>
                <p style={{ marginBottom: 6 }}>
                  <strong style={{ color: 'var(--text-muted)' }}>Fest name:</strong> {form.festName}
                </p>
                <p style={{ marginBottom: 6 }}>
                  <strong style={{ color: 'var(--text-muted)' }}>Fest dates:</strong> {form.festStartDate} to {form.festEndDate}
                </p>
                <p style={{ marginBottom: 12 }}>
                  <strong style={{ color: 'var(--text-muted)' }}>Admin email:</strong> {form.adminEmail}
                </p>

                <p style={{ marginBottom: 8, fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>
                  Your fest theme colors:
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[theme.primaryColor, theme.secondaryColor, theme.accentColor, theme.bgColor, theme.surfaceColor].map((color, i) => (
                    <span key={i} style={{ width: 28, height: 28, borderRadius: 6, background: color, border: '1px solid var(--border)' }} />
                  ))}
                </div>
                <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  These colors will be applied across the entire visitor interface for your fest.
                </p>
              </div>

              {!createdId ? (
                <button className="btn-primary" style={{ marginTop: 14, width: '100%', padding: '16px 24px', fontSize: 16 }} disabled={creating || !!formError} onClick={() => void createAccount()}>
                  {creating ? (
                    <>
                      <span className="spinner" /> Creating account...
                    </>
                  ) : (
                    'Create my account and go to dashboard →'
                  )}
                </button>
              ) : (
                <Link href="/college/login" className="btn-primary" style={{ marginTop: 14, width: '100%', textDecoration: 'none' }}>
                  Go to dashboard →
                </Link>
              )}
              <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                You can update your theme, add events, and upload maps anytime from your dashboard.
              </p>
            </section>
          )}

          <div className="wizard-nav" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, gap: 10 }}>
            <button className="btn-outline" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))}>
              Back
            </button>
            <button className="btn-primary" disabled={step === 5 || !!formError} onClick={() => setStep((s) => Math.min(5, s + 1))}>
              Next
            </button>
          </div>
        </div>
      </main>

      <style jsx>{`
        .loading-dots span {
          display: inline-block;
          animation: loadingDotBounce 1.2s ease-in-out infinite;
        }
        .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes loadingDotBounce {
          0%, 80%, 100% { opacity: 0.2; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-3px); }
        }

        @media (max-width: 640px) {
          .wizard-nav {
            flex-direction: column;
          }
          .wizard-nav button {
            width: 100%;
          }
        }
      `}</style>
    </ThemeProvider>
  )
}

function UploadCard({
  icon,
  title,
  description,
  onUpload,
}: {
  icon: string
  title: string
  description: string
  onUpload: (file: File | null) => void
}) {
  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ fontSize: 32 }}>{icon}</span>
      <h3 style={{ fontSize: 16, fontWeight: 800 }}>{title}</h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', flexGrow: 1 }}>{description}</p>
      <label className="btn-primary" style={{ cursor: 'pointer', textAlign: 'center' }}>
        <input
          type="file"
          accept="image/png,image/jpeg"
          style={{ display: 'none' }}
          onChange={(event) => {
            onUpload(event.target.files?.[0] ?? null)
            event.target.value = ''
          }}
        />
        Upload image
      </label>
    </div>
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
