import os
import subprocess
import asyncio

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
            # Set TTL using echo command (requires root privileges)
            result = subprocess.run(['sudo', 'bash', '-c', f'echo {ttl_value} > /proc/sys/net/ipv4/ip_default_ttl'], 
                                  capture_output=True, text=True, check=True)
            
            # Verify the change was applied
            new_ttl = await self.get_current_ttl()
            if new_ttl == ttl_value:
                decky.logger.info(f"Successfully set TTL to {ttl_value}")
                return True
            else:
                decky.logger.error(f"Failed to set TTL. Expected {ttl_value}, got {new_ttl}")
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
            # Add TTL setting to sysctl.conf for persistence
            sysctl_line = f"net.ipv4.ip_default_ttl = {ttl_value}\n"
            
            # Check if the setting already exists
            try:
                with open('/etc/sysctl.conf', 'r') as f:
                    content = f.read()
                    if 'net.ipv4.ip_default_ttl' in content:
                        # Remove existing line
                        lines = content.split('\n')
                        lines = [line for line in lines if not line.strip().startswith('net.ipv4.ip_default_ttl')]
                        content = '\n'.join(lines)
            except:
                content = ""
            
            # Add our setting
            content += sysctl_line
            
            # Write back to file (requires root)
            result = subprocess.run(['sudo', 'bash', '-c', f'echo "{content}" > /etc/sysctl.conf'], 
                                  capture_output=True, text=True, check=True)
            
            decky.logger.info(f"Made TTL {ttl_value} persistent across reboots")
            return True
        except Exception as e:
            decky.logger.error(f"Error making TTL persistent: {e}")
            return False

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
