import * as os from 'os';
import fetch from 'node-fetch';
import * as dns from 'dns';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const dnsResolve = promisify(dns.resolve);
const lookupService = promisify(dns.lookupService);

interface NetworkInterface {
    address: string;
    netmask: string;
    family: string;
    mac: string;
    internal: boolean;
    cidr?: string;
}

interface NetworkMetrics {
    latency?: number;
    packetLoss?: number;
    downloadSpeed?: number;
    uploadSpeed?: number;
    jitter?: number;
}

interface DNSInfo {
    nameservers: string[];
    resolvedHostnames?: { [key: string]: string[] };
    reverseLookup?: { [key: string]: string };
}

interface SystemInfo {
    hostname: string;
    platform: string;
    arch: string;
    cpuModel: string;
    cpuCores: number;
    totalMemory: number;
    freeMemory: number;
    uptime: number;
    loadAverage: number[];
}

interface NetworkInterfaceInfo {
    network_type: string;
    local_ip: string;
    ip_version: string;
    mac_address: string;
    subnet_mask: string;
    external_ip?: string;
    interface_speed?: string;
    interface_status?: string;
    gateway?: string;
    dhcp_server?: string;
    dns_info?: DNSInfo;
    metrics?: NetworkMetrics;
    routing_table?: string[];
    firewall_status?: string;
    vpn_status?: boolean;
    wifi_info?: {
        ssid?: string;
        signal_strength?: string;
        frequency?: string;
        encryption?: string;
    };
}

interface CompleteNetworkInfo {
    interfaces: NetworkInterfaceInfo[];
    system: SystemInfo;
    connectivity: {
        internet_available: boolean;
        dns_working: boolean;
        default_gateway_reachable: boolean;
    };
    security: {
        firewall_enabled?: boolean;
        open_ports?: number[];
        vulnerable_services?: string[];
    };
}

const EXTERNAL_IP_SERVICES = [
    'https://ifconfig.me',
    'https://api.ipify.org',
    'https://icanhazip.com',
    'https://ip.seeip.org'
];

const DNS_TEST_HOSTS = [
    'google.com',
    'microsoft.com',
    'cloudflare.com',
    'amazon.com'
];

async function pingHost(host: string): Promise<{ latency: number; packetLoss: number }> {
    try {
        const platform = os.platform();
        const pingCount = platform === 'win32' ? '-n 4' : '-c 4';
        const { stdout } = await execAsync(`ping ${pingCount} ${host}`);
        
        const latencyMatch = stdout.match(/time=(\d+(\.\d+)?)/);
        const latency = latencyMatch ? parseFloat(latencyMatch[1]) : 0;
        
        const lossMatch = stdout.match(/(\d+)%/);
        const packetLoss = lossMatch ? parseFloat(lossMatch[1]) : 0;
        
        return { latency, packetLoss };
    } catch (error) {
        return { latency: 0, packetLoss: 100 };
    }
}

async function measureNetworkSpeed(): Promise<{ download: number; upload: number }> {
    try {
        // Simple speed test implementation
        const startTime = Date.now();
        const response = await fetch('https://speed.cloudflare.com/__down', {
            method: 'GET',
            headers: { 'Content-Length': '1000000' }
        });
        const data = await response.arrayBuffer();
        const endTime = Date.now();
        
        const duration = (endTime - startTime) / 1000; // seconds
        const downloadSpeed = (data.byteLength / duration) / 1024 / 1024; // MB/s
        
        // Simplified upload test
        const uploadResponse = await fetch('https://speed.cloudflare.com/__up', {
            method: 'POST',
            body: Buffer.alloc(1000000)
        });
        const uploadDuration = (Date.now() - endTime) / 1000;
        const uploadSpeed = (1000000 / uploadDuration) / 1024 / 1024; // MB/s
        
        return { download: downloadSpeed, upload: uploadSpeed };
    } catch (error) {
        return { download: 0, upload: 0 };
    }
}

async function getSystemInformation(): Promise<SystemInfo> {
    return {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        cpuModel: os.cpus()[0].model,
        cpuCores: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        uptime: os.uptime(),
        loadAverage: os.loadavg()
    };
}

async function getFirewallStatus(): Promise<{ enabled: boolean; rules?: string[] }> {
    try {
        const platform = os.platform();
        let command = '';
        
        if (platform === 'win32') {
            command = 'netsh advfirewall show allprofiles state';
        } else if (platform === 'linux') {
            command = 'sudo ufw status';
        } else if (platform === 'darwin') {
            command = '/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate';
        }
        
        const { stdout } = await execAsync(command);
        const enabled = stdout.toLowerCase().includes('on') || 
                       stdout.toLowerCase().includes('active');
        
        return { enabled };
    } catch (error) {
        return { enabled: false };
    }
}

