# Ability level data (by category)

One file per **category** – all abilities in that category live in a single file.

## Current files

| File         | Category | Notes                                      |
| ------------ | -------- | ------------------------------------------ |
| `combat.ts`  | Combat   | Polish Weapon, Hunting Strategy (full data) |
| `defaults.ts` | —       | Fallback when an ability has no custom data |
| `types.ts`   | —       | `LevelData` type and level keys            |

## Adding a new category

1. Create `recon.ts` (or `spell.ts`, `defence.ts`, etc.).
2. Export a function: `getReconLevelData(abilityName: string, level: number): LevelData`.
3. Inside it, use a `Record<abilityName, Record<level, LevelData>>` and fall back to `getDefaultLevelData(level)` for unknown abilities.
4. In `index.ts`, add to `CATEGORY_GETTERS`: `Recon: getReconLevelData`.

Copy the structure from `combat.ts` and add your ability tables.
