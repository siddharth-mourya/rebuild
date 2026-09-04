import Link from "next/link";
import { BackIcon } from "@/components/icons";

export default function HelpPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="nav">
        <Link href="/" className="btn btn-secondary" style={{ fontSize: 12, gap: 8 }}>
          <BackIcon size={13} />
          Back
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-10 px-6 py-16">
        <h1>Help</h1>

        <section className="flex flex-col gap-2">
          <h6 style={{ margin: 0 }}>Your data never leaves your browser</h6>
          <p className="text-muted" style={{ fontSize: 14 }}>
            Every image, video, and audio file you import — and your whole project — is stored
            locally on this device using your browser&apos;s storage. Nothing is uploaded to a
            server. There is no account, no sign-in, and nothing to pay for.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h6 style={{ margin: 0 }}>This means</h6>
          <ul className="list-disc space-y-1.5 pl-5 text-muted" style={{ fontSize: 14 }}>
            <li>Your projects only exist on this browser, on this device.</li>
            <li>Clearing your browser&apos;s site data will delete your projects.</li>
            <li>
              To move a project to another device, use <strong>Export project</strong> from the
              editor, then <strong>Import project</strong> on the other device.
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h6 style={{ margin: 0 }}>Music</h6>
          <p className="text-muted" style={{ fontSize: 14 }}>
            Searchable music comes from Jamendo&apos;s free/CC-licensed catalog. You can also
            upload your own audio — only upload audio you have the rights to use.
          </p>
        </section>
      </div>
    </div>
  );
}
