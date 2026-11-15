# Playtime with Poppy

A full-screen voice-first kitten companion for little kids, with big tap-to-answer ideas as a fallback. Poppy's replies are scripted in the app; there is no AI service, app backend, account, or message storage. Optional voice features use the browser's speech APIs. Speech recognition may send audio to the browser's speech provider; the app itself does not store or send audio or messages.

## Try it locally

Open `index.html` in a modern browser; no installation is required. To use the microphone, open it on HTTPS (such as GitHub Pages) or localhost in a browser with speech recognition support. If Python is installed, you can start a local server from this folder:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000`. A grown-up disclosure appears before the microphone is first started. Listening is one tap, one short turn, and stops automatically; if voice is unsupported or permission is denied, use the big idea buttons.

## GitHub Pages

This is a static site: `index.html`, `styles.css`, and `app.js` are in the repository root, and asset links are relative so they also work at a project-site URL.

To publish with the included GitHub Actions workflow:

1. Push the files to the repository's default branch.
2. In the repository, open **Settings → Pages** and choose **GitHub Actions** as the build and deployment source.
3. The workflow deploys the static root when the default branch is updated. To run it manually, choose the default branch in the **Actions** tab.

For a repository named `my-pet`, the expected project-site URL is `https://OWNER.github.io/my-pet/`. If the repository is named `OWNER.github.io`, the site URL is `https://OWNER.github.io/`. GitHub Pages provides the final published URL after the repository is created and deployment succeeds.
