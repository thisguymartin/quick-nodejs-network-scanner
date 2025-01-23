# Network Interface Scanner

A cross-platform network interface scanner for Node.js that provides detailed
information about network interfaces, external IP addresses, and VPN detection.

## Features

- Primary network interface detection
- Cross-platform VPN detection
- IPv4 and IPv6 support
- External IP detection
- Network statistics and interface grouping
- MAC address and CIDR information
- Typescript support

## Installation

```bash
npm install network-interface-scanner
# or
yarn add network-interface-scanner
```

## Usage

```typescript
import { getNetworkInfo } from "network-interface-scanner";

const networkInfo = await getNetworkInfo();

// Get primary interface details
console.log(networkInfo.primaryInterface);
/*
{
  network_type: "en0",
  local_ip: "192.168.1.100",
  ip_version: "IPv4",
  mac_address: "00:11:22:33:44:55",
  subnet_mask: "255.255.255.0",
  cidr: "192.168.1.0/24"
}
*/

// Check VPN status
console.log(networkInfo.stats.hasVPN); // true/false

// Get all interfaces
console.log(networkInfo.allInterfaces);
```

## API Reference

### getNetworkInfo()

Returns network interface information.

```typescript
interface NetworkInterfaceInfo {
  primaryInterface: {
    network_type: string; // Interface name (en0, Ethernet)
    local_ip: string; // Local IP address
    ip_version: string; // IPv4 or IPv6
    mac_address: string; // MAC address
    subnet_mask: string; // Subnet mask
    cidr: string; // CIDR notation
  };
  allInterfaces: {
    [key: string]: {
      ipv4?: NetworkInterface;
      ipv6?: NetworkInterface[];
    };
  };
  stats: {
    ipv4Count: number;
    ipv6Count: number;
    interfaceTypes: Set<string>;
    hasVPN: boolean;
  };
  external_ip?: string;
  lastUpdated: string;
}
```

## Platform Support

- Windows
- macOS
- Linux

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details
