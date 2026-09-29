# 玩家一键下载

## 方式一：Release（推荐，点开即下）

仓库 → **Releases** → 上传 jar / zip / mcpack 后：

| 文件 | 自动下载链接格式 |
|------|------------------|
| Java 插件 | `https://github.com/illusd/PeanutEngine/releases/download/标签/PeanutEngine.jar` |
| Java 打包 | `.../PeanutEngine-Java.zip` |
| 基岩包 | `.../PeanutEngine.mcpack` |
| 基岩 zip | `.../PeanutEngine-Bedrock.zip` |

把链接发到 Discord / 官网即可，用户点击浏览器会**强制下载**。

## 方式二：网页按钮（自己做官网时）

```html
<a href="https://github.com/illusd/PeanutEngine/releases/download/v2.2.0/PeanutEngine.jar" download>
  下载 Java 插件
</a>
<a href="https://github.com/illusd/PeanutEngine/releases/download/v2.2.0/PeanutEngine.mcpack" download>
  下载基岩模组
</a>
```

`download` 属性可提示浏览器保存文件。

## 为什么不要用 raw 当唯一下载？

`raw.githubusercontent.com` 对 `.jar` 有时仍能下，但对文本类可能直接显示内容。  
**Release Assets** 带正确的 `Content-Disposition: attachment`，才是真正的「网址 → 自动下载」。
