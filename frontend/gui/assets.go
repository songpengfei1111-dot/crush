package frontendgui

import "embed"

// Assets contains the built GUI frontend resources.
//
//go:embed dist dist/**
var Assets embed.FS
