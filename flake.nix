{
  description = "React Native development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config = {
            allowUnfree = true;
            android_sdk.accept_license = true;
          };
        };

        androidComposition = pkgs.androidenv.composeAndroidPackages {
          cmdLineToolsVersion = "9.0";
          toolsVersion = "26.1.1";
          platformToolsVersion = "35.0.2";
          buildToolsVersions = [ "35.0.0" ];
          platformVersions = [ "35" ];
          includeNDK = true;
          ndkVersion = "27.1.12297006";
          cmakeVersions = [ "3.22.1" ];
          includeExtras = [
            "extras;android;m2repository"
            "extras;google;m2repository"
          ];
        };
      in
      {
        devShells.default = pkgs.mkShell {
          name = "react-native-shell";

          buildInputs = with pkgs; lib.unique ([
            # Node.js and pnpm
            nodejs_23

            # Python environment
            python3
            python3Packages.pip
            python3Packages.virtualenv
            python3Packages.setuptools
            python3Packages.wheel

            # Android development
            androidComposition.androidsdk
            androidComposition.platform-tools
            androidComposition.build-tools
            androidComposition.platforms
            androidComposition.cmake
            jdk17_headless
            gradle

            watchman
          ] ++ lib.optionals stdenv.isDarwin [
            # iOS development (macOS only)
            cocoapods
            ruby_3_2
            pkg-config
            xcbeautify
            libimobiledevice
            ccache
          ]);

          shellHook = ''
            # Set up Node.js environment
            export NODE_ENV=development
            
            # Set up pnpm
            export PNPM_HOME="$HOME/.local/share/pnpm"
            export PATH="$PNPM_HOME:$PATH"

            # Set up Python environment
            export PYTHONPATH="${pkgs.python3}/lib/python3.11/site-packages:$PYTHONPATH"
            export PIP_PREFIX="$(pwd)/.venv"
            export PYTHONPATH="$PIP_PREFIX/${pkgs.python3.sitePackages}:$PYTHONPATH"
            export PATH="$PIP_PREFIX/bin:$PATH"
            
            # Create virtual environment if it doesn't exist
            if [ ! -d .venv ]; then
              echo "Creating Python virtual environment..."
              ${pkgs.python3}/bin/python -m venv .venv
            fi
            
            # Set up Android environment
            export ANDROID_HOME="${androidComposition.androidsdk}/libexec/android-sdk"
            export ANDROID_SDK_ROOT="$ANDROID_HOME"
            export ANDROID_NDK_ROOT="$ANDROID_HOME/ndk-bundle"
            export PATH="$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
            
            # Set up Java environment
            export JAVA_HOME="${pkgs.jdk17_headless}"
            export PATH="$JAVA_HOME/bin:$PATH"
            
            # Set up Gradle
            export GRADLE_HOME="${pkgs.gradle}/lib/gradle"
            export PATH="$GRADLE_HOME/bin:$PATH"

            # Enable Hermes and New Architecture for Android
            export ANDROID_HERMES_ENABLED=true
            export ANDROID_NEW_ARCH_ENABLED=true

            # Set up direnv
            eval "$(direnv hook bash)"

            # iOS development setup
            if [[ "$OSTYPE" == "darwin"* ]]; then
              # Set up CocoaPods
              export LANG=en_US.UTF-8
              export LC_ALL=en_US.UTF-8
              
              # Ensure we're using Nix's Ruby and CocoaPods
              export PATH="${pkgs.ruby_3_2}/bin:${pkgs.cocoapods}/bin:$PATH"
              export GEM_HOME="${pkgs.cocoapods}/lib/ruby/gems/3.2.0"
              export GEM_PATH="${pkgs.cocoapods}/lib/ruby/gems/3.2.0"
              
              # Set up Xcode tools with highest priority
              export DEVELOPER_DIR="/Applications/Xcode.app/Contents/Developer"
              export PATH="$DEVELOPER_DIR/Toolchains/XcodeDefault.xctoolchain/usr/bin:$DEVELOPER_DIR/usr/bin:$PATH"
              
              # Enable new architecture for iOS
              export RCT_NEW_ARCH_ENABLED=1
              
              # Set up Xcode environment
              export SDKROOT="$DEVELOPER_DIR/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk"
              export MACOSX_DEPLOYMENT_TARGET="11.0"
              
              # Set up iOS development environment
              export IOS_DEPLOYMENT_TARGET="15.1"
              export IPHONEOS_DEPLOYMENT_TARGET="15.1"
            fi

            # Add project's node_modules/.bin to PATH
            export PATH="$(pwd)/node_modules/.bin:$PATH"

            # Print development environment information
            echo "=== Development Environment ==="
            
            # Android Environment
            echo "Android SDK:"
            echo "  SDK Root: $ANDROID_HOME"
            echo "  NDK Root: $ANDROID_NDK_ROOT"
            echo "  SDK Version: $(sdkmanager --version)"
            echo "  Platform Tools: $(adb version | head -n1)"
            echo "  Build Tools: $(ls -1 $ANDROID_HOME/build-tools | sort -V | tail -n1)"
            echo "  Platform: Android $(ls -1 $ANDROID_HOME/platforms | grep -o '[0-9]*' | sort -V | tail -n1)"
            echo "  NDK Version: $(ls -1 $ANDROID_HOME/ndk | sort -V | tail -n1)"
            
            # iOS Environment (macOS only)
            if [[ "$OSTYPE" == "darwin"* ]]; then
              echo "iOS Environment:"
              echo "  Xcode Version: $(xcodebuild -version | head -n1)"
              echo "  GCC Version: $(gcc --version | head -n1)"
              echo "  Clang Version: $(clang --version | head -n1)"
              echo "  CocoaPods Version: $(pod --version)"
              echo "  Ruby Version: $(ruby --version)"
              echo "  Deployment Target: $IOS_DEPLOYMENT_TARGET"
            fi
            
            # Common Environment
            echo "Common Environment:"
            echo "  Node Version: $(node --version)"
            echo "  npm Version: $(npm --version)"
            echo "  pnpm Version: $(pnpm --version)"
            echo "  Python Version: $(python3 --version)"
            echo "  Java Version: $(java -version 2>&1 | head -n1)"
            echo "  Gradle Version: $(gradle --version | grep Gradle | head -n1)"
            echo "====================================="
          '';
        };
      }
    );
} 