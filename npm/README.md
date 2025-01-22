# Quick Node.js Network Scanner (TS)

Quick Node.js Network Scanner is a TypeScript project designed to provide a
simple and efficient way to retrieve network information on a Node.js
environment. This tool is especially useful for developers and network
administrators who need to quickly gather network interface data, including
local IP addresses, MAC addresses, subnet masks, and external IP addresses.

## Features

- Retrieves detailed information about all network interfaces on your system.
- Fetches the external IP address of the system.
- Easy-to-use async function returning a structured object.
- Cross-platform compatibility, supporting a wide range of operating systems.

## Installation

To use Quick Node.js Network Scanner in your project, make sure you have Node.js
installed. Then, you can add it to your project as follows:

```bash
npm install quick-nodejs-network-scanner-ts
```

or if you're using Yarn:

```bash
yarn add quick-nodejs-network-scanner-ts
```

## Usage

Here's a quick example of how to use the library:

```javascript
import { displayNetworkInfo } from "quick-nodejs-network-scanner-ts";

async function runScanner() {
  try {
    const networkInfo = await displayNetworkInfo();
    console.log(networkInfo);
  } catch (error) {
    console.error("Failed to retrieve network information:", error);
  }
}

runScanner();
```

## API Reference

### `displayNetworkInfo()`

Returns a `Promise` that resolves to an object containing network information.

**Returns:**

- `Promise<NetworkInterfaceInfo>`: An object containing network details.

**NetworkInterfaceInfo:**

- `network_type`: The type of the network interface.
- `local_ip`: Local IP address of the interface.
- `ip_version`: IP version (e.g., IPv4).
- `mac_address_vs`: MAC address of the interface.
- `mac_address_v6` (optional): Alternative MAC address for IPv6.
- `subnet_mask`: Subnet mask of the network.
- `your_ip_address` (optional): External IP address of the system.

## Contributing

Contributions to Quick Node.js Network Scanner are welcome! Please feel free to
submit issues, pull requests, or suggest improvements.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.
