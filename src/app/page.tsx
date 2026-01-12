import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          CalAgent
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Aggregate your Google and Outlook calendars into one view.
          Let AI help you find availability and schedule meetings with your team.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/login"
            className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold leading-6"
          >
            Sign in <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
