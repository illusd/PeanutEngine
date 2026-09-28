#!/usr/bin/env python3
import base64, gzip
from pathlib import Path
mod = Path(__file__).resolve().parent.parent
def restore(b64_path, out_rel):
    raw = Path(b64_path).read_text().strip()
    out = mod / out_rel
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(gzip.decompress(base64.b64decode(raw)))
    print("OK", out)
here = Path(__file__).resolve().parent
restore(here / "PeanutEnginePlugin.java.gz.b64", "java/src/main/java/com/peanutengine/PeanutEnginePlugin.java")
restore(here.parent / "bedrock" / "main.js.gz.b64", "bedrock/PeanutEngine_BP/scripts/main.js")
print("Next: cd java && mvn -q package")
