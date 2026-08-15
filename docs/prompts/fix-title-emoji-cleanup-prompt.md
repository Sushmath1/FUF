# PROMPT: Fix Title Visibility + Remove Emojis + Clean Up Landing Page

## Context
Three specific fixes needed on the landing page and cursor.

## CHANGE 1: Fix "Find" text being invisible in the title

In src/app/page.tsx, the title "FindUrFest" has "Find" using a very light gradient 
that's nearly invisible against the light background. Fix the gradient colors so 
all three parts of the title are clearly visible:

Replace the title span gradients with these darker, more visible versions:

```typescript
<span style={{
  background: 'linear-gradient(135deg, #b8461f, #ff6b47)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}}>Find</span>
<span style={{
  background: 'linear-gradient(135deg, #ff6b47, #e8511f)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}}>Ur</span>
<span style={{
  background: 'linear-gradient(135deg, #ff9a6c, #ff6b47)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}}>Fest</span>
```

All three words must be clearly readable against the light cream background — 
no part of the title should look faded or invisible.

## CHANGE 2: Remove the peach emoji everywhere

Search the entire codebase for the 🍑 emoji and remove/replace every occurrence:

1. In src/components/CustomCursor.tsx — the DEFAULT cursor emoji should be 🧡 
   (this may already be fixed, verify it)

2. In src/app/page.tsx — the badge currently shows "🍑 COLLEGE FEST NAVIGATOR" — 
   remove the emoji entirely, just show "COLLEGE FEST NAVIGATOR" as text only

3. Search all other files in src/ for any remaining 🍑 references and remove them

## CHANGE 3: Remove emojis from the two main buttons

In src/app/page.tsx, remove the emojis from both buttons:

Change:
```
🎉 I'm attending a fest
```
to:
```
I'm attending a fest
```

Change:
```
🏫 Register my college
```
to:
```
Register my college
```

## CHANGE 4: Remove the feature pills section entirely

In src/app/page.tsx, remove the entire motion.div block that shows the feature 
pills row at the bottom ("⚡ Real-time updates", "🗺️ Campus navigation", 
"🤖 AI scheduling", "📱 Works offline"). Delete this whole section — nothing 
should appear below the "Already registered? College sign in →" line.

## After all changes

1. Run npm run dev
2. Check localhost:3000 — confirm:
   - "FindUrFest" title is fully readable, no faded/invisible letters
   - No 🍑 emoji appears anywhere on the page or as the cursor
   - Both buttons show plain text with no emoji
   - Nothing appears below the "Already registered?" line
3. Run npm run build — zero errors
4. Report done
