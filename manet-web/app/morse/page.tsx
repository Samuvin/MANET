import Link from 'next/link';
import MorseRadio from '@/components/MorseRadio';
import MorseDecoder from '@/components/MorseDecoder';

export default function MorsePage() {
  return (
    <main id="main" className="container" tabIndex={-1}>
      <header>
        <nav className="morse-nav">
          <Link href="/" className="morse-nav-link">
            ← MANET
          </Link>
        </nav>
        <h1 className="morse-page-title">Morse code</h1>
        <p className="tagline">
          Encode a message to Morse and play it with a visual of the signal. Paste Morse below to decode to text.
        </p>
      </header>
      <section className="send-block" aria-label="Send">
        <MorseRadio />
      </section>
      <section className="receive-block" aria-label="Receive">
        <MorseDecoder />
      </section>
    </main>
  );
}
