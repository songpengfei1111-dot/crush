package frontendgui

import "embed"

// Assets contains the minimal GUI frontend resources.
//
//go:embed index.html styles.css app.js
var Assets embed.FS
