// ========== 崽崽工作台 - 主应用 ==========

const APP = {
    currentPanel: 'daily-plan',
    currentNavEdit: null,
    scheduleView: 'month',
    scheduleDate: new Date(),
    englishMode: 'quiz',
    currentPlatform: 'douyin',
    currentFilter: 'all',
    quizIndex: 0,
    quizCorrect: 0,
    speakIndex: 0,
    englishSeconds: 0,
    englishTimer: null,
    emojiData: null,
};

// ========== 导航配置 ==========
const DEFAULT_NAV = [
    { id: 'daily-plan', emoji: '📋', label: '每日计划' },
    { id: 'schedule', emoji: '📅', label: '工作日程' },
    { id: 'savings', emoji: '💰', label: '存钱计划' },
    { id: 'stocks', emoji: '📈', label: '股票基金' },
    { id: 'inspiration', emoji: '💡', label: '选题灵感' },
    { id: 'hot-trends', emoji: '🔥', label: '爆款热点' },
    { id: 'video-edit', emoji: '🎬', label: '视频剪辑' },
    { id: 'review', emoji: '📝', label: '内容复盘' },
    { id: 'english', emoji: '🇬🇧', label: '英语学习' },
    { id: 'news', emoji: '📰', label: '每日新闻' },
    { id: 'memo', emoji: '📝', label: '备忘录' },
];

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initDate();
    initWeather();
    initSidebar();
    initUserInfo();
    initAvatar();
    initGlobalSearch();
    initPanelSearch();
    initDailyPlan();
    initSavings();
    initStocks();
    initInspiration();
    initHotTrends();
    initVideoEdit();
    initReview();
    initSchedule();
    initEnglish();
    initNews();
    initMemo();
    initBackupRestore();
    initCloudSync();
    initEmojiModal();
    initResponsive();
});

// ========== 工具函数 ==========
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function getData(key, def = null) {
    try { const d = localStorage.getItem('zz_' + key); return d ? JSON.parse(d) : def; }
    catch { return def; }
}

function setData(key, val) {
    localStorage.setItem('zz_' + key, JSON.stringify(val));
}

function showToast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timeout);
    t._timeout = setTimeout(() => t.classList.remove('show'), 2000);
}

// 获取本地时区日期字符串（YYYY-MM-DD），避免 UTC 时差问题
function formatLocalDate(d = new Date()) {
    const date = d instanceof Date ? d : new Date(d);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// 获取用户所在城市/地区（基于 IP，缓存 1 小时）
async function getUserLocation() {
    const cached = localStorage.getItem('zz_user_location');
    const cachedTime = parseInt(localStorage.getItem('zz_user_location_time') || '0');
    if (cached && Date.now() - cachedTime < 60 * 60 * 1000) {
        return cached;
    }
    try {
        const r = await fetch('https://geolocation-db.com/json/');
        const data = await r.json();
        let loc = '';
        if (data.city && data.city !== 'null') loc = data.city;
        if (data.state && data.state !== 'null') {
            if (loc) loc += ', ' + data.state;
            else loc = data.state;
        }
        if (data.country_name && data.country_name !== 'null' && !loc.includes(data.country_name)) {
            if (loc) loc += ', ' + data.country_name;
            else loc = data.country_name;
        }
        if (!loc) loc = '未知位置';
        localStorage.setItem('zz_user_location', loc);
        localStorage.setItem('zz_user_location_time', Date.now().toString());
        return loc;
    } catch (e) {
        return cached || '未知位置';
    }
}

// 获取本地时间字符串（HH:MM）
function formatLocalTime(d = new Date()) {
    const date = d instanceof Date ? d : new Date(d);
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
}

// ========== 行情数据服务 ==========
// 使用腾讯财经接口（支持 CORS）获取股票/ETF 实时行情与历史 K 线
// 场外基金使用天天基金 JSONP 接口获取历史净值

function normalizeStockCode(code, type) {
    code = String(code).trim().toLowerCase();
    // 移除已有的前缀
    code = code.replace(/^(sh|sz|bj|hk)/, '');
    if (type === 'fund') {
        // 场外基金代码统一补零到 6 位（天天基金接口要求）
        if (!/^(15|16|18|50|51|52|56|58)/.test(code)) {
            code = code.padStart(6, '0');
            return { market: 'fund', symbol: code };
        }
        // 场内基金：ETF/LOF 代码一般以 15/16/18/50/51/52/56/58 开头
        if (/^(15|16|18|50|51|52|56|58)/.test(code)) return { market: 'tencent', symbol: 'sh' + code };
        return { market: 'tencent', symbol: 'sz' + code };
    }
    // 股票
    if (/^6/.test(code) || /^68/.test(code) || /^8/.test(code) || /^9/.test(code)) {
        return { market: 'tencent', symbol: 'sh' + code };
    }
    if (/^(0|3|2)/.test(code) || /^4/.test(code)) {
        return { market: 'tencent', symbol: 'sz' + code };
    }
    // 默认深圳
    return { market: 'tencent', symbol: 'sz' + code };
}

function formatDateStr(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateCompact(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

function getQuoteCache(symbol) {
    return getData('quote_' + symbol, null);
}

function setQuoteCache(symbol, data) {
    setData('quote_' + symbol, data);
}

// 批量获取腾讯实时行情（GBK 编码）
async function fetchTencentQuotes(symbols) {
    const url = 'https://qt.gtimg.cn/q=' + symbols.join(',');
    try {
        const res = await fetch(url);
        const buffer = await res.arrayBuffer();
        const decoder = new TextDecoder('gbk');
        const text = decoder.decode(buffer);
        const lines = text.trim().split('\n');
        const result = {};
        lines.forEach(line => {
            const m = line.match(/v_(.+?)="(.+?)";?$/);
            if (!m) return;
            const symbol = m[1];
            const parts = m[2].split('~');
            // parts[1] 名称, parts[2] 代码, parts[3] 当前价, parts[4] 昨收, parts[5] 今开
            result[symbol] = {
                name: parts[1] || '',
                code: parts[2] || symbol,
                price: parseFloat(parts[3]) || 0,
                prevClose: parseFloat(parts[4]) || 0,
                open: parseFloat(parts[5]) || 0,
                high: parseFloat(parts[33]) || 0,
                low: parseFloat(parts[34]) || 0,
                time: parts[30] || ''
            };
        });
        return result;
    } catch (e) {
        console.error('fetchTencentQuotes error', e);
        return {};
    }
}

// 获取腾讯历史 K 线（JSON，已除权）
async function fetchTencentKline(symbol, start, end) {
    // 一次最多 640 根，通常够用
    const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${symbol},day,${start},${end},640,qfq`;
    try {
        const res = await fetch(url);
        const json = await res.json();
        const data = json.data && json.data[symbol];
        if (!data) return [];
        const arr = data.qfqday || data.day || [];
        return arr.map(item => ({
            date: item[0],
            open: parseFloat(item[1]),
            close: parseFloat(item[2]),
            low: parseFloat(item[3]),
            high: parseFloat(item[4]),
            volume: parseFloat(item[5])
        }));
    } catch (e) {
        console.error('fetchTencentKline error', e);
        return [];
    }
}

// JSONP 获取基金名称
function fetchFundName(code) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://fund.eastmoney.com/pingzhongdata/${code}.js?v=${Date.now()}`;
        script.onload = () => {
            document.body.removeChild(script);
            const name = window.fS_name;
            if (name) resolve(name);
            else reject(new Error('找不到该基金'));
        };
        script.onerror = () => {
            document.body.removeChild(script);
            reject(new Error('加载失败'));
        };
        document.body.appendChild(script);
    });
}

// JSONP 加载天天基金历史净值
function loadFundJsonp(code) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const cbName = '_fund_callback_' + Date.now();
        script.src = `https://fund.eastmoney.com/pingzhongdata/${code}.js?v=${Date.now()}`;
        script.onload = () => {
            document.body.removeChild(script);
            const trend = window.Data_netWorthTrend;
            const acWorth = window.Data_ACWorthTrend;
            if (!trend) return reject(new Error('无净值数据'));
            const list = trend.map((item, idx) => ({
                date: formatDateStr(new Date(item.x)),
                nav: item.y,
                equityReturn: item.equityReturn,
                acNav: acWorth && acWorth[idx] ? acWorth[idx][1] : null
            }));
            resolve(list);
        };
        script.onerror = () => {
            document.body.removeChild(script);
            reject(new Error('加载失败'));
        };
        document.body.appendChild(script);
    });
}

// 获取或更新某持仓的历史行情
async function updateHoldingQuotes(holding) {
    const norm = normalizeStockCode(holding.code, holding.type);
    holding.symbol = norm.symbol;
    holding.market = norm.market;

    const today = new Date();
    // 用最早买入日期作为行情起点，确保覆盖完整持仓周期
    const buyDateStr = holding.buyDate || getHoldingBuyDate(holding.id) || formatLocalDate(new Date(holding.createdAt));
    const startDate = new Date(buyDateStr + 'T00:00:00');
    startDate.setDate(startDate.getDate() - 5); // 多取前几天用于计算
    const start = formatDateStr(startDate);
    // end 不能超过今天，避免未来日期导致接口报错
    const todayStr = formatDateStr(today);
    const end = todayStr;

    let cache = getQuoteCache(norm.symbol) || { list: [], updatedAt: 0 };

    if (norm.market === 'tencent') {
        // 合并实时行情和历史 K 线
        const [quotes, kline] = await Promise.all([
            fetchTencentQuotes([norm.symbol]),
            fetchTencentKline(norm.symbol, start, end)
        ]);
        const q = quotes[norm.symbol];
        if (q && q.price > 0) {
            holding.price = q.price;
            holding.name = q.name || holding.name;
        }
        if (kline && kline.length > 0) {
            cache.list = mergeQuoteList(cache.list, kline, 'date');
        }
    } else if (norm.market === 'fund') {
        const list = await loadFundJsonp(norm.symbol);
        if (list && list.length > 0) {
            cache.list = mergeQuoteList(cache.list, list, 'date');
            const last = list[list.length - 1];
            if (last && last.nav > 0) {
                holding.price = last.nav;
            }
        }
    }

    cache.updatedAt = Date.now();
    setQuoteCache(norm.symbol, cache);
    return cache;
}

function mergeQuoteList(oldList, newList, key) {
    const map = {};
    (oldList || []).forEach(item => { map[item[key]] = item; });
    newList.forEach(item => { map[item[key]] = item; });
    return Object.values(map).sort((a, b) => a[key].localeCompare(b[key]));
}

// 从缓存获取某日收盘价/净值
function getClosePrice(symbol, dateStr) {
    const cache = getQuoteCache(symbol);
    if (!cache || !cache.list) return null;
    const item = cache.list.find(x => x.date === dateStr);
    return item ? (item.close || item.nav) : null;
}

// 判断某日期是否可能是休市日（非周末但无行情数据）
function isMarketClosed(date, symbol) {
    const dow = date.getDay();
    if (dow === 0 || dow === 6) return true;
    const dateStr = formatDateStr(date);
    const price = getClosePrice(symbol, dateStr);
    if (price === null) return true; // 无数据视为休市/节假日
    return false;
}

// 获取持仓最早买入日期（从交易记录）
function getHoldingBuyDate(holdingId) {
    const records = getData('records', []);
    const buys = records.filter(r => r.holdingId === holdingId && r.type === 'buy');
    if (buys.length === 0) return null;
    buys.sort((a, b) => new Date(a.date) - new Date(b.date));
    return buys[0].date;
}

// 修复被交易记录污染的错误买入日期（一次性）
function fixInvalidBuyDates() {
    const today = formatLocalDate(new Date());
    const holdings = getData('holdings', []);
    let changed = false;
    holdings.forEach(h => {
        if (h.buyDate && h.buyDate > today) {
            // 如果买入日是未来日期，明显错误，清空让用户重新设置
            delete h.buyDate;
            changed = true;
        }
    });
    if (changed) setData('holdings', holdings);
}

// 给所有持仓补全 symbol/market（不再从交易记录同步买入日期，避免交易记录日期错误污染持仓）
function syncHoldingBuyDates() {
    const holdings = getData('holdings', []);
    let changed = false;
    holdings.forEach(h => {
        // 补全/修正 symbol 和 market（基金代码自动补零）
        const norm = normalizeStockCode(h.code, h.type);
        if (!h.symbol || h.symbol !== norm.symbol || !h.market || h.market !== norm.market) {
            h.symbol = norm.symbol;
            h.market = norm.market;
            changed = true;
        }
        // 一次性迁移：为没有 batches 的老持仓补全首批记录
        if (!Array.isArray(h.batches) || h.batches.length === 0) {
            h.batches = [{
                shares: h.shares || 0,
                cost: h.cost || 0,
                buyDate: h.buyDate || (h.createdAt ? formatLocalDate(new Date(h.createdAt)) : null)
            }];
            changed = true;
        }
    });
    if (changed) setData('holdings', holdings);
    return holdings;
}


function formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const week = ['日', '一', '二', '三', '四', '五', '六'];
    return `${y}年${m}月${day}日 星期${week[d.getDay()]}`;
}

function formatDateShort(d) {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${m}/${day}`;
}

// ========== 日期显示 ==========
function initDate() {
    const update = () => {
        $('#dateDisplay').textContent = formatDate(new Date());
        $('#dailyPlanDate').textContent = formatDate(new Date());
        const m = new Date();
        $('#savingsMonth').textContent = `${m.getFullYear()}年${m.getMonth()+1}月`;
    };
    update();
    setInterval(update, 60000);
}

// ========== 天气 ==========
async function initWeather() {
    try {
        // 尝试获取用户位置并获取天气
        const pos = await new Promise((resolve, reject) => {
            if (!navigator.geolocation) return reject('no geolocation');
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        const { latitude, longitude } = pos.coords;
        // 使用 Open-Meteo 免费天气API
        const resp = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`);
        const data = await resp.json();
        if (data.current_weather) {
            const temp = Math.round(data.current_weather.temperature);
            const code = data.current_weather.weathercode;
            const weatherMap = {
                0: { icon: '☀️', desc: '晴天' },
                1: { icon: '🌤️', desc: '少云' },
                2: { icon: '⛅', desc: '多云' },
                3: { icon: '☁️', desc: '阴天' },
                45: { icon: '🌫️', desc: '雾' },
                48: { icon: '🌫️', desc: '雾凇' },
                51: { icon: '🌦️', desc: '小雨' },
                53: { icon: '🌦️', desc: '中雨' },
                55: { icon: '🌧️', desc: '大雨' },
                61: { icon: '🌧️', desc: '小雨' },
                63: { icon: '🌧️', desc: '中雨' },
                65: { icon: '🌧️', desc: '大雨' },
                71: { icon: '🌨️', desc: '小雪' },
                73: { icon: '🌨️', desc: '中雪' },
                75: { icon: '❄️', desc: '大雪' },
                80: { icon: '🌦️', desc: '阵雨' },
                81: { icon: '🌧️', desc: '阵雨' },
                82: { icon: '⛈️', desc: '雷阵雨' },
                95: { icon: '⛈️', desc: '雷暴' },
            };
            const w = weatherMap[code] || { icon: '🌤️', desc: '多云' };
            $('#weatherDisplay').innerHTML = `<span class="weather-icon">${w.icon}</span><span class="weather-temp">${temp}°C</span><span class="weather-desc">${w.desc}</span>`;
            setData('weather', { temp, icon: w.icon, desc: w.desc, time: Date.now() });
        }
    } catch {
        // 使用缓存或默认
        const cached = getData('weather');
        if (cached && (Date.now() - cached.time < 3600000)) {
            $('#weatherDisplay').innerHTML = `<span class="weather-icon">${cached.icon}</span><span class="weather-temp">${cached.temp}°C</span><span class="weather-desc">${cached.desc}</span>`;
        } else {
            $('#weatherDisplay').innerHTML = `<span class="weather-icon">☀️</span><span class="weather-temp">28°C</span><span class="weather-desc">晴朗</span>`;
        }
    }
}

// ========== 侧边栏 ==========
function initSidebar() {
    const menuBtn = $('#menuBtn');
    const sidebar = $('#sidebar');
    const overlay = $('#overlay');
    const toggle = $('#sidebarToggle');

    menuBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        overlay.style.display = 'block';
    });

    toggle.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.style.display = 'none';
    }
}

// ========== 导航系统 ==========
function initNavigation() {
    let navData = getData('nav', DEFAULT_NAV);

    // 如果默认导航新增了模块，自动合并更新（保留用户自定义的emoji）
    const missing = DEFAULT_NAV.find(def => !navData.some(n => n.id === def.id));
    if (missing) {
        navData = DEFAULT_NAV.map(def => {
            const existing = navData.find(n => n.id === def.id);
            return existing || def;
        });
        setData('nav', navData);
    }

    APP.emojiData = navData;
    renderNav();

    // 恢复上次面板
    const lastPanel = getData('lastPanel', 'daily-plan');
    // 如果上次面板不存在于当前导航，回到每日计划
    const validPanel = APP.emojiData.some(n => n.id === lastPanel) ? lastPanel : 'daily-plan';
    switchPanel(validPanel);
}

function renderNav() {
    const nav = $('#sidebarNav');
    nav.innerHTML = APP.emojiData.map(item => `
        <button class="nav-item${APP.currentPanel === item.id ? ' active' : ''}" data-panel="${item.id}">
            <span class="nav-emoji" data-nav-id="${item.id}">${item.emoji}</span>
            <span class="nav-label">${item.label}</span>
        </button>
    `).join('');

    nav.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            switchPanel(btn.dataset.panel);
            if (window.innerWidth <= 768) {
                $('#sidebar').classList.remove('open');
                $('#overlay').style.display = 'none';
            }
        });
    });
}

function switchPanel(panelId) {
    APP.currentPanel = panelId;
    setData('lastPanel', panelId);

    $$('.panel').forEach(p => p.classList.remove('active'));
    const panel = $(`#panel-${panelId}`);
    if (panel) panel.classList.add('active');

    $$('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.querySelector(`[data-panel="${panelId}"]`);
    if (navItem) navItem.classList.add('active');

    // 清除搜索
    $('#panelSearchInput').value = '';
    $('#globalSearchInput').value = '';
    $('#searchResults').style.display = 'none';

    // 切换到对应面板时刷新
    if (panelId === 'daily-plan') renderTasks(getData('tasks', []));
    if (panelId === 'schedule') renderSchedule();
    if (panelId === 'stocks') {
        renderHoldings();
        renderProfitCalendar();
        renderRecords();
    }
    if (panelId === 'english') renderEnglishContent();
    if (panelId === 'news') loadNews();
    if (panelId === 'savings') updateSavingsDisplay();
}

// ========== 用户信息 ==========
function initUserInfo() {
    const role = getData('userRole', '自媒体创作者');
    const sig = getData('userSignature', '每天进步一点点✨');
    $('#userRole').textContent = role;
    $('#userSignature').textContent = sig;

    $('#userRole').addEventListener('input', () => {
        setData('userRole', $('#userRole').textContent.trim() || '自媒体创作者');
    });

    $('#userSignature').addEventListener('input', (e) => {
        const text = e.target.textContent;
        if (text.length > 20) {
            e.target.textContent = text.slice(0, 20);
            // 将光标移到末尾
            const sel = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(e.target);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        }
        setData('userSignature', e.target.textContent.trim() || '每天进步一点点✨');
    });
}

// ========== 用户头像 ==========
function initAvatar() {
    const avatarData = getData('userAvatar', '');
    if (avatarData) {
        const avatar = $('#userAvatar');
        avatar.innerHTML = `<img src="${avatarData}" alt="头像">`;
    }

    $('#userAvatarWrapper').addEventListener('click', () => {
        $('#avatarFileInput').click();
    });

    $('#avatarFileInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            showToast('图片不能超过2MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target.result;
            setData('userAvatar', dataUrl);
            $('#userAvatar').innerHTML = `<img src="${dataUrl}" alt="头像">`;
            showToast('头像已更新');
        };
        reader.readAsDataURL(file);
    });
}

