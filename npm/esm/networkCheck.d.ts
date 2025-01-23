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
export declare function getNetworkInfo(): Promise<NetworkInterfaceInfo>;
//# sourceMappingURL=networkCheck.d.ts.map