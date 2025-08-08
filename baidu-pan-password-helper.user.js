// ==UserScript==
// @name         百度网盘密码自动填入助手
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  自动监控剪贴板中的百度网盘提取码，并在百度网盘页面自动填入密码
// @author       Assistant
// @match        *://pan.baidu.com/s/*
// @match        *://*.pan.baidu.com/s/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    
    // ==================== 百度网盘密码助手配置 ====================
    const BAIDU_CONFIG = {
        passwordRegex: /^[a-zA-Z0-9]{4}$/,
        checkInterval: 1000,
        passwordSelector: 'input[placeholder*="提取码"], input[placeholder*="密码"], input.pickpw, input#pwd',
        submitSelector: 'button:contains("提取文件"), button:contains("确定"), .btn-primary, .g-button-blue'
    };
    
    // 全局变量
    let lastClipboardContent = '';
    let isBaiduProcessing = false;
    
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
    
    // ==================== 初始化 ====================
    
    // 页面加载完成后启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
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
    
})();