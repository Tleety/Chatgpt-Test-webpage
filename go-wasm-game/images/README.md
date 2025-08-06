# Game Assets

This folder contains SVG image assets for the Go WASM game.

## Coins
- **gold-coin.svg** - Gold coin with dollar symbol (high value currency)
- **silver-coin.svg** - Silver coin with "5" marking (medium value currency)
- **bronze-coin.svg** - Bronze/copper coin with "1" marking (low value currency)

## Treasure Chests
- **treasure-chest.svg** - Closed treasure chest with lock
- **open-chest.svg** - Open treasure chest revealing treasures inside

## Enemies

### Skeletons
- **skeleton.svg** - Basic skeleton enemy sprite
- **skeleton-warrior.svg** - Armored skeleton with glowing red eyes and sword

### Orcs
- **orc.svg** - Basic orc enemy with club weapon
- **orc-berserker.svg** - Powerful orc berserker with double axes and scars

## Spell Effects
- **fireball.svg** - Fire spell with flame wisps and sparks
- **ice-shard.svg** - Ice spell with crystalline structure
- **lightning-bolt.svg** - Electric spell with arcing energy
- **magic-orb.svg** - Generic magical energy orb with swirling effects

## General Effects
- **explosion.svg** - Large explosion effect with rays and debris
- **sparkles.svg** - Multi-size sparkle particles for magical effects
- **healing-aura.svg** - Healing effect with animated rising particles and pulsing glow

## Technical Details
- All images are created as SVG files for scalability and small file sizes
- Images use web-safe colors and are optimized for 2D canvas rendering
- Sizes range from 32x32 to 64x64 pixels for game sprite usage
- Some effects include CSS animations for dynamic visual appeal

## Usage
These assets can be loaded in the Go WASM game using standard web image loading techniques and drawn to the canvas context.