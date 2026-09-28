#!/usr/bin/env python3
import base64, gzip
from pathlib import Path
mod = Path(__file__).resolve().parent.parent
here = Path(__file__).resolve().parent
def restore_parts(parts, out_rel):
    raw = "".join(Path(p).read_text().strip() for p in parts)
    out = mod / out_rel
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(gzip.decompress(base64.b64decode(raw)))
    print("OK", out)
restore_parts([here/"PeanutEnginePlugin.java.gz.b64.a", here/"PeanutEnginePlugin.java.gz.b64.b"],
              "java/src/main/java/com/peanutengine/PeanutEnginePlugin.java")
restore_parts([here.parent/"bedrock"/"main.js.gz.b64.a", here.parent/"bedrock"/"main.js.gz.b64.b"],
              "bedrock/PeanutEngine_BP/scripts/main.js")
print("Next: cd java && mvn -q package")
