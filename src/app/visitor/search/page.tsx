'use client'

import { motion } from 'framer-motion'

import { Navbar } from '@/components/Navbar'
import { CollegeSearchPicker } from '@/components/CollegeSearchPicker'
import { ParticleBackground } from '@/components/ParticleBackground'

export default function SearchPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--gradient)', paddingTop: 80, position: 'relative' }}>
      <ParticleBackground />
      <Navbar />

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>Find your fest</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
            Search for your college to see live event updates
          </p>

          <CollegeSearchPicker />
        </motion.div>
      </div>
    </main>
  )
}
