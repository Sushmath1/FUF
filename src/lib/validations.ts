import { z } from 'zod'

export const collegeRegisterSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  shortName: z.string().min(1).max(10).trim().optional(),
  festName: z.string().min(2).max(100).trim(),
  festTagline: z.string().max(200).trim().optional(),
  festStartDate: z.string().datetime(),
  festEndDate: z.string().datetime(),
  contactName: z.string().min(2).max(100).trim(),
  contactNumber: z.string().regex(/^[0-9+\-\s]{10,15}$/, 'Invalid phone number'),
  adminEmail: z.string().email().toLowerCase(),
  password: z.string().min(8).max(100),
  themeDescription: z.string().max(300).optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
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
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  floors: z.number().int().min(1).max(20).optional(),
})

export const venueSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  buildingId: z.string().cuid().optional(),
  floor: z.number().int().min(1).optional(),
  capacity: z.number().int().positive().optional(),
  xPercent: z.number().min(0).max(100).optional(),
  yPercent: z.number().min(0).max(100).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
})

export const verifySchema = z.object({
  collegeId: z.string().cuid(),
  email: z.string().email().toLowerCase().optional(),
  phone: z.string().regex(/^[0-9]{10}$/).optional(),
}).refine(data => data.email || data.phone, {
  message: 'Either email or phone is required',
})