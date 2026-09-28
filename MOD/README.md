# PeanutEngine MOD

**v2.2** — Java Paper + Bedrock

## Features
- Economy, TPA, RTP, homes, backpack, land claims
- Vein miner, double doors, offhand torch NV, one-player night skip
- **Keep inventory on death** (both platforms)
- **Live radar map**: `/map live` (on-screen)
- Native commands (Bedrock needs **Beta APIs** for chat cmds like `/money`)

## Java
```bash
cd MOD/java && python3 decode_sources.py   # if using b64 archives
mvn package
# plugins/PeanutEngine.jar
```
Commands: `/pe` `/money` `/map live` … — no `pe:` prefix

## Bedrock
Use `PeanutEngine.mcpack` or `bedrock/PeanutEngine_BP`.
Enable Beta APIs. Commands: `/help` `/money` `/map live`

## Creators
Ian · Grok
