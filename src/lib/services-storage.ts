import { Service } from "./types";
import { mockServices } from "./mock-data";

const LS_SERVICES = "publideas_services";

export function loadServices(): Service[] {
    if (typeof window === "undefined") return mockServices;
    try {
        const raw = localStorage.getItem(LS_SERVICES);
        return raw ? (JSON.parse(raw) as Service[]) : mockServices;
    } catch {
        return mockServices;
    }
}
