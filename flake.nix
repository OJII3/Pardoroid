{
  description = "A basic flake to with flake-parts";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixpkgs-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
    systems.url = "github:nix-systems/default";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    inputs@{ self, systems, nixpkgs, flake-parts, rust-overlay, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = import inputs.systems;
      perSystem = { config, pkgs, system, ... }: {
        _module.args.pkgs = import nixpkgs {
          inherit system;
          config = {
            allowUnfree = true; # Allow unfree packages
          };
          overlays = [
            rust-overlay.overlays.default
          ];
        };
        # When execute `nix develop`, you go in shell installed nil.
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs
            pkg-config
            (rust-bin.stable.latest.default.override {
              extensions = [ "rust-src" "rust-analyzer" ];
              targets = [ "aarch64-linux-android" ];
            })

            # GTK3 and system libraries for Tauri
            gtk3
            glib
            cairo
            pango
            gdk-pixbuf
            atk

            # WebKit for Tauri
            webkitgtk_4_1

            # Additional build dependencies
            openssl
            librsvg
          ];

          shellHook = ''
            export ANDROID_HOME=$HOME/Android/Sdk/
            export NDK_HOME=$HOME/Android/Sdk/ndk/29.0.13599879/

            node --version | sed 's/v//' > .node-version
          '';
        };
      };
    };
}
