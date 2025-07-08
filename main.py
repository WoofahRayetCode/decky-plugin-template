import os
import subprocess
import asyncio
from typing import Dict, Optional, Union

# The decky plugin module is located at decky-loader/plugin
# For easy intellisense checkout the decky-loader code repo
# and add the `decky-loader/plugin/imports` path to `python.analysis.extraPaths` in `.vscode/settings.json`
import decky

class Plugin:
    # Get current TTL value
    async def get_current_ttl(self) -> int:
        try:
            # Read current TTL from /proc/sys/net/ipv4/ip_default_ttl
            result = subprocess.run(['cat', '/proc/sys/net/ipv4/ip_default_ttl'], 
                                  capture_output=True, text=True, check=True)
            current_ttl = int(result.stdout.strip())
            decky.logger.info(f"Current TTL: {current_ttl}")
            return current_ttl
        except Exception as e:
            decky.logger.error(f"Error getting current TTL: {e}")
            return -1

    # Set TTL to specified value (requires root access)
    async def set_ttl(self, ttl_value: int) -> bool:
        try:
            # Validate TTL value (Steam Deck appropriate range)
            if ttl_value < 32 or ttl_value > 128:
                decky.logger.error(f"Invalid TTL value: {ttl_value}. Must be between 32 and 128 for Steam Deck")
                return False
            
            # Use direct write to avoid shell injection risks
            ttl_path = '/proc/sys/net/ipv4/ip_default_ttl'
            with open(ttl_path, 'w') as f:
                f.write(str(ttl_value))
            
            # Verify the change was applied
            new_ttl = await self.get_current_ttl()
            if new_ttl == ttl_value:
                decky.logger.info(f"Successfully set TTL to {ttl_value}")
                return True
            else:
                decky.logger.error(f"Failed to set TTL. Expected {ttl_value}, got {new_ttl}")
                return False
        except PermissionError:
            decky.logger.error("Permission denied: Plugin requires root privileges")
            return False
        except Exception as e:
            decky.logger.error(f"Error setting TTL: {e}")
            return False

    # Set TTL to 65 (the main function for this plugin)
    async def set_ttl_to_65(self) -> bool:
        return await self.set_ttl(65)

    # Check if TTL is already set to 65
    async def is_ttl_65(self) -> bool:
        current_ttl = await self.get_current_ttl()
        return current_ttl == 65

    # Reset TTL to default value (usually 64)
    async def reset_ttl_to_default(self) -> bool:
        return await self.set_ttl(64)

    # Make TTL change persistent across reboots
    async def make_ttl_persistent(self, ttl_value: int) -> bool:
        try:
            # Validate TTL value for Steam Deck
            if ttl_value < 32 or ttl_value > 128:
                decky.logger.error(f"Invalid TTL value for persistence: {ttl_value}")
                return False
            
            sysctl_conf_path = '/etc/sysctl.conf'
            sysctl_line = f"net.ipv4.ip_default_ttl = {ttl_value}"
            
            # Read existing content
            try:
                with open(sysctl_conf_path, 'r') as f:
                    lines = f.readlines()
            except FileNotFoundError:
                lines = []
            
            # Remove any existing TTL configuration
            filtered_lines = [line for line in lines 
                            if not line.strip().startswith('net.ipv4.ip_default_ttl')]
            
            # Add new TTL configuration with Steam Deck comment
            filtered_lines.append(f"# Steam Deck TTL setting for mobile hotspot compatibility\n")
            filtered_lines.append(f"{sysctl_line}\n")
            
            # Write back to file
            with open(sysctl_conf_path, 'w') as f:
                f.writelines(filtered_lines)
            
            # Apply the setting immediately
            subprocess.run(['sysctl', '-p'], check=True, capture_output=True)
            
            decky.logger.info(f"Made TTL {ttl_value} persistent across reboots for Steam Deck")
            return True
        except PermissionError:
            decky.logger.error("Permission denied: Cannot modify sysctl.conf")
            return False
        except subprocess.CalledProcessError as e:
            decky.logger.error(f"Failed to apply sysctl settings: {e}")
            return False
        except Exception as e:
            decky.logger.error(f"Error making TTL persistent: {e}")
            return False

    # Check if TTL persistence is configured and get the persistent value
    async def get_persistent_ttl(self) -> dict[str, Union[bool, int, None]]:
        try:
            sysctl_conf_path = '/etc/sysctl.conf'
            with open(sysctl_conf_path, 'r') as f:
                lines = f.readlines()
            
            for line in lines:
                line = line.strip()
                if line.startswith('net.ipv4.ip_default_ttl'):
                    # Extract TTL value from the line
                    parts = line.split('=')
                    if len(parts) == 2:
                        persistent_ttl = int(parts[1].strip())
                        return {"is_persistent": True, "ttl_value": persistent_ttl}
            
            return {"is_persistent": False, "ttl_value": None}
        except FileNotFoundError:
            return {"is_persistent": False, "ttl_value": None}
        except Exception as e:
            decky.logger.error(f"Error checking TTL persistence: {e}")
            return {"is_persistent": False, "ttl_value": None}

    # Asyncio-compatible long-running code, executed in a task when the plugin is loaded
    async def _main(self):
        self.loop = asyncio.get_event_loop()
        decky.logger.info("TTL Changer Plugin loaded!")
        
        # Log current TTL on startup
        current_ttl = await self.get_current_ttl()
        decky.logger.info(f"Current system TTL: {current_ttl}")

    # Function called first during the unload process
    async def _unload(self):
        decky.logger.info("TTL Changer Plugin unloading...")

    # Function called after `_unload` during uninstall
    async def _uninstall(self):
        decky.logger.info("TTL Changer Plugin uninstalled!")

    # Migrations that should be performed before entering `_main()`.
    async def _migration(self):
        decky.logger.info("TTL Changer Plugin migrating...")
        # Migrate any existing settings if needed
        decky.migrate_settings(
            os.path.join(decky.DECKY_HOME, "settings", "ttl-changer.json"),
            os.path.join(decky.DECKY_USER_HOME, ".config", "ttl-changer")
        )
        decky.migrate_runtime(
            os.path.join(decky.DECKY_HOME, "template"),
            os.path.join(decky.DECKY_USER_HOME, ".local", "share", "decky-template"))
    
    # Set TTL to custom value (exposed for frontend)
    async def set_ttl_custom(self, ttl_value: int) -> bool:
        return await self.set_ttl(ttl_value)
