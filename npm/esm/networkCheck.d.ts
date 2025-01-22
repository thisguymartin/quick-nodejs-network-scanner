interface NetworkInterfaceInfo {
    network_type: string;
    local_ip: string;
    ip_version: string;
    mac_address_vs: string;
    mac_address_v6?: string;
    subnet_mask: string;
    your_ip_address?: string;
}
export declare function displayNetworkInfo(): Promise<NetworkInterfaceInfo>;
export {};
//# sourceMappingURL=networkCheck.d.ts.map