# Downloads (in-repo)

Binary packages stored as **base64** in this folder (GitHub repo, not Release).

## Restore to real files

```bash
cd MOD/downloads
python3 decode_downloads.py
```

| Output | Use |
|--------|-----|
| `PeanutEngine.jar` | Java → `plugins/` |
| `PeanutEngine-Java.zip` | Java bundle |
| `PeanutEngine.mcpack` | Bedrock import |
| `PeanutEngine-Bedrock.zip` | Bedrock behavior pack zip |

After decode, use the generated binaries on your server.