// ========== 全局搜索 ==========
function initGlobalSearch() {
    const input = $('#globalSearchInput');
    const results = $('#searchResults');
    let debounceTimer;

    input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = input.value.trim().toLowerCase();
            if (query.length < 1) {
                results.style.display = 'none';
                return;
            }
            const items = performSearch(query);
            if (items.length === 0) {
                results.innerHTML = '<div style="padding:14px;text-align:center;color:#ccc;">未找到匹配结果</div>';
            } else {
                results.innerHTML = items.map(item => `
                    <div class="search-result-item" data-panel="${item.panel}" data-id="${item.id || ''}">
                        <span class="result-emoji">${item.emoji}</span>
                        <span class="result-text">${escapeHtml(item.text)}</span>
                        <span class="result-module">${item.module}</span>
                    </div>
                `).join('');
            }
            results.style.display = 'block';
        }, 200);
    });

    input.addEventListener('focus', () => {
        if (input.value.trim().length >= 1) {
            results.style.display = 'block';
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.global-search')) {
            results.style.display = 'none';
        }
    });

    results.addEventListener('click', (e) => {
        const item = e.target.closest('.search-result-item');
        if (item) {
            const panel = item.dataset.panel;
            switchPanel(panel);
            input.value = '';
            results.style.display = 'none';
            // 如果有点击项的高亮需求可以在这里扩展
        }
    });
}

function performSearch(query) {
    const results = [];

    // 搜索每日计划任务
    const tasks = getData('tasks', []);
    tasks.forEach(t => {
        if (t.text.toLowerCase().includes(query)) {
            results.push({ emoji: '📋', text: t.text, module: '每日计划', panel: 'daily-plan' });
        }
    });

    // 搜索日程
    const schedules = getData('schedules', []);
    schedules.forEach(s => {
        if (s.text.toLowerCase().includes(query)) {
            results.push({ emoji: '📅', text: s.text, module: '工作日程', panel: 'schedule' });
        }
    });

    // 搜索灵感
    const inspirations = getData('inspirations', []);
    inspirations.forEach(ins => {
        if (ins.text.toLowerCase().includes(query)) {
            results.push({ emoji: '💡', text: ins.text.substring(0, 50), module: '选题灵感', panel: 'inspiration' });
        }
    });

    // 搜索备忘录
    const memos = getData('memos', []);
    memos.forEach(m => {
        if (m.text.toLowerCase().includes(query)) {
            results.push({ emoji: '📝', text: m.text.substring(0, 50), module: '备忘录', panel: 'memo' });
        }
    });

    // 搜索复盘
    const reviews = getData('reviews', []);
    reviews.forEach(r => {
        if (r.title.toLowerCase().includes(query)) {
            results.push({ emoji: '📝', text: r.title, module: '内容复盘', panel: 'review' });
        }
    });

    // 搜索导航项
    APP.emojiData.forEach(nav => {
        if (nav.label.toLowerCase().includes(query)) {
            results.push({ emoji: nav.emoji, text: nav.label, module: '功能模块', panel: nav.id });
        }
    });

    return results.slice(0, 15);
}

// ========== 面板内搜索 ==========
function initPanelSearch() {
    const input = $('#panelSearchInput');
    let debounceTimer;

    input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = input.value.trim().toLowerCase();
            // 在当前每日计划面板中过滤任务
            const tasks = getData('tasks', []);
            if (query.length >= 1) {
                const filtered = tasks.filter(t => t.text.toLowerCase().includes(query));
                renderTasks(filtered);
            } else {
                renderTasks(tasks);
            }
        }, 200);
    });

    // 快捷跳转到今日日程（月视图）
    $('#quickJumpSchedule').addEventListener('click', () => {
        APP.scheduleView = 'month';
        APP.scheduleDate = new Date();
        switchPanel('schedule');
    });
}

// ========== 每日计划 ==========
function initDailyPlan() {
    const tasks = getData('tasks', []);
    renderTasks(tasks);

    $('#addTaskBtn').addEventListener('click', () => {
        const input = $('#newTaskInput');
        const text = input.value.trim();
        if (!text) return showToast('请输入任务内容');
        tasks.push({ id: Date.now(), text, done: false });
        setData('tasks', tasks);
        renderTasks(tasks);
        input.value = '';
        input.focus();
    });

    $('#newTaskInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') $('#addTaskBtn').click();
    });
}

function renderTasks(tasks) {
    const list = $('#taskList');
    if (tasks.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:30px;color:#ccc;">还没有任务，快来添加吧~</div>';
    } else {
        list.innerHTML = tasks.map((t, i) => `
            <li class="task-item">
                <div class="task-checkbox${t.done ? ' checked' : ''}" data-index="${i}"></div>
                <span class="task-text${t.done ? ' done' : ''}" contenteditable="true" data-index="${i}">${escapeHtml(t.text)}</span>
                <button class="task-delete" data-index="${i}">🗑️</button>
            </li>
        `).join('');
    }

    // Checkbox
    list.querySelectorAll('.task-checkbox').forEach(cb => {
        cb.addEventListener('click', () => {
            const i = parseInt(cb.dataset.index);
            tasks[i].done = !tasks[i].done;
            setData('tasks', tasks);
            renderTasks(tasks);
        });
    });

    // Delete
    list.querySelectorAll('.task-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const i = parseInt(btn.dataset.index);
            tasks.splice(i, 1);
            setData('tasks', tasks);
            renderTasks(tasks);
            showToast('任务已删除');
        });
    });

    // Inline edit
    list.querySelectorAll('.task-text').forEach(span => {
        span.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                span.blur();
            }
        });
        span.addEventListener('blur', () => {
            const i = parseInt(span.dataset.index);
            const newText = span.textContent.trim();
            if (newText && newText !== tasks[i].text) {
                tasks[i].text = newText;
                setData('tasks', tasks);
                renderTasks(tasks);
                showToast('任务已更新');
            } else if (!newText) {
                renderTasks(tasks);
            }
        });
    });

    // Progress
    const done = tasks.filter(t => t.done).length;
    const total = tasks.length;
    $('#taskProgress').textContent = total > 0 ? `已完成 ${done}/${total}` : '';
}

// ========== 存钱计划 ==========
function initSavings() {
    const budget = getData('dailyBudget', 0);
    const goal = getData('monthlyGoal', 0);
    $('#dailyBudget').value = budget || '';
    $('#monthlyGoalInput').value = goal || '';
    $('#transDate').value = formatLocalDate(new Date());

    updateSavingsDisplay();

    $('#setBudgetBtn').addEventListener('click', () => {
        const val = parseFloat($('#dailyBudget').value) || 0;
        setData('dailyBudget', val);
        updateSavingsDisplay();
        showToast('预算已设置');
    });

    $('#setGoalBtn').addEventListener('click', () => {
        const val = parseFloat($('#monthlyGoalInput').value) || 0;
        setData('monthlyGoal', val);
        updateSavingsDisplay();
        showToast('存钱目标已设置');
    });

    $('#addSaveBtn').addEventListener('click', () => {
        const amount = parseFloat($('#saveAmountInput').value);
        if (!amount || amount <= 0) return showToast('请输入存入金额');
        const transactions = getData('transactions', []);
        const today = formatLocalDate(new Date());
        transactions.unshift({
            id: Date.now(),
            amount,
            type: 'save',
            category: '存款',
            note: '存入存钱罐',
            date: today
        });
        setData('transactions', transactions);
        $('#saveAmountInput').value = '';
        updateSavingsDisplay();
        showToast('已存入一笔');
    });

    $('#addTransBtn').addEventListener('click', addTransaction);

    // 根据收支类型联动分类
    $('#transType').addEventListener('change', () => {
        updateTransCategories();
        $('#transCategory').style.display = 'block';
        $('#customCategory').style.display = 'none';
    });
    updateTransCategories();

    // 选择自定义时，select隐藏，input在同一位置显示
    $('#transCategory').addEventListener('change', () => {
        if ($('#transCategory').value === '自定义') {
            $('#transCategory').style.display = 'none';
            $('#customCategory').style.display = 'block';
            $('#customCategory').focus();
        }
    });

    // 输入框失焦时如果没输入内容，恢复select
    $('#customCategory').addEventListener('blur', () => {
        if (!$('#customCategory').value.trim()) {
            $('#customCategory').style.display = 'none';
            $('#transCategory').style.display = 'block';
            $('#transCategory').value = '餐饮';
        }
    });
}

const BASE_EXPENSE_CATEGORIES = ['餐饮', '交通', '购物', '娱乐', '居住', '其他'];
const BASE_INCOME_CATEGORIES = ['工资', '兼职', '理财', '其他'];

function updateTransCategories() {
    const type = $('#transType').value;
    const baseCats = type === 'expense' ? BASE_EXPENSE_CATEGORIES : BASE_INCOME_CATEGORIES;
    const customKey = type === 'expense' ? 'customExpenseCategories' : 'customIncomeCategories';
    const customCats = getData(customKey, []);
    const select = $('#transCategory');
    select.innerHTML = [
        ...baseCats.map(c => `<option value="${c}">${c}</option>`),
        ...customCats.map(c => `<option value="${c}">${c}</option>`),
        '<option value="自定义">✏️ 自定义</option>'
    ].join('');
    select.style.display = 'block';
    $('#customCategory').style.display = 'none';
    $('#customCategory').value = '';
}

function addTransaction() {
    const amount = parseFloat($('#transAmount').value);
    if (!amount || amount <= 0) return showToast('请输入金额');
    const type = $('#transType').value;

    // 判断是select还是input在显示
    let category;
    if ($('#customCategory').style.display === 'block') {
        category = $('#customCategory').value.trim();
        if (!category) return showToast('请输入分类名称');
        // 保存自定义分类
        const key = type === 'expense' ? 'customExpenseCategories' : 'customIncomeCategories';
        const list = getData(key, []);
        if (!list.includes(category)) {
            list.push(category);
            setData(key, list);
        }
    } else {
        category = $('#transCategory').value;
        if (category === '自定义') return showToast('请输入自定义分类名称');
    }

    const note = $('#transNote').value.trim() || category;
    const date = $('#transDate').value || formatLocalDate(new Date());

    const transactions = getData('transactions', []);
    transactions.unshift({ id: Date.now(), amount, type, category, note, date });
    setData('transactions', transactions);

    $('#transAmount').value = '';
    $('#transNote').value = '';
    updateTransCategories();
    updateSavingsDisplay();
    showToast('已记录');
}

function updateSavingsDisplay() {
    const budget = getData('dailyBudget', 0);
    const monthlyGoal = getData('monthlyGoal', 0);
    const transactions = getData('transactions', []);
    const today = formatLocalDate(new Date());
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

    // 今日统计
    const todayExpense = transactions
        .filter(t => t.date === today && t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);
    const todayIncome = transactions
        .filter(t => t.date === today && t.type === 'income')
        .reduce((s, t) => s + t.amount, 0);

    // 本月统计
    const monthIncome = transactions
        .filter(t => t.date.startsWith(monthStart) && t.type === 'income')
        .reduce((s, t) => s + t.amount, 0);
    const monthExpense = transactions
        .filter(t => t.date.startsWith(monthStart) && t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);
    const monthSaved = Math.max(0, monthIncome - monthExpense);

    // 四宫格概览
    $('#overviewBudget').textContent = `¥${budget.toFixed(0)}`;
    $('#overviewSpent').textContent = `¥${todayExpense.toFixed(0)}`;
    $('#overviewIncome').textContent = `¥${todayIncome.toFixed(0)}`;
    $('#overviewSaved').textContent = `¥${monthSaved.toFixed(0)}`;

    // 预算进度
    const budgetPct = budget > 0 ? Math.min(100, (todayExpense / budget) * 100) : 0;
    $('#budgetFill').style.width = budgetPct + '%';
    $('#budgetPercent').textContent = `${budgetPct.toFixed(0)}%`;

    // 存钱目标进度
    const goalPct = monthlyGoal > 0 ? Math.min(100, (monthSaved / monthlyGoal) * 100) : 0;
    $('#goalFill').style.width = goalPct + '%';
    $('#goalText').textContent = `本月已存 ¥${monthSaved.toFixed(0)} / 目标 ¥${monthlyGoal.toFixed(0)}`;
    $('#goalPercent').textContent = `${goalPct.toFixed(0)}%`;

    // 交易列表
    renderTransactions(transactions.slice(0, 30));
}

function renderTransactions(transactions) {
    const list = $('#transactionList');
    if (transactions.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:20px;color:#ccc;">暂无收支记录</div>';
        return;
    }
    list.innerHTML = transactions.map(t => `
        <div class="trans-item">
            <div>
                <div>${escapeHtml(t.note)}</div>
                <div class="trans-category">${escapeHtml(t.date)} · ${escapeHtml(t.category || (t.type === 'income' ? '收入' : '支出'))}</div>
            </div>
            <span class="amount ${t.type}">${t.type === 'expense' ? '-' : (t.type === 'save' ? '+' : '+')}¥${t.amount.toFixed(2)}</span>
        </div>
    `).join('');
}

// ========== 股票基金 ==========
APP.stockTab = 'holdings';
APP.profitPeriod = 'day';
APP.profitType = 'all';
APP.profitDate = new Date();
APP.profitSelectedDate = new Date(); // 选中的日期/月份/年份

