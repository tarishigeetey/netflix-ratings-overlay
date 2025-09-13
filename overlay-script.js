// ==UserScript==
// @name         Netflix Ratings Overlay
// @namespace    http://tampermonkey.net/
// @version      1.8
// @description  Show IMDb ⭐ & Rotten Tomatoes 🍅 ratings on Netflix (auto-updates when selecting new movie)
// @match        https://www.netflix.com/*
// @grant        GM_xmlhttpRequest
// @connect      www.omdbapi.com
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log("✅ Netflix Ratings Overlay script loaded");

    const API_KEY = ''; // your OMDb key
    const CACHE_TTL = 1000 * 60 * 60 * 24;
    const DEBOUNCE_MS = 500;

    let lastTitle = '';
    let debounceTimer;

    const CACHE_KEY = 'nf_ratings_cache_v7';
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
        if (header && header.textContent.trim()) {
            return header.textContent.trim();
        }
        return null;
    }

    function createBadge() {
        const div = document.createElement('div');
        div.className = 'nf-ratings-overlay';
        div.style.cssText = `
            margin-top: 8px;
            font-size: 16px;
            color: #e5e5e5;
            background: rgba(0,0,0,0.7);
            padding: 8px 14px;
            border-radius: 16px;
            display: inline-block;
            font-family: Netflix Sans, Helvetica, Arial, sans-serif;
        `;
        return div;
    }

    function updateBadge(badge, data) {
        if (!data || data.Response === 'False') {
            badge.innerHTML = '❌ Ratings not found';
            return;
        }
        let html = '';
        if (data.imdbRating && data.imdbRating !== 'N/A') {
            html += `⭐ ${data.imdbRating}/10 `;
        }
        if (data.Ratings) {
            const rt = data.Ratings.find(r => r.Source === 'Rotten Tomatoes');
            if (rt && rt.Value !== 'N/A') {
                if (html) html += ' | ';
                html += `🍅 ${rt.Value}`;
            }
        }
        badge.innerHTML = html || '❌ Ratings not available';
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

        let badge = document.querySelector('.nf-ratings-overlay');
        if (!badge) {
            badge = createBadge();
            const container = document.querySelector('.previewModal--detailsMetadata-info')
                           || document.querySelector('.previewModal--section-header');
            if (container) {
                container.appendChild(badge);
            } else {
                document.body.appendChild(badge);
            }
        }

        badge.innerHTML = '⏳ Fetching ratings...';
        fetchRatings(raw, (data) => updateBadge(badge, data));
    }

    function debounceProcess() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(processNetflixTitle, DEBOUNCE_MS);
    }

    // 🔍 Watch for Netflix modal open/close
    const observer = new MutationObserver(() => {
        debounceProcess();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('popstate', debounceProcess);
    window.addEventListener('click', debounceProcess);

    debounceProcess();
})();
