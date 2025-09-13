// ==UserScript==
// @name         Netflix Ratings Overlay
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Show IMDb ⭐ & Rotten Tomatoes 🍅 ratings on Netflix with modern styling
// @match        https://www.netflix.com/*
// @grant        GM_xmlhttpRequest
// @connect      www.omdbapi.com
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log("✅ Netflix Ratings Overlay (Modern UI) loaded");

    const API_KEY = 'afad9ecc'; // your OMDb key
    const CACHE_TTL = 1000 * 60 * 60 * 24;
    const DEBOUNCE_MS = 500;

    let lastTitle = '';
    let debounceTimer;

    const CACHE_KEY = 'nf_ratings_cache_modern';
    const loadCache = () => JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const saveCache = (c) => localStorage.setItem(CACHE_KEY, JSON.stringify(c));
    const getCached = (k) => {
        const c = loadCache();
        const e = c[k];
        if (!e) return null;
        if (Date.now() - e.ts > CACHE_TTL) {
            delete c[k];
            saveCache(c);
            return null;
        }
        return e.data;
    };
    const setCached = (k, data) => {
        const c = loadCache();
        c[k] = { ts: Date.now(), data };
        saveCache(c);
    };

    function sanitize(s) {
        return (s || '').trim().replace(/\s+/g, ' ');
    }

    function findNetflixTitle() {
        const header = document.querySelector('.previewModal--section-header strong');
        return header && header.textContent.trim() ? header.textContent.trim() : null;
    }

    function createBadge() {
        const div = document.createElement('div');
        div.className = 'nf-ratings-overlay';
        div.style.cssText = `
            margin-top: 14px;
            display: flex;
            gap: 12px;
            align-items: center;
            font-size: 14px;
            font-family: 'Netflix Sans', Helvetica, Arial, sans-serif;
            font-weight: 500;
        `;
        return div;
    }

    function styledTag(bg, fg, text) {
        return `
          <span style="
            background:${bg};
            color:${fg};
            padding:6px 12px;
            border-radius:20px;
            font-weight:600;
            font-size:13px;
            min-width:60px;
            text-align:center;
            box-shadow:0 2px 6px rgba(0,0,0,0.4);
          ">
            ${text}
          </span>`;
    }

    function updateBadge(badge, data) {
        if (!data || data.Response === 'False') {
            badge.innerHTML = styledTag("#444", "#ccc", "❌ No ratings");
            return;
        }

        let html = '';

        if (data.imdbRating && data.imdbRating !== 'N/A') {
            html += styledTag("#f5c518", "#000", `⭐ IMDb ${data.imdbRating}`);
        }

        if (data.Ratings) {
            const rt = data.Ratings.find(r => r.Source === 'Rotten Tomatoes');
            if (rt && rt.Value !== 'N/A') {
                const score = parseInt(rt.Value);
                const color = score >= 60 ? "#e63946" : "#6c757d";
                html += styledTag(color, "#fff", `🍅 ${rt.Value}`);
            }
        }

        badge.innerHTML = html || styledTag("#444", "#ccc", "❌ Not available");
    }

    function cleanTitle(title) {
        return title.replace(/:.*$/, '').replace(/\(.*\)/, '').trim();
    }

    function fetchRatings(title, callback) {
        const cleaned = cleanTitle(title);
        const cacheKey = cleaned;
        const cached = getCached(cacheKey);

        if (cached) {
            callback(cached);
            return;
        }

        const url = `https://www.omdbapi.com/?apikey=${API_KEY}&t=${encodeURIComponent(cleaned)}`;
        GM_xmlhttpRequest({
            method: 'GET',
            url,
            onload: function(resp) {
                try {
                    const data = JSON.parse(resp.responseText);
                    if (data && data.Response === "True") {
                        setCached(cacheKey, data);
                        callback(data);
                    } else {
                        callback(null);
                    }
                } catch {
                    callback(null);
                }
            },
            onerror: () => callback(null)
        });
    }

    function processNetflixTitle() {
        const titleText = findNetflixTitle();
        if (!titleText) return;

        const raw = sanitize(titleText);
        if (!raw || raw === lastTitle) return;

        lastTitle = raw;
        console.log("📺 New Netflix title:", raw);

        // remove old badge
        const oldBadge = document.querySelector('.nf-ratings-overlay');
        if (oldBadge) oldBadge.remove();

        const badge = createBadge();
        const container = document.querySelector('.previewModal--detailsMetadata-info')
                       || document.querySelector('.previewModal--section-header');
        (container || document.body).appendChild(badge);

        badge.innerHTML = styledTag("#333", "#aaa", "⏳ Loading...");
        fetchRatings(raw, (data) => updateBadge(badge, data));
    }

    function debounceProcess() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(processNetflixTitle, DEBOUNCE_MS);
    }

    const observer = new MutationObserver(() => {
        const modal = document.querySelector('.previewModal--container');
        if (!modal) {
            lastTitle = '';
            const oldBadge = document.querySelector('.nf-ratings-overlay');
            if (oldBadge) oldBadge.remove();
        }
        debounceProcess();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('popstate', debounceProcess);
    window.addEventListener('click', debounceProcess);

    debounceProcess();
})();
