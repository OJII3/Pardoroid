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
      perSystem = { config, pkgs, system, ... }:
        {
          _module.args.pkgs = import nixpkgs {
            inherit system;
            config = {
              allowUnfree = true; # Allow unfree packages
              # android_sdk.accept_license = true; # Accept Android SDK license
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

              # Additional build dependencies
              openssl
              librsvg

              rustup
            ]
            ++ lib.optionals (system == "x86_64-linux") [
              # WebKit for Tauri
              webkitgtk_4_1
            ];

            shellHook = ''
              export ANDROID_HOME=${pkgs.androidenv.androidPkgs.tools}/libexec/android-sdk/
              export NDK_HOME=${pkgs.androidenv.androidPkgs.ndk-bundle}/libexec/android-sdk/ndk/28.1.13356709/
            '';
          };
        };
    };
}