async function getWiFiInfo(): Promise<NetworkInterfaceInfo['wifi_info']> {
    try {
        const platform = os.platform();
        let command = '';
        
        if (platform === 'win32') {
            command = 'netsh wlan show interfaces';
        } else if (platform === 'linux') {
            command = 'iwconfig';
        } else if (platform === 'darwin') {
            command = '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I';
        }
        
        const { stdout } = await execAsync(command);
        
        // Parse WiFi information based on platform
        // This is a simplified implementation
        return {
            ssid: stdout.match(/SSID[:\s]+([^\n]+)/i)?.[1],
            signal_strength: stdout.match(/Signal[:\s]+([^\n]+)/i)?.[1],
            frequency: stdout.match(/Frequency[:\s]+([^\n]+)/i)?.[1],
            encryption: stdout.match(/Encryption[:\s]+([^\n]+)/i)?.[1]
        };
    } catch (error) {
        return {};
    }
}

async function getDNSInformation(): Promise<DNSInfo> {
    const dnsInfo: DNSInfo = {
        nameservers: [],
        resolvedHostnames: {},
        reverseLookup: {}
    };
    
    try {
        // Get nameservers from system configuration
        const { stdout } = await execAsync('cat /etc/resolv.conf');
        dnsInfo.nameservers = stdout
            .split('\n')
            .filter(line => line.startsWith('nameserver'))
            .map(line => line.split(' ')[1]);
        
        // Resolve test hosts
        for (const host of DNS_TEST_HOSTS) {
            try {
                const addresses = await dnsResolve(host);
                dnsInfo.resolvedHostnames[host] = addresses;
                
                // Perform reverse lookup for the first IP
                if (addresses[0]) {
                    const hostname = await lookupService(addresses[0], 0);
                    dnsInfo.reverseLookup[addresses[0]] = hostname.hostname;
                }
            } catch (error) {
                console.warn(`Failed to resolve ${host}:`, error.message);
            }
        }
    } catch (error) {
        console.warn('Failed to get DNS information:', error.message);
    }
    
    return dnsInfo;
}

async function getRoutingTable(): Promise<string[]> {
    try {
        const platform = os.platform();
        const command = platform === 'win32' ? 'route print' : 'netstat -r';
        
        const { stdout } = await execAsync(command);
        return stdout.split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
        return [];
    }
}

export async function getCompleteNetworkInfo(): Promise<CompleteNetworkInfo> {
    try {
        const networkInterfaces = os.networkInterfaces();
        const interfaces: NetworkInterfaceInfo[] = [];
        const systemInfo = await getSystemInformation();
        
        // Process each network interface
        for (const [ifname, ifaceData] of Object.entries(networkInterfaces)) {
            if (!ifaceData) continue;
            
            for (const iface of ifaceData) {
                if (!iface.mac || iface.internal) continue;
                
                const networkInfo: NetworkInterfaceInfo = {
                    network_type: ifname,
                    local_ip: iface.address,
                    ip_version: iface.family,
                    mac_address: iface.mac,
                    subnet_mask: iface.netmask
                };
                
                // Get additional interface information
                try {
                    // WiFi information if applicable
                    if (ifname.toLowerCase().includes('wlan') || 
                        ifname.toLowerCase().includes('wifi')) {
                        networkInfo.wifi_info = await getWiFiInfo();
                    }
                    
                    // Interface metrics
                    const pingResults = await pingHost('8.8.8.8');
                    const speedTest = await measureNetworkSpeed();
                    
                    networkInfo.metrics = {
                        latency: pingResults.latency,
                        packetLoss: pingResults.packetLoss,
                        downloadSpeed: speedTest.download,
                        uploadSpeed: speedTest.upload
                    };
                    
                    // DNS information
                    networkInfo.dns_info = await getDNSInformation();
                    
                    // Routing information
                    networkInfo.routing_table = await getRoutingTable();
                    
                    interfaces.push(networkInfo);
                } catch (error) {
                    console.warn(`Error getting additional info for ${ifname}:`, error.message);
                    interfaces.push(networkInfo);
                }
            }
        }
        
        // Get security information
        const firewallStatus = await getFirewallStatus();
        
        // Compile complete network information
        const completeInfo: CompleteNetworkInfo = {
            interfaces,
            system: systemInfo,
            connectivity: {
                internet_available: await pingHost('8.8.8.8').then(r => r.latency > 0),
                dns_working: Object.keys(interfaces[0]?.dns_info?.resolvedHostnames || {}).length > 0,
                default_gateway_reachable: await pingHost(interfaces[0]?.gateway || '').then(r => r.latency > 0)
            },
            security: {
                firewall_enabled: firewallStatus.enabled,
                open_ports: [], // Would need additional implementation to scan ports
                vulnerable_services: [] // Would need additional implementation to check services
            }
        };
        
        return completeInfo;
    } catch (error) {
        throw new Error(`Failed to retrieve complete network information: ${error.message}`);
    }
}
