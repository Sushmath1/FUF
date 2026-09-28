import { z } from 'zod'

export const collegeRegisterSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  shortName: z.string().min(1).max(30).trim().optional(),
  festName: z.string().min(2).max(100).trim(),
  festTagline: z.string().max(200).trim().optional(),
  festStartDate: z.string().datetime(),
  festEndDate: z.string().datetime(),
  contactName: z.string().min(2).max(100).trim(),
  contactNumber: z.string().regex(/^[0-9+\-\s()]{10,15}$/, 'Invalid phone number'),
  adminEmail: z.string().email().toLowerCase(),
  password: z.string().min(8).max(100),
  themeDescription: z.string().max(300).optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  bgColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  surfaceColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  fontStyle: z.enum(['modern', 'serif', 'monospace', 'futuristic', 'traditional']).optional(),
  moodText: z.string().max(100).optional(),
  particleStyle: z.enum(['dots', 'stars', 'sparks', 'petals', 'bubbles']).optional(),
  mapImageUrl: z.string().trim().min(1).max(3_000_000).optional(),
})

export const mapImageSchema = z.object({
  mapImageUrl: z.string().trim().min(1).max(3_000_000),
})

export const eventSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  description: z.string().max(1000).optional(),
  venueId: z.string().cuid(),
  category: z.enum(['TECHNICAL', 'CULTURAL', 'SPORTS', 'WORKSHOP', 'GAMING', 'MUSIC', 'DANCE', 'FOOD', 'OTHER']).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  contactName: z.string().max(100).optional(),
  contactNumber: z.string().regex(/^[0-9+\-\s]{10,15}$/).optional(),
  maxParticipants: z.number().int().positive().optional(),
})

export const buildingSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  shortName: z.string().max(10).trim().optional(),
})

export const floorSchema = z.object({
  buildingId: z.string().cuid(),
  floorNumber: z.number().int().min(0).max(200),
  floorPlanUrl: z.string().trim().min(1).max(3_000_000),
  entranceXPercent: z.number().min(0).max(100).optional(),
  entranceYPercent: z.number().min(0).max(100).optional(),
})

export const venueSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  floorId: z.string().cuid().optional(),
  capacity: z.number().int().positive().optional(),
  xPercent: z.number().min(0).max(100).optional(),
  yPercent: z.number().min(0).max(100).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  directions: z.string().max(300).trim().optional(),
})

export const verifySchema = z.object({
  collegeId: z.string().cuid(),
  email: z.string().email().toLowerCase().optional(),
  // Loose on purpose: the route itself strips this to its last 10 digits before
  // comparing, exactly like the CSV upload route does. Requiring exactly 10 raw
  // digits here rejected anything typed with spaces, dashes, or a +91 prefix
  // before normalization ever ran — a mismatch with what upload accepts.
  phone: z.string().regex(/^[0-9+\-\s()]{7,15}$/).optional(),
}).refine(data => data.email || data.phone, {
  message: 'Either email or phone is required',
})