<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# TTL Changer Plugin for Steam Deck

This is a Decky plugin for Steam Deck that allows users to change the system TTL (Time To Live) value to 65 for network compatibility.

## Project Structure
- Uses TypeScript for the frontend React components
- Uses Python for the backend system operations
- Follows Decky plugin architecture with @decky/api and @decky/ui

## Development Guidelines
- Frontend uses React with Decky UI components
- Backend uses Python with subprocess calls for system modifications
- TTL changes require root privileges (_root flag in plugin.json)
- All system modifications should be logged properly
- Error handling should provide clear user feedback through toaster notifications

## Key Features
- Display current TTL value with color coding
- Set TTL to 65 for network compatibility
- Reset TTL to default (64)
- Make TTL changes persistent across reboots
- Real-time status updates and user feedback
