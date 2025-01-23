import os from 'node:os';
import { networkInterfaces } from 'node:os';

export interface NetworkInterface {
  family: string;
  name: string;
  address: string;
  netmask: string;
  scopeid: number | null; 
  cidr: string;
  mac: string;
 }
 
 export interface NetworkStats {
  ipv4Count: number;
  ipv6Count: number;
  interfaceTypes: Set<string>;
  hasVPN: boolean;
 }
 
 export interface NetworkInterfaceInfo {
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
   win32: ['VPN', 'TAP', 'TUN'],
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
   case 'win32':
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
 const interfaces = networkInterfaces();
 const platform = os.platform();

 const formattedInterfaces = Object.entries(interfaces).flatMap(([name, ints]) => 
   ints?.map(int => ({
     family: int.family,
     name,
     address: int.address,
     netmask: int.netmask || '',
     scopeid: null,
     cidr: int.cidr || `${int.address}/${int.netmask}`,
     mac: int.mac || ''
   })) || []
 );

 const mainInterface = formattedInterfaces.find(iface => 
   iface.family === "IPv4" && 
   !iface.address.startsWith("127.") &&
   (platform === 'win32'
     ? !isVPNInterface(iface.name, platform)
     : iface.name === getPrimaryInterfaceName(platform))
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
   allInterfaces: groupInterfaces(formattedInterfaces),
   stats: calculateNetworkStats(formattedInterfaces, platform),
   lastUpdated: new Date().toISOString()
 };

 try {
   const ipv4Response = await fetch("https://api.ipify.org");
   if (ipv4Response.ok) {
     networkInfo.external_ip = await ipv4Response.text();
   }
 } catch (error) {
   console.warn("External IP fetch failed:", error);
 }

 return networkInfo;
}