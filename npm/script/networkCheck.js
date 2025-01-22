"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.displayNetworkInfo = displayNetworkInfo;
// deno-lint-ignore-file
const os = __importStar(require("node:os"));
const node_fetch_1 = __importDefault(require("node-fetch"));
async function displayNetworkInfo() {
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
        const response = await (0, node_fetch_1.default)("https://ifconfig.me");
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