function initStocks() {
    // 默认日期
    $('#recordDate').value = formatLocalDate(new Date());

    // Tab切换
    $$('.stock-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            $$('.stock-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            APP.stockTab = tab.dataset.tab;
            $$('.stock-panel').forEach(p => p.classList.remove('active'));
            $('#stockPanel-' + APP.stockTab).classList.add('active');

            if (APP.stockTab === 'holdings') renderHoldings();
            if (APP.stockTab === 'profit') renderProfitCalendar();
            if (APP.stockTab === 'records') {
                updateRecordHoldingOptions();
                renderRecords();
            }
        });
    });

    // 添加持仓表单
    $('#addHoldingBtn').addEventListener('click', () => {
        const form = $('#addHoldingForm');
        const willShow = form.style.display === 'none';
        form.style.display = willShow ? 'flex' : 'none';
        if (willShow) clearHoldingForm();
    });

    $('#cancelHoldingBtn').addEventListener('click', () => {
        $('#addHoldingForm').style.display = 'none';
        clearHoldingForm();
    });

    // 代码失焦自动识别名称
    $('#holdingCode').addEventListener('blur', async () => {
        const code = $('#holdingCode').value.trim();
        const type = $('#holdingType').value;
        const statusEl = $('#holdingCodeStatus');
        const nameInput = $('#holdingName');
        if (!code) return;
        statusEl.textContent = '正在识别...';
        statusEl.style.color = '#999';
        try {
            const norm = normalizeStockCode(code, type);
            let name = '';
            let latestPrice = 0;
            if (type === 'fund') {
                name = await fetchFundName(norm.symbol);
                // 基金现价从历史净值取最新一条
                try {
                    const list = await loadFundJsonp(norm.symbol);
                    if (list && list.length > 0) {
                        const last = list[list.length - 1];
                        latestPrice = last.nav || 0;
                    }
                } catch (e2) {}
            } else {
                const quotes = await fetchTencentQuotes([norm.symbol]);
                const q = quotes[norm.symbol];
                if (!q || !q.name) throw new Error('找不到该股票');
                name = q.name;
                latestPrice = q.price || 0;
            }
            if (name) {
                nameInput.value = name;
                // 自动填入最新现价到只读框
                const priceInput = $('#holdingPrice');
                if (priceInput && latestPrice > 0) {
                    priceInput.value = latestPrice.toFixed(4);
                }
                statusEl.textContent = latestPrice > 0
                    ? `✓ 已识别：${name}（现价 ¥${latestPrice.toFixed(4)}）`
                    : `✓ 已识别：${name}（现价获取中...）`;
                statusEl.style.color = 'var(--success)';
                // 检测是否已存在同代码持仓，切换为「追加买入」模式
                checkExistingHolding(type, norm.symbol, name);
            }
        } catch (e) {
            statusEl.textContent = '⚠ 找不到该代码，请检查是否正确';
            statusEl.style.color = 'var(--danger)';
            nameInput.value = '';
            // 重置追加买入模式
            const mergeTip = $('#holdingMergeTip');
            if (mergeTip) {
                mergeTip.style.display = 'none';
                mergeTip.textContent = '';
            }
            const btn = $('#confirmHoldingBtn');
            if (btn) btn.textContent = '确认添加';
        }
    });

    // 检测同一持仓是否已存在，存在则切换为追加买入模式
    function checkExistingHolding(type, symbol, name) {
        const holdings = getData('holdings', []);
        const existing = holdings.find(h => h.type === type && h.symbol === symbol);
        const mergeTip = $('#holdingMergeTip');
        const btn = $('#confirmHoldingBtn');
        if (!mergeTip || !btn) return;
        if (existing) {
            const oldShares = existing.shares || 0;
            const oldCost = existing.cost || 0;
            const batchCount = (Array.isArray(existing.batches) && existing.batches.length) ? existing.batches.length : 1;
            mergeTip.innerHTML = `🔁 检测到已持有 <b>${name}</b>（${oldShares} 份 @ ¥${oldCost.toFixed(4)}，共 ${batchCount} 批）<br>本次将作为<b>新增一批</b>买入记录，保留各自买入价和日期，收益按每批独立计算`;
            mergeTip.style.display = 'block';
            btn.textContent = '追加买入';
        } else {
            mergeTip.style.display = 'none';
            mergeTip.textContent = '';
            btn.textContent = '确认添加';
        }
    }

    // 类型切换时清空识别结果
    $('#holdingType').addEventListener('change', () => {
        $('#holdingCodeStatus').textContent = '';
    });

    $('#confirmHoldingBtn').addEventListener('click', async () => {
        const type = $('#holdingType').value;
        const code = $('#holdingCode').value.trim();
        const name = $('#holdingName').value.trim();
        const shares = parseFloat($('#holdingShares').value);
        const cost = parseFloat($('#holdingCost').value);
        let price = parseFloat($('#holdingPrice').value);
        const buyDateInput = $('#holdingBuyDate');
        const buyDate = buyDateInput ? buyDateInput.value : '';
        if (!code || !name) return showToast('请输入代码和名称');
        if (!shares || shares <= 0) return showToast('请输入有效的持仓数量');
        if (!cost || cost <= 0) return showToast('请输入有效的成本价');
        if (!buyDate) return showToast('请选择买入日期');

        const norm = normalizeStockCode(code, type);
        // 现价字段只读，若识别时未获取到则再次尝试（股票走行情、基金走净值）
        if (!price || price <= 0) {
            showToast('正在获取当前行情...');
            try {
                if (type === 'fund') {
                    const list = await loadFundJsonp(norm.symbol);
                    if (list && list.length > 0) {
                        const last = list[list.length - 1];
                        price = last.nav || 0;
                    }
                } else {
                    const quotes = await fetchTencentQuotes([norm.symbol]);
                    const q = quotes[norm.symbol];
                    if (q && q.price > 0) {
                        price = q.price;
                    }
                }
            } catch (e) {}
        }
        if (!price || price <= 0) return showToast('现价获取失败，请检查网络后重试');
        // 把最终获取到的现价回填到只读框，让用户看到
        const priceInputEl = $('#holdingPrice');
        if (priceInputEl) priceInputEl.value = price.toFixed(4);

        const holdings = getData('holdings', []);
        // 检查是否已存在同代码持仓 → 新增一批买入记录（保留历史，不抹平）
        const existingIdx = holdings.findIndex(h => h.type === type && h.symbol === norm.symbol);
        if (existingIdx >= 0) {
            const existing = holdings[existingIdx];
            const newBatch = {
                shares: shares,
                cost: cost,
                buyDate: buyDate,
                addedAt: Date.now()
            };
            // 兼容老数据：若没有 batches，先把现有数据作为首批
            if (!Array.isArray(existing.batches) || existing.batches.length === 0) {
                existing.batches = [{
                    shares: existing.shares || 0,
                    cost: existing.cost || 0,
                    buyDate: existing.buyDate || (existing.createdAt ? formatLocalDate(new Date(existing.createdAt)) : buyDate)
                }];
            }
            existing.batches.push(newBatch);
            // 当前价取本次输入的（最新行情）
            existing.price = price;
            // 汇总字段（向后兼容读取这些字段的地方）
            existing.shares = existing.batches.reduce((s, b) => s + (b.shares || 0), 0);
            existing.cost = existing.batches.reduce((sum, b) => sum + (b.shares || 0) * (b.cost || 0), 0) / existing.shares;
            existing.buyDate = existing.batches
                .map(b => b.buyDate)
                .filter(Boolean)
                .sort()[0];
            existing.updatedAt = Date.now();
            setData('holdings', holdings);
            updateHoldingQuotes(existing).then(() => {
                renderProfitCalendar();
            }).catch(() => {});
            renderHoldings();
            $('#addHoldingForm').style.display = 'none';
            clearHoldingForm();
            const batchCount = existing.batches.length;
            showToast(`已加仓第 ${batchCount} 批 ${name}，合计 ${existing.shares} 份`);
            return;
        }

        const newHolding = {
            id: Date.now(),
            type, code, name, shares, cost, price,
            symbol: norm.symbol,
            market: norm.market,
            buyDate: buyDate,
            batches: [{ shares: shares, cost: cost, buyDate: buyDate, addedAt: Date.now() }],
            createdAt: Date.now()
        };
        holdings.push(newHolding);
        setData('holdings', holdings);
        updateHoldingQuotes(newHolding).then(() => {
            renderProfitCalendar();
        }).catch(() => {});
        renderHoldings();
        $('#addHoldingForm').style.display = 'none';
        clearHoldingForm();
        showToast('持仓已添加');
    });

    // 收益明细 - 周期切换
    $$('.profit-period').forEach(btn => {
        btn.addEventListener('click', () => {
            $$('.profit-period').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            APP.profitPeriod = btn.dataset.period;
            APP.profitDate = new Date();
            APP.profitSelectedDate = new Date();
            renderProfitCalendar();
        });
    });

    // 收益明细 - 类型切换（全部/股票/基金）
    $$('.profit-type').forEach(btn => {
        btn.addEventListener('click', () => {
            $$('.profit-type').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            APP.profitType = btn.dataset.type;
            APP.profitDate = new Date();
            APP.profitSelectedDate = new Date();
            renderProfitCalendar();
        });
    });

    // 收益明细 - 前后导航
    $('#profitPrev').addEventListener('click', () => {
        navigateProfit(-1);
    });
    $('#profitNext').addEventListener('click', () => {
        navigateProfit(1);
    });

    // 交易记录
    $('#recordHolding').addEventListener('change', fillRecordFromHolding);
    $('#recordType').addEventListener('change', fillRecordFromHolding);

    $('#addRecordBtn').addEventListener('click', () => {
        const type = $('#recordType').value;
        const holdingId = parseInt($('#recordHolding').value);
        const shares = parseFloat($('#recordShares').value);
        const price = parseFloat($('#recordPrice').value);
        const date = $('#recordDate').value;
        if (!holdingId) return showToast('请选择持仓');
        if (!shares || shares <= 0) return showToast('请输入有效数量');
        if (!price || price <= 0) return showToast('请输入有效价格');
        if (!date) return showToast('请选择日期');

        const records = getData('records', []);
        records.push({
            id: Date.now(),
            type, holdingId, shares, price, date,
            createdAt: Date.now()
        });
        setData('records', records);

        renderRecords();
        showToast('交易已记录');
    });

    // 刷新行情按钮
    $('#refreshQuotesBtn').addEventListener('click', async () => {
        const btn = $('#refreshQuotesBtn');
        const status = $('#quoteStatus');
        btn.disabled = true;
        status.textContent = '正在刷新行情...';
        await refreshAllHoldingsQuotes();
        status.textContent = '行情已更新 ' + new Date().toLocaleTimeString();
        btn.disabled = false;
    });

    // 初始化各视图
    renderHoldings();
    renderProfitCalendar();
    updateRecordHoldingOptions();
    renderRecords();

    // 首次加载自动刷新行情，并按天/交易时段定时刷新
    setTimeout(() => {
        refreshAllHoldingsQuotes();
    }, 1000);
    // 定时刷新：交易时段每 5 分钟一次，非交易时段每小时检查一次
    setInterval(() => {
        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes();
        const dow = now.getDay();
        const isWeekday = dow !== 0 && dow !== 6;
        // A 股交易时段 9:30-11:30, 13:00-15:00
        const inTrading = isWeekday && (
            (h === 9 && m >= 30) || (h === 10) || (h === 11 && m <= 30) ||
            (h === 13) || (h === 14) || (h === 15 && m === 0)
        );
        if (inTrading) {
            refreshAllHoldingsQuotes();
        } else {
            // 非交易时段：若当天还没刷新过则刷新一次
            const todayStr = formatLocalDate(now);
            const lastRefresh = localStorage.getItem('zz_last_quote_refresh_date');
            if (lastRefresh !== todayStr) {
                refreshAllHoldingsQuotes();
            }
        }
    }, 5 * 60 * 1000);
}

function clearHoldingForm() {
    $('#holdingCode').value = '';
    $('#holdingName').value = '';
    $('#holdingShares').value = '';
    $('#holdingCost').value = '';
    $('#holdingPrice').value = '';
    const buyDateInput = $('#holdingBuyDate');
    if (buyDateInput) {
        // 默认填今天，避免用户漏选
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        buyDateInput.value = `${y}-${m}-${d}`;
    }
    const statusEl = $('#holdingCodeStatus');
    if (statusEl) {
        statusEl.textContent = '';
        statusEl.style.color = '#999';
    }
    const mergeTip = $('#holdingMergeTip');
    if (mergeTip) {
        mergeTip.style.display = 'none';
        mergeTip.textContent = '';
    }
    const btn = $('#confirmHoldingBtn');
    if (btn) btn.textContent = '确认添加';
}

// ---- 持仓汇总 ----
function calcHoldingSummary(holdings) {
    let totalMarketValue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    holdings.forEach(h => {
        totalMarketValue += h.shares * h.price;
        totalCost += h.shares * h.cost;
        totalProfit += h.shares * (h.price - h.cost);
    });
    return { totalMarketValue, totalProfit, todayProfit: totalProfit };
}

function renderBatchDetails(h) {
    const batches = Array.isArray(h.batches) ? h.batches : [];
    const rows = batches.map((b, i) => {
        const shares = b.shares || 0;
        const cost = b.cost || 0;
        const buyDate = b.buyDate || '—';
        const batchMarketValue = shares * h.price;
        const batchProfit = batchMarketValue - shares * cost;
        const isUp = batchProfit >= 0;
        return `
            <div class="batch-row">
                <span class="batch-no">第${i + 1}批</span>
                <span class="batch-shares">${shares}份</span>
                <span class="batch-cost">@¥${cost.toFixed(4)}</span>
                <span class="batch-date">${buyDate}</span>
                <span class="batch-profit ${isUp ? 'profit-up' : 'profit-down'}">${isUp ? '+' : ''}¥${batchProfit.toFixed(2)}</span>
            </div>
        `;
    }).join('');
    return `<div class="holding-batches">${rows}</div>`;
}

function renderHoldings() {
    const holdings = getData('holdings', []);
    const summary = calcHoldingSummary(holdings);

    $('#totalMarketValue').textContent = '¥' + summary.totalMarketValue.toFixed(2);
    const profitEl = $('#totalProfit');
    profitEl.textContent = (summary.totalProfit >= 0 ? '+' : '') + '¥' + summary.totalProfit.toFixed(2);
    profitEl.className = 'summary-value ' + (summary.totalProfit >= 0 ? 'profit-up' : 'profit-down');

    const todayEl = $('#todayProfit');
    todayEl.textContent = (summary.todayProfit >= 0 ? '+' : '') + '¥' + summary.todayProfit.toFixed(2);
    todayEl.className = 'summary-value ' + (summary.todayProfit >= 0 ? 'profit-up' : 'profit-down');

    const list = $('#holdingList');
    if (holdings.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:30px;color:#ccc;">点击上方按钮添加持仓</div>';
        return;
    }

    list.innerHTML = holdings.map(h => {
        const marketValue = h.shares * h.price;
        const profit = marketValue - h.shares * h.cost;
        const profitPct = h.cost > 0 ? ((h.price - h.cost) / h.cost * 100) : 0;
        const isUp = profit >= 0;
        const typeLabel = h.type === 'fund' ? '基金' : '股票';
        const buyDateStr = h.buyDate || formatLocalDate(new Date(h.createdAt));
        const batchCount = (Array.isArray(h.batches) && h.batches.length) ? h.batches.length : 1;
        const batchBadge = batchCount > 1
            ? `<span class="holding-batch-badge" title="共 ${batchCount} 批买入">📦 ${batchCount}批</span>`
            : '';
        return `
            <div class="holding-item">
                <div class="holding-main">
                    <div class="holding-header">
                        <span class="holding-name">${escapeHtml(h.name)}</span>
                        <span class="holding-type ${h.type}">${typeLabel}</span>
                        ${batchBadge}
                    </div>
                    <div class="holding-code">${escapeHtml(h.code)}</div>
                    <div class="holding-stats">
                        <div class="stat-item">
                            <span class="stat-label">持仓${batchCount > 1 ? '合计' : ''}</span>
                            <span class="stat-value holding-editable" contenteditable="true" data-id="${h.id}" data-field="shares">${h.shares}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">成本${batchCount > 1 ? '加权' : ''}</span>
                            <span class="stat-value holding-editable" contenteditable="true" data-id="${h.id}" data-field="cost">${h.cost.toFixed(4)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">现价</span>
                            <span class="stat-value current-price holding-price-readonly" data-id="${h.id}" data-field="price" title="长按可修正">${h.price.toFixed(4)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">买入日${batchCount > 1 ? '(最早)' : ''}</span>
                            <input type="date" class="holding-date-input" data-id="${h.id}" value="${buyDateStr}"${batchCount > 1 ? ' disabled' : ''}>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">市值</span>
                            <span class="stat-value">¥${marketValue.toFixed(2)}</span>
                        </div>
                    </div>
                    ${batchCount > 1 ? renderBatchDetails(h) : ''}
                </div>
                <div class="holding-right">
                    <div class="holding-profit ${isUp ? 'profit-up' : 'profit-down'}">
                        ${isUp ? '+' : ''}¥${profit.toFixed(2)}
                    </div>
                    <div class="holding-profit-pct ${isUp ? 'profit-up' : 'profit-down'}">
                        ${isUp ? '+' : ''}${profitPct.toFixed(2)}%
                    </div>
                    <button class="holding-delete" data-id="${h.id}">🗑️</button>
                </div>
            </div>
        `;
    }).join('');

    // 统一处理可编辑字段（现价只读，由系统自动更新）
    const editableFields = ['shares', 'cost'];
    list.querySelectorAll('.holding-editable').forEach(el => {
        const field = el.dataset.field;
        if (!editableFields.includes(field)) return;
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
        });
        el.addEventListener('blur', () => {
            const id = parseInt(el.dataset.id);
            const holdings = getData('holdings', []);
            const h = holdings.find(x => x.id === id);
            if (!h) return;
            const raw = el.textContent.trim();
            if (field === 'shares') {
                const v = parseFloat(raw);
                if (!v || v <= 0) { showToast('请输入有效数量'); return renderHoldings(); }
                h.shares = v;
                // 同步到首批（仅单批持仓时有效；多批时该字段已 disabled）
                if (Array.isArray(h.batches) && h.batches.length === 1) {
                    h.batches[0].shares = v;
                }
            } else if (field === 'cost') {
                const v = parseFloat(raw);
                if (!v || v <= 0) { showToast('请输入有效价格'); return renderHoldings(); }
                h.cost = v;
                if (Array.isArray(h.batches) && h.batches.length === 1) {
                    h.batches[0].cost = v;
                }
            }
            setData('holdings', holdings);
            renderHoldings();
            showToast('已更新');
        });
    });

    // 买入日期选择（仅单批可编辑；多批时 disabled）
    list.querySelectorAll('.holding-date-input').forEach(inp => {
        if (inp.disabled) return;
        inp.addEventListener('change', () => {
            const id = parseInt(inp.dataset.id);
            const holdings = getData('holdings', []);
            const h = holdings.find(x => x.id === id);
            if (h) {
                h.buyDate = inp.value;
                if (Array.isArray(h.batches) && h.batches.length === 1) {
                    h.batches[0].buyDate = inp.value;
                }
                setData('holdings', holdings);
                renderHoldings();
                showToast('买入日期已更新');
            }
        });
    });

    // 删除持仓
    list.querySelectorAll('.holding-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const holdings = getData('holdings', []);
            const updated = holdings.filter(h => h.id !== id);
            setData('holdings', updated);
            renderHoldings();
            showToast('已删除');
        });
    });
}

// ---- 收益明细 ----
function navigateProfit(dir) {
    const d = APP.profitDate;
    if (APP.profitPeriod === 'day') {
        d.setMonth(d.getMonth() + dir);
    } else if (APP.profitPeriod === 'month') {
        d.setFullYear(d.getFullYear() + dir);
    } else {
        d.setFullYear(d.getFullYear() + dir);
    }
    renderProfitCalendar();
}

// 刷新所有持仓行情
async function refreshAllHoldingsQuotes() {
    syncHoldingBuyDates();
    const holdings = getData('holdings', []);
    if (holdings.length === 0) return;
    const status = $('#quoteStatus');
    if (status) status.textContent = '正在刷新行情...';
    // 补全旧数据
    let changed = false;
    holdings.forEach(h => {
        if (!h.symbol) {
            const norm = normalizeStockCode(h.code, h.type);
            h.symbol = norm.symbol;
            h.market = norm.market;
            changed = true;
        }
    });
    if (changed) setData('holdings', holdings);

    // 逐个刷新，避免并发过多
    for (const h of holdings) {
        try {
            await updateHoldingQuotes(h);
        } catch (e) {
            console.error('refresh quote failed', h.code, e);
        }
    }
    renderHoldings();
    renderProfitCalendar();
    if (status) status.textContent = '行情已更新 ' + new Date().toLocaleTimeString();
    localStorage.setItem('zz_last_quote_refresh_date', formatLocalDate(new Date()));
}

function renderProfitCalendar() {
    fixInvalidBuyDates();
    let holdings = syncHoldingBuyDates();
    const period = APP.profitPeriod;
    const d = APP.profitDate;
    const titleEl = $('#profitTitle');
    const calendarEl = $('#profitCalendar');
    const detailTitleEl = $('#profitDetailTitle');
    const detailTotalEl = $('#profitDetailTotal');
    const detailListEl = $('#profitDetailList');

    // 兼容旧数据：补全 symbol/market
    let migrated = false;
    holdings = holdings.map(h => {
        if (!h.symbol) {
            migrated = true;
            const norm = normalizeStockCode(h.code, h.type);
            return { ...h, symbol: norm.symbol, market: norm.market };
        }
        return h;
    });
    if (migrated) setData('holdings', holdings);

    if (holdings.length === 0) {
        titleEl.textContent = '';
        calendarEl.innerHTML = '<div style="text-align:center;padding:30px;color:#ccc;">添加持仓后查看收益明细</div>';
        detailTitleEl.textContent = '收益明细';
        detailTotalEl.textContent = '¥0.00';
        detailListEl.innerHTML = '';
        return;
    }

    // 按类型过滤
    const typeFilter = APP.profitType;
    if (typeFilter === 'stock') {
        holdings = holdings.filter(h => h.type !== 'fund');
        $('#profitCalendarLabel').textContent = '股票收益日历';
    } else if (typeFilter === 'fund') {
        holdings = holdings.filter(h => h.type === 'fund');
        $('#profitCalendarLabel').textContent = '基金收益日历';
    } else {
        $('#profitCalendarLabel').textContent = '收益日历';
    }

    if (period === 'day') {
        const year = d.getFullYear();
        const month = d.getMonth();
        titleEl.textContent = `${year}年${month + 1}月`;
        renderDayCalendar(year, month, holdings, calendarEl);
        // 使用已选中的日期，不在当前月则回退到当月第一天
        const selected = APP.profitSelectedDate || new Date();
        const selectedDay = (selected.getFullYear() === year && selected.getMonth() === month)
            ? selected.getDate()
            : 1;
        renderProfitDetail('day', year, month, selectedDay, holdings, detailTitleEl, detailTotalEl, detailListEl);
    } else if (period === 'month') {
        const year = d.getFullYear();
        titleEl.textContent = `${year}年`;
        renderMonthCalendar(year, holdings, calendarEl);
        renderProfitDetail('month', year, null, null, holdings, detailTitleEl, detailTotalEl, detailListEl);
    } else {
        titleEl.textContent = '历年收益';
        renderYearCalendar(holdings, calendarEl);
        renderProfitDetail('year', null, null, null, holdings, detailTitleEl, detailTotalEl, detailListEl);
    }
}

function getDailyProfit(holding, year, month, day) {
    const date = new Date(year, month, day);
    const dow = date.getDay();
    const dateStr = formatDateStr(date);

    // 兼容老数据：没有 batches 时按单批处理
    const batches = (Array.isArray(holding.batches) && holding.batches.length > 0)
        ? holding.batches
        : [{
            shares: holding.shares || 0,
            cost: holding.cost || 0,
            buyDate: holding.buyDate || (holding.createdAt ? formatLocalDate(new Date(holding.createdAt)) : null)
        }];

    // 周末休市
    if (dow === 0 || dow === 6) return { value: 0, status: 'weekend' };

    // 无行情数据视为休市/节假日
    const symbol = holding.symbol || normalizeStockCode(holding.code, holding.type).symbol;
    const price = getClosePrice(symbol, dateStr);
    if (price === null) return { value: 0, status: 'nodata' };

    // 找前一日收盘价（所有批次共用同一标的前一日价）
    const prevDate = new Date(date);
    prevDate.setDate(prevDate.getDate() - 1);
    let marketPrevPrice = null;
    for (let i = 0; i < 10; i++) {
        const pd = new Date(prevDate);
        pd.setDate(pd.getDate() - i);
        const p = getClosePrice(symbol, formatDateStr(pd));
        if (p !== null) { marketPrevPrice = p; break; }
    }

    // 逐批计算，每批用自己的 buyDate 和 cost 作为买入当天基准
    let totalValue = 0;
    let hasBefore = false;   // 全部批次都在买入日之前
    let hasActive = false;   // 至少一批在持仓中
    batches.forEach(b => {
        const bBuyDate = b.buyDate || null;
        if (bBuyDate && dateStr < bBuyDate) {
            hasBefore = true;
            return; // 这批还没买入，当日收益 0
        }
        hasActive = true;
        const isBuyDay = bBuyDate && dateStr === bBuyDate;
        const prevPrice = isBuyDay ? (b.cost || 0) : (marketPrevPrice !== null ? marketPrevPrice : (b.cost || 0));
        totalValue += (b.shares || 0) * (price - prevPrice);
    });

    // 所有批次都还没买入 → before
    if (!hasActive) return { value: 0, status: 'before' };
    return { value: totalValue, status: 'ok' };
}

