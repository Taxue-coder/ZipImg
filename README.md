# ZipImg

Online: [http://43.242.200.67:4174/zh](http://43.242.200.67:4174/zh)

该项目基于 `https://zippic.cn/zh` 的公开客户端构建产物，已重新命名为 ZipImg，并替换品牌视觉、主题配色、联系方式和页脚内容。


## 运行

```powershell
npm install
npm start
```

浏览器打开：`http://127.0.0.1:4174/zh`

已缓存的文件会优先从 `site-source/` 读取。未缓存的懒加载资源会从原站获取并自动落盘。

重新生成 ZipImg Logo、favicon、对比插画并应用品牌文本：

```powershell
npm run brand
```

## 更新镜像

先运行 `npm start`，再在另一个终端执行：

```powershell
npm run crawl
```

## 验证视频转换

需要系统已安装 Chrome 和 FFmpeg：

```powershell
npm run verify
```

验证脚本会生成一个临时 MP4，上传到本地视频转换页，等待 FFmpeg WASM 初始化，执行转换并检查下载状态。

## 文件说明

- `scripts/mirror-server.mjs`：缓存优先的本地镜像和回源代理
- `scripts/crawl-site.mjs`：从 sitemap 预热中文页面和静态依赖
- `scripts/verify-mirror.mjs`：浏览器端视频/WASM 回归测试
- `site-source/pages`：公开页面和页面域名资源
- `site-source/assets`：静态资源域名文件及 FFmpeg WASM

这是公开部署产物的镜像，不是原站未发布的 TypeScript/React 仓库或服务端源码。
