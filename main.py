#!/usr/bin/env python3

"""
VS Code AI Agent - Universal Setup & Launch Script
Automatically detects OS, installs dependencies, sets up extension, and opens VS Code
Works on Windows, macOS, and Linux without any configuration needed
"""

import os
import sys
import platform
import subprocess
import json
import shutil
import time
from pathlib import Path


class VSCodeAIAgentSetup:
    """Unified setup and launch handler for all platforms"""

    def __init__(self):
        self.platform = platform.system()
        self.home = str(Path.home())
        self.script_dir = os.path.dirname(os.path.abspath(__file__))
        self.colors = {
            'BLUE': '\033[34m',
            'GREEN': '\033[32m',
            'RED': '\033[31m',
            'YELLOW': '\033[33m',
            'RESET': '\033[0m'
        }

    def log(self, message, level='INFO'):
        """Print colored log messages"""
        icons = {'INFO': '➜', 'SUCCESS': '✓', 'ERROR': '✗', 'WARNING': '⚠'}
        colors = {
            'INFO': self.colors['BLUE'],
            'SUCCESS': self.colors['GREEN'],
            'ERROR': self.colors['RED'],
            'WARNING': self.colors['YELLOW']
        }
        icon = icons.get(level, '➜')
        color = colors.get(level, self.colors['BLUE'])
        print(f"{color}{icon}{self.colors['RESET']} {message}")

    def print_header(self, text):
        """Print formatted header"""
        print(f"\n{'='*80}")
        print(f"  {text}")
        print(f"{'='*80}\n")

    def get_platform_name(self):
        """Get human-readable platform name"""
        if self.platform == 'Windows':
            return 'Windows'
        elif self.platform == 'Darwin':
            return 'macOS'
        elif self.platform == 'Linux':
            return 'Linux'
        return 'Unknown'

    def run_command(self, cmd, shell=False, check=True):
        """Run shell command and return result"""
        try:
            if isinstance(cmd, str):
                result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            else:
                result = subprocess.run(cmd, shell=shell, capture_output=True, text=True)

            if check and result.returncode != 0:
                self.log(f"Command failed: {result.stderr}", 'ERROR')
                return None
            return result.stdout.strip() if result.stdout else True
        except Exception as e:
            self.log(f"Command execution error: {str(e)}", 'ERROR')
            return None

    def check_node_js(self):
        """Check if Node.js is installed"""
        self.log("Checking Node.js installation...")
        version = self.run_command('node --version', check=False)
        if version:
            self.log(f"Node.js {version} found", 'SUCCESS')
            return True
        self.log("Node.js not found", 'ERROR')
        self.log("Install from: https://nodejs.org/", 'INFO')
        return False

    def check_npm(self):
        """Check if npm is installed"""
        self.log("Checking npm installation...")
        version = self.run_command('npm --version', check=False)
        if version:
            self.log(f"npm {version} found", 'SUCCESS')
            return True
        self.log("npm not found", 'ERROR')
        return False

    def check_vscode(self):
        """Check if VS Code is installed"""
        self.log("Checking VS Code installation...")

        if self.platform == 'Windows':
            paths = [
                r"C:\Program Files\Microsoft VS Code\bin\code.cmd",
                r"C:\Program Files (x86)\Microsoft VS Code\bin\code.cmd",
                os.path.expandvars(r"%LOCALAPPDATA%\Programs\Microsoft VS Code\bin\code.cmd")
            ]
            for path in paths:
                if os.path.exists(path):
                    self.log("VS Code found", 'SUCCESS')
                    return True
        else:
            # macOS and Linux
            result = self.run_command('which code', check=False)
            if result:
                self.log("VS Code found", 'SUCCESS')
                return True

        self.log("VS Code not found", 'WARNING')
        self.log("Install VS Code from: https://code.visualstudio.com/", 'INFO')
        return False

    def install_dependencies(self):
        """Install npm dependencies (skip if bundled)"""
        # Check if node_modules already exists (pre-bundled)
        if os.path.exists('node_modules') and os.path.isdir('node_modules'):
            self.log("✓ Dependencies already bundled (node_modules found)", 'SUCCESS')
            self.log("Skipping npm install - using pre-installed dependencies", 'INFO')
            return True
        
        self.log("Installing npm dependencies...")
        if not self.run_command('npm install'):
            self.log("Failed to install dependencies", 'ERROR')
            return False
        self.log("Dependencies installed successfully", 'SUCCESS')
        return True

    def build_extension(self):
        """Build the TypeScript extension"""
        self.log("Building TypeScript extension...")
        if not self.run_command('npm run compile'):
            self.log("Failed to compile extension", 'ERROR')
            return False
        self.log("Extension built successfully", 'SUCCESS')
        return True

    def package_extension(self):
        """Package extension as VSIX"""
        self.log("Packaging extension as VSIX...")

        # Check if vsce is available
        result = self.run_command('vsce --version', check=False)
        if not result:
            self.log("Installing vsce globally...")
            if not self.run_command('npm install -g @vscode/vsce'):
                self.log("Failed to install vsce", 'ERROR')
                return False

        vsix_path = os.path.join(self.script_dir, 'vscode-ai-agent-1.0.0.vsix')
        if os.path.exists(vsix_path):
            self.log("VSIX package already exists", 'SUCCESS')
            return True

        if not self.run_command('vsce package --allow-missing-repository'):
            self.log("Failed to package extension", 'ERROR')
            return False

        self.log("Extension packaged successfully", 'SUCCESS')
        return True

    def install_extension_vscode(self):
        """Install extension in VS Code"""
        self.log("Installing extension in VS Code...")

        vsix_path = os.path.join(self.script_dir, 'vscode-ai-agent-1.0.0.vsix')
        if not os.path.exists(vsix_path):
            self.log(f"VSIX file not found at {vsix_path}", 'ERROR')
            return False

        # Absolute path for the VSIX
        abs_vsix_path = os.path.abspath(vsix_path)

        cmd = f'code --install-extension "{abs_vsix_path}"'
        if not self.run_command(cmd, check=False):
            self.log("Failed to install extension", 'WARNING')
            self.log(f"You can manually install: {abs_vsix_path}", 'INFO')
            return False

        self.log("Extension installed in VS Code", 'SUCCESS')
        return True

    def open_vscode(self):
        """Open VS Code with workspace"""
        self.log("Opening VS Code with AI Agent...")

        abs_workspace = os.path.abspath(self.script_dir)

        try:
            if self.platform == 'Windows':
                os.startfile(abs_workspace)
            elif self.platform == 'Darwin':
                subprocess.Popen(['open', abs_workspace])
            elif self.platform == 'Linux':
                subprocess.Popen(['xdg-open', abs_workspace])

            self.log("VS Code opening... Check your screen!", 'SUCCESS')
            time.sleep(2)
            return True
        except Exception as e:
            self.log(f"Error opening VS Code: {str(e)}", 'WARNING')
            self.log(f"Open manually: {abs_workspace}", 'INFO')
            return False

    def show_welcome_message(self):
        """Display welcome and next steps"""
        print(f"\n{'='*80}")
        print("  🎉 SETUP COMPLETE!")
        print(f"{'='*80}\n")

        print("✨ What's Next:\n")
        print("  1. ✅ VS Code should be opening with AI Agent integrated")
        print("  2. ⚙️  See welcome message with setup options")
        print("  3. 🔑 Configure your AI provider (Gemini, OpenAI, Azure, or Copilot)")
        print("  4. 💬 Press Ctrl+Alt+A (Windows/Linux) or Cmd+Alt+A (macOS) to open chat\n")

        print(f"{'='*80}")
        print("  📚 Documentation:")
        print("  • README.md - Quick overview")
        print("  • QUICK_START.md - 5-minute guide")
        print("  • INTEGRATION_GUIDE.md - Full integration guide")
        print("  • OS_COMPATIBILITY.md - OS-specific details")
        print(f"{'='*80}\n")

    def run_setup(self):
        """Main setup flow"""
        self.print_header(f"🤖 VS Code AI Agent Setup ({self.get_platform_name()})")

        # Check prerequisites
        print("📋 Checking Prerequisites...\n")

        if not self.check_node_js():
            return False

        if not self.check_npm():
            return False

        vscode_found = self.check_vscode()

        # Build and package
        print("\n⚙️  Building and Packaging...\n")

        if not self.install_dependencies():
            return False

        if not self.build_extension():
            return False

        if not self.package_extension():
            return False

        # Install extension
        print("\n📦 Installing Extension...\n")

        if vscode_found:
            if not self.install_extension_vscode():
                self.log("Extension installation skipped", 'WARNING')
        else:
            self.log("VS Code not found - skipping extension installation", 'WARNING')
            self.log("Install VS Code first, then run this script again", 'INFO')

        # Open VS Code
        print("\n🚀 Launching VS Code...\n")

        if vscode_found:
            self.open_vscode()

        # Show welcome message
        self.show_welcome_message()
        return True

    def main(self):
        """Entry point"""
        try:
            success = self.run_setup()
            sys.exit(0 if success else 1)
        except KeyboardInterrupt:
            print("\n\n❌ Setup cancelled by user")
            sys.exit(1)
        except Exception as e:
            self.log(f"Unexpected error: {str(e)}", 'ERROR')
            sys.exit(1)


if __name__ == '__main__':
    setup = VSCodeAIAgentSetup()
    setup.main()
