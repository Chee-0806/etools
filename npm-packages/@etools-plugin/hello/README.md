# @etools-plugin/hello

Hello World plugin for ETools - A simple greeting plugin.

## Features

- Greet users by name
- Simple example plugin structure
- Demonstrates ETools plugin API

## Usage

1. Install via ETools marketplace:
   ```
   Search for "hello" in the plugin marketplace
   Click "Install"
   ```

2. Use the plugin:
   - Type `hello:` in ETools search box
   - Type a name after the colon (e.g., `hello: Alice`)
   - Press Enter to see the greeting

## Development

```bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Watch mode for development
npm run dev

# Publish to npm
npm publish --access public
```

## Plugin Structure

```
@etools-plugin/hello/
├── package.json       # Package configuration with ETools metadata
├── tsconfig.json      # TypeScript configuration
├── src/
│   └── index.ts       # Plugin source code
├── dist/              # Compiled output (generated)
└── README.md          # This file
```

## ETools Metadata

The plugin metadata is defined in `package.json` under the `etools` field:

```json
{
  "etools": {
    "id": "hello-world",
    "title": "Hello Plugin",
    "description": "A simple greeting plugin",
    "triggers": ["hello:"],
    "permissions": [],
    "category": "productivity"
  }
}
```

## License

MIT
