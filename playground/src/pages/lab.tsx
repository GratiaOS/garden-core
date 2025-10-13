import { CardDemo } from '../demos/CardDemo';
import { PillDemo } from '../demos/PillDemo';
import { FieldDemo } from '../demos/FieldDemo';
import { ButtonDemo } from '../demos/ButtonDemo';
import { ToastDemo } from '../demos/ToastDemo';

export default function LabPage() {
  return (
    <main role="main" aria-labelledby="lab-title">
      <div className="mx-auto w-full max-w-3xl space-y-12 pb-12">
        <header className="mb-8 pb-4 border-b border-border">
          <h1 id="lab-title" className="mb-2 text-3xl font-semibold">
            Components Lab
          </h1>
          <p className="max-w-xl text-muted">Explore the primitives with their default states.</p>
        </header>
        <ButtonDemo />
        <CardDemo />
        <PillDemo />
        <FieldDemo />
        <ToastDemo />
      </div>
    </main>
  );
}
