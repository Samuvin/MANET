import Link from 'next/link';
import HowManetWorks from '@/components/HowManetWorks';
import ManetDemo from '@/components/ManetDemo';

export default function Home() {
  return (
    <main id="main" className="container" tabIndex={-1}>
      <header>
        <h1>MANET</h1>
        <p className="tagline">
          How device-to-device messaging works in a Mobile Ad-hoc Network. No fixed infrastructure — nodes relay messages.
        </p>
        <p className="header-link">
          <Link href="/morse">Morse code simulator →</Link>
        </p>
      </header>
      <HowManetWorks />
      <ManetDemo />
    </main>
  );
}
