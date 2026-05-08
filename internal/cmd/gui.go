package cmd

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"time"

	"github.com/charmbracelet/crush/internal/event"
	"github.com/charmbracelet/crush/internal/gui"
	"github.com/pkg/browser"
	"github.com/spf13/cobra"
)

var guiCmd = &cobra.Command{
	Use:   "gui",
	Short: "Start the minimal GUI frontend",
	RunE: func(cmd *cobra.Command, args []string) error {
		ws, cleanup, err := setupWorkspaceWithProgressBar(cmd)
		if err != nil {
			return err
		}
		defer cleanup()

		event.AppInitialized()

		controller := gui.NewController(ws)
		server := gui.NewServer(controller)

		url, err := server.Start()
		if err != nil {
			return err
		}
		defer func() {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			_ = server.Shutdown(ctx)
		}()

		fmt.Fprintf(os.Stdout, "Crush GUI available at %s\n", url)
		if err := launchDesktopGUI(cmd.Context(), url); err == nil {
			return nil
		} else {
			fmt.Fprintf(os.Stdout, "Could not open desktop shell automatically: %v\n", err)
		}
		if err := browser.OpenURL(url); err != nil {
			fmt.Fprintf(os.Stdout, "Could not open browser automatically: %v\n", err)
		}

		ctx, stop := signal.NotifyContext(cmd.Context(), os.Interrupt)
		defer stop()
		<-ctx.Done()
		return nil
	},
}

func launchDesktopGUI(ctx context.Context, url string) error {
	frontendDir, err := findFrontendGUIDir()
	if err != nil {
		return err
	}

	manifest := filepath.Join(frontendDir, "src-tauri", "Cargo.toml")
	if _, err := os.Stat(manifest); err != nil {
		return err
	}

	cmd := exec.CommandContext(ctx, "cargo", "run", "--manifest-path", manifest, "--", "--url", url)
	cmd.Dir = frontendDir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func findFrontendGUIDir() (string, error) {
	candidates := []string{}
	if cwd, err := os.Getwd(); err == nil {
		candidates = append(candidates, cwd)
	}
	if exe, err := os.Executable(); err == nil {
		candidates = append(candidates, filepath.Dir(exe))
	}

	for _, base := range candidates {
		for dir := base; ; dir = filepath.Dir(dir) {
			frontendDir := filepath.Join(dir, "frontend", "gui")
			if _, err := os.Stat(filepath.Join(frontendDir, "package.json")); err == nil {
				return frontendDir, nil
			}
			parent := filepath.Dir(dir)
			if parent == dir {
				break
			}
		}
	}

	return "", fmt.Errorf("frontend/gui directory not found")
}