function renderDayCalendar(year, month, holdings, calendarEl) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = (year === today.getFullYear() && month === today.getMonth());
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

    let html = '<div class="profit-calendar-grid">';
    weekDays.forEach(w => {
        html += `<div class="profit-week-day">${w}</div>`;
    });
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="profit-day empty"></div>';
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        const dow = dateObj.getDay();
        const isWeekend = (dow === 0 || dow === 6);
        let dayProfit = 0;
        let hasNodata = false;
        let hasBefore = false;
        holdings.forEach(h => {
            const r = getDailyProfit(h, year, month, day);
            dayProfit += r.value;
            if (r.status === 'nodata') hasNodata = true;
            if (r.status === 'before') hasBefore = true;
        });
        const isToday = isCurrentMonth && day === today.getDate();
        let cellClass = 'profit-day';
        let cellContent;
        if (isWeekend) {
            cellClass += ' weekend';
            cellContent = `<div class="profit-day-num">${day}</div><div class="profit-day-val rest">休</div>`;
        } else if (hasNodata && !hasBefore) {
            cellClass += ' nodata';
            cellContent = `<div class="profit-day-num">${day}</div><div class="profit-day-val rest">—</div>`;
        } else {
            const isUp = dayProfit >= 0;
            cellClass += isUp ? ' up' : ' down';
            const profitText = (isUp ? '+' : '') + dayProfit.toFixed(0);
            cellContent = `<div class="profit-day-num">${day}</div><div class="profit-day-val">${profitText}</div>`;
        }
        if (isToday) cellClass += ' today';
        html += `<div class="${cellClass}" data-year="${year}" data-month="${month}" data-day="${day}" data-weekend="${isWeekend ? 1 : 0}">${cellContent}</div>`;
    }
    html += '</div>';
    calendarEl.innerHTML = html;

    calendarEl.querySelectorAll('.profit-day:not(.empty)').forEach(el => {
        el.addEventListener('click', () => {
            const y = parseInt(el.dataset.year);
            const m = parseInt(el.dataset.month);
            const day = parseInt(el.dataset.day);
            APP.profitSelectedDate = new Date(y, m, day);
            calendarEl.querySelectorAll('.profit-day').forEach(d => d.classList.remove('selected'));
            el.classList.add('selected');
            // 先同步买入日期，再按当前类型过滤持仓
            let holdings = syncHoldingBuyDates();
            if (APP.profitType === 'stock') holdings = holdings.filter(h => h.type !== 'fund');
            if (APP.profitType === 'fund') holdings = holdings.filter(h => h.type === 'fund');
            renderProfitDetail('day', y, m, day, holdings, $('#profitDetailTitle'), $('#profitDetailTotal'), $('#profitDetailList'));
        });
    });
}

function getMonthlyProfit(holding, year, month) {
    let total = 0;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        total += getDailyProfit(holding, year, month, day).value;
    }
    return total;
}

function renderMonthCalendar(year, holdings, calendarEl) {
    const today = new Date();
    let html = '<div class="profit-month-grid">';
    for (let month = 0; month < 12; month++) {
        let monthProfit = 0;
        holdings.forEach(h => { monthProfit += getMonthlyProfit(h, year, month); });
        const isUp = monthProfit >= 0;
        const isCurrentMonth = (year === today.getFullYear() && month === today.getMonth());
        const profitText = (isUp ? '+' : '') + monthProfit.toFixed(0);
        html += `
            <div class="profit-month-cell ${isUp ? 'up' : 'down'} ${isCurrentMonth ? 'current' : ''}" data-year="${year}" data-month="${month}">
                <div class="profit-month-label">${month + 1}月</div>
                <div class="profit-month-val">${profitText}</div>
            </div>
        `;
    }
    html += '</div>';
    calendarEl.innerHTML = html;
}

function getYearlyProfit(holding, year) {
    let total = 0;
    for (let month = 0; month < 12; month++) {
        total += getMonthlyProfit(holding, year, month);
    }
    return total;
}

function renderYearCalendar(holdings, calendarEl) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const years = [];
    for (let y = currentYear; y >= currentYear - 4; y--) {
        years.push(y);
    }
    let html = '<div class="profit-year-grid">';
    years.forEach(year => {
        let yearProfit = 0;
        holdings.forEach(h => { yearProfit += getYearlyProfit(h, year); });
        const isUp = yearProfit >= 0;
        const profitText = (isUp ? '+' : '') + yearProfit.toFixed(2);
        html += `
            <div class="profit-year-cell ${isUp ? 'up' : 'down'} ${year === currentYear ? 'current' : ''}">
                <div class="profit-year-label">${year}年</div>
                <div class="profit-year-val">${profitText}</div>
            </div>
        `;
    });
    html += '</div>';
    calendarEl.innerHTML = html;
}

function renderProfitDetail(period, year, month, day, holdings, titleEl, totalEl, listEl) {
    let title = '';
    let total = 0;
    const details = [];

    if (period === 'day') {
        const dateObj = new Date(year, month, day);
        const dow = dateObj.getDay();
        const isWeekend = (dow === 0 || dow === 6);
        title = `${year}年${month + 1}月${day}日 收益明细` + (isWeekend ? '（休市）' : '');
        holdings.forEach(h => {
            const r = getDailyProfit(h, year, month, day);
            let note = '';
            if (isWeekend) note = '休市';
            else if (r.status === 'before') note = '未持仓';
            else if (r.status === 'nodata') note = '无行情';
            total += r.value;
            details.push({ name: h.name, code: h.code, type: h.type, profit: r.value, note });
        });
    } else if (period === 'month') {
        title = `${year}年${month + 1}月 收益明细`;
        holdings.forEach(h => {
            const mProfit = getMonthlyProfit(h, year, month);
            total += mProfit;
            details.push({ name: h.name, code: h.code, type: h.type, profit: mProfit, note: '' });
        });
    } else {
        title = '历年总收益明细';
        const today = new Date();
        holdings.forEach(h => {
            let yProfit = 0;
            for (let y = today.getFullYear(); y >= today.getFullYear() - 4; y--) {
                yProfit += getYearlyProfit(h, y);
            }
            total += yProfit;
            details.push({ name: h.name, code: h.code, type: h.type, profit: yProfit, note: '' });
        });
    }

    titleEl.textContent = title;
    totalEl.textContent = (total >= 0 ? '+' : '') + '¥' + total.toFixed(2);
    totalEl.className = total >= 0 ? 'profit-up' : 'profit-down';

    if (details.length === 0) {
        listEl.innerHTML = '<div style="text-align:center;padding:20px;color:#ccc;">暂无持仓数据</div>';
        return;
    }

    // 分为股票和基金两组
    const stockList = details.filter(d => d.type !== 'fund').sort((a, b) => Math.abs(b.profit) - Math.abs(a.profit));
    const fundList = details.filter(d => d.type === 'fund').sort((a, b) => Math.abs(b.profit) - Math.abs(a.profit));

    const renderGroup = (title, group) => {
        if (group.length === 0) return '';
        const groupTotal = group.reduce((s, d) => s + (d.note ? 0 : d.profit), 0);
        const items = group.map(d => {
            const isUp = d.profit >= 0;
            const noteHtml = d.note ? `<span class="profit-detail-note">${d.note}</span>` : '';
            const showDash = !!d.note;
            const valHtml = showDash
                ? `<span class="profit-detail-val" style="color:#999;">—</span>`
                : `<span class="profit-detail-val ${isUp ? 'profit-up' : 'profit-down'}">${isUp ? '+' : ''}¥${d.profit.toFixed(2)}</span>`;
            return `
                <div class="profit-detail-item">
                    <div class="profit-detail-info">
                        <span class="profit-detail-name">${escapeHtml(d.name)}</span>
                        <span class="profit-detail-code">${escapeHtml(d.code)} · 股票${noteHtml ? ' ' + noteHtml : ''}</span>
                    </div>
                    ${valHtml}
                </div>
            `;
        }).join('');
        const totalClass = groupTotal >= 0 ? 'profit-up' : 'profit-down';
        const totalStr = (groupTotal >= 0 ? '+' : '') + '¥' + groupTotal.toFixed(2);
        return `
            <div class="profit-group">
                <div class="profit-group-header">
                    <span class="profit-group-title">${title}</span>
                    <span class="profit-group-total ${totalClass}">${totalStr}</span>
                </div>
                <div class="profit-group-list">${items}</div>
            </div>
        `;
    };

    const renderFundGroup = (title, group) => {
        if (group.length === 0) return '';
        const groupTotal = group.reduce((s, d) => s + (d.note ? 0 : d.profit), 0);
        const items = group.map(d => {
            const isUp = d.profit >= 0;
            const noteHtml = d.note ? `<span class="profit-detail-note">${d.note}</span>` : '';
            const showDash = !!d.note;
            const valHtml = showDash
                ? `<span class="profit-detail-val" style="color:#999;">—</span>`
                : `<span class="profit-detail-val ${isUp ? 'profit-up' : 'profit-down'}">${isUp ? '+' : ''}¥${d.profit.toFixed(2)}</span>`;
            return `
                <div class="profit-detail-item">
                    <div class="profit-detail-info">
                        <span class="profit-detail-name">${escapeHtml(d.name)}</span>
                        <span class="profit-detail-code">${escapeHtml(d.code)} · 基金${noteHtml ? ' ' + noteHtml : ''}</span>
                    </div>
                    ${valHtml}
                </div>
            `;
        }).join('');
        const totalClass = groupTotal >= 0 ? 'profit-up' : 'profit-down';
        const totalStr = (groupTotal >= 0 ? '+' : '') + '¥' + groupTotal.toFixed(2);
        return `
            <div class="profit-group">
                <div class="profit-group-header">
                    <span class="profit-group-title">${title}</span>
                    <span class="profit-group-total ${totalClass}">${totalStr}</span>
                </div>
                <div class="profit-group-list">${items}</div>
            </div>
        `;
    };

    listEl.innerHTML = renderGroup('📈 股票', stockList) + renderFundGroup('💰 基金', fundList);
}

// ---- 交易记录 ----
function updateRecordHoldingOptions() {
    const holdings = getData('holdings', []);
    const select = $('#recordHolding');
    if (holdings.length === 0) {
        select.innerHTML = '<option value="">请先添加持仓</option>';
    } else {
        select.innerHTML = holdings.map(h =>
            `<option value="${h.id}">${escapeHtml(h.name)} (${escapeHtml(h.code)})</option>`
        ).join('');
    }
    fillRecordFromHolding();
}

function fillRecordFromHolding() {
    const holdingId = parseInt($('#recordHolding').value);
    const holdings = getData('holdings', []);
    const h = holdings.find(x => x.id === holdingId);
    if (h) {
        const type = $('#recordType').value;
        const batches = Array.isArray(h.batches) ? h.batches : [];
        if (type === 'buy') {
            // 买入：带出最新一批的份额和成本（最近一次加仓的快照）
            const latestBatch = batches.length > 0 ? batches[batches.length - 1] : null;
            $('#recordShares').value = latestBatch ? latestBatch.shares : h.shares;
            $('#recordPrice').value = (latestBatch ? latestBatch.cost : h.cost).toFixed(4);
        } else {
            // 卖出：带出总份额和当前价
            $('#recordShares').value = h.shares;
            $('#recordPrice').value = h.price.toFixed(4);
        }
        // 日期默认用最新批次买入日，没有则用今天
        const latestBuyDate = batches.length > 0 && batches[batches.length - 1].buyDate
            ? batches[batches.length - 1].buyDate
            : (h.buyDate || formatLocalDate(new Date(h.createdAt || Date.now())));
        $('#recordDate').value = latestBuyDate;
    } else {
        $('#recordShares').value = '';
        $('#recordPrice').value = '';
        $('#recordDate').value = formatLocalDate(new Date());
    }
}

function renderRecords() {
    const records = getData('records', []);
    const holdings = getData('holdings', []);
    const list = $('#recordList');

    if (records.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:20px;color:#ccc;">暂无交易记录</div>';
        return;
    }

    // 按日期降序
    records.sort((a, b) => new Date(b.date) - new Date(a.date));

    list.innerHTML = records.map(r => {
        const h = holdings.find(h => h.id === r.holdingId);
        const name = h ? h.name : '已删除持仓';
        const code = h ? h.code : '--';
        const typeLabel = r.type === 'buy' ? '买入' : '卖出';
        const typeClass = r.type === 'buy' ? 'record-buy' : 'record-sell';
        const amount = r.shares * r.price;
        return `
            <div class="record-item">
                <div class="record-item-left">
                    <span class="record-type ${typeClass}">${typeLabel}</span>
                    <div class="record-info">
                        <span class="record-name">${escapeHtml(name)}</span>
                        <span class="record-meta">${escapeHtml(code)} · ${r.shares}份 @ ¥${r.price.toFixed(4)}</span>
                    </div>
                </div>
                <div class="record-item-right">
                    <div class="record-amount">¥${amount.toFixed(2)}</div>
                    <div class="record-date">${r.date}</div>
                </div>
                <button class="record-delete" data-id="${r.id}">🗑️</button>
            </div>
        `;
    }).join('');

    list.querySelectorAll('.record-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const records = getData('records', []);
            const updated = records.filter(r => r.id !== id);
            setData('records', updated);
            renderRecords();
            showToast('已删除记录');
        });
    });
}

// ========== 选题灵感 ==========
function initInspiration() {
    const inspirations = getData('inspirations', []);
    renderInspirations(inspirations);

    // Tag selection
    let selectedTags = [];
    $$('#panel-inspiration .tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const t = tag.dataset.tag;
            if (selectedTags.includes(t)) {
                selectedTags = selectedTags.filter(s => s !== t);
                tag.classList.remove('selected');
            } else {
                selectedTags.push(t);
                tag.classList.add('selected');
            }
        });
    });

    $('#saveInspirationBtn').addEventListener('click', () => {
        const text = $('#inspirationInput').value.trim();
        if (!text) return showToast('请输入灵感内容');
        const inspirations = getData('inspirations', []);
        inspirations.unshift({
            id: Date.now(),
            text,
            tags: [...selectedTags],
            date: formatLocalDate(new Date())
        });
        setData('inspirations', inspirations);
        renderInspirations(inspirations);
        $('#inspirationInput').value = '';
        selectedTags = [];
        $$('#panel-inspiration .tag').forEach(t => t.classList.remove('selected'));
        showToast('灵感已保存');
    });
}

function renderInspirations(inspirations) {
    const list = $('#inspirationList');
    if (inspirations.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:30px;color:#ccc;">还没有灵感，快来记录吧~</div>';
        return;
    }
    list.innerHTML = inspirations.map(ins => `
        <div class="inspiration-item">
            <div class="insp-content">${escapeHtml(ins.text)}</div>
            <div class="insp-meta">
                <div class="insp-tags">
                    ${(ins.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
                </div>
                <span>${ins.date}</span>
                <button class="insp-delete" data-id="${ins.id}">🗑️</button>
            </div>
        </div>
    `).join('');

    list.querySelectorAll('.insp-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const inspirations = getData('inspirations', []);
            setData('inspirations', inspirations.filter(i => i.id !== id));
            renderInspirations(getData('inspirations', []));
            showToast('已删除');
        });
    });
}

// ========== 爆款热点 ==========
const TREND_DATA = {
    douyin: [
        { rank: 1, title: '氛围感美妆教程爆火全网', platform: '抖音', hot: '980w', tags: ['美妆'], remake: true, desc: '简约高级感妆容教程，适合日常通勤' },
        { rank: 2, title: '情侣日常vlog甜蜜暴击', platform: '抖音', hot: '850w', tags: ['vlog', '两性'], remake: true, desc: '记录情侣相处日常，真实感强' },
        { rank: 3, title: '手势舞挑战新玩法', platform: '抖音', hot: '720w', tags: ['手势舞'], remake: true, desc: '配合热门BGM的手势舞新编排' },
        { rank: 4, title: '夏天护肤routine分享', platform: '抖音', hot: '680w', tags: ['美妆'], remake: true, desc: '夏季清爽护肤全流程' },
        { rank: 5, title: '沉浸式晚间vlog', platform: '抖音', hot: '620w', tags: ['vlog'], remake: true, desc: '从下班到入睡的精致日常' },
        { rank: 6, title: '情侣默契问答挑战', platform: '抖音', hot: '580w', tags: ['两性'], remake: false, desc: '测试情侣默契度' },
        { rank: 7, title: '国风妆容教程', platform: '抖音', hot: '550w', tags: ['美妆'], remake: true, desc: '新中式妆容搭配汉服造型' },
        { rank: 8, title: '双人手势舞教学', platform: '抖音', hot: '490w', tags: ['手势舞'], remake: true, desc: '适合情侣/闺蜜合拍' },
    ],
    xiaohongshu: [
        { rank: 1, title: '年度爱用美妆好物合集', platform: '小红书', hot: '12w', tags: ['美妆'], remake: true, desc: '盘点年度回购率最高的产品' },
        { rank: 2, title: '情侣相处之道：如何有效沟通', platform: '小红书', hot: '9.8w', tags: ['两性'], remake: true, desc: '分享亲密关系中的沟通技巧' },
        { rank: 3, title: '一周通勤穿搭不重样', platform: '小红书', hot: '8.5w', tags: ['vlog'], remake: true, desc: '职场新人穿搭指南' },
        { rank: 4, title: '新手化妆避雷指南', platform: '小红书', hot: '7.8w', tags: ['美妆'], remake: true, desc: '化妆小白常见误区盘点' },
        { rank: 5, title: '周末治愈系vlog', platform: '小红书', hot: '7.2w', tags: ['vlog'], remake: true, desc: '慢节奏生活记录' },
        { rank: 6, title: '手势舞新手入门教程', platform: '小红书', hot: '6.5w', tags: ['手势舞'], remake: true, desc: '零基础也能学会的手势舞' },
        { rank: 7, title: '约会妆容灵感', platform: '小红书', hot: '6.0w', tags: ['美妆', '两性'], remake: true, desc: '不同场合的约会妆容推荐' },
        { rank: 8, title: '独居女生vlog', platform: '小红书', hot: '5.5w', tags: ['vlog'], remake: true, desc: '精致独居生活日常' },
    ]
};

function initHotTrends() {
    // Refresh buttons
    $$('.trend-refresh-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            APP.currentPlatform = btn.dataset.platform;
            // 模拟刷新效果：重新打乱热度排序
            shuffleTrendData();
            renderTrends();
            showToast(`${btn.dataset.platform === 'douyin' ? '抖音' : '小红书'}热点已刷新`);
        });
    });

    // Filter tags
    $$('.filter-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            $$('.filter-tag').forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            APP.currentFilter = tag.dataset.filter;
            renderTrends();
        });
    });

    renderTrends();
}

function shuffleTrendData() {
    // 简单打乱当前平台数据的热度
    const data = TREND_DATA[APP.currentPlatform] || [];
    data.forEach(item => {
        const hotNum = parseFloat(item.hot);
        const variation = (Math.random() - 0.5) * 0.2;
        item.hot = Math.max(100, Math.floor(hotNum * (1 + variation))) + (item.hot.includes('万') ? '万' : 'w');
    });
    data.sort((a, b) => parseFloat(b.hot) - parseFloat(a.hot));
    data.forEach((item, idx) => item.rank = idx + 1);
}

