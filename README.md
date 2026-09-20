# PeanutEngine
A server-specific mod for Minecraft Bedrock Edition, used as the initial server mod.

## Features
This mod equips your newly created Bedrock Edition server with a built-in economy system that requires no Beta APIs enabled,

alongside features like TPA/RTP, Home, Land Claims, Vein Mining, Tree Felling, Instant Sleep, and Off-hand Torch Night Vision, 

with even more features coming soon.

## Function Introduction
### PeanutEngine Command List

| Command | Example | Description |
|---------|---------|-------------|
| `/pe:help` | `/pe:help` | Show all command help |
| `/pe:money` | `/pe:money` | Check your balance |
| `/pe:pay` | `/pe:pay Steve 100` | Pay an online player (name amount) |
| `/pe:ahsell` | `/pe:ahsell 50` | Sell the item in your hand for the given price |
| `/pe:rtp` | `/pe:rtp` | Random teleport |
| `/pe:tpa` | `/pe:tpa Steve` | Request teleport to a player |
| `/pe:tpahere` | `/pe:tpahere Steve` | Request a player to teleport to you |
| `/pe:tpaccept` | `/pe:tpaccept` | Accept a teleport request |
| `/pe:tpacancel` | `/pe:tpacancel` | Deny or cancel a teleport request |
| `/pe:tpauto` | `/pe:tpauto` | Toggle auto-accept for TPA |
| `/pe:seth` | `/pe:seth 1` | Set current location as home named "1" |
| `/pe:h` | `/pe:h 1` | Teleport to home "1"; omit name to list homes |
| `/pe:delh` | `/pe:delh 1` | Delete home named "1" |
| `/pe:bp` | `/pe:bp 1` | Open backpack page 1 (pages 1–5) |
| `/pe:bpput` | `/pe:bpput 1` | Store held item into backpack page 1 |
| `/pe:bptake` | `/pe:bptake 1 3` | Take item #3 from backpack page 1 |
| `/pe:tselect` | `/pe:tselect` | Get the land-claim selection shovel (golden shovel) |
| `/pe:tdone` | `/pe:tdone 20 myhome` | After selecting 4 corners, create land with height 20 and name "myhome" |
| `/pe:tprotect` | `/pe:tprotect myhome` | Enable protection on that land (others cannot break/place) |
| `/pe:tout` | `/pe:tout` | Leave visitor state and random teleport |
| `/pe:delt` | `/pe:delt myhome` | Delete your land named "myhome" |
| `/pe:sleep` | `/pe:sleep` | Teleport to last bed; return to original spot after waking |

### Features without commands

| Feature | How to use |
|---------|------------|
| Vein mine / tree capitator | **Sneak** while breaking ores or logs |
| Double-door sync | Place two matching doors side by side; open/close one |
| Offhand night vision | Hold a torch or lantern in the offhand |
| One-player skip night | Sleep in a bed at night |
| Save bed location | Place or click a bed |

## Why not enable BetaAPIs?
I'm a Minecraft Bedrock player and the founder of a server called PeanutSMP. Since I couldn't find the toggle to enable Beta APIs, I went ahead and created this module myself.

## Mod open source
This project is open source under a GNU General Public License.

## Creaters
- Ian
- Grok

## Statement
This project has nothing to do with Mojang.
