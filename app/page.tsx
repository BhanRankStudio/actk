import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link className="flex items-center justify-center" href="#">
          <Clock className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-bold tracking-tight">Actk</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
            Login
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/register">
            Register
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-muted/30">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Track Your Time with Precision
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl dark:text-zinc-400">
                  A modern, simple, and effective way to manage your work sessions. Clock in, track details, and generate reports in seconds.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="rounded-full px-8">
                  <Link href="/register">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 border-t">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-3 text-center">
                <div className="bg-primary/10 p-3 rounded-2xl">
                  <Zap className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Quick Clocking</h2>
                <p className="text-muted-foreground">
                  Start and end your work sessions with a single click. No more manual logs or spreadsheets.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-3 text-center">
                <div className="bg-primary/10 p-3 rounded-2xl">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Detailed Reporting</h2>
                <p className="text-muted-foreground">
                  View your work history and generate monthly reports for administrative purposes effortlessly.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-3 text-center">
                <div className="bg-primary/10 p-3 rounded-2xl">
                  <ShieldCheck className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Secure & Reliable</h2>
                <p className="text-muted-foreground">
                  Your data is safely stored and protected. Access your records anytime, anywhere.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          © 2026 Actk Time Tracker. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
