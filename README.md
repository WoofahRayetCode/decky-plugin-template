# TTL Changer Plugin

A Steam Deck plugin that changes the system TTL (Time To Live) value to 65 for improved network compatibility with mobile hotspots and carrier networks.

## Features

- 🔧 Change system TTL value to 65 with one click
- 📊 Display current TTL value
- 🔄 Reset TTL to default system value (usually 64)
- ⚡ Real-time status updates
- 🛡️ Safe TTL modification with proper validation

## Why Change TTL?

Many mobile carriers and hotspot providers use TTL values to detect tethering usage. By setting your Steam Deck's TTL to 65, packets from your device will appear to come from a regular mobile device (which typically have TTL 64 after one hop), helping avoid potential throttling or restrictions.

## Installation

### Prerequisites

This plugin requires [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader) to be installed on your Steam Deck.

### Install via Decky Loader

1. Open Decky Loader on your Steam Deck
2. Navigate to the Plugin Store
3. Search for "TTL Changer"
4. Click Install

### Manual Installation

1. Download the latest release from the releases page
2. Extract the files to your Steam Deck's plugins directory:
   ```bash
   scp -r dist/* deck@steamdeck:~/homebrew/plugins/ttl-changer-plugin/
   ```
3. Restart Decky Loader

## Usage

1. Open the Quick Access menu (QAM) on your Steam Deck
2. Navigate to the TTL Changer plugin
3. View the current TTL value
4. Click "Set TTL to 65" to change the system TTL
5. Click "Reset TTL" to restore the default value

## Development

### Dependencies

This plugin requires Node.js and pnpm:

```bash
npm install -g pnpm
```

Install project dependencies:

```bash
pnpm install
```

### Building

Build the plugin:

```bash
pnpm run build
```

### Development Mode

For live development with automatic rebuilding:

```bash
pnpm run watch
```

View Python backend logs:

```bash
decky log
```

## Technical Details

- **Frontend**: React with TypeScript using Decky UI components
- **Backend**: Python script that uses subprocess calls to modify iptables
- **TTL Modification**: Uses iptables NETFILTER_QUEUE target to modify outgoing packets
- **Permissions**: Requires root access for iptables modifications

## Security Note

This plugin requires root privileges to modify network settings. The plugin only changes TTL values and does not access or modify any other system components.

## License

This project is licensed under the BSD-3-Clause License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/SteamDeckHomebrew/ttl-changer-plugin/issues) page
2. Create a new issue with detailed information
3. Join the [Decky Loader Discord](https://discord.gg/ZU74G2NJzk) for community support

## Changelog

### v1.0.0
- Initial release
- TTL modification to 65
- Current TTL display
- Reset functionality
- Real-time status updates
