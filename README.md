# 🍿 Netflix Ratings Overlay

A Tampermonkey userscript that adds **IMDb ⭐ and Rotten Tomatoes 🍅 ratings** directly to Netflix movie/show pages.  
No more switching tabs — instantly see how titles are rated before you hit play.  

---

## ✨ Features
- ⭐ IMDb rating and 🍅 Rotten Tomatoes score displayed on Netflix.
- ⚡ Auto-updates when you select a new title (no refresh needed).
- 💾 Local cache (24h) to reduce API calls.
- 🎨 Clean Netflix-style badge overlay.
- 🔑 Works with your own [OMDb API key](https://www.omdbapi.com/apikey.aspx).

---

## 🚀 Installation
1. Install [Tampermonkey](https://www.tampermonkey.net/) in your browser.  
2. Click **Create a new script**.  
3. Paste the code from [`netflix-ratings-overlay.user.js`](./netflix-ratings-overlay.user.js).  
4. Replace `API_KEY` in the script with your [OMDb API key](https://www.omdbapi.com/apikey.aspx).  
5. Save ✅ and visit [Netflix](https://www.netflix.com).  
6. Open any movie/show — ratings will appear under the title.

---

## 🔧 Configuration
Inside the script you can change:
- `API_KEY` → Your OMDb API key.  
- `CACHE_TTL` → How long ratings are cached (default: 24h).  
- `DEBOUNCE_MS` → Delay for detecting Netflix navigation (default: 500ms).  

---

## 📸 Screenshot
<img width="1405" height="816" alt="Netflix-Ratings-Overlay" src="https://github.com/user-attachments/assets/1fd1236c-526e-4dc1-bdbe-70ab0c4bc2af" />

---

## 🛠 Tech
- **Tampermonkey** for running userscripts.  
- **OMDb API** for movie/TV ratings.  
- **MutationObserver** to detect Netflix modal navigation.  

---

## ⚠️ Notes
- Requires a **free OMDb API key**.  
- Works best in Netflix **preview modals** (click on a movie/show tile).  
- If ratings don’t load, check the console for OMDb errors.  

---
