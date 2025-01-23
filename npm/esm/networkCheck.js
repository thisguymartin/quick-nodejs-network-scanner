import os from 'node:os';
import { networkInterfaces } from 'node:os';
function isVPNInterface(name, platform) {
    const vpnIdentifiers = {
        win32: ['VPN', 'TAP', 'TUN'],
        darwin: ['utun', 'ppp'],
        linux: ['tun', 'vpn', 'wg']
    };
    const identifiers = vpnIdentifiers[platform] || [];
    return identifiers.some(id => name.toLowerCase().includes(id.toLowerCase()));
}
function getPrimaryInterfaceName(platform) {
    switch (platform) {
        case 'darwin':
            return 'en0';
        case 'win32':
            return 'Ethernet';
        default:
            return 'eth0';
    }
}
function calculateNetworkStats(interfaces, platform) {
    return {
        ipv4Count: interfaces.filter(i => i.family === "IPv4").length,
        ipv6Count: interfaces.filter(i => i.family === "IPv6").length,
        interfaceTypes: new Set(interfaces.map(i => i.name)),
        hasVPN: interfaces.some(i => isVPNInterface(i.name, platform))
    };
}
function groupInterfaces(interfaces) {
    return interfaces.reduce((acc, iface) => {
        if (!acc[iface.name]) {
            acc[iface.name] = {};
        }
        if (iface.family === "IPv4") {
            acc[iface.name].ipv4 = iface;
        }
        else {
            if (!acc[iface.name].ipv6) {
                acc[iface.name].ipv6 = [];
            }
            acc[iface.name].ipv6?.push(iface);
        }
        return acc;
    }, {});
}
export async function getNetworkInfo() {
    const interfaces = networkInterfaces();
    const platform = os.platform();
    const formattedInterfaces = Object.entries(interfaces).flatMap(([name, ints]) => ints?.map(int => ({
        family: int.family,
        name,
        address: int.address,
        netmask: int.netmask || '',
        scopeid: null,
        cidr: int.cidr || `${int.address}/${int.netmask}`,
        mac: int.mac || ''
    })) || []);
    const mainInterface = formattedInterfaces.find(iface => iface.family === "IPv4" &&
        !iface.address.startsWith("127.") &&
        (platform === 'win32'
            ? !isVPNInterface(iface.name, platform)
            : iface.name === getPrimaryInterfaceName(platform)));
    if (!mainInterface) {
        throw new Error("No valid network interface found");
    }
    const networkInfo = {
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
    }
    catch (error) {
        console.warn("External IP fetch failed:", error);
    }
    return networkInfo;
}