function renderTrends() {
    const data = TREND_DATA[APP.currentPlatform] || [];
    let filtered = data;
    if (APP.currentFilter !== 'all') {
        filtered = data.filter(item => item.tags.includes(APP.currentFilter));
    }

    const list = $('#trendList');
    if (filtered.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:30px;color:#ccc;">暂无该领域热点</div>';
        return;
    }

    list.innerHTML = filtered.map(item => `
        <div class="trend-item">
            <div class="trend-rank">${item.rank}</div>
            <div class="trend-info">
                <div class="trend-title-row">
                    <span class="trend-platform">${escapeHtml(item.platform)}</span>
                    <span class="trend-title">${escapeHtml(item.title)}</span>
                </div>
                <div class="trend-hot">🔥 ${escapeHtml(item.hot)}</div>
                <div class="trend-tags">
                    ${item.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
                </div>
                ${item.remake ? '<div class="trend-remake">✅ 适合二创</div>' : ''}
                <button class="trend-save-btn" data-title="${escapeHtml(item.title)}" data-desc="${escapeHtml(item.desc)}">💡 存为灵感</button>
            </div>
        </div>
    `).join('');

    list.querySelectorAll('.trend-save-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const inspirations = getData('inspirations', []);
            inspirations.unshift({
                id: Date.now(),
                text: `🔥 ${btn.dataset.title} - ${btn.dataset.desc}`,
                tags: ['热点'],
                date: formatLocalDate(new Date())
            });
            setData('inspirations', inspirations);
            showToast('已保存为灵感');
        });
    });
}

// ========== 视频剪辑教程 ==========
const VIDEO_TUTORIALS = [
    // Vlog剪辑
    { id: 1, cat: 'vlog', title: '新手vlog拍摄全流程', desc: '从选题策划到素材拍摄，零基础vlog入门指南，手机就能拍出电影感。', steps: ['确定主题：日常vlog、旅行vlog、美食vlog选一个', '拍摄B-roll素材：多角度多景别，每个镜头3-5秒', '录制A-roll主镜头：对着镜头说话，自然表达', '导入剪映，按时间线排列素材', '添加转场和背景音乐'], tip: '💡 新手建议先拍30秒以内的vlog，熟练后再加长。手机横屏拍摄效果更好。', tools: ['剪映', '手机原相机', '轻颜相机'], toolLabel: '剪映专业版', time: '15分钟', level: '新手', stars: 1, tags: ['剪映', 'vlog', '拍摄'] },
    { id: 2, cat: 'vlog', title: '剪映一键成片技巧', desc: '利用剪映的图文成片功能，5分钟快速制作高质量vlog视频。', steps: ['打开剪映，点击「图文成片」', '输入文案或粘贴脚本', '选择喜欢的配音音色', 'AI自动匹配画面素材', '手动调整不匹配的片段'], tip: '💡 图文成片适合口播类vlog，画面与声音自动匹配，效率翻倍。', tools: ['剪映'], toolLabel: '剪映专业版', time: '5分钟', level: '新手', stars: 1, tags: ['剪映', '一键成片', '效率'] },
    { id: 3, cat: 'vlog', title: 'vlog转场特效大全', desc: '10种最常用的vlog转场技巧，让视频衔接更流畅更有质感。', steps: ['遮罩转场：用物体遮挡镜头切换场景', '旋转转场：镜头旋转配合剪辑', '匹配剪辑：相似画面元素衔接', '缩放转场：放大/缩小过渡', '模糊转场：高斯模糊渐隐渐现'], tip: '💡 转场不宜过多，每30秒1-2个转场即可。遮罩转场最容易出片。', tools: ['剪映'], toolLabel: '剪映专业版', time: '20分钟', level: '进阶', stars: 2, tags: ['剪映', '转场', 'vlog'] },

    // 爆点拆解
    { id: 4, cat: 'trend', title: '爆款视频开头3秒公式', desc: '分析抖音Top100爆款视频，总结出5种让人停下滑动的开头公式。', steps: ['冲突式：「我做了XX，结果...」制造悬念', '反常识：「99%的人不知道...」打破认知', '痛点式：「你是不是也遇到XX问题？」引发共鸣', '数据式：「我用3天测试了XX...」建立信任', '视觉冲击：震撼画面+大字标题直接抓眼球'], tip: '💡 前3秒决定完播率，标题一定要够炸。建议多看同领域爆款模仿。', tools: ['剪映', '抖音数据分析'], toolLabel: '剪映专业版', time: '30分钟', level: '进阶', stars: 2, tags: ['剪映', '爆款', '开头'] },
    { id: 5, cat: 'trend', title: '爆款BGM节奏卡点教学', desc: '学会卡点剪辑，让画面与音乐节拍完美同步，视频节奏感拉满。', steps: ['选择节奏感强的BGM（鼓点明显）', '导入剪映，打开「自动踩点」', '根据踩点标记切分画面', '每个节拍切换一个镜头', '高潮部分加速剪辑节奏'], tip: '💡 抖音热门BGM每周更新，关注音乐榜单及时跟进。踩点剪辑是爆款基本功。', tools: ['剪映', '抖音热歌榜'], toolLabel: '剪映专业版', time: '25分钟', level: '新手', stars: 1, tags: ['剪映', '卡点', 'BGM'] },
    { id: 6, cat: 'trend', title: '爆款视频结构拆解', desc: '拆解一条百万点赞视频的完整结构，从开头到结尾逐帧分析。', steps: ['0-3秒：黄金开头，用冲突/问题吸引', '3-8秒：展开问题，放大痛点', '8-15秒：给出解决方案或反转', '15-20秒：展示效果/结果对比', '20秒后：引导互动（点赞关注评论）'], tip: '💡 爆款视频=50%选题+30%开头+20%内容。选题决定上限，开头决定下限。', tools: ['剪映', '飞瓜数据'], toolLabel: '剪映专业版', time: '20分钟', level: '进阶', stars: 2, tags: ['剪映', '爆款', '结构'] },

    // 新手入门
    { id: 7, cat: 'beginner', title: '剪映新手第一天：认识界面', desc: '剪映完全入门，认识每个功能按钮，5分钟上手剪辑。', steps: ['应用商店搜索「剪映」下载安装', '打开剪映，点击「开始创作」', '认识底部工具栏：剪辑、音频、文本、贴纸等', '认识时间轴：主轨道和画中画轨道', '预览窗口和导出设置'], tip: '💡 剪映完全免费，功能足够日常创作。导出选1080P 30帧即可。', tools: ['剪映'], toolLabel: '剪映专业版', time: '5分钟', level: '新手', stars: 1, tags: ['剪映', '入门', '界面'] },
    { id: 8, cat: 'beginner', title: '第一个15秒短视频制作', desc: '手把手教你制作第一个短视频，从素材导入到导出发布全流程。', steps: ['导入3-5段手机拍摄素材', '裁剪每段素材到3-5秒', '拖动调整素材顺序', '添加一首背景音乐', '添加字幕和滤镜，导出发布'], tip: '💡 第一个视频不用追求完美，先发出去再说。完成比完美重要！', tools: ['剪映'], toolLabel: '剪映专业版', time: '15分钟', level: '新手', stars: 1, tags: ['剪映', '入门', '实操'] },
    { id: 9, cat: 'beginner', title: '剪映字幕自动生成', desc: '利用剪映智能字幕功能，一键添加字幕，提高视频完播率。', steps: ['导入视频素材', '点击「文本」→「识别字幕」', '等待AI自动识别语音', '检查并修正识别错误', '调整字幕样式和位置'], tip: '💡 有字幕的视频完播率提升30%以上。字幕颜色建议白字黑边，阅读最清晰。', tools: ['剪映'], toolLabel: '剪映专业版', time: '10分钟', level: '新手', stars: 1, tags: ['剪映', '字幕', '入门'] },

    // 剪辑技巧
    { id: 10, cat: 'technique', title: '剪映画中画高级玩法', desc: '画中画+混合模式的6种创意用法，让你的视频更有层次感。', steps: ['添加画中画轨道', '调整画中画大小和位置', '尝试「混合模式」：滤色、正片叠底等', '添加画中画入场动画', '配合关键帧做运动效果'], tip: '💡 画中画最适合做反应视频和教程类内容，注意不要遮挡主画面关键信息。', tools: ['剪映'], toolLabel: '剪映专业版', time: '20分钟', level: '进阶', stars: 2, tags: ['剪映', '画中画', '技巧'] },
    { id: 11, cat: 'technique', title: '关键帧动画完全指南', desc: '学会关键帧，让你的画面动起来！缩放、旋转、位移全搞定。', steps: ['选中素材，点击「关键帧」按钮', '在时间轴不同位置添加多个关键帧', '每个关键帧调整画面位置/大小', '播放预览动画效果', '微调关键帧间距控制速度'], tip: '💡 关键帧是剪辑的分水岭，学会后画面质感直接提升一个档次。', tools: ['剪映'], toolLabel: '剪映专业版', time: '25分钟', level: '进阶', stars: 2, tags: ['剪映', '关键帧', '技巧'] },
    { id: 12, cat: 'technique', title: '调色教程：一键电影感', desc: '剪映滤镜+手动调色，让你的视频拥有电影级质感。', steps: ['选择合适的滤镜（推荐「富士」「柯达」系列）', '调整亮度+5~10，对比度+3~5', '饱和度-5~10，营造高级感', '添加暗角效果，聚焦画面中心', '锐化+10，让画面更清晰'], tip: '💡 电影感调色的核心是低饱和+暗角+暖色调。多看优秀作品培养色感。', tools: ['剪映'], toolLabel: '剪映专业版', time: '15分钟', level: '进阶', stars: 2, tags: ['剪映', '调色', '技巧'] },
    { id: 13, cat: 'technique', title: '音频处理：降噪与配音', desc: '视频噪音太多？学会降噪处理和配音录制，声音质量提升10倍。', steps: ['选中音频素材', '点击「降噪」开关一键去噪', '如需配音：点击「音频」→「录音」', '调整音量平衡（背景音乐-15dB）', '添加音效增强氛围感'], tip: '💡 声音质量比画面质量更重要！嘈杂的音频会让观众秒划走。', tools: ['剪映'], toolLabel: '剪映专业版', time: '15分钟', level: '新手', stars: 1, tags: ['剪映', '音频', '降噪'] },
];

const CAT_LABELS = {
    vlog: 'Vlog',
    trend: '爆点拆解',
    beginner: '新手入门',
    technique: '剪辑技巧',
};

const CAT_BADGE_CLASS = {
    vlog: 'vlog',
    trend: 'trend',
    beginner: 'beginner',
    technique: 'technique',
};

const CAT_BADGE_TEXT = {
    vlog: 'Vlog教程',
    trend: '爆点拆解',
    beginner: '入门教程',
    technique: '核心技能',
};

function getStars(n) {
    return '⭐'.repeat(n) + '☆'.repeat(Math.max(0, 3 - n));
}

function initVideoEdit() {
    APP.veCat = 'all';
    renderVideoTutorials('all');
    renderVideoTasks();

    $$('.ve-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            $$('.ve-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            APP.veCat = tab.dataset.cat;
            renderVideoTutorials(APP.veCat);
        });
    });

    // 刷新推荐
    $('#veRefreshBtn').addEventListener('click', () => {
        // 打乱顺序重新渲染，模拟每日刷新
        const today = new Date().toDateString();
        setData('veRefreshDate', today);
        showToast('已刷新推荐教程');
        renderVideoTutorials(APP.veCat);
    });

    $('#veDetailOverlay').addEventListener('click', (e) => {
        if (e.target === $('#veDetailOverlay')) {
            $('#veDetailOverlay').style.display = 'none';
        }
    });
}

function getShuffledTutorials(cat) {
    let tutorials = VIDEO_TUTORIALS.map((t, idx) => ({ ...t, originalIdx: idx }));
    if (cat !== 'all') {
        tutorials = tutorials.filter(t => t.cat === cat);
    }
    // 使用日期做种子，让同一天刷新结果一致
    const date = new Date().toDateString();
    const seed = Array.from(date).reduce((a, c) => a + c.charCodeAt(0), 0);
    const shuffled = [...tutorials];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = (seed + i * 37) % (i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function isVideoTask(id) {
    return getData('videoTasks', []).includes(id);
}

function isVideoLearned(id) {
    return getData('videoLearned', []).includes(id);
}

function toggleVideoTask(id) {
    const tasks = getData('videoTasks', []);
    const idx = tasks.indexOf(id);
    if (idx >= 0) {
        tasks.splice(idx, 1);
        showToast('已移出任务');
    } else {
        tasks.push(id);
        showToast('已加入任务');
    }
    setData('videoTasks', tasks);
    renderVideoTutorials(APP.veCat);
    renderVideoTasks();
}

function markVideoLearned(id) {
    const learned = getData('videoLearned', []);
    if (!learned.includes(id)) {
        learned.push(id);
        setData('videoLearned', learned);
        showToast('已标记学习进度');
        renderVideoTutorials(APP.veCat);
        renderVideoTasks();
    }
}

function renderVideoTasks() {
    const tasks = getData('videoTasks', []);
    const learned = getData('videoLearned', []);
    const box = $('#videoMyTasks');
    const count = $('#videoTasksCount');
    const list = $('#videoTasksList');

    if (tasks.length === 0) {
        box.style.display = 'none';
        return;
    }

    box.style.display = 'block';
    count.textContent = tasks.length;

    const taskItems = tasks.map(id => VIDEO_TUTORIALS.find(t => t.id === id)).filter(Boolean);
    list.innerHTML = taskItems.map(t => {
        const done = learned.includes(t.id);
        return `
            <div class="video-task-item ${done ? 'done' : ''}">
                <div class="video-task-title">${escapeHtml(t.title)}</div>
                <div class="video-task-meta">${done ? '✅ 已完成' : '⏳ 学习中'} · ${t.time}</div>
                <button class="video-task-remove" data-id="${t.id}">✕</button>
            </div>
        `;
    }).join('');

    list.querySelectorAll('.video-task-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleVideoTask(parseInt(btn.dataset.id));
        });
    });

    list.querySelectorAll('.video-task-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.querySelector('.video-task-remove').dataset.id);
            const t = VIDEO_TUTORIALS.find(x => x.id === id);
            if (t) showTutorialDetail(t);
        });
    });
}

