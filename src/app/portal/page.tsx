import { Suspense } from "react";
import UserPortal from "@/components/UserPortal";

export default function PortalPage() {
    return (
        <Suspense>
            <UserPortal />
        </Suspense>
    );
}
