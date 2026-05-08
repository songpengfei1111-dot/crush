package frontendgui

import "embed"

// Assets contains the built GUI frontend resources.
//
//go:embed all:dist all:dist/**
var Assets embed.FS
