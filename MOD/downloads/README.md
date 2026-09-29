# Downloads — 一键下载说明

## 推荐：GitHub Release（点链接就下载）

1. 打开 https://github.com/illusd/PeanutEngine/releases/new
2. Tag 填 `v2.2.0`，标题填 `PeanutEngine 2.2`
3. 把下面四个文件拖进 **Attach binaries**：
   - `PeanutEngine.jar`
   - `PeanutEngine-Java.zip`
   - `PeanutEngine.mcpack`
   - `PeanutEngine-Bedrock.zip`
4. Publish release

发布后，用户用这些链接**会直接下载**（不会打开网页预览）：

```
https://github.com/illusd/PeanutEngine/releases/download/v2.2.0/PeanutEngine.jar
https://github.com/illusd/PeanutEngine/releases/download/v2.2.0/PeanutEngine-Java.zip
https://github.com/illusd/PeanutEngine/releases/download/v2.2.0/PeanutEngine.mcpack
https://github.com/illusd/PeanutEngine/releases/download/v2.2.0/PeanutEngine-Bedrock.zip
```

最新版总入口（自动跳最新 Release）：

```
https://github.com/illusd/PeanutEngine/releases/latest
```

## 仓库内文件链接（备选）

二进制若已放在 `MOD/downloads/`：

```
https://github.com/illusd/PeanutEngine/raw/main/MOD/downloads/PeanutEngine.jar
https://raw.githubusercontent.com/illusd/PeanutEngine/main/MOD/downloads/PeanutEngine.jar
```

- `github.com/.../raw/...`：多数浏览器会**直接下载** jar/zip
- `raw.githubusercontent.com`：有时会在浏览器里打开文本，不适合当下载按钮

## 分享给玩家时建议写法

**Java：**
> 点此下载插件：  
> https://github.com/illusd/PeanutEngine/releases/download/v2.2.0/PeanutEngine.jar  
> 放到服务器 `plugins/` 后重启

**基岩：**
> 点此下载行为包：  
> https://github.com/illusd/PeanutEngine/releases/download/v2.2.0/PeanutEngine.mcpack  
> 手机/电脑双击导入，并开启 Beta APIs

## 从 base64 还原（开发用）

```bash
cd MOD/downloads
python3 decode_downloads.py
```
