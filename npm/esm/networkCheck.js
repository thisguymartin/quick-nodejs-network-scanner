// deno-lint-ignore-file
import * as os from "node:os";
import fetch from "node-fetch";
export async function displayNetworkInfo() {
    return new Promise(async (resolve, reject) => {
        try {
            let res = {};
            const networkInterfaces = os.networkInterfaces();
            Object.keys(networkInterfaces).forEach((ifname) => {
                let alias = 0;
                if (networkInterfaces[ifname] !== undefined &&
                    networkInterfaces[ifname].length > 0 &&
                    networkInterfaces[ifname][0].mac !== undefined &&
                    networkInterfaces[ifname][0].mac !== null &&
                    networkInterfaces[ifname][0].mac !== "") {
                    networkInterfaces[ifname].forEach((iface) => {
                        if ("IPv4" !== iface.family || iface.internal !== false) {
                            return;
                        }
                        if (alias >= 1) {
                            res = {
                                ...res,
                                network_type: ifname,
                                local_ip: iface.address,
                                ip_version: iface.family,
                                mac_address_vs: os.networkInterfaces()[ifname]?.[0]?.mac || '',
                                subnet_mask: os.networkInterfaces()[ifname]?.[1]?.netmask || '',
                            };
                        }
                        else {
                            res = {
                                ...res,
                                network_type: ifname,
                                local_ip: iface.address,
                                ip_version: iface.family,
                                mac_address_v6: os.networkInterfaces()[ifname]?.[0]?.mac || '',
                                subnet_mask: iface?.netmask || ''
                            };
                        }
                        ++alias;
                    });
                }
            });
            const yourIpAddress = await initialize();
            if (yourIpAddress) {
                res.your_ip_address = yourIpAddress;
                console.log("Successfully retrieved network information.");
                resolve(res);
            }
            else {
                console.log("Failed to retrieve external IP address.");
                reject(new Error("No response from external IP service."));
            }
        }
        catch (error) {
            console.error("An error occurred while retrieving network information:", error);
            reject(error);
        }
    });
}
const initialize = async () => {
    try {
        const response = await fetch("https://ifconfig.me");
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        return response.text();
    }
    catch (error) {
        console.error("Error fetching external IP address:", error);
        throw error;
    }
};