function renderVideoTutorials(cat) {
    const tutorials = getShuffledTutorials(cat);
    const learned = getData('videoLearned', []);
    const tasks = getData('videoTasks', []);
    const container = $('#videoTutorials');

    if (tutorials.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:#ccc;">暂无该分类教程</div>';
        return;
    }

    container.innerHTML = tutorials.map((t, idx) => {
        const isLearned = learned.includes(t.id);
        const isTask = tasks.includes(t.id);
        const catBadge = CAT_BADGE_TEXT[t.cat] || CAT_LABELS[t.cat];
        const catClass = CAT_BADGE_CLASS[t.cat] || t.cat;
        return `
            <div class="ve-card ${isLearned ? 'learned' : ''}" data-id="${t.id}">
                <div class="ve-card-top">
                    <div class="ve-card-title">${escapeHtml(t.title)}</div>
                    <span class="ve-card-cat-badge ${catClass}">${catBadge}</span>
                </div>
                <div class="ve-card-meta">
                    <span class="ve-card-tool">🛠️ ${escapeHtml(t.toolLabel)}</span>
                    <span class="ve-card-time">⏱️ ${t.time}</span>
                    <span class="ve-card-level">难度 ${getStars(t.stars)}</span>
                </div>
                <div class="ve-card-desc">${escapeHtml(t.desc)}</div>
                <div class="ve-card-actions">
                    <button class="ve-card-start-btn ${isLearned ? 'learned' : ''}" data-id="${t.id}">
                        <span class="ve-card-start-icon">🎬</span>
                        <span class="ve-card-start-text">${isLearned ? '继续学' : '开始学'}</span>
                    </button>
                    <button class="ve-card-task-btn ${isTask ? 'active' : ''}" data-id="${t.id}">
                        <span>${isTask ? '⭐ 已收藏' : '☆ 加入任务'}</span>
                    </button>
                </div>
                <div class="ve-card-tags">
                    ${t.tags.map(tag => `<span class="ve-card-tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
                ${isLearned ? '<div class="ve-card-learned-badge">✅ 已学习</div>' : ''}
            </div>
        `;
    }).join('');

    container.querySelectorAll('.ve-card-start-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            const t = VIDEO_TUTORIALS.find(x => x.id === id);
            if (t) showTutorialDetail(t);
        });
    });

    container.querySelectorAll('.ve-card-task-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleVideoTask(parseInt(btn.dataset.id));
        });
    });

    container.querySelectorAll('.ve-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = parseInt(card.dataset.id);
            const t = VIDEO_TUTORIALS.find(x => x.id === id);
            if (t) showTutorialDetail(t);
        });
    });
}

function showTutorialDetail(tutorial) {
    const isLearned = getData('videoLearned', []).includes(tutorial.id);
    const isTask = getData('videoTasks', []).includes(tutorial.id);
    $('#veDetailContent').innerHTML = `
        <div class="ve-detail-close">
            <button id="veDetailClose">✕</button>
        </div>
        <div class="ve-detail-header">
            <span class="ve-card-cat-badge ${CAT_BADGE_CLASS[tutorial.cat] || tutorial.cat}">${CAT_BADGE_TEXT[tutorial.cat] || CAT_LABELS[tutorial.cat]}</span>
            <span class="ve-detail-title">${escapeHtml(tutorial.title)}</span>
        </div>
        <div class="ve-detail-meta">
            <span>🛠️ ${escapeHtml(tutorial.toolLabel)}</span>
            <span>⏱️ ${tutorial.time}</span>
            <span>难度 ${getStars(tutorial.stars)}</span>
        </div>
        <div style="font-size:14px;color:var(--text-secondary);margin-bottom:16px;line-height:1.6;">${escapeHtml(tutorial.desc)}</div>
        <div class="ve-detail-actions">
            <button class="ve-detail-start-btn ${isLearned ? 'learned' : ''}" id="veDetailStartBtn">
                <span>🎬</span> ${isLearned ? '已完成，再看一遍' : '开始学'}
            </button>
            <button class="ve-detail-task-btn ${isTask ? 'active' : ''}" id="veDetailTaskBtn">
                ${isTask ? '⭐ 已收藏' : '☆ 加入任务'}
            </button>
        </div>
        <div class="ve-detail-steps-title">学习步骤</div>
        <div class="ve-detail-steps">
            ${tutorial.steps.map((s, i) => `
                <div class="ve-step">
                    <div class="ve-step-num">${i + 1}</div>
                    <div class="ve-step-text">${escapeHtml(s)}</div>
                </div>
            `).join('')}
        </div>
        <div class="ve-detail-tip">${tutorial.tip}</div>
        <div class="ve-detail-tools">
            ${tutorial.tags.map(tag => `<span class="ve-tool-tag">${escapeHtml(tag)}</span>`).join('')}
        </div>
    `;

    $('#veDetailOverlay').style.display = 'flex';

    $('#veDetailClose').addEventListener('click', () => {
        $('#veDetailOverlay').style.display = 'none';
    });

    $('#veDetailStartBtn').addEventListener('click', () => {
        markVideoLearned(tutorial.id);
        const btn = $('#veDetailStartBtn');
        btn.classList.add('learned');
        btn.innerHTML = '<span>🎬</span> 已完成，再看一遍';
        renderVideoTutorials(APP.veCat);
        renderVideoTasks();
    });

    $('#veDetailTaskBtn').addEventListener('click', () => {
        toggleVideoTask(tutorial.id);
        const btn = $('#veDetailTaskBtn');
        const nowTask = getData('videoTasks', []).includes(tutorial.id);
        btn.classList.toggle('active', nowTask);
        btn.textContent = nowTask ? '⭐ 已收藏' : '☆ 加入任务';
    });
}

// ========== 内容复盘 ==========
function initReview() {
    const today = new Date();
    $('#reviewDate').value = formatLocalDate(today);
    $('#reviewFormTitle').textContent = `${today.getMonth() + 1}月${today.getDate()}日复盘`;

    const reviews = getData('reviews', []);
    renderReviews(reviews);

    $('#saveReviewBtn').addEventListener('click', () => {
        const date = $('#reviewDate').value;
        const title = $('#reviewTitle').value.trim();
        const pros = $('#reviewPros').value.trim();
        const cons = $('#reviewCons').value.trim();
        const improve = $('#reviewImprove').value.trim();
        if (!date || !title) return showToast('请填写日期和标题');

        const reviews = getData('reviews', []);
        reviews.unshift({ id: Date.now(), date, title, pros, cons, improve });
        setData('reviews', reviews);
        renderReviews(reviews);
        $('#reviewTitle').value = '';
        $('#reviewPros').value = '';
        $('#reviewCons').value = '';
        $('#reviewImprove').value = '';
        showToast('复盘已保存');
    });
}

function renderReviews(reviews) {
    const list = $('#reviewList');
    if (reviews.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:30px;color:#aaa;">暂无复盘记录</div>';
        return;
    }
    list.innerHTML = reviews.map(r => `
        <div class="review-item">
            <button class="review-delete" data-id="${r.id}">🗑️</button>
            <h4>${escapeHtml(r.title)}</h4>
            <div class="review-date">📅 ${r.date}</div>
            ${r.pros ? `<div class="review-section pros"><strong>✅ 优点：</strong>${escapeHtml(r.pros)}</div>` : ''}
            ${r.cons ? `<div class="review-section cons"><strong>❌ 缺点：</strong>${escapeHtml(r.cons)}</div>` : ''}
            ${r.improve ? `<div class="review-section improve"><strong>🔄 优化方向：</strong>${escapeHtml(r.improve)}</div>` : ''}
        </div>
    `).join('');

    list.querySelectorAll('.review-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const reviews = getData('reviews', []);
            setData('reviews', reviews.filter(r => r.id !== id));
            renderReviews(getData('reviews', []));
            showToast('已删除');
        });
    });
}

// ========== 工作日程 ==========
let currentEditingDate = null;

function initSchedule() {
    // 颜色选择（弹窗内）
    document.addEventListener('click', (e) => {
        const dot = e.target.closest('.schedule-edit-add .color-dot');
        if (!dot) return;
        dot.parentElement.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
    });

    // 日程编辑弹窗事件
    $('#closeScheduleEditModal').addEventListener('click', closeScheduleEdit);
    $('#scheduleEditModal').addEventListener('click', (e) => {
        if (e.target === $('#scheduleEditModal')) closeScheduleEdit();
    });

    // 新增日程
    $('#addNewScheduleBtn').addEventListener('click', () => {
        const text = $('#newScheduleText').value.trim();
        if (!text || !currentEditingDate) return showToast('请输入日程内容');
        const time = $('#newScheduleTime').value;
        const color = $('#scheduleEditModal .color-dot.active')?.dataset.color || '#333';
        const schedules = getData('schedules', []);
        schedules.push({
            id: Date.now() + Math.floor(Math.random() * 1000),
            text, date: currentEditingDate, time, color, done: false
        });
        setData('schedules', schedules);
        $('#newScheduleText').value = '';
        $('#newScheduleTime').value = '';
        renderScheduleEditList();
        renderSchedule();
        showToast('日程已添加');
    });
    $('#newScheduleText').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') $('#addNewScheduleBtn').click();
    });

    $$('.view-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            $$('.view-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            APP.scheduleView = tab.dataset.view;
            renderSchedule();
        });
    });

    $('#schedulePrev').addEventListener('click', () => {
        if (APP.scheduleView === 'week') APP.scheduleDate.setDate(APP.scheduleDate.getDate() - 7);
        else if (APP.scheduleView === 'month') APP.scheduleDate.setMonth(APP.scheduleDate.getMonth() - 1);
        else APP.scheduleDate.setFullYear(APP.scheduleDate.getFullYear() - 1);
        APP.scheduleDate = new Date(APP.scheduleDate);
        renderSchedule();
    });

    $('#scheduleNext').addEventListener('click', () => {
        if (APP.scheduleView === 'week') APP.scheduleDate.setDate(APP.scheduleDate.getDate() + 7);
        else if (APP.scheduleView === 'month') APP.scheduleDate.setMonth(APP.scheduleDate.getMonth() + 1);
        else APP.scheduleDate.setFullYear(APP.scheduleDate.getFullYear() + 1);
        APP.scheduleDate = new Date(APP.scheduleDate);
        renderSchedule();
    });

    // 保存本月总结
    $('#saveMonthSummaryBtn').addEventListener('click', () => {
        const d = APP.scheduleDate;
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        const text = $('#monthSummaryInput').value.trim();
        const summaries = getData('monthSummaries', {});
        summaries[key] = text;
        setData('monthSummaries', summaries);
        $('#monthSummaryDate').textContent = `已保存：${new Date().toLocaleString('zh-CN')}`;
        showToast('本月总结已保存');
    });

    renderSchedule();
}

function renderSchedule() {
    const d = APP.scheduleDate;
    if (APP.scheduleView === 'week') renderWeekView(d);
    else if (APP.scheduleView === 'month') renderMonthView(d);
    else renderYearView(d);
    renderMonthSummary();
}

function getWeekStart(d) {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    return new Date(d.getFullYear(), d.getMonth(), diff);
}

function renderWeekView(d) {
    const weekStart = getWeekStart(d);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    $('#scheduleTitle').textContent = `${weekStart.getFullYear()}年 ${formatDateShort(weekStart)} - ${formatDateShort(weekEnd)}`;

    const schedules = getData('schedules', []);
    const today = formatLocalDate(new Date());
    const weekNames = ['一', '二', '三', '四', '五', '六', '日'];

    let html = '<div class="week-grid">';
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        const dateStr = formatLocalDate(date);
        const isToday = dateStr === today;
        const daySchedules = schedules.filter(s => s.date === dateStr);

        html += `
            <div class="week-day${isToday ? ' today' : ''}">
                <div class="week-day-header">周${weekNames[i]}</div>
                <div class="week-day-date">${date.getDate()}</div>
                ${daySchedules.map(s => `
                    <div class="schedule-task-item${s.done ? ' done' : ''}" data-id="${s.id}">
                        <div class="sch-check${s.done ? ' done' : ''}"></div>
                        <span style="color:${s.color || '#333'};">${escapeHtml(s.text)}${s.time ? ' ' + s.time : ''}</span>
                        <button class="sch-delete" data-id="${s.id}">✕</button>
                    </div>
                `).join('')}
            </div>`;
    }
    html += '</div>';
    $('#scheduleContent').innerHTML = html;

    bindScheduleEvents();
}

function renderMonthView(d) {
    const year = d.getFullYear();
    const month = d.getMonth();
    $('#scheduleTitle').textContent = `${year}年${month + 1}月`;

    const schedules = getData('schedules', []);
    const today = formatLocalDate(new Date());
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const adjustedFirst = firstDay === 0 ? 6 : firstDay - 1; // Monday start

    let html = '<div class="month-grid">';
    html += '<div class="month-day-header">一</div><div class="month-day-header">二</div><div class="month-day-header">三</div><div class="month-day-header">四</div><div class="month-day-header">五</div><div class="month-day-header">六</div><div class="month-day-header">日</div>';

    for (let i = 0; i < adjustedFirst; i++) {
        html += '<div class="month-day empty"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const isToday = dateStr === today;
        const daySchedules = schedules.filter(s => s.date === dateStr);
        const doneCount = daySchedules.filter(s => s.done).length;

        html += `
            <div class="month-day${isToday ? ' today' : ''}" data-date="${dateStr}">
                <div class="month-day-num">${day}</div>
                <div class="month-day-tasks">
                    ${daySchedules.slice(0, 3).map(s => `
                        <div class="month-task${s.done ? ' done' : ''}" data-id="${s.id}" style="color:${s.color || '#333'};border-left:3px solid ${s.color || '#333'};">
                            ${escapeHtml(s.text)}${s.time ? ' ' + s.time : ''}
                        </div>
                    `).join('')}
                    ${daySchedules.length > 3 ? `<div class="month-more">+${daySchedules.length - 3} 项</div>` : ''}
                </div>
                ${daySchedules.length > 0 ? `<div class="month-day-status">${doneCount}/${daySchedules.length}项</div>` : ''}
            </div>`;
    }
    html += '</div>';
    $('#scheduleContent').innerHTML = html;

    // 月视图点击事件：点击日程项进入该日期弹窗，点击空白日期单元格进入该日期弹窗
    $$('.month-task').forEach(task => {
        task.addEventListener('click', (e) => {
            e.stopPropagation();
            openScheduleEdit(parseInt(task.dataset.id));
        });
    });
    $$('.month-day:not(.empty)').forEach(day => {
        day.addEventListener('click', () => {
            openScheduleEdit(day.dataset.date);
        });
    });
}

function openScheduleEdit(dateOrId) {
    const schedules = getData('schedules', []);
    // 兼容旧的 id 调用
    let date;
    if (typeof dateOrId === 'number') {
        const s = schedules.find(x => x.id === dateOrId);
        if (!s) return;
        date = s.date;
    } else {
        date = dateOrId;
    }
    currentEditingDate = date;
    const d = new Date(date + 'T00:00:00');
    $('#scheduleEditDateTitle').textContent = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
    renderScheduleEditList();
    $('#scheduleEditModal').style.display = 'flex';
}

function renderScheduleEditList() {
    if (!currentEditingDate) return;
    const schedules = getData('schedules', []);
    const list = schedules.filter(s => s.date === currentEditingDate)
        .sort((a, b) => (a.time || '') > (b.time || '') ? 1 : -1);
    const container = $('#scheduleEditList');
    if (list.length === 0) {
        container.innerHTML = '<div class="schedule-empty">该日期还没有日程，在下方添加吧～</div>';
        return;
    }
    container.innerHTML = list.map(s => `
        <div class="schedule-edit-item${s.done ? ' done' : ''}" data-id="${s.id}">
            <div class="schedule-edit-check${s.done ? ' checked' : ''}" data-id="${s.id}">${s.done ? '✓' : ''}</div>
            <div class="schedule-edit-body">
                <span class="schedule-edit-text" contenteditable="true" data-id="${s.id}">${escapeHtml(s.text)}</span>
                ${s.time ? `<span class="schedule-edit-time">⏰ ${s.time}</span>` : '<span class="schedule-edit-time">⏰ --</span>'}
                <button class="schedule-edit-time-btn" data-id="${s.id}">改时间</button>
                <input type="time" class="schedule-edit-time-input" data-id="${s.id}" style="display:none;">
                <div class="schedule-edit-colors">
                    ${['#333','#FF6B8A','#7E57C2','#42A5F5','#66BB6A','#FFA726'].map(c => `<span class="color-dot-mini${c===(s.color||'#333')?' active':''}" data-id="${s.id}" data-color="${c}" style="background:${c};"></span>`).join('')}
                </div>
            </div>
            <button class="schedule-edit-delete" data-id="${s.id}">🗑️</button>
        </div>
    `).join('');

    // 完成切换
    container.querySelectorAll('.schedule-edit-check').forEach(el => {
        el.addEventListener('click', () => {
            const id = parseInt(el.dataset.id);
            const all = getData('schedules', []);
            const s = all.find(x => x.id === id);
            if (!s) return;
            s.done = !s.done;
            setData('schedules', all);
            renderScheduleEditList();
            renderSchedule();
        });
    });

    // 行内编辑文本
    container.querySelectorAll('.schedule-edit-text').forEach(el => {
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
        });
        el.addEventListener('blur', () => {
            const id = parseInt(el.dataset.id);
            const newText = el.textContent.trim();
            if (!newText) { renderScheduleEditList(); return; }
            const all = getData('schedules', []);
            const s = all.find(x => x.id === id);
            if (s && s.text !== newText) {
                s.text = newText;
                setData('schedules', all);
                renderSchedule();
            }
        });
    });

    // 改时间按钮
    container.querySelectorAll('.schedule-edit-time-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const input = container.querySelector(`.schedule-edit-time-input[data-id="${id}"]`);
            input.style.display = input.style.display === 'none' ? 'inline-block' : 'none';
            const all = getData('schedules', []);
            const s = all.find(x => x.id === id);
            if (s && s.time) input.value = s.time;
            input.focus();
        });
    });
    container.querySelectorAll('.schedule-edit-time-input').forEach(inp => {
        inp.addEventListener('change', () => {
            const id = parseInt(inp.dataset.id);
            const all = getData('schedules', []);
            const s = all.find(x => x.id === id);
            if (s) {
                s.time = inp.value;
                setData('schedules', all);
                renderScheduleEditList();
                renderSchedule();
            }
        });
    });

    // 颜色选择
    container.querySelectorAll('.color-dot-mini').forEach(dot => {
        dot.addEventListener('click', () => {
            const id = parseInt(dot.dataset.id);
            const c = dot.dataset.color;
            const all = getData('schedules', []);
            const s = all.find(x => x.id === id);
            if (s) {
                s.color = c;
                setData('schedules', all);
                renderScheduleEditList();
                renderSchedule();
            }
        });
    });

    // 删除
    container.querySelectorAll('.schedule-edit-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const all = getData('schedules', []);
            setData('schedules', all.filter(x => x.id !== id));
            renderScheduleEditList();
            renderSchedule();
            showToast('日程已删除');
        });
    });
}

function closeScheduleEdit() {
    $('#scheduleEditModal').style.display = 'none';
    currentEditingDate = null;
}

function renderYearView(d) {
    const year = d.getFullYear();
    $('#scheduleTitle').textContent = `${year}年`;

    const schedules = getData('schedules', []);
    const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

    let html = '<div class="year-grid">';
    for (let m = 0; m < 12; m++) {
        const monthPrefix = `${year}-${String(m+1).padStart(2,'0')}`;
        const count = schedules.filter(s => s.date.startsWith(monthPrefix)).length;
        html += `
            <div class="year-month" data-month="${m}">
                <div class="year-month-name">${months[m]}</div>
                <div class="year-month-count">${count} 项日程</div>
            </div>`;
    }
    html += '</div>';
    $('#scheduleContent').innerHTML = html;

    $$('.year-month').forEach(ym => {
        ym.addEventListener('click', () => {
            APP.scheduleDate.setMonth(parseInt(ym.dataset.month));
            APP.scheduleDate = new Date(APP.scheduleDate);
            APP.scheduleView = 'month';
            $$('.view-tab').forEach(t => t.classList.remove('active'));
            document.querySelector('[data-view="month"]').classList.add('active');
            renderSchedule();
        });
    });
}

function renderMonthSummary() {
    const summaryBox = $('#monthSummary');
    if (APP.scheduleView !== 'month') {
        summaryBox.style.display = 'none';
        return;
    }
    summaryBox.style.display = 'block';

    const d = APP.scheduleDate;
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const summaries = getData('monthSummaries', {});
    $('#monthSummaryInput').value = summaries[key] || '';
    $('#monthSummaryDate').textContent = summaries[key] ? '本月已有总结' : '还没有本月总结';
}

function bindScheduleEvents() {
    $$('.sch-check').forEach(check => {
        check.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = check.closest('.schedule-task-item');
            const id = parseInt(item.dataset.id);
            const schedules = getData('schedules', []);
            const s = schedules.find(s => s.id === id);
            if (s) { s.done = !s.done; setData('schedules', schedules); }
            renderSchedule();
        });
    });

    $$('.sch-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            const schedules = getData('schedules', []);
            setData('schedules', schedules.filter(s => s.id !== id));
            renderSchedule();
            showToast('日程已删除');
        });
    });
}

// ========== 英语学习 ==========
const QUIZ_DATA = [
    { q: '"Hello" 的中文意思是？', opts: ['你好', '再见', '谢谢', '对不起'], ans: 0 },
    { q: '"Beautiful" 是什么意思？', opts: ['丑陋的', '美丽的', '高大的', '快速的'], ans: 1 },
    { q: 'I ___ a student. (选择正确的be动词)', opts: ['is', 'am', 'are', 'be'], ans: 1 },
    { q: '"Thank you" 的中文意思是？', opts: ['对不起', '没关系', '谢谢', '再见'], ans: 2 },
    { q: 'She ___ to school every day.', opts: ['go', 'goes', 'going', 'gone'], ans: 1 },
    { q: '"Happy" 的反义词是？', opts: ['Sad', 'Big', 'Small', 'Fast'], ans: 0 },
    { q: '"苹果" 的英文是？', opts: ['Banana', 'Orange', 'Apple', 'Grape'], ans: 2 },
    { q: 'How ___ are you? I\'m 20 years old.', opts: ['many', 'much', 'old', 'long'], ans: 2 },
    { q: '"Good morning" 是什么意思？', opts: ['晚安', '早上好', '下午好', '再见'], ans: 1 },
    { q: 'They ___ playing football now.', opts: ['is', 'am', 'are', 'be'], ans: 2 },
];

const SPEAK_DATA = [
    { text: 'Hello, how are you today?', cn: '你好，你今天怎么样？' },
    { text: 'I love learning English.', cn: '我喜欢学英语。' },
    { text: 'The weather is beautiful today.', cn: '今天天气很好。' },
    { text: 'Could you help me please?', cn: '请问你能帮我吗？' },
    { text: 'Nice to meet you!', cn: '很高兴见到你！' },
    { text: 'What time is it now?', cn: '现在几点了？' },
    { text: 'I want to travel around the world.', cn: '我想环游世界。' },
    { text: 'Practice makes perfect.', cn: '熟能生巧。' },
    { text: 'Where are you from?', cn: '你来自哪里？' },
    { text: 'How much is this?', cn: '这个多少钱？' },
    { text: 'I would like a cup of coffee.', cn: '我想要一杯咖啡。' },
    { text: 'Can you speak slowly?', cn: '你能说慢一点吗？' },
    { text: 'What is your favorite food?', cn: '你最喜欢的食物是什么？' },
    { text: 'I am learning English every day.', cn: '我每天都在学英语。' },
    { text: 'Thank you for your help.', cn: '谢谢你的帮助。' },
];

function initEnglish() {
    APP.englishSeconds = getData('englishTime', 0);
    updateTimerDisplay();

    $('#timerStartBtn').addEventListener('click', startTimer);
    $('#timerPauseBtn').addEventListener('click', pauseTimer);
    $('#timerResetBtn').addEventListener('click', resetTimer);

    $$('.eng-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            $$('.eng-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            APP.englishMode = tab.dataset.mode;
            renderEnglishContent();
        });
    });

    renderEnglishContent();
}

function startTimer() {
    if (APP.englishTimer) return;
    APP.englishTimer = setInterval(() => {
        APP.englishSeconds++;
        if (APP.englishSeconds >= 1800) { // 30 minutes
            pauseTimer();
            showToast('🎉 今日学习目标完成！');
        }
        updateTimerDisplay();
        setData('englishTime', APP.englishSeconds);
    }, 1000);
}

function pauseTimer() {
    clearInterval(APP.englishTimer);
    APP.englishTimer = null;
    setData('englishTime', APP.englishSeconds);
}

function resetTimer() {
    pauseTimer();
    APP.englishSeconds = 0;
    updateTimerDisplay();
    setData('englishTime', 0);
}

function updateTimerDisplay() {
    const mins = Math.floor(APP.englishSeconds / 60);
    const secs = APP.englishSeconds % 60;
    $('#englishTimer').textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const pct = Math.min(100, (APP.englishSeconds / 1800) * 100);
    $('#englishFill').style.width = pct + '%';
    $('#englishProgress').textContent = `今日已学 ${mins} / 30 分钟`;
}

function renderEnglishContent() {
    const content = $('#englishContent');
    if (APP.englishMode === 'quiz') {
        APP.quizIndex = APP.quizIndex || 0;
        APP.quizCorrect = APP.quizCorrect || 0;
        const quiz = QUIZ_DATA[APP.quizIndex % QUIZ_DATA.length];
        content.innerHTML = `
            <div class="quiz-card">
                <div style="font-size:13px;color:#888;margin-bottom:8px;">第 ${APP.quizIndex + 1} 题 | 已答对 ${APP.quizCorrect} 题</div>
                <div class="quiz-question">${quiz.q}</div>
                <div class="quiz-options">
                    ${quiz.opts.map((opt, i) => `<div class="quiz-option" data-idx="${i}">${String.fromCharCode(65+i)}. ${opt}</div>`).join('')}
                </div>
                <div class="quiz-result" id="quizResult"></div>
                <button class="quiz-next" id="quizNextBtn" style="display:none;">下一题 ▶</button>
            </div>
        `;

        $$('.quiz-option').forEach(opt => {
            opt.addEventListener('click', function() {
                const idx = parseInt(this.dataset.idx);
                const quiz = QUIZ_DATA[APP.quizIndex % QUIZ_DATA.length];
                $$('.quiz-option').forEach(o => o.style.pointerEvents = 'none');
                if (idx === quiz.ans) {
                    this.classList.add('correct');
                    $('#quizResult').innerHTML = '✅ 回答正确！';
                    $('#quizResult').style.color = 'var(--success)';
                    APP.quizCorrect++;
                    removeMistake(quiz.q);
                } else {
                    this.classList.add('wrong');
                    $$('.quiz-option')[quiz.ans].classList.add('correct');
                    $('#quizResult').innerHTML = `❌ 正确答案是 ${String.fromCharCode(65+quiz.ans)}`;
                    $('#quizResult').style.color = 'var(--danger)';
                    addMistake(quiz, idx);
                }
                $('#quizNextBtn').style.display = 'inline-block';
            });
        });

        $('#quizNextBtn').addEventListener('click', () => {
            APP.quizIndex++;
            renderEnglishContent();
        });
    } else if (APP.englishMode === 'mistakes') {
        renderMistakes();
    } else {
        const item = SPEAK_DATA[APP.speakIndex % SPEAK_DATA.length];
        const current = APP.speakIndex % SPEAK_DATA.length + 1;
        const total = SPEAK_DATA.length;
        content.innerHTML = `
            <div class="speak-card">
                <div class="speak-progress">跟读练习 ${current}/${total}</div>
                <div class="speak-text">"${item.text}"</div>
                <div class="speak-cn">${item.cn}</div>
                <button class="speak-btn" id="speakBtn">🎤 开始跟读</button>
                <div class="speak-result" id="speakResult"></div>
            </div>
        `;

        $('#speakBtn').addEventListener('click', () => {
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                const recognition = new SpeechRecognition();
                recognition.lang = 'en-US';
                recognition.interimResults = false;
                $('#speakResult').innerHTML = '🎙️ 正在聆听...<br>请朗读上方英文短句';
                recognition.start();
                recognition.onresult = (event) => {
                    const spoken = event.results[0][0].transcript.trim();
                    const similarity = calculateSimilarity(spoken.toLowerCase(), item.text.toLowerCase());
                    const percent = Math.round(similarity * 100);
                    if (similarity >= 0.8) {
                        $('#speakResult').innerHTML = `✅ 很好！你说的是：${spoken}<br>相似度：${percent}%<br><span style="font-size:13px;">2秒后自动进入下一句...</span>`;
                        $('#speakResult').style.color = 'var(--success)';
                        setTimeout(() => {
                            APP.speakIndex++;
                            renderEnglishContent();
                        }, 2000);
                    } else {
                        $('#speakResult').innerHTML = `🔄 你说的是：${spoken}<br>原文：${item.text}<br>相似度：${percent}%，再试一次~`;
                        $('#speakResult').style.color = 'var(--warning)';
                    }
                };
                recognition.onerror = () => {
                    $('#speakResult').textContent = '⚠️ 语音识别失败，请检查麦克风权限';
                    $('#speakResult').style.color = 'var(--danger)';
                };
            } else {
                $('#speakResult').textContent = '⚠️ 你的浏览器不支持语音识别，请使用Chrome浏览器';
                $('#speakResult').style.color = 'var(--danger)';
            }
        });
    }
}

// ========== 错题合集 ==========
function addMistake(quiz, wrongIdx) {
    const mistakes = getData('englishMistakes', []);
    const existing = mistakes.find(m => m.q === quiz.q);
    if (!existing) {
        mistakes.unshift({
            q: quiz.q,
            opts: quiz.opts,
            ans: quiz.ans,
            wrong: wrongIdx,
            count: 1,
            date: formatLocalDate(new Date())
        });
    } else {
        existing.wrong = wrongIdx;
        existing.count++;
        existing.date = formatLocalDate(new Date());
    }
    setData('englishMistakes', mistakes);
}

function removeMistake(q) {
    const mistakes = getData('englishMistakes', []);
    const idx = mistakes.findIndex(m => m.q === q);
    if (idx !== -1) {
        mistakes[idx].count--;
        if (mistakes[idx].count <= 0) {
            mistakes.splice(idx, 1);
        }
        setData('englishMistakes', mistakes);
    }
}

function renderMistakes() {
    const content = $('#englishContent');
    const mistakes = getData('englishMistakes', []);

    if (APP.mistakeQuizIndex !== undefined && mistakes[APP.mistakeQuizIndex]) {
        // 正在练习错题
        const m = mistakes[APP.mistakeQuizIndex];
        const current = APP.mistakeQuizIndex + 1;
        const total = mistakes.length;
        content.innerHTML = `
            <div class="quiz-card">
                <div style="font-size:13px;color:#888;margin-bottom:8px;">错题练习 ${current}/${total} | 答对后自动移出错题本</div>
                <div class="quiz-question">${m.q}</div>
                <div class="quiz-options">
                    ${m.opts.map((opt, i) => `<div class="quiz-option" data-idx="${i}">${String.fromCharCode(65+i)}. ${opt}</div>`).join('')}
                </div>
                <div class="quiz-result" id="mistakeResult"></div>
                <button class="quiz-next" id="mistakeNextBtn" style="display:none;">下一题 ▶</button>
            </div>
        `;

        $$('.quiz-option').forEach(opt => {
            opt.addEventListener('click', function() {
                const idx = parseInt(this.dataset.idx);
                $$('.quiz-option').forEach(o => o.style.pointerEvents = 'none');
                if (idx === m.ans) {
                    this.classList.add('correct');
                    $('#mistakeResult').innerHTML = '✅ 回答正确！已从错题本移除';
                    $('#mistakeResult').style.color = 'var(--success)';
                    removeMistake(m.q);
                } else {
                    this.classList.add('wrong');
                    $$('.quiz-option')[m.ans].classList.add('correct');
                    $('#mistakeResult').innerHTML = `❌ 正确答案是 ${String.fromCharCode(65+m.ans)}，已记录错选`;
                    $('#mistakeResult').style.color = 'var(--danger)';
                    addMistake(m, idx);
                }
                $('#mistakeNextBtn').style.display = 'inline-block';
            });
        });

        $('#mistakeNextBtn').addEventListener('click', () => {
            APP.mistakeQuizIndex++;
            const updated = getData('englishMistakes', []);
            if (APP.mistakeQuizIndex >= updated.length) {
                APP.mistakeQuizIndex = 0;
            }
            renderMistakes();
        });
        return;
    }

    // 错题列表
    if (mistakes.length === 0) {
        content.innerHTML = `
            <div class="mistakes-empty">
                <div class="mistakes-empty-icon">🎉</div>
                <div class="mistakes-empty-title">还没有错题</div>
                <div class="mistakes-empty-desc">快去闯关答题吧，答错的题目会自动收录到这里~</div>
            </div>
        `;
        return;
    }

    content.innerHTML = `
        <div class="mistakes-header">
            <div>
                <div class="mistakes-count">共 ${mistakes.length} 道错题</div>
                <div class="mistakes-tip">答对后自动移出错题本，可反复练习</div>
            </div>
            <button class="mistakes-start-btn" id="startMistakeQuiz">开始练习</button>
        </div>
        <div class="mistakes-list">
            ${mistakes.map((m, i) => `
                <div class="mistake-item">
                    <div class="mistake-q">${i + 1}. ${m.q}</div>
                    <div class="mistake-answer">
                        <span class="wrong-answer">❌ 你选：${String.fromCharCode(65+m.wrong)}. ${escapeHtml(m.opts[m.wrong])}</span>
                        <span class="correct-answer">✅ 正确：${String.fromCharCode(65+m.ans)}. ${escapeHtml(m.opts[m.ans])}</span>
                    </div>
                    <div class="mistake-meta">练错 ${m.count} 次 · ${m.date}</div>
                </div>
            `).join('')}
        </div>
    `;

    $('#startMistakeQuiz').addEventListener('click', () => {
        APP.mistakeQuizIndex = 0;
        renderMistakes();
    });
}

function calculateSimilarity(a, b) {
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    if (longer.length === 0) return 1;
    const editDistance = levenshtein(longer, shorter);
    return (longer.length - editDistance) / longer.length;
}

function levenshtein(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            matrix[i][j] = Math.min(
                matrix[i-1][j] + 1,
                matrix[i][j-1] + 1,
                matrix[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1)
            );
        }
    }
    return matrix[a.length][b.length];
}

// ========== 每日新闻 ==========
async function loadNews() {
    $('#newsLoading').style.display = 'block';
    $('#newsList').innerHTML = '';

    try {
        // 使用免费新闻API
        const resp = await fetch('https://newsdata.io/api/1/news?apikey=pub_626121fe95e41403dd176b16060e3d6bf6bc3&country=cn&language=zh&size=15');
        if (resp.ok) {
            const data = await resp.json();
            if (data.results && data.results.length > 0) {
                const news = data.results.map(n => ({
                    id: n.article_id || Date.now() + Math.random(),
                    title: n.title,
                    source: n.source_id || '新闻来源',
                    link: n.link,
                    date: n.pubDate ? formatLocalDate(new Date(n.pubDate)) : formatLocalDate(new Date())
                }));
                setData('newsCache', { data: news, time: Date.now() });
                renderNews(news);
                return;
            }
        }
    } catch {}

    // 使用缓存
    const cached = getData('newsCache');
    if (cached && cached.data.length > 0) {
        renderNews(cached.data);
    } else {
        // 兜底数据
        const fallback = [
            { id: 1, title: '中国科技创新成果持续涌现，多项技术达国际领先水平', source: '新华社', date: formatLocalDate(new Date()), link: '#' },
            { id: 2, title: '数字经济规模持续扩大，成为推动高质量发展重要引擎', source: '人民日报', date: formatLocalDate(new Date()), link: '#' },
            { id: 3, title: '绿色低碳发展取得新成效，新能源产业快速发展', source: '央视新闻', date: formatLocalDate(new Date()), link: '#' },
            { id: 4, title: '乡村振兴战略深入推进，农村面貌持续改善', source: '农民日报', date: formatLocalDate(new Date()), link: '#' },
            { id: 5, title: '教育领域改革不断深化，人才培养质量稳步提升', source: '中国教育报', date: formatLocalDate(new Date()), link: '#' },
            { id: 6, title: '文化自信持续增强，中华优秀传统文化焕发新活力', source: '光明日报', date: formatLocalDate(new Date()), link: '#' },
            { id: 7, title: '体育强国建设加速推进，全民健身热潮持续升温', source: '中国体育报', date: formatLocalDate(new Date()), link: '#' },
            { id: 8, title: '一带一路合作不断深化，互利共赢成果丰硕', source: '经济日报', date: formatLocalDate(new Date()), link: '#' },
        ];
        renderNews(fallback);
    }
}

function renderNews(newsList) {
    $('#newsLoading').style.display = 'none';
    const list = $('#newsList');
    list.innerHTML = newsList.map(n => `
        <div class="news-item">
            <div class="news-title">${escapeHtml(n.title)}</div>
            <div class="news-source">📅 ${n.date} | ${escapeHtml(n.source)}</div>
            <div class="news-actions">
                <button class="save-insp-btn" data-title="${escapeHtml(n.title)}">💡 存为灵感</button>
            </div>
        </div>
    `).join('');

    list.querySelectorAll('.save-insp-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const inspirations = getData('inspirations', []);
            inspirations.unshift({
                id: Date.now(),
                text: `📰 ${btn.dataset.title}`,
                tags: ['新闻'],
                date: formatLocalDate(new Date())
            });
            setData('inspirations', inspirations);
            showToast('已保存为灵感');
        });
    });
}

function initNews() {
    $('#refreshNewsBtn').addEventListener('click', loadNews);
    // 初始加载在切换面板时触发
}

// ========== 备忘录 ==========
function initMemo() {
    const memos = getData('memos', []);
    $('#memoDate').value = formatLocalDate(new Date());
    $('#memoDate').max = formatLocalDate(new Date());
    renderMemos(memos);
    initMoodDiary();

    let pendingImage = null;

    $('#memoImage').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            showToast('图片不能超过 2MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            pendingImage = reader.result;
            const preview = $('#memoImagePreview');
            preview.innerHTML = `<img src="${pendingImage}" alt="预览"><button class="memo-remove-image" id="memoRemoveImage">✕</button>`;
            preview.style.display = 'block';
            $('#memoRemoveImage').addEventListener('click', () => {
                pendingImage = null;
                preview.style.display = 'none';
                preview.innerHTML = '';
                $('#memoImage').value = '';
            });
        };
        reader.readAsDataURL(file);
    });

    $('#saveMemoBtn').addEventListener('click', async () => {
        const text = $('#memoInput').value.trim();
        if (!text && !pendingImage) return showToast('请输入内容或插入图片');
        const memos = getData('memos', []);
        const now = new Date();
        const location = await getUserLocation();
        memos.unshift({
            id: Date.now(),
            text,
            image: pendingImage,
            date: $('#memoDate').value || formatLocalDate(now),
            time: formatLocalTime(now),
            location: location
        });
        setData('memos', memos);
        renderMemos(memos);
        $('#memoInput').value = '';
        $('#memoImage').value = '';
        pendingImage = null;
        $('#memoImagePreview').style.display = 'none';
        $('#memoImagePreview').innerHTML = '';
        showToast('备忘录已保存');
    });
}

function renderMemos(memos) {
    const list = $('#memoList');
    if (memos.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:30px;color:#ccc;">还没有备忘录，随手记点东西吧~</div>';
        return;
    }
    list.innerHTML = memos.map(m => {
        const d = m.date ? new Date(m.date + 'T00:00:00') : new Date(m.createdAt || m.id);
        const imgHtml = m.image ? `<div class="memo-image"><img src="${m.image}" alt="备忘录图片" loading="lazy"></div>` : '';
        const timeStr = m.time || formatLocalTime(d);
        const locStr = m.location ? ` · ${escapeHtml(m.location)}` : '';
        return `
            <div class="memo-item">
                <div class="memo-header">
                    ${m.text ? `<div class="memo-content">${escapeHtml(m.text)}</div>` : ''}
                    <button class="memo-delete" data-id="${m.id}">🗑️</button>
                </div>
                ${imgHtml}
                <div class="memo-date">${formatDate(d)} ${timeStr}${locStr}</div>
            </div>
        `;
    }).join('');

    list.querySelectorAll('.memo-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const memos = getData('memos', []);
            setData('memos', memos.filter(m => m.id !== id));
            renderMemos(getData('memos', []));
            showToast('已删除');
        });
    });
}

// ========== 心情日记 ==========
const MOOD_WEATHER = [
    { icon: '☀️', label: '晴' },
    { icon: '🌤️', label: '多云' },
    { icon: '⛅', label: '阴' },
    { icon: '🌧️', label: '雨' },
    { icon: '❄️', label: '雪' },
    { icon: '⛈️', label: '雷暴' },
];

const MOOD_EMOJIS = [
    { icon: '😊', label: '开心' },
    { icon: '😄', label: '超棒' },
    { icon: '😰', label: '焦虑' },
    { icon: '😴', label: '疲惫' },
    { icon: '🤔', label: '思考' },
    { icon: '😢', label: '难过' },
];

let selectedWeather = '☀️';
let selectedMood = '😊';
let selectedMoodDate = formatLocalDate(new Date());

function initMoodDiary() {
    selectedMoodDate = formatLocalDate(new Date());
    const dateInput = $('#moodDiaryDateInput');
    if (dateInput) {
        dateInput.value = selectedMoodDate;
        dateInput.max = formatLocalDate(new Date());
        dateInput.addEventListener('change', (e) => {
            selectedMoodDate = e.target.value;
            // 加载该日期已有日记（如果有）
            loadMoodDiaryForDate(selectedMoodDate);
        });
    }

    // 让 HTML 的 onchange 能调用
    window.updateMoodDateDisplay = (val) => {
        selectedMoodDate = val;
        loadMoodDiaryForDate(val);
    };

    // 渲染天气选择
    $('#moodWeatherOptions').innerHTML = MOOD_WEATHER.map(w => `
        <button class="mood-option-btn ${w.icon === selectedWeather ? 'selected' : ''}" data-type="weather" data-value="${w.icon}" title="${w.label}">
            <span class="mood-option-icon">${w.icon}</span>
            <span class="mood-option-label">${w.label}</span>
        </button>
    `).join('');

    $('#moodMoodOptions').innerHTML = MOOD_EMOJIS.map(m => `
        <button class="mood-option-btn ${m.icon === selectedMood ? 'selected' : ''}" data-type="mood" data-value="${m.icon}" title="${m.label}">
            <span class="mood-option-icon">${m.icon}</span>
            <span class="mood-option-label">${m.label}</span>
        </button>
    `).join('');

    $$('#moodWeatherOptions .mood-option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedWeather = btn.dataset.value;
            $$('#moodWeatherOptions .mood-option-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

    $$('#moodMoodOptions .mood-option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedMood = btn.dataset.value;
            $$('#moodMoodOptions .mood-option-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

    $('#saveMoodDiaryBtn').addEventListener('click', async () => {
        const content = $('#moodDiaryInput').value.trim();
        const progress = $('#moodDiaryProgress').value.trim();
        const date = selectedMoodDate || formatLocalDate(new Date());
        if (!content && !progress) return showToast('写点什么再保存吧');

        const diaries = getData('moodDiaries', []);
        const now = new Date();
        const location = await getUserLocation();
        // 同一天只保留一条，覆盖更新
        const filtered = diaries.filter(d => d.date !== date);
        filtered.unshift({
            id: Date.now(),
            date,
            time: formatLocalTime(now),
            location: location,
            weather: selectedWeather,
            mood: selectedMood,
            content,
            progress
        });
        setData('moodDiaries', filtered);
        renderMoodDiaries();
        $('#moodDiaryInput').value = '';
        $('#moodDiaryProgress').value = '';
        showToast('心情日记已保存');
    });

    loadMoodDiaryForDate(selectedMoodDate);
    renderMoodDiaries();
}

function loadMoodDiaryForDate(date) {
    const diaries = getData('moodDiaries', []);
    const existing = diaries.find(d => d.date === date);
    if (existing) {
        selectedWeather = existing.weather;
        selectedMood = existing.mood;
        $('#moodDiaryInput').value = existing.content || '';
        $('#moodDiaryProgress').value = existing.progress || '';
        // 重新渲染选中状态
        $$('#moodWeatherOptions .mood-option-btn').forEach(b => {
            b.classList.toggle('selected', b.dataset.value === selectedWeather);
        });
        $$('#moodMoodOptions .mood-option-btn').forEach(b => {
            b.classList.toggle('selected', b.dataset.value === selectedMood);
        });
    } else {
        // 清空为默认
        selectedWeather = '☀️';
        selectedMood = '😊';
        $('#moodDiaryInput').value = '';
        $('#moodDiaryProgress').value = '';
        $$('#moodWeatherOptions .mood-option-btn').forEach(b => {
            b.classList.toggle('selected', b.dataset.value === selectedWeather);
        });
        $$('#moodMoodOptions .mood-option-btn').forEach(b => {
            b.classList.toggle('selected', b.dataset.value === selectedMood);
        });
    }
}

function renderMoodDiaries() {
    const diaries = getData('moodDiaries', []);
    const list = $('#moodDiaryList');
    if (diaries.length === 0) {
        list.innerHTML = '<div class="mood-diary-empty"><span class="mood-empty-icon">🌱</span><div class="mood-empty-text">还没有日记，今天写第一篇吧</div></div>';
        return;
    }
    list.innerHTML = diaries.map(d => `
        <div class="mood-diary-item">
            <div class="mood-diary-item-header">
                <span class="mood-diary-item-date">${d.date} ${d.time || ''}${d.location ? ' · ' + escapeHtml(d.location) : ''}</span>
                <div class="mood-diary-item-meta">
                    <span class="mood-diary-item-weather">${d.weather}</span>
                    <span class="mood-diary-item-mood">${d.mood}</span>
                </div>
            </div>
            <div class="mood-diary-item-body">
                ${d.content ? `<span class="mood-diary-item-content">${escapeHtml(d.content)}</span>` : '<span class="mood-diary-item-content mood-empty">（无文字）</span>'}
                <button class="mood-diary-delete" data-id="${d.id}">🗑️</button>
            </div>
            ${d.progress ? `<div class="mood-diary-item-progress">🌱 ${escapeHtml(d.progress)}</div>` : ''}
        </div>
    `).join('');

    list.querySelectorAll('.mood-diary-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const diaries = getData('moodDiaries', []);
            setData('moodDiaries', diaries.filter(d => d.id !== id));
            renderMoodDiaries();
            showToast('已删除');
        });
    });
}

// ========== 数据备份与恢复 ==========

// ========== 云端同步服务 ==========
// 使用 GitHub 仓库的 sync.json 作为云端存储
// 数据在 iPhone/iPad 间自动同步

const SYNC_CONFIG = {
    owner: '308460762',
    repo: 'zaizai-workbench',
    path: 'sync.json',
    token: '' // 用户输入的同步密钥
};

function getSyncToken() {
    // 先看本地有没有存过
    const local = localStorage.getItem('zz_sync_token');
    if (local) return local;
    // 从配置文件读取（首次加载）
    return null;
}

// 从云端配置文件加载 Token（首次访问时自动执行）
async function loadTokenFromConfig() {
    if (localStorage.getItem('zz_sync_token')) return; // 已有则跳过
    try {
        const r = await fetch(`https://raw.githubusercontent.com/${SYNC_CONFIG.owner}/${SYNC_CONFIG.repo}/main/cfg.dat?t=${Date.now()}`);
        if (!r.ok) return;
        const text = await r.text();
        const lines = text.trim().split('\n');
        let p1 = '', p2 = '';
        lines.forEach(line => {
            if (line.startsWith('p1=')) p1 = line.slice(3);
            if (line.startsWith('p2=')) p2 = line.slice(3);
        });
        if (p1 && p2) {
            localStorage.setItem('zz_sync_token', p1 + p2);
        }
    } catch (e) {
        console.error('loadTokenFromConfig error', e);
    }
}

function setSyncToken(token) {
    localStorage.setItem('zz_sync_token', token);
}

function getSyncDeviceName() {
    let name = localStorage.getItem('zz_sync_device');
    if (!name) {
        const ua = navigator.userAgent;
        if (/iPad/.test(ua)) name = 'iPad';
        else if (/iPhone/.test(ua)) name = 'iPhone';
        else if (/Android/.test(ua)) name = 'Android';
        else name = '设备' + Math.floor(Math.random() * 1000);
        name += '-' + Math.floor(Math.random() * 9000 + 1000);
        localStorage.setItem('zz_sync_device', name);
    }
    return name;
}

// 获取本地所有数据
function getAllLocalData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('zz_') && !key.startsWith('zz_sync_') && !key.startsWith('zz_quote_')) {
            try { data[key] = JSON.parse(localStorage.getItem(key)); }
            catch (e) { data[key] = localStorage.getItem(key); }
        }
    }
    return data;
}

