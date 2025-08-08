# 百度网盘密码自动填入助手（简化版）

一个简单的油猴脚本，自动检测剪贴板中的4位数字字母组合密码并填入百度网盘。

## ✨ 功能特性

- 🔍 **自动检测**：监控剪贴板，识别4位数字字母组合（如：a1b2、3c4d）
- 📋 **自动填入**：检测到密码后自动填入百度网盘密码框
- 🔔 **通知提示**：显示简单的通知提醒用户操作状态
- 🎯 **精准匹配**：只匹配4位数字+字母组合，避免误操作
- ⚡ **轻量简洁**：代码简单，功能专一，性能优秀

## 🚀 安装使用

### 1. 安装油猴插件

首先需要在浏览器中安装 Tampermonkey 插件：
- [Chrome 扩展商店](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- [Firefox 附加组件](https://addons.mozilla.org/zh-CN/firefox/addon/tampermonkey/)
- [Edge 扩展商店](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

### 2. 安装脚本

1. 点击 Tampermonkey 图标 → 管理面板
2. 点击「新建脚本」
3. 复制 `auto_baidu_pan_password.user.js` 文件内容
4. 粘贴到编辑器中，保存

### 3. 使用方法

1. 访问百度网盘分享链接（如：`https://pan.baidu.com/s/xxxxxx`）
2. 复制4位数字字母组合密码到剪贴板（如：a1b2）
3. 脚本会自动检测并填入密码框
4. 自动点击确认按钮完成提取

## 🎯 支持网站

- `pan.baidu.com` - 百度网盘
- `yun.baidu.com` - 百度云（旧域名）

## ⚙️ 配置说明

脚本内置以下配置，可根据需要修改：

```javascript
const CONFIG = {
    // 4位数字字母组合的正则表达式
    passwordRegex: /^[a-zA-Z0-9]{4}$/,
    // 检查间隔（毫秒）
    checkInterval: 1000,
    // 密码输入框选择器
    passwordSelector: 'input[placeholder*="密码"], input[placeholder*="提取码"], input.QKKaIZb, input[type="text"]',
    // 确认按钮选择器
    submitSelector: 'button[type="submit"], .g2HqYd, .u9jSD1, button:contains("确定"), button:contains("提取文件")'
};
```

## 🔒 权限说明

脚本需要以下权限：
- `GM_notification` - 显示通知
- `GM_setClipboard` - 剪贴板操作
- 访问百度网盘页面

## 🛡️ 安全提示

- 脚本只在百度网盘页面运行
- 只检测4位数字字母组合，避免误操作
- 不会上传或存储任何密码信息
- 所有操作都在本地浏览器中完成

## 🔧 故障排除

### 脚本不工作？
1. 确认 Tampermonkey 已启用
2. 检查脚本是否已安装并启用
3. 刷新百度网盘页面
4. 检查浏览器控制台是否有错误信息

### 无法读取剪贴板？
1. 确保浏览器允许访问剪贴板
2. 在 HTTPS 页面下使用
3. 手动授权剪贴板权限

### 密码框找不到？
1. 等待页面完全加载
2. 检查页面是否为百度网盘分享页面
3. 尝试手动刷新页面

## 📝 更新日志

### v1.0 (2024-08-08)
- 初始版本发布
- 支持4位数字字母组合密码检测
- 自动填入和提交功能
- 通知提示功能

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

## ⚠️ 免责声明

本脚本仅供学习和个人使用，请遵守相关网站的使用条款。使用本脚本所产生的任何问题，作者不承担任何责任。