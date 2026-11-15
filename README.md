# Poppy's Little Math Garden

A calm, full-screen companion and early-math game for little learners. Poppy is a softly animated blob who asks one small addition or subtraction question at a time, celebrates effort, and explains answers kindly. Say a color command such as “turn Poppy blue” to change Poppy's look. Replies and learning logic are scripted locally in the browser; there is no AI service, app backend, account, or message storage. The only on-screen play control is the microphone in the corner.

## Try it locally

Open `index.html` in a modern browser to see the garden. To use the microphone, open the site on HTTPS or `localhost` in a browser that supports speech recognition. If Python is installed, start a local server from this folder:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000`. Before voice play begins, a grown-up disclosure explains that the browser's speech provider may process audio. After a grown-up taps **I understand — start**, Poppy reads the first question; the microphone stays off until someone taps the corner mic to answer, when the browser may ask for permission. Poppy listens for one short turn only and stops; the microphone is never on automatically. If speech recognition is unavailable or permission is denied, the app explains the limitation. Spoken replies use the browser's speech synthesis when available.

## GitHub Pages

The site is static and ready to serve from the repository root. Asset paths are relative, and `.github/workflows/pages.yml` deploys the root from the repository's default branch with GitHub Actions.

1. Push the files to the repository's default branch.
2. In **Settings → Pages**, choose **GitHub Actions** as the build and deployment source.
3. After the workflow succeeds, a repository named `my-pet` is expected at `https://OWNER.github.io/my-pet/`. A repository named `OWNER.github.io` is expected at `https://OWNER.github.io/`. GitHub Pages shows the final URL after deployment.
