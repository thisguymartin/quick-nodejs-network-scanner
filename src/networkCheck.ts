interface NetworkInterface {
  family: string;
  name: string;
  address: string;
  netmask: string;
  scopeid: number | null;
  cidr: string;
  mac: string;
}

interface NetworkStats {
  ipv4Count: number;
  ipv6Count: number;
  interfaceTypes: Set<string>;
  hasVPN: boolean;
}

interface NetworkInterfaceInfo {
  primaryInterface: {
    network_type: string;
    local_ip: string;
    ip_version: string;
    mac_address: string;
    subnet_mask: string;
    cidr: string;
  };
  allInterfaces: {
    [key: string]: {
      ipv4?: NetworkInterface;
      ipv6?: NetworkInterface[];
    };
  };
  stats: NetworkStats;
  external_ip?: string;
  lastUpdated: string;
}

function isVPNInterface(name: string, platform: string): boolean {
  const vpnIdentifiers = {
    windows: ['VPN', 'TAP', 'TUN'],
    darwin: ['utun', 'ppp'],
    linux: ['tun', 'vpn', 'wg']
  };
  
  const identifiers = vpnIdentifiers[platform as keyof typeof vpnIdentifiers] || [];
  return identifiers.some(id => name.toLowerCase().includes(id.toLowerCase()));
}

function getPrimaryInterfaceName(platform: string): string {
  switch (platform) {
    case 'darwin':
      return 'en0';
    case 'windows':
      return 'Ethernet';
    default:
      return 'eth0';
  }
}

function calculateNetworkStats(interfaces: NetworkInterface[], platform: string): NetworkStats {
  return {
    ipv4Count: interfaces.filter(i => i.family === "IPv4").length,
    ipv6Count: interfaces.filter(i => i.family === "IPv6").length,
    interfaceTypes: new Set(interfaces.map(i => i.name)),
    hasVPN: interfaces.some(i => isVPNInterface(i.name, platform))
  };
}

function groupInterfaces(interfaces: NetworkInterface[]): {
  [key: string]: { ipv4?: NetworkInterface; ipv6?: NetworkInterface[] };
} {
  return interfaces.reduce((acc, iface) => {
    if (!acc[iface.name]) {
      acc[iface.name] = {};
    }
    
    if (iface.family === "IPv4") {
      acc[iface.name].ipv4 = iface;
    } else {
      if (!acc[iface.name].ipv6) {
        acc[iface.name].ipv6 = [];
      }
      acc[iface.name].ipv6?.push(iface);
    }
    
    return acc;
  }, {} as { [key: string]: { ipv4?: NetworkInterface; ipv6?: NetworkInterface[] } });
}

export async function getNetworkInfo(): Promise<NetworkInterfaceInfo> {
  await Deno.permissions.request({ name: "net" });

  const platform = Deno.build.os;
  const interfaces = await Deno.networkInterfaces();
  const primaryName = getPrimaryInterfaceName(platform);
  
  const mainInterface = interfaces.find(iface => 
    iface.family === "IPv4" && 
    !iface.address.startsWith("127.") &&
    (platform === 'windows' 
      ? !isVPNInterface(iface.name, platform)
      : iface.name === primaryName)
  );

  if (!mainInterface) {
    throw new Error("No valid network interface found");
  }

  const networkInfo: NetworkInterfaceInfo = {
    primaryInterface: {
      network_type: mainInterface.name,
      local_ip: mainInterface.address,
      ip_version: mainInterface.family,
      mac_address: mainInterface.mac,
      subnet_mask: mainInterface.netmask,
      cidr: mainInterface.cidr,
    },
    allInterfaces: groupInterfaces(interfaces),
    stats: calculateNetworkStats(interfaces, platform),
    lastUpdated: new Date().toISOString()
  };

  try {
    const [ipv4Response, ipv6Response] = await Promise.allSettled([
      fetch("https://api.ipify.org"),
      fetch("https://api6.ipify.org")
    ]);

    if (ipv4Response.status === "fulfilled" && ipv4Response.value.ok) {
      networkInfo.external_ip = await ipv4Response.value.text();
    }
  } catch (error) {
    console.warn("External IP fetch failed:", error);
  }

  return networkInfo;
}