// ==UserScript==
// @name         多功能助手：下载按钮点击器 + 百度网盘密码填入
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  通用下载按钮点击器 + 百度网盘密码自动填入助手
// @author       You
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @grant        GM_setClipboard
// @grant        window.open
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // ==================== 百度网盘密码助手配置 ====================
    const BAIDU_CONFIG = {
        // 4位数字字母组合的正则表达式
        passwordRegex: /^[a-zA-Z0-9]{4}$/,
        // 检查间隔（毫秒）
        checkInterval: 1000,
        // 密码输入框选择器
        passwordSelector: 'input[placeholder*="密码"], input[placeholder*="提取码"], input.QKKaIZb, input[type="text"]',
        // 确认按钮选择器
        submitSelector: 'button[type="submit"], .g2HqYd, .u9jSD1, button:contains("确定"), button:contains("提取文件")'
    };

    let lastClipboardContent = '';
    let isBaiduProcessing = false;

    // ==================== 下载按钮点击器配置 ====================
    // 删除菜单命令，改为页面按钮

    // 主要功能函数 - 显示结果
    function clickDownloadButtons() {
        if (allResults.length > 0) {
            // 直接显示已处理的结果
            updateResultsDisplay();
        } else if (isProcessing) {
            showNotification('正在后台处理中，请稍候...');
        } else {
            showNotification('当前页面未找到指定的下载链接');
        }
    }
    
    // 后台静默处理函数
    async function backgroundProcess() {
        console.log('开始后台查找包含"/wp-content/plugins/erphpdown/download.php"的链接...');
        
        // 清空之前的结果
        allResults = [];
        isProcessing = true;
        
        // 查找所有包含指定路径的链接
        const downloadUrls = findDownloadLinksQuietly();
        
        if (downloadUrls.length > 0) {
            console.log(`后台找到 ${downloadUrls.length} 个下载链接，开始静默处理...`);
            
            // 批量处理所有链接
            const promises = downloadUrls.map((url, index) => 
                fetchHtmlContentQuietly(url, index + 1)
            );
            
            try {
                await Promise.all(promises);
                console.log('后台处理完成，共处理', allResults.length, '个链接');
            } catch (error) {
                console.error('后台处理出错:', error);
            }
        } else {
            console.log('后台未找到包含"/wp-content/plugins/erphpdown/download.php"的链接');
        }
        
        isProcessing = false;
    }

    // 静默查找下载链接的函数
    function findDownloadLinksQuietly() {
        const downloadUrls = [];
        
        // 获取当前网站的域名
        const currentDomain = window.location.protocol + '//' + window.location.host;
        
        // 查找所有a标签
        const allLinks = document.querySelectorAll('a');
        
        console.log(`后台扫描页面链接，总共找到 ${allLinks.length} 个 <a> 标签`);
        
        allLinks.forEach((link, index) => {
            const href = link.href || link.getAttribute('href') || '';
            const text = link.textContent.trim();
            
            // 检查链接是否包含指定的下载路径
            if (href.includes('/wp-content/plugins/erphpdown/download.php')) {
                let fullUrl = href;
                
                // 如果是相对路径，拼接域名
                if (href.startsWith('/')) {
                    fullUrl = currentDomain + href;
                } else if (!href.startsWith('http')) {
                    fullUrl = currentDomain + '/' + href;
                }
                
                // 直接使用原始URL，不进行参数替换
                downloadUrls.push(fullUrl);
                console.log('后台找到匹配的下载URL:', {
                    original: href,
                    full: fullUrl,
                    text: text
                });
            }
        });
        
        // 去重处理
        const uniqueUrls = [...new Set(downloadUrls)];
        
        console.log(`后台扫描完成，找到 ${uniqueUrls.length} 个唯一下载链接`);
        
        return uniqueUrls;
    }

    // 显示通知的函数
    function showNotification(message) {
        // 创建自定义通知
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            max-width: 300px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease-out;
        `;
        
        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // 3秒后自动移除通知
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    // 存储所有结果的数组
    let allResults = [];
    // 处理状态标志
    let isProcessing = false;
    

    // 静默获取HTML内容并提取验证码的函数
    async function fetchHtmlContentQuietly(originalUrl, index) {
        try {
            console.log(`后台处理第 ${index} 个链接...`);
            
            // 从原始URL获取验证码
            let verificationCode = null;
            try {
                const response = await fetch(originalUrl, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                
                if (response.ok) {
                    const htmlContent = await response.text();
                    verificationCode = extractVerificationCode(htmlContent);
                    console.log(`后台从原始URL获取的验证码:`, verificationCode || '未找到');
                } else {
                    console.log(`后台获取原始URL失败: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                console.log(`后台从原始URL获取验证码失败:`, error.message);
            }
            
            // 获取验证码后，将key参数替换为iframe参数
            const iframeUrl = processUrlFormatReverse(originalUrl);
            console.log(`后台替换后的URL (key->iframe):`, iframeUrl);
            
            // 存储结果
            const result = {
                index: index,
                iframeUrl: iframeUrl,
                verificationCode: verificationCode || '未找到验证码'
            };
            
            allResults.push(result);
            
        } catch (error) {
            console.error(`✗ 后台处理第 ${index} 个链接时出错:`, error);
            // 错误情况也显示基本信息
            const result = {
                index: index,
                iframeUrl: processUrlFormatReverse(originalUrl),
                verificationCode: '获取失败'
            };
            allResults.push(result);
        }
    }
    
    // 提取验证码的函数
    function extractVerificationCode(htmlContent) {
        // 匹配 <span class="erphpdown-code">验证码</span> 格式
        const codeMatch = htmlContent.match(/<span[^>]*class=["']erphpdown-code["'][^>]*>([^<]+)<\/span>/i);
        if (codeMatch && codeMatch[1]) {
            return codeMatch[1].trim();
        }
        
        // 备用匹配：更宽松的匹配
        const backupMatch = htmlContent.match(/erphpdown-code["'][^>]*>([^<]+)</i);
        if (backupMatch && backupMatch[1]) {
            return backupMatch[1].trim();
        }
        
        return null;
    }
    
    // 处理URL格式的函数（将iframe替换为key）
    function processUrlFormat(url) {
        try {
            const urlObj = new URL(url);
            const params = new URLSearchParams(urlObj.search);
            
            // 保存原始的参数值
            const postidValue = params.get('postid');
            const indexValue = params.get('index');
            let keyValue = params.get('key');
            
            // 将iframe替换为key，保持原始数值
            if (params.has('iframe')) {
                keyValue = params.get('iframe');
            }
            
            // 重新构建参数，确保key在index之前
            const newParams = new URLSearchParams();
            
            // 按顺序添加参数：postid → key → index → 其他参数
            if (postidValue) {
                newParams.set('postid', postidValue);
            }
            
            if (keyValue) {
                newParams.set('key', keyValue);
            }
            
            if (indexValue) {
                newParams.set('index', indexValue);
            }
            
            // 添加其他参数（排除已处理的postid、key、index、iframe）
            for (const [key, value] of params) {
                if (!['postid', 'key', 'index', 'iframe'].includes(key)) {
                    newParams.set(key, value);
                }
            }
            
            // 构建新的URL
            urlObj.search = newParams.toString();
            return urlObj.toString();
            
        } catch (error) {
            console.error('URL处理错误:', error);
            return url; // 如果处理失败，返回原URL
        }
    }
    
    // 反向处理URL格式的函数（将key替换为iframe）
    function processUrlFormatReverse(url) {
        try {
            const urlObj = new URL(url);
            const params = new URLSearchParams(urlObj.search);
            
            // 如果有key参数，将其替换为iframe=1&index=x格式改为index=x&key=1格式
            if (params.has('key')) {
                params.delete('key');
                params.set('iframe', '1');
            }
            
            // 重新排序参数：postid, index, key, 其他参数
            const newParams = new URLSearchParams();
            
            // 按顺序添加参数
            if (params.has('postid')) {
                newParams.set('postid', params.get('postid'));
            }
            
            if (params.has('index')) {
                newParams.set('index', params.get('index'));
            }
            
            if (params.has('iframe')) {
                newParams.set('key', '1');
            }
            
            // 添加其他参数（排除已处理的postid、iframe、index、key）
            for (const [key, value] of params) {
                if (!['postid', 'iframe', 'index', 'key'].includes(key)) {
                    newParams.set(key, value);
                }
            }
            
            // 构建新的URL
            urlObj.search = newParams.toString();
            return urlObj.toString();
            
        } catch (error) {
            console.error('URL反向处理错误:', error);
            return url; // 如果处理失败，返回原URL
        }
    }
    
    // 更新结果显示的函数
    function updateResultsDisplay() {
        const sortedResults = allResults.sort((a, b) => a.index - b.index);
        showClickableModal(sortedResults);
    }
    
    // 复制文本到剪贴板的函数
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification(`验证码已复制: ${text}`);
            checkAllCodesCopied();
        }).catch(err => {
            console.error('复制失败:', err);
            // 备用方法
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification(`验证码已复制: ${text}`);
            checkAllCodesCopied();
        });
    }
    
    // 检查是否所有验证码都已复制
    function checkAllCodesCopied() {
        const modal = document.getElementById('debug-modal');
        if (!modal) return;
        
        const copiedElements = modal.querySelectorAll('.code-status span[style*="color: #FF9800"]');
        const validCodes = allResults.filter(result => 
            result.verificationCode && 
            result.verificationCode !== '未找到验证码' && 
            result.verificationCode !== '获取失败'
        );
        
        if (copiedElements.length === validCodes.length && validCodes.length > 0) {
            console.log('所有验证码都已复制');
            const autoCloseEnabled = GM_getValue('autoCloseEnabled', true);
            
            if (autoCloseEnabled) {
                 console.log('自动关闭已启用，10秒后关闭网页');
                 showNotification('所有验证码已复制完成，10秒后自动关闭网页');
                 
                 setTimeout(() => {
                      // 获取页面标题和URL
                      const pageTitle = document.title || '未知页面';
                      const currentUrl = window.location.href;
                      
                      // 发送浏览器通知
                      if (typeof GM_notification !== 'undefined') {
                          GM_notification({
                        title: '页面自动关闭通知',
                        text: `${pageTitle} 已打开所有下载页面，自动关闭\n点击此通知可重新打开页面`,
                        timeout: 5000,
                              onclick: function() {
                                  console.log('通知被点击，重新打开页面:', currentUrl);
                                  // 重新打开页面
                                  if (typeof window !== 'undefined' && window.open) {
                                      window.open(currentUrl, '_blank');
                                  } else if (typeof GM_openInTab !== 'undefined') {
                                      GM_openInTab(currentUrl, { active: true });
                                  }
                              }
                          });
                      }
                      
                      window.close();
                  }, 10000);
             } else {
                console.log('自动关闭已禁用');
                showNotification('所有验证码已复制完成');
            }
        }
    }

    // 显示调试信息弹窗的函数
    function showDebugModal(message) {
        // 移除之前的调试弹窗
        const existingModal = document.getElementById('debug-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.id = 'debug-modal';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 20000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        // 创建弹窗内容
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 10px;
            max-width: 80%;
            max-height: 80%;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        
        // 创建关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '关闭';
        closeBtn.style.cssText = `
            float: right;
            background: #f44336;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            margin-bottom: 10px;
        `;
        
        closeBtn.onclick = () => overlay.remove();
        
        // 创建内容区域
        const content = document.createElement('pre');
        content.textContent = message;
        content.style.cssText = `
            white-space: pre-wrap;
            word-wrap: break-word;
            margin: 0;
            clear: both;
        `;
        
        modal.appendChild(closeBtn);
        modal.appendChild(content);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // 点击遮罩层关闭
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        };
        
        // 不自动关闭，只能手动关闭
    }
    
    // 显示可点击链接弹窗的函数
    function showClickableModal(results) {
        // 移除之前的调试弹窗
        const existingModal = document.getElementById('debug-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.id = 'debug-modal';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 20000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        // 创建弹窗内容
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 10px;
            max-width: 90%;
            max-height: 80%;
            overflow-y: auto;
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        
        // 创建关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '关闭';
        closeBtn.style.cssText = `
            float: right;
            background: #f44336;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            margin-bottom: 15px;
            font-size: 14px;
        `;
        
        closeBtn.onclick = () => overlay.remove();
        
        // 创建标题
        const title = document.createElement('h3');
        title.textContent = `下载链接列表 (${results.length}个)`;
        title.style.cssText = `
            margin: 0 0 10px 0;
            color: #333;
            clear: both;
        `;
        
        // 创建提示文本和开关容器
        const tipContainer = document.createElement('div');
        tipContainer.style.cssText = `
            margin: 0 0 20px 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        `;
        
        const tipText = document.createElement('span');
        tipText.textContent = '打开所有网站后，网页将在 10 秒后关闭';
        tipText.style.cssText = `
            color: #333;
            font-size: 13px;
        `;
        
        // 创建自动关闭开关
        const autoCloseEnabled = GM_getValue('autoCloseEnabled', true);
        const switchContainer = document.createElement('div');
        switchContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
        `;
        
        const switchLabel = document.createElement('span');
        switchLabel.textContent = '自动关闭:';
        switchLabel.style.cssText = `
            font-size: 12px;
            color: #666;
        `;
        
        const switchButton = document.createElement('div');
         switchButton.style.cssText = `
             width: 50px;
             height: 30px;
             border-radius: 15px;
             position: relative;
             transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
             cursor: pointer;
             background: ${autoCloseEnabled ? '#34C759' : '#E5E5EA'};
             box-shadow: inset 0 0 0 1px ${autoCloseEnabled ? 'rgba(52, 199, 89, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
         `;
         
         const switchSlider = document.createElement('div');
         switchSlider.style.cssText = `
             width: 26px;
             height: 26px;
             border-radius: 50%;
             background: white;
             position: absolute;
             top: 2px;
             transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
             transform: translateX(${autoCloseEnabled ? '22px' : '2px'});
             box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.2);
         `;
        
        switchButton.appendChild(switchSlider);
        
        // 开关点击事件
        switchContainer.addEventListener('click', () => {
            const currentState = GM_getValue('autoCloseEnabled', true);
            const newState = !currentState;
            GM_setValue('autoCloseEnabled', newState);
            
            // 更新开关样式
             switchButton.style.background = newState ? '#34C759' : '#E5E5EA';
             switchButton.style.boxShadow = `inset 0 0 0 1px ${newState ? 'rgba(52, 199, 89, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;
             switchSlider.style.transform = `translateX(${newState ? '22px' : '2px'})`;
            
            // 更新提示文本
            tipText.textContent = newState ? 
                '打开所有网站后，网页将在 10 秒后关闭' : 
                '打开所有网站后，网页不会自动关闭';
            
            showNotification(newState ? '已启用自动关闭' : '已禁用自动关闭');
        });
        
        // 根据当前状态更新提示文本
        tipText.textContent = autoCloseEnabled ? 
            '打开所有网站后，网页将在 10 秒后关闭' : 
            '打开所有网站后，网页不会自动关闭';
        
        switchContainer.appendChild(switchLabel);
        switchContainer.appendChild(switchButton);
        tipContainer.appendChild(tipText);
        tipContainer.appendChild(switchContainer);
        
        // 创建链接列表容器
        const linkContainer = document.createElement('div');
        
        results.forEach((result, index) => {
            const linkItem = document.createElement('div');
            linkItem.style.cssText = `
                margin-bottom: 15px;
                padding: 15px;
                border: 1px solid #ddd;
                border-radius: 8px;
                background: #f9f9f9;
            `;
            
            // 创建序号
            const indexSpan = document.createElement('span');
            indexSpan.textContent = `${result.index}. `;
            indexSpan.style.cssText = `
                font-weight: bold;
                color: #666;
                margin-right: 10px;
            `;
            
            // 创建可点击的链接
            const link = document.createElement('a');
            link.href = result.iframeUrl;
            link.textContent = result.iframeUrl;
            link.target = '_blank';
            link.style.cssText = `
                color: #2196F3;
                text-decoration: none;
                word-break: break-all;
                display: block;
                margin: 5px 0;
                padding: 5px;
                background: white;
                border-radius: 4px;
                border: 1px solid #e0e0e0;
            `;
            
            // 点击链接时复制验证码
            link.addEventListener('click', (e) => {
                if (result.verificationCode && result.verificationCode !== '未找到验证码' && result.verificationCode !== '获取失败') {
                    copyToClipboard(result.verificationCode);
                    // 更新提示文本为"已复制"
                    const codeSpan = linkItem.querySelector('.code-status');
                    if (codeSpan) {
                        codeSpan.innerHTML = `验证码：<strong style="color: #4CAF50;">${result.verificationCode}</strong> <span style="color: #FF9800;">已复制</span>`;
                    }
                }
            });
            
            // 鼠标悬停效果
            link.addEventListener('mouseenter', () => {
                link.style.background = '#e3f2fd';
                link.style.borderColor = '#2196F3';
            });
            
            link.addEventListener('mouseleave', () => {
                link.style.background = 'white';
                link.style.borderColor = '#e0e0e0';
            });
            
            // 创建验证码显示
            const codeSpan = document.createElement('div');
            codeSpan.style.cssText = `
                margin-top: 8px;
                font-size: 12px;
                color: #666;
            `;
            
            // 添加class用于后续更新
            codeSpan.className = 'code-status';
            
            if (result.verificationCode && result.verificationCode !== '未找到验证码' && result.verificationCode !== '获取失败') {
                codeSpan.innerHTML = `验证码：<strong style="color: #4CAF50;">${result.verificationCode}</strong> <span style="color: #999;">(点击链接自动复制)</span>`;
            } else {
                codeSpan.innerHTML = `验证码：<span style="color: #f44336;">${result.verificationCode}</span>`;
            }
            
            linkItem.appendChild(indexSpan);
            linkItem.appendChild(link);
            linkItem.appendChild(codeSpan);
            linkContainer.appendChild(linkItem);
        });
        
        modal.appendChild(closeBtn);
        modal.appendChild(title);
        modal.appendChild(tipContainer);
        modal.appendChild(linkContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // 点击遮罩层关闭
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        };
    }

    // 创建页面底部按钮
    function createBottomButton() {
        const button = document.createElement('div');
        button.innerHTML = '📥 点击立即下载';
        button.title = '点击立即下载';
        button.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 30px;
            background: #2196F3;
            color: white;
            border-radius: 25px 25px 0 0;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 9999;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            min-width: 200px;
            font-family: Arial, sans-serif;
        `;
        
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateX(-50%) translateY(-5px)';
            button.style.background = '#1976D2';
            button.style.boxShadow = '0 -4px 15px rgba(0,0,0,0.4)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateX(-50%) translateY(0)';
            button.style.background = '#2196F3';
            button.style.boxShadow = '0 -2px 10px rgba(0,0,0,0.3)';
        });
        
        button.addEventListener('click', clickDownloadButtons);
        
        document.body.appendChild(button);
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        console.log('立即下载按钮点击器已加载');
        
        // 下载按钮点击器功能
        if (window.location.href.startsWith('https://www.freeshare666.com/archives')) {
            console.log('在指定网站，创建按钮');
            // 创建页面底部按钮
            createBottomButton();
            
            // 延迟启动后台处理，确保页面完全加载
            setTimeout(() => {
                backgroundProcess();
            }, 2000);
        } else {
            console.log('不在指定网站，跳过按钮创建');
        }
        
        // 百度网盘密码助手功能
        if (window.location.hostname.includes('baidu.com') && 
            (window.location.pathname.includes('/s/') || window.location.href.includes('pan.baidu.com/s/'))) {
            console.log('百度网盘密码自动填入助手已启动');
            requestNotificationPermission();
            
            // 开始监控剪贴板
            setInterval(checkClipboard, BAIDU_CONFIG.checkInterval);
            
            // 页面变化时重新检查
            const observer = new MutationObserver(() => {
                if (!isBaiduProcessing && lastClipboardContent && BAIDU_CONFIG.passwordRegex.test(lastClipboardContent.trim())) {
                    const passwordInput = findPasswordInput();
                    if (passwordInput && !passwordInput.value) {
                        fillPassword(lastClipboardContent.trim());
                    }
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    // ==================== 百度网盘密码助手功能函数 ====================
    
    // 请求通知权限
    function requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
    
    // 检查剪贴板内容
    async function checkClipboard() {
        if (isBaiduProcessing) return;
        
        try {
            const text = await navigator.clipboard.readText();
            if (text !== lastClipboardContent && BAIDU_CONFIG.passwordRegex.test(text.trim())) {
                lastClipboardContent = text;
                console.log('检测到可能的提取码:', text.trim());
                
                const passwordInput = findPasswordInput();
                if (passwordInput && !passwordInput.value) {
                    fillPassword(text.trim());
                }
            }
        } catch (err) {
            // 静默处理剪贴板权限错误
        }
    }
    
    // 查找密码输入框
    function findPasswordInput() {
        const selectors = BAIDU_CONFIG.passwordSelector.split(', ');
        
        for (const selector of selectors) {
            const input = document.querySelector(selector);
            if (input && input.offsetParent !== null) { // 确保元素可见
                return input;
            }
        }
        
        return null;
    }
    
    // 查找提交按钮
    function findSubmitButton() {
        const selectors = BAIDU_CONFIG.submitSelector.split(', ');
        
        for (const selector of selectors) {
            if (selector.includes(':contains')) {
                // 处理包含文本的选择器
                const text = selector.match(/\"([^\"]+)\"/)[1];
                const buttons = document.querySelectorAll('button');
                for (const button of buttons) {
                    if (button.textContent.includes(text) && button.offsetParent !== null) {
                        return button;
                    }
                }
            } else {
                const button = document.querySelector(selector);
                if (button && button.offsetParent !== null) {
                    return button;
                }
            }
        }
        
        return null;
    }
    
    // 填入密码并提交
    function fillPassword(password) {
        if (isBaiduProcessing) return;
        
        isBaiduProcessing = true;
        
        const passwordInput = findPasswordInput();
        if (!passwordInput) {
            console.log('未找到密码输入框');
            isBaiduProcessing = false;
            return;
        }
        
        // 填入密码
        passwordInput.value = password;
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
        passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        console.log('已填入提取码:', password);
        
        // 显示通知
        showBaiduNotification(`已自动填入提取码: ${password}`);
        
        // 等待一下再查找提交按钮
        setTimeout(() => {
            const submitButton = findSubmitButton();
            if (submitButton) {
                console.log('找到提交按钮，准备点击');
                submitButton.click();
                showBaiduNotification('已自动点击提取按钮');
            } else {
                console.log('未找到提交按钮');
            }
            
            // 重置处理状态
            setTimeout(() => {
                isBaiduProcessing = false;
            }, 2000);
        }, 500);
    }
    
    // 显示百度网盘通知
    function showBaiduNotification(message) {
        // 创建自定义通知
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #1890ff;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease-out;
        `;
        
        // 添加动画样式
        if (!document.getElementById('baidu-notification-style')) {
            const style = document.createElement('style');
            style.id = 'baidu-notification-style';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // 3秒后自动移除通知
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
        
        // 浏览器通知
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('百度网盘助手', {
                body: message,
                icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjMTg5MGZmIi8+Cjwvc3ZnPgo='
            });
        }
    }

})();