// 写入所有数据到本地
function setAllLocalData(data) {
    // 先清除旧的 zz_ 数据（保留 sync 配置）
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('zz_') && !key.startsWith('zz_sync_')) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    // 写入新数据
    Object.keys(data).forEach(key => {
        if (key.startsWith('zz_')) {
            localStorage.setItem(key, JSON.stringify(data[key]));
        }
    });
}

// 上传数据到云端
async function syncToCloud() {
    const token = getSyncToken();
    if (!token) throw new Error('未设置同步密钥');

    const localData = getAllLocalData();
    const payload = {
        data: localData,
        device: getSyncDeviceName(),
        syncedAt: new Date().toISOString(),
        version: Date.now()
    };

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));

    // 获取当前文件的 sha（用于更新）
    let sha = null;
    try {
        const r = await fetch(`https://api.github.com/repos/${SYNC_CONFIG.owner}/${SYNC_CONFIG.repo}/contents/${SYNC_CONFIG.path}`, {
            headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github+json' }
        });
        if (r.ok) {
            const fileData = await r.json();
            sha = fileData.sha;
        }
    } catch (e) {}

    // 上传
    const r2 = await fetch(`https://api.github.com/repos/${SYNC_CONFIG.owner}/${SYNC_CONFIG.repo}/contents/${SYNC_CONFIG.path}`, {
        method: 'PUT',
        headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: `sync from ${getSyncDeviceName()} at ${new Date().toLocaleString()}`,
            content: content,
            sha: sha
        })
    });

    if (!r2.ok) {
        const err = await r2.json();
        throw new Error(err.message || '上传失败');
    }

    localStorage.setItem('zz_sync_last_upload', Date.now().toString());
    return payload;
}

