import { Pill } from '@garden/ui';

export function PillDemo() {
  return (
    <div className="space-y-3">
      <h2>Pill Variants</h2>
      <div className="flex gap-2">
        <Pill variant="solid" tone="accent">
          Solid Accent
        </Pill>
        <Pill variant="solid" tone="positive">
          Solid Positive
        </Pill>
        <Pill variant="solid" tone="warning">
          Solid Warning
        </Pill>
        <Pill variant="solid" tone="danger">
          Solid Danger
        </Pill>
        <Pill variant="solid" tone="subtle">
          Solid Subtle
        </Pill>
      </div>

      <div className="flex gap-2">
        <Pill variant="soft" tone="accent">
          Soft Accent
        </Pill>
        <Pill variant="soft" tone="positive">
          Soft Positive
        </Pill>
        <Pill variant="soft" tone="warning">
          Soft Warning
        </Pill>
        <Pill variant="soft" tone="danger">
          Soft Danger
        </Pill>
        <Pill variant="soft" tone="subtle">
          Soft Subtle
        </Pill>
      </div>
      <div className="flex gap-2">
        <Pill variant="outline" tone="accent">
          Outline Accent
        </Pill>
        <Pill variant="outline" tone="positive">
          Outline Positive
        </Pill>
        <Pill variant="outline" tone="warning">
          Outline Warning
        </Pill>
        <Pill variant="outline" tone="danger">
          Outline Danger
        </Pill>
        <Pill variant="outline" tone="subtle">
          Outline Subtle
        </Pill>
      </div>
    </div>
  );
}
