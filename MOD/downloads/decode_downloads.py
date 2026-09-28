#!/usr/bin/env python3
"""Decode MOD/downloads/*.b64 into real jar/zip/mcpack next to this script."""
import base64
from pathlib import Path
here = Path(__file__).resolve().parent
for p in sorted(here.glob("*.b64")):
    name = p.name[:-4]
    part_files = []
    i = 0
    while (here / f"{name}.b64.{i}").exists():
        part_files.append(here / f"{name}.b64.{i}")
        i += 1
    if part_files:
        b64 = "".join(f.read_text().strip() for f in part_files)
    else:
        b64 = p.read_text().strip()
    out = here / name
    out.write_bytes(base64.b64decode(b64))
    print("OK", out.name, out.stat().st_size, "bytes")
print("Done. Java: plugins/PeanutEngine.jar  |  Bedrock: PeanutEngine.mcpack")
