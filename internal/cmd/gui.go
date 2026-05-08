package cmd

import (
	"context"
	"fmt"
	"os"
	"os/signal"
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
		if err := browser.OpenURL(url); err != nil {
			fmt.Fprintf(os.Stdout, "Could not open browser automatically: %v\n", err)
		}

		ctx, stop := signal.NotifyContext(cmd.Context(), os.Interrupt)
		defer stop()
		<-ctx.Done()
		return nil
	},
}