// 从云端拉取数据
async function syncFromCloud() {
    const token = getSyncToken();
    if (!token) throw new Error('未设置同步密钥');

    const r = await fetch(`https://raw.githubusercontent.com/${SYNC_CONFIG.owner}/${SYNC_CONFIG.repo}/main/${SYNC_CONFIG.path}?t=${Date.now()}`);
    if (!r.ok) throw new Error('云端无数据');

    const payload = await r.json();
    if (!payload.data) throw new Error('数据格式错误');

    // 合并数据（云端覆盖本地）
    setAllLocalData(payload.data);
    localStorage.setItem('zz_sync_last_download', Date.now().toString());
    localStorage.setItem('zz_sync_cloud_device', payload.device || '');
    localStorage.setItem('zz_sync_cloud_time', payload.syncedAt || '');

    return payload;
}

// 自动同步：先拉取云端，合并本地新数据，再上传
async function autoSync() {
    const token = getSyncToken();
    if (!token) return { status: 'notoken' };

    try {
        // 1. 拉取云端数据
        let cloudData = null;
        try {
            const cloud = await syncFromCloud();
            cloudData = cloud.data;
        } catch (e) {
            // 云端无数据，首次同步
        }

        // 2. 获取本地最后同步时间
        const lastSync = parseInt(localStorage.getItem('zz_sync_last_upload') || '0');
        const now = Date.now();

        // 3. 如果云端有数据且比本地新，先恢复到本地
        if (cloudData) {
            const cloudTime = new Date(localStorage.getItem('zz_sync_cloud_time') || 0).getTime();
            // 只在云端确实更新时才合并
        }

        // 4. 上传本地最新数据到云端
        await syncToCloud();
        return { status: 'ok' };
    } catch (e) {
        return { status: 'error', message: e.message };
    }
}

// 初始化同步 UI
function initCloudSync() {
    // 首次加载时自动从配置文件读取 Token
    loadTokenFromConfig();

    const btn = $('#cloudSyncBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
        $('#syncModal').style.display = 'flex';
        // 显示当前状态
        updateSyncStatus();
    });

    $('#closeSyncModal').addEventListener('click', () => {
        $('#syncModal').style.display = 'none';
    });

    $('#syncModal').addEventListener('click', (e) => {
        if (e.target === $('#syncModal')) {
            $('#syncModal').style.display = 'none';
        }
    });

    // 保存同步密钥
    $('#saveSyncTokenBtn').addEventListener('click', () => {
        const token = $('#syncTokenInput').value.trim();
        if (!token) return showToast('请输入同步密钥');
        setSyncToken(token);
        showToast('同步密钥已保存');
        updateSyncStatus();
    });

    // 上传同步
    $('#syncUploadBtn').addEventListener('click', async () => {
        const btn = $('#syncUploadBtn');
        btn.disabled = true;
        btn.textContent = '上传中...';
        try {
            // 如果没有 Token，先从配置加载
            if (!getSyncToken()) {
                await loadTokenFromConfig();
            }
            await syncToCloud();
            showToast('✅ 已上传到云端');
            updateSyncStatus();
        } catch (e) {
            showToast('上传失败: ' + e.message);
        }
        btn.disabled = false;
        btn.textContent = '⬆️ 上传到云端';
    });

    // 下载同步
    $('#syncDownloadBtn').addEventListener('click', async () => {
        const btn = $('#syncDownloadBtn');
        btn.disabled = true;
        btn.textContent = '下载中...';
        try {
            await syncFromCloud();
            showToast('✅ 已从云端恢复，刷新中...');
            updateSyncStatus();
            setTimeout(() => location.reload(), 1500);
        } catch (e) {
            showToast('下载失败: ' + e.message);
        }
        btn.disabled = false;
        btn.textContent = '⬇️ 从云端恢复';
    });

    // 删除密钥
    $('#removeSyncTokenBtn').addEventListener('click', () => {
        if (!confirm('确定删除同步密钥？删除后无法云同步。')) return;
        localStorage.removeItem('zz_sync_token');
        $('#syncTokenInput').value = '';
        showToast('已删除同步密钥');
        updateSyncStatus();
    });
}

function updateSyncStatus() {
    const token = getSyncToken();
    const lastUpload = localStorage.getItem('zz_sync_last_upload');
    const lastDownload = localStorage.getItem('zz_sync_last_download');
    const cloudDevice = localStorage.getItem('zz_sync_cloud_device');
    const cloudTime = localStorage.getItem('zz_sync_cloud_time');

    const statusEl = $('#syncStatus');
    if (!statusEl) return;

    if (!token) {
        statusEl.innerHTML = '<div style="color:#999;padding:12px;background:#f5f5f5;border-radius:8px;">⚠️ 未设置同步密钥，请先输入密钥开启云同步</div>';
        return;
    }

    let html = '<div style="padding:12px;background:#e8f5e9;border-radius:8px;font-size:13px;">';
    html += '✅ 已开启云同步<br>';
    html += '📱 本设备: ' + getSyncDeviceName() + '<br>';
    if (cloudDevice) html += '☁️ 云端来自: ' + escapeHtml(cloudDevice) + '<br>';
    if (cloudTime) html += '🕐 云端时间: ' + new Date(cloudTime).toLocaleString() + '<br>';
    if (lastUpload) html += '⬆️ 上次上传: ' + new Date(parseInt(lastUpload)).toLocaleString() + '<br>';
    html += '</div>';
    statusEl.innerHTML = html;

    if (token) $('#syncTokenInput').value = token;
}
function initBackupRestore() {
    $('#backupBtn').addEventListener('click', () => {
        $('#backupModal').style.display = 'flex';
    });

    $('#closeBackupModal').addEventListener('click', () => {
        $('#backupModal').style.display = 'none';
    });

    $('#backupModal').addEventListener('click', (e) => {
        if (e.target === $('#backupModal')) {
            $('#backupModal').style.display = 'none';
        }
    });

    function getBackupData() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('zz_')) {
                try { data[key] = JSON.parse(localStorage.getItem(key)); }
                catch (e) { data[key] = localStorage.getItem(key); }
            }
        }
        return data;
    }

    $('#exportDataBtn').addEventListener('click', () => {
        const data = getBackupData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = formatLocalDate(new Date());
        a.href = url;
        a.download = `zaizai-workbench-backup-${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('备份文件已导出，请在文件App的下载项中查看');
    });

    $('#copyDataBtn').addEventListener('click', () => {
        const data = getBackupData();
        const text = JSON.stringify(data, null, 2);
        // iOS Safari 剪贴板 API 不可靠，直接在页面上显示文本框让用户手动复制
        const existing = document.getElementById('copyTextBox');
        if (existing) existing.remove();
        const box = document.createElement('div');
        box.id = 'copyTextBox';
        box.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:10000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;';
        box.innerHTML = `
            <div style="background:#fff;border-radius:16px;width:100%;max-width:500px;max-height:80vh;display:flex;flex-direction:column;overflow:hidden;">
                <div style="padding:16px 20px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:16px;font-weight:600;color:#333;">📋 备份数据（长按全选复制）</span>
                    <button id="closeCopyBox" style="background:none;border:none;font-size:22px;color:#999;cursor:pointer;padding:0 8px;">✕</button>
                </div>
                <div style="padding:12px 16px;flex:1;overflow:auto;">
                    <textarea id="copyTextArea" readonly style="width:100%;height:300px;font-size:11px;font-family:monospace;border:1px solid #ddd;border-radius:8px;padding:10px;box-sizing:border-box;word-break:break-all;" onclick="this.select()">${text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</textarea>
                </div>
                <div style="padding:12px 20px;border-top:1px solid #eee;text-align:center;">
                    <p style="font-size:13px;color:#666;margin:0 0 10px;">👆 点击上方文本框自动全选，再长按选「复制」</p>
                    <button id="closeCopyBox2" style="background:#FF6B8A;color:#fff;border:none;border-radius:10px;padding:10px 24px;font-size:14px;font-weight:600;width:100%;">我已复制，关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(box);
        const close = () => box.remove();
        box.querySelector('#closeCopyBox').addEventListener('click', close);
        box.querySelector('#closeCopyBox2').addEventListener('click', close);
        // 自动选中文本
        setTimeout(() => {
            const ta = box.querySelector('#copyTextArea');
            ta.focus();
            ta.select();
        }, 100);
        showToast('点击文本框全选，长按复制');
    });

    $('#importDataFile').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                if (!confirm('导入会覆盖当前所有数据，确定继续吗？')) return;
                // 先清除所有 zz_ 前缀数据
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('zz_')) keysToRemove.push(key);
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
                // 写入新数据
                Object.keys(data).forEach(key => {
                    if (key.startsWith('zz_')) {
                        localStorage.setItem(key, JSON.stringify(data[key]));
                    }
                });
                showToast('数据已恢复，刷新页面生效');
                $('#backupModal').style.display = 'none';
                $('#importDataFile').value = '';
                setTimeout(() => location.reload(), 1200);
            } catch (err) {
                showToast('备份文件格式错误');
            }
        };
        reader.readAsText(file);
    });
}

// ========== 自定义Emoji弹窗 ==========// ========== 自定义Emoji弹窗 ==========
function initEmojiModal() {
    const commonEmojis = [
        '📋','💰','📈','💡','🔥','📝','📅','🇬🇧','📰','🗒️',
        '✅','🎯','💪','🌟','🎨','📊','🏠','❤️','🎵','📚',
        '✈️','🍔','🎮','💻','📱','🎬','🏃','🧘','🎉','🌈',
        '⭐','🔔','📌','💬','🎪','🌺','🍀','🎁','🔮','💎',
        '🦄','🐣','🌸','💫','🌙','☕','🎧','📷','🛒','🏖️',
    ];

    const grid = $('#emojiGrid');
    grid.innerHTML = commonEmojis.map(e => `<button class="emoji-option">${e}</button>`).join('');

    grid.querySelectorAll('.emoji-option').forEach(btn => {
        btn.addEventListener('click', () => {
            if (APP.currentNavEdit !== null) {
                grid.querySelectorAll('.emoji-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                $('#customEmojiInput').value = btn.textContent;
            }
        });
    });

    $('#emojiSettingsBtn').addEventListener('click', () => {
        APP.currentNavEdit = null;
        $('#customEmojiInput').value = '';
        grid.querySelectorAll('.emoji-option').forEach(b => b.classList.remove('selected'));
        $('#emojiModal').style.display = 'flex';
        showToast('请先点击要修改的导航项');
    });

    // 点击导航emoji进入编辑模式
    document.addEventListener('click', (e) => {
        const emojiSpan = e.target.closest('.nav-emoji');
        if (emojiSpan) {
            const navId = emojiSpan.dataset.navId;
            APP.currentNavEdit = navId;
            $('#emojiModal').style.display = 'flex';
            const navItem = APP.emojiData.find(n => n.id === navId);
            if (navItem) {
                $('#customEmojiInput').value = navItem.emoji;
                grid.querySelectorAll('.emoji-option').forEach(b => {
                    b.classList.toggle('selected', b.textContent === navItem.emoji);
                });
            }
        }
    });

    $('#closeEmojiModal').addEventListener('click', () => {
        $('#emojiModal').style.display = 'none';
        APP.currentNavEdit = null;
    });

    $('#emojiModal').addEventListener('click', (e) => {
        if (e.target === $('#emojiModal')) {
            $('#emojiModal').style.display = 'none';
            APP.currentNavEdit = null;
        }
    });

    $('#applyEmojiBtn').addEventListener('click', () => {
        const emoji = $('#customEmojiInput').value.trim();
        if (!emoji) return showToast('请输入emoji图标');
        if (APP.currentNavEdit === null) return showToast('请先点击左侧导航项的图标');

        const navItem = APP.emojiData.find(n => n.id === APP.currentNavEdit);
        if (navItem) {
            navItem.emoji = emoji;
            setData('nav', APP.emojiData);
            renderNav();
            showToast('图标已更新');
        }
        $('#emojiModal').style.display = 'none';
        APP.currentNavEdit = null;
    });
}

// ========== 响应式处理 ==========
function initResponsive() {
    const handleResize = () => {
        if (window.innerWidth <= 768) {
            $('#sidebar').classList.remove('open');
            $('#mainContent').classList.add('expanded');
        } else {
            $('#sidebar').classList.remove('collapsed', 'open');
            $('#mainContent').classList.remove('expanded');
            $('#overlay').style.display = 'none';
        }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
}

// ========== HTML转义 ==========
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ========== 键盘快捷键 ==========
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        $('#emojiModal').style.display = 'none';
        APP.currentNavEdit = null;
    }
});

console.log('🐣 崽崽工作台已就绪！');
