# Schedule Update — Fri-Sun baseline, Apr 17-19, 2026

**Updated:** 2026-04-17 09:56 AM PDT  
**Source path:** raw Mac Chrome CDP fallback  
**Status:** Partial success, baseline established

---

## CorePower Yoga — Main filter (Encino + Sherman Oaks)

### Friday, Apr 17
Live scrape returned **16 classes**.

- 8:00 am, YS - Yoga Sculpt, Encino, Adrian A, session started
- 9:00 am, YS - Yoga Sculpt, Sherman Oaks, Michelle S, session started
- 9:30 am, C2 - CorePower Yoga 2, Encino, Olivia S, cancelled
- 10:00 am, C2 - CorePower Yoga 2, Sherman Oaks, Heather P
- 10:30 am, YS - Yoga Sculpt, Encino, Gabriella D
- 12:00 pm, YS - Yoga Sculpt, Encino, Gabriella D
- 12:00 pm, YS - Yoga Sculpt, Sherman Oaks, Hannah S
- 12:30 pm, C2 - CorePower Yoga 2, Encino, Tatiana C
- 3:00 pm, YS - Yoga Sculpt, Encino, Eric G
- 3:00 pm, C2 - CorePower Yoga 2, Sherman Oaks, Aliza P
- 4:00 pm, C2 - CorePower Yoga 2, Encino, Aileen S
- 4:30 pm, YS - Yoga Sculpt, Sherman Oaks, Bridget A
- 5:30 pm, YS - Yoga Sculpt, Encino, Eric G
- 6:00 pm, C2 - CorePower Yoga 2, Sherman Oaks, Prerna C (sub)
- 7:00 pm, C2 - CorePower Yoga 2, Encino, Nina R
- 8:30 pm, C2 - CorePower Yoga 2, Encino, Nina R

### Saturday, Apr 18
The same live CorePower view rendered **0 classes**.

### Sunday, Apr 19
The same live CorePower view rendered **0 classes**.

**Note:** Weekend yoga output is provisional because the page loaded but returned empty day grids for Sat/Sun.

---

## Regal Sherman Oaks Galleria

### Friday, Apr 17
Live scrape returned full movie rows. Titles detected:

- The Super Mario Galaxy Movie
- The Drama
- The Christophers
- Project Hail Mary
- You, Me & Tuscany
- LOL: Rugrats in Paris
- Lorne
- Busboys
- Lee Cronin's The Mummy
- Hoppers
- Normal

### Saturday, Apr 18
Regal returned only the theatre shell and navigation, with **no movie rows**.

### Sunday, Apr 19
Regal returned only the theatre shell and navigation, with **no movie rows**.

---

## Errors / caveats

- `chrome-devtools` MCP is still offline, so this run used direct CDP fallback.
- CorePower weekend days rendered as zero classes in the visible grid.
- Regal weekend pages loaded without showtimes for Apr 18 and Apr 19.

This baseline run proves the pipe can fetch live data through fallback mode, but weekend coverage is incomplete on this pass.
