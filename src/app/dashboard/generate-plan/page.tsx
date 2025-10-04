import { DietitianView } from "@/components/dashboard/dietitian-view";

export default function GeneratePlanPage() {
    // The DietitianView component already contains the form under a tab.
    // We can't render the form directly, so we render the whole view.
    // This is a temporary solution until the component is refactored.
    return <DietitianView />;
}
