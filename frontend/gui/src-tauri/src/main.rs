#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use tauri::{WebviewUrl, WebviewWindowBuilder};
use url::Url;

fn parse_backend_url() -> Result<Url, String> {
    let mut args = env::args().skip(1);
    while let Some(arg) = args.next() {
        if arg == "--url" {
            let value = args
                .next()
                .ok_or_else(|| "missing value for --url".to_string())?;
            return Url::parse(&value).map_err(|err| format!("invalid --url value: {err}"));
        }
    }
    Err("missing required --url argument".to_string())
}

fn main() {
    let backend_url = parse_backend_url().unwrap_or_else(|err| {
        eprintln!("Crush GUI shell: {err}");
        std::process::exit(1);
    });

    tauri::Builder::default()
        .setup(move |app| {
            WebviewWindowBuilder::new(app, "main", WebviewUrl::External(backend_url.clone()))
                .title("Crush GUI")
                .inner_size(1440.0, 920.0)
                .min_inner_size(960.0, 640.0)
                .build()
                .map(|_| ())
                .map_err(Into::into)
        })
        .run(tauri::generate_context!())
        .expect("failed to run Crush GUI shell");
}
